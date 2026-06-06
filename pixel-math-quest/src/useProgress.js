import { useState, useCallback } from 'react';

const STORAGE_KEY = 'pixel-math-quest-progress';

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted data — start fresh */
  }
  return { stagesCleared: [], totalStars: 0, bestScores: {} };
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);

  const recordStageResult = useCallback((stageId, correct, total) => {
    setProgress((prev) => {
      const stars = correct === total ? 3 : correct >= total * 0.7 ? 2 : correct >= total * 0.5 ? 1 : 0;
      const cleared = stars > 0 && !prev.stagesCleared.includes(stageId)
        ? [...prev.stagesCleared, stageId]
        : prev.stagesCleared;
      const prevBest = prev.bestScores[stageId] || 0;
      const bestScores = { ...prev.bestScores, [stageId]: Math.max(prevBest, stars) };
      const totalStars = Object.values(bestScores).reduce((s, v) => s + v, 0);
      const next = { stagesCleared: cleared, totalStars, bestScores };
      saveProgress(next);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    const fresh = { stagesCleared: [], totalStars: 0, bestScores: {} };
    saveProgress(fresh);
    setProgress(fresh);
  }, []);

  return { progress, recordStageResult, resetProgress };
}
