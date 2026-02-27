/**
 * Output panel DOM controller.
 *
 * Manages three inner zones:
 *   .status       – gesture-specific header ("▶ Fixing bug in selected code...")
 *   .content      – streaming text area
 *   .confirmation – clipboard / abort confirmation
 */

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

/** Show a status message at the top of the panel (e.g. "▶ Fixing bug..."). */
export function showStatus(msg) {
  clearPanel();
  const el = getOrCreate('status');
  el.textContent = msg;
}

/** Clear all panel content (hides onboarding if present). */
export function clearPanel() {
  const onboarding = panel.querySelector('#onboarding');
  if (onboarding) {
    onboarding.classList.add('hidden');
  }
  // Remove everything except a fading onboarding overlay
  Array.from(panel.children).forEach(child => {
    if (child.id !== 'onboarding') child.remove();
  });
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
