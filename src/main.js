import './styles.css';
import { dispatch } from './dispatcher.js';
import { FALLBACK_CODE } from './prompts.js';

/**
 * Debug keyboard shortcuts — only active in development.
 *
 *   1 → fix      (✌️ Peace)
 *   2 → explain  (👍 Thumbs up)
 *   3 → commit   (🤙 Hang loose)
 *   4 → test     (🤘 Rock on)
 *   0 → stop     (✋ Open palm)
 */
if (import.meta.env.DEV) {
  const KEY_MAP = {
    '1': 'fix',
    '2': 'explain',
    '3': 'commit',
    '4': 'test',
    '0': 'open_palm',
  };

  document.addEventListener('keydown', async (e) => {
    // Ignore if user is typing in an input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const gesture = KEY_MAP[e.key];
    if (!gesture) return;

    // For action gestures, try to read clipboard; fall back to demo code
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
