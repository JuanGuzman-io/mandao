import { afterEach, aroundEach } from 'vitest';
import { removeTrees, testTreeScope } from './helpers.js';

aroundEach((runTest, { task }) => testTreeScope.run(task.id, runTest));
afterEach(({ task }) => removeTrees(task.id));
