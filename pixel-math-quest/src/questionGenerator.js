const STAGES = [
  {
    id: 1,
    name: 'Counting Meadow',
    description: 'Addition up to 10',
    color: '#4ade80',
    generate: () => {
      const a = randInt(1, 5);
      const b = randInt(1, 5);
      return { text: `${a} + ${b}`, answer: a + b };
    },
  },
  {
    id: 2,
    name: 'Subtraction Swamp',
    description: 'Subtraction within 20',
    color: '#60a5fa',
    generate: () => {
      const a = randInt(5, 20);
      const b = randInt(1, a);
      return { text: `${a} − ${b}`, answer: a - b };
    },
  },
  {
    id: 3,
    name: 'Multiply Mountain',
    description: 'Multiplication tables up to 10',
    color: '#f472b6',
    generate: () => {
      const a = randInt(2, 10);
      const b = randInt(2, 10);
      return { text: `${a} × ${b}`, answer: a * b };
    },
  },
  {
    id: 4,
    name: 'Division Den',
    description: 'Division with whole-number results',
    color: '#fb923c',
    generate: () => {
      const b = randInt(2, 10);
      const answer = randInt(1, 10);
      const a = b * answer;
      return { text: `${a} ÷ ${b}`, answer };
    },
  },
  {
    id: 5,
    name: 'Boss Battle',
    description: 'Mixed operations, bigger numbers',
    color: '#a78bfa',
    generate: () => {
      const ops = ['+', '−', '×'];
      const op = ops[randInt(0, ops.length - 1)];
      if (op === '+') {
        const a = randInt(10, 50);
        const b = randInt(10, 50);
        return { text: `${a} + ${b}`, answer: a + b };
      }
      if (op === '−') {
        const a = randInt(20, 99);
        const b = randInt(1, a);
        return { text: `${a} − ${b}`, answer: a - b };
      }
      const a = randInt(2, 12);
      const b = randInt(2, 12);
      return { text: `${a} × ${b}`, answer: a * b };
    },
  },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getStage(id) {
  return STAGES.find((s) => s.id === id);
}

export function getStages() {
  return STAGES;
}

/**
 * Generate a question for a stage. Pass the previous question's text as
 * `avoidText` to prevent the same problem appearing twice in a row (very
 * likely otherwise on small-range stages like Counting Meadow, which only
 * has 25 possible problems). Retries are capped so this always terminates.
 */
export function generateQuestion(stageId, avoidText) {
  const stage = getStage(stageId);
  if (!stage) throw new Error(`Unknown stage ${stageId}`);
  let q = stage.generate();
  for (let attempts = 0; attempts < 8 && q.text === avoidText; attempts++) {
    q = stage.generate();
  }
  return q;
}

export const QUESTIONS_PER_STAGE = 10;

export const MAX_STARS_PER_STAGE = 3;

/**
 * Single source of truth for the star thresholds. Both the result screen
 * (display) and the progress store (persistence) call this, so the two can
 * never disagree about what a score is worth.
 *
 *   100%      -> 3 stars
 *   >= 70%    -> 2 stars
 *   >= 50%    -> 1 star (stage cleared)
 *   otherwise -> 0 stars
 */
export function starsForScore(correct, total) {
  if (correct === total) return 3;
  if (correct >= total * 0.7) return 2;
  if (correct >= total * 0.5) return 1;
  return 0;
}
