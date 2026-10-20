import type { z } from 'zod';

/** Turns a zod error into readable lines: `projects.1.path: must be relative`. */
export function formatIssues(error: z.ZodError, file?: string): string[] {
  return error.issues.map((i) => {
    const where = i.path.length ? i.path.join('.') : '(root)';
    return `${file ? `${file}: ` : ''}${where}: ${i.message}`;
  });
}
