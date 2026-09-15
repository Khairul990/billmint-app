import test from 'node:test';
import assert from 'node:assert';
import { getStaff } from '../src/services/dbEngine.js';

test('Regression: getStaff is defined and accessible for sync paths', async () => {
  assert.strictEqual(typeof getStaff, 'function', 'getStaff must be exported and defined as a function from dbEngine');
});
