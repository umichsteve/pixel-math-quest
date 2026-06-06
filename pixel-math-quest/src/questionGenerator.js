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

export function generateQuestion(stageId) {
  const stage = getStage(stageId);
  if (!stage) throw new Error(`Unknown stage ${stageId}`);
  return stage.generate();
}

export const QUESTIONS_PER_STAGE = 10;
