/**
 * Dependency-free WebAudio chiptune SFX.
 *
 * No audio assets ship with the app; everything is synthesized, which keeps
 * the bundle small and works fully offline (App Store Guideline 4.2).
 *
 * iOS/WKWebView note: the AudioContext is created lazily and resumed inside
 * play calls. The first play always happens inside a user gesture (the
 * answer submit), which unlocks audio for the rest of the session.
 */

const MUTE_KEY = 'pixel-math-quest-muted';

let ctx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* storage unavailable, mute just won't persist */
  }
}

function tone(freq, startOffset, duration, type = 'square', peak = 0.1) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + startOffset;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export function playCorrect() {
  if (isMuted()) return;
  tone(660, 0, 0.12);
  tone(880, 0.1, 0.18);
}

export function playWrong() {
  if (isMuted()) return;
  tone(196, 0, 0.22, 'sawtooth', 0.06);
}

export function playStageClear() {
  if (isMuted()) return;
  [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.16));
}
