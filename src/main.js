import { startCamera } from './camera.js';
import { initHands } from './mediapipe.js';
import { processFrame, onGestureDetected } from './gestures.js';
import { showGestureFeedback } from './ui.js';

const video = document.getElementById('camera');

onGestureDetected((gestureName) => {
  showGestureFeedback(gestureName);
});

startCamera(video).then(() => {
  initHands(video, processFrame);
});