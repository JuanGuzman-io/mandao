import { createHash } from 'node:crypto';

export const sha256 = (content: string) => `sha256-${createHash('sha256').update(content).digest('base64')}`;

/** A file's sha256 in lower-case hex, the form a document's provenance is recorded in (intake proposals). */
export const sha256Hex = (content: string | Uint8Array) => createHash('sha256').update(content).digest('hex');
