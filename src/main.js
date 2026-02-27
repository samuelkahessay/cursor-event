import './styles.css';
import { startCamera } from './camera.js';
import { initHands } from './mediapipe.js';
import { processFrame, onGestureDetected } from './gestures.js';
import { showGestureFeedback } from './ui.js';
import { dispatch } from './dispatcher.js';
import { FALLBACK_CODE } from './prompts.js';

// ── Camera + gesture detection (Bishesh) ──

const video = document.getElementById('camera');

onGestureDetected((gestureName) => {
  showGestureFeedback(gestureName);
});

startCamera(video).then(() => {
  initHands(video, processFrame);
});

// ── Keyboard debug shortcuts (Sam) — DEV only ──

if (import.meta.env.DEV) {
  const KEY_MAP = {
    '1': 'fix',
    '2': 'explain',
    '3': 'commit',
    '4': 'test',
    '0': 'open_palm',
  };

  document.addEventListener('keydown', async (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

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

    dispatch(gesture, code);
  });

  console.log(
    '%c[GestureDispatch] Dev mode — press 1-4 to simulate gestures, 0 to stop',
    'color: #58a6ff',
  );
}
