import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getStage,
  getStages,
  generateQuestion,
  starsForScore,
  QUESTIONS_PER_STAGE,
  MAX_STARS_PER_STAGE,
} from './questionGenerator';
import { useProgress } from './useProgress';
import { isMuted, setMuted, playCorrect, playWrong, playStageClear } from './sound';
import { hapticCorrect, hapticWrong, hapticStageClear } from './haptics';
import './App.css';

const SCREENS = { MAP: 'map', PLAY: 'play', RESULT: 'result' };

function StarDisplay({ count, max = 3 }) {
  return (
    <span className="stars" aria-label={`${count} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < count ? 'star filled' : 'star empty'}>
          {i < count ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

function PixelHero({ mood }) {
  const face = mood === 'happy' ? '^_^' : mood === 'sad' ? '>_<' : 'o_o';
  return (
    <div className="pixel-hero" aria-hidden="true">
      <div className="hero-body">
        <div className="hero-face">{face}</div>
      </div>
    </div>
  );
}

function MuteButton() {
  const [muted, setMutedState] = useState(isMuted);
  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };
  return (
    <button
      type="button"
      className="icon-btn mute-btn"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {muted ? '\u{1F507}' : '\u{1F50A}'}
    </button>
  );
}

function MapScreen({ onSelectStage, onReset, progress }) {
  const stages = getStages();
  const maxStars = stages.length * MAX_STARS_PER_STAGE;
  return (
    <div className="screen map-screen">
      <h1 className="game-title">Pixel Math Quest</h1>
      <PixelHero mood="happy" />
      <p className="total-stars">Total Stars: {progress.totalStars} / {maxStars}</p>
      <div className="stage-list">
        {stages.map((stage) => {
          const unlocked = stage.id === 1 || progress.stagesCleared.includes(stage.id - 1);
          const best = progress.bestScores[stage.id] || 0;
          return (
            <button
              key={stage.id}
              className={`stage-btn ${unlocked ? '' : 'locked'}`}
              style={unlocked ? { '--stage-color': stage.color } : {}}
              disabled={!unlocked}
              onClick={() => onSelectStage(stage.id)}
            >
              <span className="stage-id">{stage.id}</span>
              <span className="stage-name">{stage.name}</span>
              <span className="stage-desc">{stage.description}</span>
              {unlocked ? <StarDisplay count={best} /> : <span className="lock-icon">&#x1f512;</span>}
            </button>
          );
        })}
      </div>
      {progress.totalStars > 0 && (
        <button
          className="reset-btn"
          onClick={() => {
            if (window.confirm('Reset all progress?')) onReset();
          }}
        >
          Reset Progress
        </button>
      )}
    </div>
  );
}

// Rotating praise keeps correct answers from feeling robotic without needing
// any assets. Indexed by question number so the sequence is stable per run.
const PRAISE = ['Correct!', 'Nice one!', 'You got it!', 'Awesome!', 'Great job!'];

function PlayScreen({ stageId, onFinish, onQuit }) {
  const stage = getStage(stageId);
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState(() => generateQuestion(stageId));
  const [input, setInput] = useState('');
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null); // { correct: boolean, text: string } | null
  const [heroMood, setHeroMood] = useState('normal');
  const [streak, setStreak] = useState(0);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // The input is disabled while feedback shows, which drops focus on iOS and
  // closes the keyboard. Refocus when the next question arrives so a kid
  // never has to re-tap the box between questions.
  useEffect(() => {
    inputRef.current?.focus();
  }, [qIndex]);

  // Never fire the advance timer into an unmounted screen (e.g. quit mid-feedback).
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleQuit = () => {
    if (window.confirm('Quit this stage? This run will not be saved.')) onQuit();
  };

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const userAnswer = parseInt(input, 10);
      if (isNaN(userAnswer)) return;

      const isCorrect = userAnswer === question.answer;
      const newCorrect = isCorrect ? correct + 1 : correct;
      const newStreak = isCorrect ? streak + 1 : 0;

      // Play inside the submit gesture so iOS unlocks the AudioContext.
      if (isCorrect) {
        playCorrect();
        hapticCorrect();
      } else {
        playWrong();
        hapticWrong();
      }

      setFeedback(
        isCorrect
          ? {
              correct: true,
              text:
                newStreak >= 3
                  ? `${newStreak} in a row!`
                  : PRAISE[qIndex % PRAISE.length],
            }
          : { correct: false, text: `Nope! It was ${question.answer}` },
      );
      setHeroMood(isCorrect ? 'happy' : 'sad');
      setCorrect(newCorrect);
      setStreak(newStreak);

      // A correct answer can advance quickly; a wrong one shows the real
      // answer, and a kid needs time to actually read it. That pause is the
      // teaching moment, so don't rush it.
      const advanceDelay = isCorrect ? 1000 : 2000;

      timerRef.current = setTimeout(() => {
        const nextIndex = qIndex + 1;
        if (nextIndex >= QUESTIONS_PER_STAGE) {
          onFinish(newCorrect, QUESTIONS_PER_STAGE);
        } else {
          setQIndex(nextIndex);
          setQuestion(generateQuestion(stageId, question.text));
          setInput('');
          setFeedback(null);
          setHeroMood('normal');
        }
      }, advanceDelay);
    },
    [input, question, correct, streak, qIndex, stageId, onFinish],
  );

  return (
    <div className="screen play-screen" style={{ '--stage-color': stage.color }}>
      <div className="play-header">
        <button type="button" className="icon-btn quit-btn" onClick={handleQuit} aria-label="Quit stage">
          ✕
        </button>
        <span className="stage-label">{stage.name}</span>
        <MuteButton />
        <span className="progress-label">
          {qIndex + 1} / {QUESTIONS_PER_STAGE}
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((qIndex + 1) / QUESTIONS_PER_STAGE) * 100}%` }}
        />
      </div>
      <PixelHero mood={heroMood} />
      <div className="question-card">
        <p className="question-text">{question.text} = ?</p>
        <form onSubmit={handleSubmit}>
          {/* type="text" + inputMode avoids number-input quirks (e/-/. accepted,
              scroll wheel changing the value) while still showing the digit
              pad on iOS. onChange strips non-digits so parseInt is always
              grading exactly what the kid sees. Max answer is 144 (12 x 12). */}
          <input
            ref={inputRef}
            className="answer-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            enterKeyHint="go"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
            disabled={feedback !== null}
            autoFocus
            aria-label="Your answer"
          />
          <button type="submit" className="submit-btn" disabled={feedback !== null || input === ''}>
            Go!
          </button>
        </form>
        <p
          className={`feedback ${feedback ? (feedback.correct ? 'correct' : 'wrong') : ''}`}
          role="status"
          aria-live="polite"
        >
          {feedback ? feedback.text : '\u00A0'}
        </p>
      </div>
      <p className="score-tracker">
        Score: {correct} / {qIndex + (feedback ? 1 : 0)}
        {streak >= 3 && (
          <span className="streak-chip" aria-label={`${streak} correct in a row`}>
            {'\u{1F525}'} x{streak}
          </span>
        )}
      </p>
    </div>
  );
}

function ResultScreen({ stageId, correct, total, prevBest, onBack, onReplay, onNext }) {
  const stage = getStage(stageId);
  // starsForScore is the single source of truth shared with useProgress, so
  // the stars shown here always match what was persisted for the stage.
  const stars = starsForScore(correct, total);
  const passed = stars > 0;
  const nextStage = getStage(stageId + 1);

  const isNewBest = correct > prevBest && prevBest > 0;
  const best = Math.max(correct, prevBest);

  useEffect(() => {
    if (passed) {
      playStageClear();
      hapticStageClear();
    }
  }, [passed]);

  return (
    <div className="screen result-screen" style={{ '--stage-color': stage.color }}>
      <PixelHero mood={passed ? 'happy' : 'sad'} />
      <h2>{passed ? 'Stage Clear!' : 'Try Again!'}</h2>
      <p className="result-score">
        {correct} / {total} correct
        {isNewBest && <span className="new-best-badge">New Best!</span>}
      </p>
      {prevBest > 0 && !isNewBest && (
        <p className="best-score">Best: {best} / {total}</p>
      )}
      <StarDisplay count={stars} />
      {!passed && <p className="hint">Get at least 50% to pass.</p>}
      <div className="result-actions">
        {passed && nextStage && (
          <button
            className="back-btn"
            style={{ '--stage-color': nextStage.color }}
            onClick={onNext}
          >
            Next: {nextStage.name}
          </button>
        )}
        <button className="back-btn" onClick={onReplay}>
          {passed ? 'Play Again' : 'Try Again'}
        </button>
        <button className="back-btn secondary" onClick={onBack}>
          Back to Map
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { progress, recordStageResult, resetProgress } = useProgress();
  const [screen, setScreen] = useState(SCREENS.MAP);
  const [currentStage, setCurrentStage] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const handleSelectStage = useCallback((id) => {
    setCurrentStage(id);
    setScreen(SCREENS.PLAY);
  }, []);

  const handleFinish = useCallback(
    (correct, total) => {
      // Snapshot the best BEFORE recording, so the result screen can tell
      // whether this run beat it. After recordStageResult the stored best
      // already includes this run and the comparison would always be false.
      const prevBest = progress.bestCorrect?.[currentStage] || 0;
      recordStageResult(currentStage, correct, total);
      setLastResult({ correct, total, prevBest });
      setScreen(SCREENS.RESULT);
    },
    [currentStage, progress, recordStageResult],
  );

  const handleBackToMap = useCallback(() => {
    setScreen(SCREENS.MAP);
    setCurrentStage(null);
    setLastResult(null);
  }, []);

  // Replay and next-stage both leave the RESULT screen, which unmounts
  // PlayScreen's previous instance, so the new run always starts fresh.
  const handleReplay = useCallback(() => {
    setLastResult(null);
    setScreen(SCREENS.PLAY);
  }, []);

  const handleNextStage = useCallback(() => {
    setCurrentStage((s) => s + 1);
    setLastResult(null);
    setScreen(SCREENS.PLAY);
  }, []);

  if (screen === SCREENS.PLAY && currentStage) {
    return <PlayScreen stageId={currentStage} onFinish={handleFinish} onQuit={handleBackToMap} />;
  }

  if (screen === SCREENS.RESULT && lastResult) {
    return (
      <ResultScreen
        stageId={currentStage}
        correct={lastResult.correct}
        total={lastResult.total}
        prevBest={lastResult.prevBest}
        onBack={handleBackToMap}
        onReplay={handleReplay}
        onNext={handleNextStage}
      />
    );
  }

  return <MapScreen onSelectStage={handleSelectStage} onReset={resetProgress} progress={progress} />;
}
