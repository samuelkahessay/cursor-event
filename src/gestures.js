import { classifyGesture } from './classifier.js';
import { dispatch } from './dispatcher.js';

const DEBOUNCE_MS = 1000;
const FALLBACK_CODE = `def calculate_average(nums):\n    return sum(nums) / len(nums)  # crashes on empty list`;

let lastGesture = null;
let lastFiredAt = 0;
let uiCallback = null;

export function onGestureDetected(cb) {
  uiCallback = cb;
}

export function processFrame(results) {
  if (!results.multiHandLandmarks?.length) {
    lastGesture = null;
    return;
  }

  const landmarks = results.multiHandLandmarks[0];
  const gesture = classifyGesture(landmarks);

  if (!gesture) { lastGesture = null; return; }

  const now = Date.now();
  if (gesture === lastGesture && (now - lastFiredAt) < DEBOUNCE_MS) return;

  lastGesture = gesture;
  lastFiredAt = now;
  console.log(`GESTURE FIRED: ${gesture}`);

  uiCallback?.(gesture);
  fireDispatch(gesture);
}

function fireDispatch(gestureName) {
  if (gestureName === 'open_palm') {
    dispatch('open_palm');
    return;
  }
  navigator.clipboard.readText()
    .then(code => dispatch(gestureName, code))
    .catch(() => dispatch(gestureName, FALLBACK_CODE));
}