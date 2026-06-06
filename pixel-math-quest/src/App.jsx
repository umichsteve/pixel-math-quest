import { useState, useCallback } from 'react';
import { getStages, generateQuestion, QUESTIONS_PER_STAGE } from './questionGenerator';
import { useProgress } from './useProgress';
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

function MapScreen({ onSelectStage, progress }) {
  const stages = getStages();
  return (
    <div className="screen map-screen">
      <h1 className="game-title">Pixel Math Quest</h1>
      <PixelHero mood="happy" />
      <p className="total-stars">Total Stars: {progress.totalStars} / 15</p>
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
        <button className="reset-btn" onClick={() => {
          if (window.confirm('Reset all progress?')) {
            window.location.reload();
            localStorage.removeItem('pixel-math-quest-progress');
          }
        }}>
          Reset Progress
        </button>
      )}
    </div>
  );
}

function PlayScreen({ stageId, onFinish }) {
  const stage = getStages().find((s) => s.id === stageId);
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState(() => generateQuestion(stageId));
  const [input, setInput] = useState('');
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [heroMood, setHeroMood] = useState('normal');

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const userAnswer = parseInt(input, 10);
      if (isNaN(userAnswer)) return;

      const isCorrect = userAnswer === question.answer;
      const newCorrect = isCorrect ? correct + 1 : correct;

      setFeedback(isCorrect ? 'Correct!' : `Nope! It was ${question.answer}`);
      setHeroMood(isCorrect ? 'happy' : 'sad');
      setCorrect(newCorrect);

      setTimeout(() => {
        const nextIndex = qIndex + 1;
        if (nextIndex >= QUESTIONS_PER_STAGE) {
          onFinish(newCorrect, QUESTIONS_PER_STAGE);
        } else {
          setQIndex(nextIndex);
          setQuestion(generateQuestion(stageId));
          setInput('');
          setFeedback(null);
          setHeroMood('normal');
        }
      }, 1200);
    },
    [input, question, correct, qIndex, stageId, onFinish],
  );

  return (
    <div className="screen play-screen" style={{ '--stage-color': stage.color }}>
      <div className="play-header">
        <span className="stage-label">{stage.name}</span>
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
          <input
            className="answer-input"
            type="number"
            inputMode="numeric"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={feedback !== null}
            autoFocus
            aria-label="Your answer"
          />
          <button type="submit" className="submit-btn" disabled={feedback !== null || input === ''}>
            Go!
          </button>
        </form>
        {feedback && (
          <p className={`feedback ${feedback.startsWith('Correct') ? 'correct' : 'wrong'}`}>
            {feedback}
          </p>
        )}
      </div>
      <p className="score-tracker">Score: {correct} / {qIndex + (feedback ? 1 : 0)}</p>
    </div>
  );
}

function ResultScreen({ stageId, correct, total, onBack }) {
  const stage = getStages().find((s) => s.id === stageId);
  const stars = correct === total ? 3 : correct >= total * 0.7 ? 2 : correct >= total * 0.5 ? 1 : 0;
  const passed = stars > 0;

  return (
    <div className="screen result-screen" style={{ '--stage-color': stage.color }}>
      <PixelHero mood={passed ? 'happy' : 'sad'} />
      <h2>{passed ? 'Stage Clear!' : 'Try Again!'}</h2>
      <p className="result-score">
        {correct} / {total} correct
      </p>
      <StarDisplay count={stars} />
      {!passed && <p className="hint">Get at least 50% to pass.</p>}
      <button className="back-btn" onClick={onBack}>
        Back to Map
      </button>
    </div>
  );
}

export default function App() {
  const { progress, recordStageResult } = useProgress();
  const [screen, setScreen] = useState(SCREENS.MAP);
  const [currentStage, setCurrentStage] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const handleSelectStage = useCallback((id) => {
    setCurrentStage(id);
    setScreen(SCREENS.PLAY);
  }, []);

  const handleFinish = useCallback(
    (correct, total) => {
      recordStageResult(currentStage, correct, total);
      setLastResult({ correct, total });
      setScreen(SCREENS.RESULT);
    },
    [currentStage, recordStageResult],
  );

  const handleBackToMap = useCallback(() => {
    setScreen(SCREENS.MAP);
    setCurrentStage(null);
    setLastResult(null);
  }, []);

  if (screen === SCREENS.PLAY && currentStage) {
    return <PlayScreen stageId={currentStage} onFinish={handleFinish} />;
  }

  if (screen === SCREENS.RESULT && lastResult) {
    return (
      <ResultScreen
        stageId={currentStage}
        correct={lastResult.correct}
        total={lastResult.total}
        onBack={handleBackToMap}
      />
    );
  }

  return <MapScreen onSelectStage={handleSelectStage} progress={progress} />;
}
