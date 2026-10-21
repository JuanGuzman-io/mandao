import { createHash } from 'node:crypto';

/** The identity of a derived specification: its diagram is stale when this changes. */
export const specHash = (spec) => createHash('sha256').update(JSON.stringify(spec)).digest('hex');
