import { DEFAULT_RESEARCH_EXPIRY, type ResearchEntry, type ResearchTopicType, researchDocumentSchema } from '../schemas/research.js';
import { withoutCode } from './markdown.js';

export interface ResearchFinding {
  code: string;
  ref: string;
  message: string;
  severity: 'error' | 'info';
}

export interface ResearchValidationOptions {
  today?: string;
  highPremiseIds?: string[];
  expiryMonths?: Partial<Record<ResearchTopicType, number>>;
  maxQuestions?: number;
  /** Harness discovery says no native or configured MCP search tool is available. */
  webSearchAvailable?: boolean;
}

const HIGH_IMPACT = new Set<ResearchTopicType>(['architecture', 'data', 'security', 'public-contract']);
const SOURCE_RANK = { technical: 1, manufacturer: 2, official: 3 } as const;
const DEFAULT_EXPIRY = DEFAULT_RESEARCH_EXPIRY;

/** Whether a research decision crosses a high-impact boundary by topic or premise. */
export function highImpactResearch(topicType: ResearchTopicType, premiseIds: string[], highPremiseIds: string[]): boolean {
  return HIGH_IMPACT.has(topicType) || premiseIds.some((id) => highPremiseIds.includes(id));
}

function validDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addMonths(date: string, months: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(Date.UTC(year!, month! - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day!, last));
  return target.toISOString().slice(0, 10);
}

function parseDocument(value: unknown, findings: ResearchFinding[]): ResearchEntry[] {
  const parsed = researchDocumentSchema.safeParse(value);
  if (!parsed.success) {
    findings.push({
      code: 'RESEARCH_SCHEMA',
      ref: 'research.md',
      message: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
      severity: 'error',
    });
    return [];
  }
  return parsed.data.entries;
}

const addFinding = (
  findings: ResearchFinding[],
  code: string,
  ref: string,
  message: string,
  severity: ResearchFinding['severity'] = 'error',
) => findings.push({ code, ref, message, severity });

function validateClaimSources(
  entry: ResearchEntry,
  claim: ResearchEntry['claims'][number],
  highImpact: boolean,
  contradictions: Map<string, string>,
  findings: ResearchFinding[],
): void {
  const ref = `${entry.id}/${claim.id}`;
  const futureSource = claim.sources.find((source) => !validDate(source.checked_on) || source.checked_on > entry.checked_on);
  if (futureSource)
    addFinding(findings, 'RESEARCH_SOURCE_DATE', ref, 'source checked_on must be a real date no later than the research date');
  const highestRank = Math.max(...claim.sources.map((source) => SOURCE_RANK[source.tier]));
  const highestValues = new Set(claim.sources.filter((source) => SOURCE_RANK[source.tier] === highestRank).map((source) => source.value));
  const values = new Set(claim.sources.map((source) => source.value));
  if (claim.kind !== 'general' && !claim.sources.some((source) => source.tier !== 'technical'))
    addFinding(findings, 'RESEARCH_SOURCE_NOT_PRIMARY', ref, 'version and API claims need direct official or manufacturer documentation');
  if (values.size > 1 && !contradictions.has(claim.id))
    addFinding(
      findings,
      'RESEARCH_CONTRADICTION_UNRECORDED',
      ref,
      'conflicting source values need a recorded contradiction and resolution',
    );
  if (values.size <= 1 && contradictions.has(claim.id))
    addFinding(findings, 'RESEARCH_CONTRADICTION_UNUSED', ref, 'remove the contradiction entry because sources agree');
  if (!highestValues.has(claim.value))
    addFinding(findings, 'RESEARCH_SOURCE_PRIORITY', ref, 'the selected claim value must follow the highest-priority available source');
  if (highImpact && highestRank === SOURCE_RANK.technical)
    addFinding(findings, 'RESEARCH_UNVERIFIED_HIGH_IMPACT', ref, 'high-impact decisions need official or manufacturer evidence');
}

function validateClaim(
  entry: ResearchEntry,
  claim: ResearchEntry['claims'][number],
  highImpact: boolean,
  options: ResearchValidationOptions,
  contradictions: Map<string, string>,
  findings: ResearchFinding[],
): void {
  if (!claim.sources.length || options.webSearchAvailable === false) {
    addFinding(
      findings,
      highImpact ? 'RESEARCH_UNVERIFIED_HIGH_IMPACT' : 'RESEARCH_UNVERIFIED',
      entry.id,
      highImpact
        ? 'high-impact decisions cannot rely on model knowledge without web evidence'
        : `${claim.key} is unverified (model knowledge)`,
      highImpact ? 'error' : 'info',
    );
    return;
  }
  validateClaimSources(entry, claim, highImpact, contradictions, findings);
}

function validateEntryDatesAndStatus(entry: ResearchEntry, options: ResearchValidationOptions, findings: ResearchFinding[]): void {
  const expectedExpiry = addMonths(entry.checked_on, { ...DEFAULT_EXPIRY, ...options.expiryMonths }[entry.topic_type] ?? 6);
  if (!validDate(entry.checked_on) || !validDate(entry.expires)) {
    addFinding(findings, 'RESEARCH_INVALID_DATE', entry.id, 'checked_on and expires must be real ISO calendar dates');
    return;
  }
  if (entry.expires !== expectedExpiry)
    addFinding(findings, 'RESEARCH_EXPIRY_MISMATCH', entry.id, `expires must be ${expectedExpiry} for ${entry.topic_type}`);
  if (entry.expires < (options.today ?? new Date().toISOString().slice(0, 10)))
    addFinding(findings, 'RESEARCH_EXPIRED', entry.id, `evidence expired on ${entry.expires}`);
  if (entry.status === 'open') addFinding(findings, 'RESEARCH_OPEN', entry.id, 'research question is still open');
  if (entry.status === 'resolved' && (!entry.decision || !entry.rationale))
    addFinding(findings, 'RESEARCH_DECISION_MISSING', entry.id, 'a resolved entry needs both a decision and rationale');
}

function validateEntry(entry: ResearchEntry, options: ResearchValidationOptions, findings: ResearchFinding[]): void {
  const highImpact = highImpactResearch(entry.topic_type, entry.premise_ids, options.highPremiseIds ?? []);
  validateEntryDatesAndStatus(entry, options, findings);
  const contradictions = new Map(entry.contradictions.map((row) => [row.claim_id, row.resolution]));
  const claimIds = new Set<string>();
  for (const claim of entry.claims) {
    if (claimIds.has(claim.id))
      addFinding(findings, 'RESEARCH_DUPLICATE_CLAIM', `${entry.id}/${claim.id}`, 'claim IDs must be unique within an entry');
    claimIds.add(claim.id);
    validateClaim(entry, claim, highImpact, options, contradictions, findings);
  }
  for (const claimId of contradictions.keys()) {
    if (!claimIds.has(claimId))
      addFinding(findings, 'RESEARCH_CONTRADICTION_UNUSED', `${entry.id}/${claimId}`, 'contradiction references a missing claim');
  }
  if (highImpact && !entry.claims.length)
    addFinding(findings, 'RESEARCH_UNVERIFIED_HIGH_IMPACT', entry.id, 'high-impact decisions need at least one sourced claim');
}

/** Checks source precedence, contradictions, expiry and the rule-based impact gate. */
export function validateResearch(document: unknown, options: ResearchValidationOptions = {}): ResearchFinding[] {
  const findings: ResearchFinding[] = [];
  const entries = parseDocument(document, findings);
  const maxQuestions = options.maxQuestions ?? 5;
  if (entries.length > maxQuestions)
    addFinding(
      findings,
      'RESEARCH_QUESTION_LIMIT',
      'research.md',
      `${entries.length} research entries exceed the configured limit of ${maxQuestions}`,
    );
  const ids = new Set<string>();
  for (const entry of entries) {
    if (ids.has(entry.id)) addFinding(findings, 'RESEARCH_DUPLICATE_ID', entry.id, 'research entry IDs must be unique');
    ids.add(entry.id);
    validateEntry(entry, options, findings);
  }
  return findings;
}

/** Ensures every research marker is represented by a matching resolved-or-open evidence entry. */
export function researchGateFindings(markdowns: string[], document: unknown, options: ResearchValidationOptions = {}): ResearchFinding[] {
  const findings = validateResearch(document, options);
  const parsed = researchDocumentSchema.safeParse(document);
  if (!parsed.success) return findings;
  const questions = researchQuestions(markdowns, options.maxQuestions ?? 5);
  for (const question of questions.questions) {
    const found = parsed.data.entries.some(
      (entry) =>
        entry.topic_type === question.topic_type &&
        normalizeTopic(entry.topic) === normalizeTopic(question.topic) &&
        normalizeTopic(entry.question) === normalizeTopic(question.question),
    );
    if (!found)
      findings.push({
        code: 'RESEARCH_UNCOVERED',
        ref: question.id,
        message: `research question is not recorded: ${question.question}`,
        severity: 'error',
      });
  }
  return findings;
}

function normalizeTopic(topic: string): string {
  return topic
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Finds reusable, current evidence for a matching topic; callers preserve `source` as a link. */
export function reusableResearch(
  candidates: { source: string; entry: unknown }[],
  topic: string,
  topicType: ResearchTopicType,
  today: string,
  expiryMonths?: Partial<Record<ResearchTopicType, number>>,
): { source: string; entry: ResearchEntry }[] {
  return candidates.flatMap((candidate) => {
    const parsed = researchDocumentSchema.safeParse({ schema_version: 1, entries: [candidate.entry] });
    if (!parsed.success) return [];
    const entry = parsed.data.entries[0];
    if (entry?.status !== 'resolved') return [];
    if (entry.topic_type !== topicType || normalizeTopic(entry.topic) !== normalizeTopic(topic)) return [];
    const findings = validateResearch({ schema_version: 1, entries: [entry] }, { today, expiryMonths });
    if (findings.some((finding) => finding.severity === 'error')) return [];
    return [{ source: candidate.source, entry }];
  });
}

export interface ResearchQuestionReport {
  questions: ResearchQuestion[];
  total: number;
  maxQuestions: number;
  needsPriority: boolean;
  dispatchable: ResearchQuestion[];
}

export interface ResearchQuestion {
  id: string;
  topic_type: ResearchTopicType;
  topic: string;
  question: string;
}

const TOPIC_TYPE_SET = new Set<string>([
  'ai-model',
  'api',
  'library',
  'framework',
  'architecture',
  'data',
  'security',
  'public-contract',
  'other',
]);

/** Counts unique NEEDS RESEARCH markers and enforces the budget before research is delegated. */
export function researchQuestions(markdowns: string[], maxQuestions: number, selected?: string[]): ResearchQuestionReport {
  const found = markdowns.flatMap((markdown) => withoutCode(markdown).split('\n').flatMap(parseResearchMarker));
  const unique = [
    ...new Map(found.map((item) => [`${item.topic_type}/${normalizeTopic(item.topic)}/${normalizeTopic(item.question)}`, item])).values(),
  ];
  const questions = unique.map((item, index) => ({ ...item, id: `Q${index + 1}` }));
  const needsPriority = (questions.length > maxQuestions && selected === undefined) || Boolean(selected && selected.length > maxQuestions);
  const dispatchable =
    selected === undefined && !needsPriority
      ? questions
      : (selected ?? [])
          .map((id) => questions.find((question) => question.id === id))
          .filter((question): question is ResearchQuestion => Boolean(question))
          .slice(0, maxQuestions);
  return { questions, total: questions.length, maxQuestions, needsPriority, dispatchable };
}

function parseResearchMarker(line: string): { topic_type: ResearchTopicType; topic: string; question: string }[] {
  const match = /\[NEEDS RESEARCH(?::\s*([^\]]+))?\](.*)$/i.exec(line);
  if (!match) return [];
  let topic = match[1]?.trim() ?? '';
  let question = match[2]?.trim() ?? '';
  let topicType: ResearchTopicType = 'other';
  const typed = /^([a-z-]+)\s*\/\s*(.+)$/.exec(topic);
  if (typed && TOPIC_TYPE_SET.has(typed[1]!)) {
    topicType = typed[1] as ResearchTopicType;
    topic = typed[2]!.trim();
  }
  question = question.replace(/^[:\s—-]+/, '').trim();
  if (!question) question = topic || line.replace(/\[NEEDS RESEARCH[^\]]*\]/gi, '').trim();
  if (!topic) topic = question;
  return [{ topic_type: topicType, topic, question }];
}
