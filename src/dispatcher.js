import { PROMPT_TEMPLATES, STATUS_MESSAGES, CACHED_FALLBACK } from './prompts.js';
import { streamChat } from './api.js';
import { showStatus, clearPanel, appendText, showConfirmation } from './output-panel.js';
import { playTone } from './sounds.js';
import { logActivity } from './activity-log.js';

let activeController = null;

/**
 * Main dispatch function — the interface contract with Bishesh.
 *
 * @param {string} gestureName – One of: fix, explain, commit, test, open_palm
 * @param {string} code        – The code context (from clipboard or selection)
 */
export function dispatch(gestureName, code = '') {
  // ── Stop gesture: abort active stream ──
  if (gestureName === 'open_palm' || gestureName === 'stop') {
    if (activeController) {
      activeController.abort();
      activeController = null;
      logActivity('✋', 'Stream aborted');
    }
    showStatus(STATUS_MESSAGES.stop);
    playTone('abort');
    return;
  }

  // ── Validate gesture ──
  const template = PROMPT_TEMPLATES[gestureName];
  if (!template) {
    showStatus(`Unknown gesture: "${gestureName}"`);
    return;
  }

  // ── Abort any in-flight stream ──
  if (activeController) {
    activeController.abort();
  }
  activeController = new AbortController();
  const { signal } = activeController;

  // ── Build prompt and show status ──
  const prompt = template.replace('{code}', code);
  showStatus(STATUS_MESSAGES[gestureName]);

  const gestureIcons = { fix: '👎', explain: '☝️', commit: '✊', test: '✌️' };
  logActivity(gestureIcons[gestureName] || '🤚', `Dispatching "${gestureName}"`);

  // ── Stream and pipe to output panel ──
  streamChat(prompt, signal, (chunk) => {
    appendText(chunk);
  })
    .then((fullText) => {
      // Auto-copy result to clipboard
      navigator.clipboard.writeText(fullText).then(() => {
        showConfirmation('✓ Copied to clipboard');
        playTone('confirm');
        logActivity('✓', 'Response copied to clipboard', 'success');
      });
    })
    .catch((err) => {
      if (err.name === 'AbortError') return; // expected on abort

      // Network / API failure → use cached fallback
      console.warn('Stream failed, using cached fallback:', err.message);
      logActivity('⚠', `Stream failed: ${err.message}`, 'error');
      const fallback = CACHED_FALLBACK[gestureName];
      if (fallback) {
        clearPanel();
        showStatus(STATUS_MESSAGES[gestureName]);
        appendText(fallback);
        logActivity('↩', 'Using cached fallback');
        navigator.clipboard.writeText(fallback).then(() => {
          showConfirmation('✓ Copied to clipboard (cached fallback)');
          playTone('confirm');
        });
      } else {
        showStatus(`Error: ${err.message}`);
        logActivity('✗', `Error: ${err.message}`, 'error');
      }
    });
}
