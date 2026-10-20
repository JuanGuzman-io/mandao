import { createHash } from 'node:crypto';

export const sha256 = (content: string) => `sha256-${createHash('sha256').update(content).digest('base64')}`;
