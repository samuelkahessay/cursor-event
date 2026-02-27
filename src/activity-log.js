/**
 * Activity log — bottom-right panel.
 *
 * Appends timestamped entries for gesture detections,
 * dispatch events, API results, and errors.
 */

const entries = document.getElementById('activity-log-entries');

function ts() {
  const d = new Date();
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Add a line to the activity log.
 *
 * @param {string} icon  – emoji or short symbol
 * @param {string} msg   – description text
 * @param {'info'|'success'|'error'} [type='info']
 */
export function logActivity(icon, msg, type = 'info') {
  if (!entries) return;

  const row = document.createElement('div');
  row.className = 'activity-entry' + (type !== 'info' ? ` activity-${type}` : '');

  row.innerHTML =
    `<span class="activity-time">${ts()}</span>` +
    `<span class="activity-icon">${icon}</span>` +
    `<span class="activity-msg">${msg}</span>`;

  entries.appendChild(row);
  entries.scrollTop = entries.scrollHeight;
}
