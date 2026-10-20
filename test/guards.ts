import ts from 'typescript';

/** A call that can leave the test's own work folder. `line` is 1-based; `text` is the call's source text. */
export interface Climb {
  line: number;
  text: string;
}

const PATH_MODULES = new Set(['node:path', 'path']);

/** Builds a one-file program so the checker resolves identifiers by scope without touching the disk. */
function createChecker(file: string, source: string): { sf: ts.SourceFile; checker: ts.TypeChecker } {
  const options: ts.CompilerOptions = { noResolve: true, noLib: true, types: [], allowJs: true };
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name) => (name === file ? sf : undefined);
  host.fileExists = (name) => name === file;
  host.readFile = (name) => (name === file ? source : undefined);
  const program = ts.createProgram([file], options, host);
  return { sf, checker: program.getTypeChecker() };
}

function declarationOf(checker: ts.TypeChecker, node: ts.Node): ts.Declaration | undefined {
  return checker.getSymbolAtLocation(node)?.declarations?.[0];
}

function isPathImport(decl: ts.Node | undefined): boolean {
  let node = decl;
  while (node && !ts.isImportDeclaration(node)) node = node.parent;
  return !!node && ts.isStringLiteral(node.moduleSpecifier) && PATH_MODULES.has(node.moduleSpecifier.text);
}

/** The `node:path` function a call invokes (`join`, `dirname`, ...), or undefined when it is not from `node:path`. */
function pathFunction(checker: ts.TypeChecker, call: ts.CallExpression): string | undefined {
  const callee = call.expression;
  if (ts.isIdentifier(callee)) {
    const decl = declarationOf(checker, callee);
    if (!decl || !ts.isImportSpecifier(decl) || !isPathImport(decl)) return undefined;
    return decl.propertyName?.text ?? callee.text;
  }
  if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression)) {
    const decl = declarationOf(checker, callee.expression);
    const viaNamespace = decl && (ts.isNamespaceImport(decl) || ts.isImportClause(decl));
    return viaNamespace && isPathImport(decl) ? callee.name.text : undefined;
  }
  return undefined;
}

function hasParentSegment(arg: ts.Expression): boolean {
  if (!ts.isStringLiteralLike(arg)) return false;
  return arg.text.split(/[/\\]/).includes('..');
}

function isMetaDirname(arg: ts.Expression | undefined): boolean {
  return !!arg && arg.getText() === 'import.meta.dirname';
}

function isMakeTreeCall(node: ts.Node | undefined): boolean {
  return !!node && ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'makeTree';
}

function isTreeArgument(checker: ts.TypeChecker, arg: ts.Expression | undefined): boolean {
  if (!arg) return false;
  if (isMakeTreeCall(arg)) return true;
  if (!ts.isIdentifier(arg)) return false;
  const decl = declarationOf(checker, arg);
  return !!decl && ts.isVariableDeclaration(decl) && isMakeTreeCall(decl.initializer);
}

function isClimb(checker: ts.TypeChecker, call: ts.CallExpression): boolean {
  const fn = pathFunction(checker, call);
  if (fn === 'join' || fn === 'resolve') {
    return !isMetaDirname(call.arguments[0]) && call.arguments.some(hasParentSegment);
  }
  return fn === 'dirname' && isTreeArgument(checker, call.arguments[0]);
}

/** A justified exception: this exact call, in this file, may climb out of the work folder. */
export interface Allowed {
  file: string;
  call: string;
  why: string;
}

/** Drops only the findings whose file and exact call text match an entry; everything else stays reported. */
export function withoutAllowed(file: string, found: Climb[], allowed: Allowed[]): Climb[] {
  return found.filter((c) => !allowed.some((a) => a.file === file && a.call === c.text));
}

/** Reports every `node:path` call in `source` that climbs out of the test's work folder. Pure: reads only `source`. */
export function findClimbs(file: string, source: string): Climb[] {
  const { sf, checker } = createChecker(file, source);
  const found: Climb[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && isClimb(checker, node)) {
      found.push({ line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, text: node.getText(sf) });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}
