import { classifyGesture } from './classifier.js';
import { dispatch } from './dispatcher.js';
import { FALLBACK_CODE } from './prompts.js';

/** Map physical gesture names → dispatcher action names. */
const GESTURE_TO_ACTION = {
  thumbs_down: 'fix',
  point_up: 'explain',
  fist: 'commit',
  peace: 'test',
  open_palm: 'open_palm',
};

const DEBOUNCE_MS = 1000;

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