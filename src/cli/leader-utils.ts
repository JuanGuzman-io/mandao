import type { SpecFolder } from '../scripts/spec.js';
import { type Task, taskAttempt } from '../spec/index.js';

export const currentAttempt = (spec: SpecFolder, task: string) => taskAttempt(spec.execution, task);

export function taskOf(spec: SpecFolder, id: string): Task {
  const task = spec.tasks.find((item) => item.id === id);
  if (!task) throw new Error(`No ${id} in ${spec.name}`);
  return task;
}
