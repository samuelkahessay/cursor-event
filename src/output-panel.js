/**
 * Output panel DOM controller.
 *
 * Manages three inner zones:
 *   .status       – gesture-specific header ("▶ Fixing bug in selected code...")
 *   .content      – streaming text area
 *   .confirmation – clipboard / abort confirmation
 */

import { FALLBACK_CODE } from './prompts.js';

const panel = document.getElementById('output-panel');

// ── Ensure inner elements exist ──

function getOrCreate(className, tag = 'div') {
  let el = panel.querySelector(`.${className}`);
  if (!el) {
    el = document.createElement(tag);
    el.className = className;
    panel.appendChild(el);
  }
  return el;
}

/** Show the demo code snippet on initial load so it's ready to select + copy. */
export function showDemoState() {
  panel.innerHTML = `
    <div class="demo-hint">Select the code below, copy it, then press a key to dispatch →</div>
    <pre class="demo-snippet">${FALLBACK_CODE}</pre>
  `;
}

/** Show a status message at the top of the panel (e.g. "▶ Fixing bug..."). */
export function showStatus(msg) {
  clearPanel();
  const el = getOrCreate('status');
  el.textContent = msg;
}

/** Clear all panel content. */
export function clearPanel() {
  panel.innerHTML = '';
}

/** Append a text chunk to the streaming content area. */
export function appendText(chunk) {
  const el = getOrCreate('content');
  el.textContent += chunk;
  // Auto-scroll to bottom
  panel.scrollTop = panel.scrollHeight;
}

/** Show a confirmation message below the content (e.g. "✓ Copied to clipboard"). */
export function showConfirmation(msg) {
  const el = getOrCreate('confirmation');
  el.textContent = msg;
}
