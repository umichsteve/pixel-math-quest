/**
 * Invariant tests for the question generator. Run with: npm test
 * (node:test, no test framework dependency).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getStage,
  getStages,
  generateQuestion,
  starsForScore,
  QUESTIONS_PER_STAGE,
} from './questionGenerator.js';

const N = 2000;

function parse(text) {
  const m = text.match(/^(\d+) ([+\u2212\u00d7\u00f7]) (\d+)$/);
  assert.ok(m, `question text "${text}" has the form "a <op> b"`);
  return { a: Number(m[1]), op: m[2], b: Number(m[3]) };
}

function compute({ a, op, b }) {
  if (op === '+') return a + b;
  if (op === '\u2212') return a - b;
  if (op === '\u00d7') return a * b;
  return a / b; // ÷
}

test('exactly five stages with unique sequential ids', () => {
  const stages = getStages();
  assert.equal(stages.length, 5);
  assert.deepEqual(stages.map((s) => s.id), [1, 2, 3, 4, 5]);
  for (const s of stages) {
    assert.equal(getStage(s.id), s);
    assert.ok(s.name && s.description && s.color, `stage ${s.id} has display metadata`);
  }
});

test('QUESTIONS_PER_STAGE is 10', () => {
  assert.equal(QUESTIONS_PER_STAGE, 10);
});

test('generateQuestion throws on unknown stage', () => {
  assert.throws(() => generateQuestion(99), /Unknown stage 99/);
});

test('stage 1: addition with operands 1-5, answers 2-10', () => {
  for (let i = 0; i < N; i++) {
    const q = generateQuestion(1);
    const p = parse(q.text);
    assert.equal(p.op, '+');
    assert.ok(p.a >= 1 && p.a <= 5, `operand a=${p.a} in [1,5]`);
    assert.ok(p.b >= 1 && p.b <= 5, `operand b=${p.b} in [1,5]`);
    assert.equal(q.answer, compute(p));
    assert.ok(q.answer >= 2 && q.answer <= 10);
  }
});

test('stage 2: subtraction within 20, answers are non-negative integers', () => {
  for (let i = 0; i < N; i++) {
    const q = generateQuestion(2);
    const p = parse(q.text);
    assert.equal(p.op, '\u2212');
    assert.ok(p.a >= 5 && p.a <= 20, `minuend a=${p.a} in [5,20]`);
    assert.ok(p.b >= 1 && p.b <= p.a, `subtrahend b=${p.b} in [1,a]`);
    assert.equal(q.answer, compute(p));
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0);
  }
});

test('stage 3: multiplication tables with factors 2-10', () => {
  for (let i = 0; i < N; i++) {
    const q = generateQuestion(3);
    const p = parse(q.text);
    assert.equal(p.op, '\u00d7');
    assert.ok(p.a >= 2 && p.a <= 10);
    assert.ok(p.b >= 2 && p.b <= 10);
    assert.equal(q.answer, compute(p));
  }
});

test('stage 4: division always yields whole answers 1-10 with divisor 2-10', () => {
  for (let i = 0; i < N; i++) {
    const q = generateQuestion(4);
    const p = parse(q.text);
    assert.equal(p.op, '\u00f7');
    assert.ok(p.b >= 2 && p.b <= 10, `divisor b=${p.b} in [2,10]`);
    assert.equal(p.a % p.b, 0, `${p.a} divisible by ${p.b}`);
    assert.equal(q.answer, compute(p));
    assert.ok(Number.isInteger(q.answer) && q.answer >= 1 && q.answer <= 10);
  }
});

test('stage 5: mixed ops stay in spec ranges with non-negative integer answers', () => {
  const seen = new Set();
  for (let i = 0; i < N; i++) {
    const q = generateQuestion(5);
    const p = parse(q.text);
    seen.add(p.op);
    assert.equal(q.answer, compute(p));
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0);
    if (p.op === '+') {
      assert.ok(p.a >= 10 && p.a <= 50 && p.b >= 10 && p.b <= 50);
    } else if (p.op === '\u2212') {
      assert.ok(p.a >= 20 && p.a <= 99 && p.b >= 1 && p.b <= p.a);
    } else {
      assert.equal(p.op, '\u00d7');
      assert.ok(p.a >= 2 && p.a <= 12 && p.b >= 2 && p.b <= 12);
    }
  }
  assert.deepEqual([...seen].sort(), ['+', '\u00d7', '\u2212'], 'all three ops appear over 2000 draws');
});

test('starsForScore boundaries: 100% = 3, >= 70% = 2, >= 50% = 1, else 0', () => {
  assert.equal(starsForScore(10, 10), 3);
  assert.equal(starsForScore(9, 10), 2);
  assert.equal(starsForScore(7, 10), 2, 'exactly 70% earns 2 stars');
  assert.equal(starsForScore(6, 10), 1);
  assert.equal(starsForScore(5, 10), 1, 'exactly 50% clears the stage');
  assert.equal(starsForScore(4, 10), 0);
  assert.equal(starsForScore(0, 10), 0);
});

test('avoidText prevents back-to-back identical questions on every stage', () => {
  for (const stage of getStages()) {
    let last = generateQuestion(stage.id);
    for (let i = 0; i < 500; i++) {
      const q = generateQuestion(stage.id, last.text);
      assert.notEqual(q.text, last.text, `stage ${stage.id}: no immediate repeat`);
      last = q;
    }
  }
});
