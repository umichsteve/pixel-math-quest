import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyStageResult } from './useProgress.js';

const EMPTY = { stagesCleared: [], totalStars: 0, bestScores: {}, bestCorrect: {} };

test('passing run clears the stage and records stars and best correct', () => {
  const next = applyStageResult(EMPTY, 1, 8, 10);
  assert.deepEqual(next.stagesCleared, [1]);
  assert.equal(next.bestScores[1], 2, '8/10 is 2 stars');
  assert.equal(next.bestCorrect[1], 8);
  assert.equal(next.totalStars, 2);
});

test('failing run records best correct but does not clear', () => {
  const next = applyStageResult(EMPTY, 1, 4, 10);
  assert.deepEqual(next.stagesCleared, []);
  assert.equal(next.bestScores[1], 0);
  assert.equal(next.bestCorrect[1], 4);
  assert.equal(next.totalStars, 0);
});

test('a worse later run never lowers stars or best correct', () => {
  const first = applyStageResult(EMPTY, 2, 10, 10);
  const second = applyStageResult(first, 2, 5, 10);
  assert.equal(second.bestScores[2], 3, 'stars stay at 3');
  assert.equal(second.bestCorrect[2], 10, 'best correct stays at 10');
  assert.deepEqual(second.stagesCleared, [2], 'no duplicate clears');
  assert.equal(second.totalStars, 3);
});

test('totalStars sums best stars across stages', () => {
  let p = applyStageResult(EMPTY, 1, 10, 10); // 3
  p = applyStageResult(p, 2, 7, 10); // 2
  p = applyStageResult(p, 3, 5, 10); // 1
  assert.equal(p.totalStars, 6);
  assert.deepEqual(p.stagesCleared, [1, 2, 3]);
});

test('legacy saves without bestCorrect are handled', () => {
  const legacy = { stagesCleared: [1], totalStars: 2, bestScores: { 1: 2 } };
  const next = applyStageResult(legacy, 1, 9, 10);
  assert.equal(next.bestCorrect[1], 9);
  assert.equal(next.bestScores[1], 2);
});
