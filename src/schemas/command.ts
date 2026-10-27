import { z } from 'zod';
import { capability, harnessId, kebabId, PROFILES, profile, schemaVersion } from './common.js';

const io = z.object({
  path: z.string().min(1),
  required: z.boolean().default(false),
  description: z.string().optional(),
});

export const commandFrontmatterSchema = z
  .object({
    schema_version: schemaVersion,
    id: kebabId,
    title: z.string().min(1),
    description: z.string().min(1).max(300),
    /** One short line for the README and the guide's command tables (phase 19). */
    summary: z.string().min(1).max(110).optional(),
    status: z.enum(['stable', 'stub']),
    flow: z.object({ after: z.array(kebabId).default([]), next: z.array(kebabId).default([]) }).prefault({}),
    profiles: z
      .array(profile)
      .min(1)
      .default([...PROFILES]),
    arguments: z
      .array(
        z.object({
          name: z.string().regex(/^[a-z][a-zA-Z0-9]*$/, 'must be camelCase'),
          description: z.string().min(1),
          required: z.boolean().default(false),
          default: z.string().optional(),
          /** Typed as `--name` (kebab-case), such as `--product`; with `value`, it takes one: `--depth <lite|standard|full>`. */
          flag: z.boolean().default(false),
          /** What the argument takes, as shown in its syntax: `lite|standard|full`, `file`, `proposal#I-n`. */
          value: z.string().min(1).optional(),
        }),
      )
      .default([]),
    /** Real invocations, shown on the command's page, in the guide and in the README (phase 19). */
    examples: z.array(z.object({ run: z.string().min(1), does: z.string().min(1) }).strict()).default([]),
    inputs: z.array(io),
    outputs: z.array(io),
    capabilities: z.array(capability).min(1),
    templates: z.array(z.string().min(1)).default([]),
    scripts: z.array(kebabId).default([]),
    approval: z.enum(['none', 'required']).default('none'),
    scope: z.enum(['project', 'global', 'both']).default('project'),
    harness: z.partialRecord(harnessId, z.record(z.string(), z.unknown())).default({}),
  })
  .strict();

export type CommandFrontmatter = z.infer<typeof commandFrontmatterSchema>;
export type CommandArgument = CommandFrontmatter['arguments'][number];

/** An argument as the user types it: `<spec>`, `--product`, `--depth <lite|standard|full>` (phase 19). */
export function argumentSyntax(a: CommandArgument): string {
  if (!a.flag) return `<${a.value ?? a.name}>`;
  const flag = `--${a.name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
  return a.value ? `${flag} <${a.value}>` : flag;
}

/** One argument in a usage line: required as typed, optional in brackets (`[spec]`, `[--depth <lite|standard|full>]`). */
export const argumentUsage = (a: CommandArgument) =>
  a.required ? argumentSyntax(a) : a.flag ? `[${argumentSyntax(a)}]` : `[${a.value ?? a.name}]`;

/** A command's arguments as one usage line. */
export const usageLine = (id: string, meta: Pick<CommandFrontmatter, 'arguments'>) =>
  [`/mandao-${id}`, ...meta.arguments.map(argumentUsage)].join(' ');

export const personaFrontmatterSchema = z
  .object({
    schema_version: schemaVersion,
    id: kebabId,
    title: z.string().min(1),
    description: z.string().min(1).max(300),
    capabilities: z.array(capability).min(1),
    scripts: z.array(kebabId).default([]),
    /** Another persona whose model must differ (e.g. reviewer vs implementer). */
    must_differ_from: kebabId.optional(),
    harness: z.partialRecord(harnessId, z.record(z.string(), z.unknown())).default({}),
  })
  .strict();

export type PersonaFrontmatter = z.infer<typeof personaFrontmatterSchema>;
