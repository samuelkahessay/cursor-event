const GESTURE_LABELS = {
  peace:     '✌️  FIX FIRED',
  thumbs_up: '👍  EXPLAIN FIRED',
  hang_loose:'🤙  COMMIT FIRED',
  rock_on:   '🤘  TEST FIRED',
  open_palm: '✋  STOP',
};

const indicator = document.getElementById('gesture-indicator');
const labelEl   = document.getElementById('gesture-label');

export function showGestureFeedback(gestureName) {
  labelEl.textContent = gestureName.replace(/_/g, ' ');

  indicator.textContent = GESTURE_LABELS[gestureName] ?? gestureName;
  indicator.classList.remove('flash');
  void indicator.offsetWidth; // force reflow to restart animation
  indicator.classList.add('flash');

  setTimeout(() => indicator.classList.remove('flash'), 800);
}