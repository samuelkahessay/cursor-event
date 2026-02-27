import './styles.css';
import { startCamera } from './camera.js';
import { initHands } from './mediapipe.js';
import { classifyGesture } from './classifier.js';
import { showGestureFeedback } from './ui.js';
import { dispatch } from './dispatcher.js';
import { FALLBACK_CODE } from './prompts.js';
import { createHandSketch } from './handviz.js';
import { showStatus } from './output-panel.js';
import { playTone, toggleMute } from './sounds.js';
import { logActivity } from './activity-log.js';

// ── DOM refs ──

const video = document.getElementById('camera');

// ── p5.js Hand Visualization ──
// Falls back to raw webcam feed if p5 CDN fails to load.

let handViz = null;

if (typeof p5 !== 'undefined') {
  handViz = createHandSketch('camera-wrap');
} else {
  console.warn('p5.js not available — falling back to webcam feed');
}

// ── Hold-timer state for confidence ring ──
// Gesture must be held 0.8s (HOLD_DURATION_MS) before dispatch fires.
// During the hold, the confidence ring fills progressively.

const HOLD_DURATION_MS = 800;
let currentGesture = null;
let holdStartTime = 0;
let holdConfirmed = false; // prevents re-firing while same gesture held

// ── MediaPipe frame handler ──
// Replaces the old processFrame from gestures.js.
// Feeds landmarks to both the classifier and the p5 visualization.

function onMediaPipeResults(results) {
  const lm = results.multiHandLandmarks?.[0] ?? null;

  if (!lm) {
    // No hand detected — reset everything
    handViz?.clearLandmarks();
    handViz?.setGesture(null);
    handViz?.setConfidence(0);
    currentGesture = null;
    holdConfirmed = false;
    return;
  }

  // Feed raw landmarks to the visualization
  handViz?.updateLandmarks(lm);

  // Classify gesture from landmarks
  const gesture = classifyGesture(lm);

  if (!gesture) {
    // Hand visible but no recognized gesture
    handViz?.setGesture(null);
    handViz?.setConfidence(0);
    currentGesture = null;
    holdConfirmed = false;
    return;
  }

  if (gesture !== currentGesture) {
    // New gesture — start hold timer
    currentGesture = gesture;
    holdStartTime = Date.now();
    holdConfirmed = false;
    handViz?.setGesture(gesture);
    handViz?.setConfidence(0);
    return;
  }

  // Same gesture held — update confidence ring
  if (holdConfirmed) return; // already fired for this hold

  const elapsed = Date.now() - holdStartTime;
  const progress = Math.min(elapsed / HOLD_DURATION_MS, 1);
  handViz?.setConfidence(progress);

  if (progress >= 1) {
    // Ring complete — confirm gesture
    holdConfirmed = true;
    handViz?.triggerBurst(gesture);
    showGestureFeedback(gesture);
    playTone('fire');
    logActivity('🖐', `Gesture confirmed: ${gesture}`);
    fireGestureDispatch(gesture);
  }
}

// ── Dispatch gesture action with clipboard code ──

function fireGestureDispatch(gestureName) {
  // Map physical gesture → action name (same mapping as gestures.js)
  const GESTURE_TO_ACTION = {
    thumbs_down: 'fix',
    point_up: 'explain',
    fist: 'commit',
    peace: 'test',
    open_palm: 'open_palm',
  };

  const action = GESTURE_TO_ACTION[gestureName];
  if (!action) return;

  if (action === 'open_palm') {
    dispatch('open_palm');
    return;
  }

  navigator.clipboard.readText()
    .then(code => dispatch(action, code || FALLBACK_CODE))
    .catch(() => dispatch(action, FALLBACK_CODE));
}

// ── Camera + MediaPipe startup ──

logActivity('🚀', 'GestureDispatch ready');

startCamera(video).then(() => {
  // Hide video — MediaPipe still reads from it, user sees p5 canvas
  if (handViz) {
    video.style.display = 'none';
  }
  initHands(video, onMediaPipeResults);
  logActivity('📷', 'Camera active');
}).catch((err) => {
  console.warn('Camera access failed:', err.message);
  showStatus('Camera access denied — use keyboard shortcuts (1-4, 0)');
  logActivity('📷', `Camera failed: ${err.message}`, 'error');
});

// ── Keyboard shortcuts (always available — demo safety net) ──

const KEY_MAP = {
  '1': 'fix',
  '2': 'explain',
  '3': 'commit',
  '4': 'test',
  '0': 'open_palm',
};

document.addEventListener('keydown', async (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'm' || e.key === 'M') { toggleMute(); return; }

  const gesture = KEY_MAP[e.key];
  if (!gesture) return;

  let code = '';
  if (gesture !== 'open_palm') {
    try {
      code = await navigator.clipboard.readText();
    } catch {
      code = FALLBACK_CODE;
    }
    if (!code.trim()) code = FALLBACK_CODE;
  }

  showGestureFeedback(gesture);
  playTone('fire');
  logActivity('⌨', `Key [${e.key}] → ${gesture}`);
  dispatch(gesture, code);
});
