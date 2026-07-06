import { useState, useCallback } from 'react';
import { starsForScore } from './questionGenerator.js';

const STORAGE_KEY = 'pixel-math-quest-progress';

const EMPTY = { stagesCleared: [], totalStars: 0, bestScores: {}, bestCorrect: {} };

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Spread over EMPTY so saves written before a field existed (e.g.
    // bestCorrect) load cleanly instead of leaving undefined holes.
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    /* corrupted data, start fresh */
  }
  return { ...EMPTY };
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

// Pure state transition, exported for the node:test suite. Everything the
// game persists flows through here, so the invariants (stars never decrease,
// totalStars is always the sum of best stars) are testable without React.
export function applyStageResult(prev, stageId, correct, total) {
  const stars = starsForScore(correct, total);
  const cleared = stars > 0 && !prev.stagesCleared.includes(stageId)
    ? [...prev.stagesCleared, stageId]
    : prev.stagesCleared;
  const bestScores = {
    ...prev.bestScores,
    [stageId]: Math.max(prev.bestScores[stageId] || 0, stars),
  };
  const bestCorrect = {
    ...prev.bestCorrect,
    [stageId]: Math.max(prev.bestCorrect?.[stageId] || 0, correct),
  };
  const totalStars = Object.values(bestScores).reduce((s, v) => s + v, 0);
  return { stagesCleared: cleared, totalStars, bestScores, bestCorrect };
}

export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);

  const recordStageResult = useCallback((stageId, correct, total) => {
    setProgress((prev) => {
      const next = applyStageResult(prev, stageId, correct, total);
      saveProgress(next);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    const fresh = { ...EMPTY };
    saveProgress(fresh);
    setProgress(fresh);
  }, []);

  return { progress, recordStageResult, resetProgress };
}
