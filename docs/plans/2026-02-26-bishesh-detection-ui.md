# Bishesh Detection & UI Shell — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Own everything from camera → recognized gesture event + the visual shell, so that a held hand sign reliably fires a named gesture event and calls Sam's `dispatch()`.

**Architecture:** Vite + Vanilla JS app. `classifier.js` is pure logic (testable). `gestures.js` wraps MediaPipe and owns the debounce + event firing. `ui.js` handles all DOM updates. `dispatcher.js` is Sam's file — Bishesh stubs it first to develop independently, then swaps the real one in for integration.

**Tech Stack:** Vite (CDN-less scaffold), MediaPipe Hands (CDN), Clipboard API, Vitest (unit tests for classifier only)

---

## Interface Contract (Read This First)

Bishesh calls into Sam's module. Sam's file lives at `src/dispatcher.js`.

```js
// src/dispatcher.js — Sam owns this. Bishesh stubs it during solo dev.
export function dispatch(gestureName, code = '') { ... }
```

Bishesh's call site in `src/gestures.js`:
```js
import { dispatch } from './dispatcher.js';

const FALLBACK_CODE = `def calculate_average(nums):\n    return sum(nums) / len(nums)  # crashes on empty list`;

function onGesture(gestureName) {
  if (gestureName === 'open_palm') {
    dispatch('open_palm');
  } else {
    navigator.clipboard.readText()
      .then(code => dispatch(gestureName, code))
      .catch(() => dispatch(gestureName, FALLBACK_CODE));
  }
}
```

The output panel container (`#output-panel`) is created by Bishesh. Sam renders into it.

---

## Task 1: Project Scaffold

**Files:**
- Create: `index.html`
- Create: `src/main.js`
- Create: `package.json` (via Vite init)

**Step 1: Scaffold the Vite project**
```bash
npm create vite@latest . -- --template vanilla
npm install
```

**Step 2: Confirm dev server runs**
```bash
npm run dev
```
Expected: Browser opens at `http://localhost:5173`, default Vite page visible.

**Step 3: Commit**
```bash
git add .
git commit -m "feat: scaffold Vite vanilla JS project"
```

---

## Task 2: HTML Layout Shell

**Files:**
- Modify: `index.html`
- Create: `src/style.css`

**Step 1: Replace index.html with app layout**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>GestureDispatch</title>
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body>
  <div id="app">
    <!-- Top row: camera feed + gesture indicator -->
    <div id="top-bar">
      <div id="camera-wrap">
        <video id="camera" autoplay playsinline muted></video>
        <canvas id="landmark-canvas"></canvas>
        <div id="gesture-label"></div>
      </div>
      <div id="gesture-indicator"></div>
    </div>

    <!-- Output panel — Sam renders content inside this -->
    <div id="output-panel"></div>

    <!-- Legend bar -->
    <div id="legend-bar">
      <span>✌️ fix</span>
      <span>👍 explain</span>
      <span>🤙 commit</span>
      <span>🤘 test</span>
      <span>✋ stop</span>
    </div>
  </div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**Step 2: Add base styles to `src/style.css`**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0d0d0d; color: #f0f0f0; font-family: monospace; height: 100vh; display: flex; flex-direction: column; }

#app { display: flex; flex-direction: column; height: 100vh; }

#top-bar { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px; }

#camera-wrap { position: relative; width: 200px; height: 150px; }
#camera, #landmark-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 6px; }
#gesture-label {
  position: absolute; bottom: 4px; left: 4px;
  background: rgba(0,0,0,0.6); color: #fff;
  font-size: 12px; padding: 2px 6px; border-radius: 4px;
}

#gesture-indicator {
  font-size: 20px; font-weight: bold; color: #a3e635;
  opacity: 0; transition: opacity 0.15s;
}
#gesture-indicator.flash { opacity: 1; }

#output-panel {
  flex: 1; background: #111; border-top: 1px solid #222;
  padding: 16px; overflow-y: auto; font-size: 14px;
}

#legend-bar {
  display: flex; gap: 24px; justify-content: center;
  padding: 10px; border-top: 1px solid #222;
  font-size: 13px; color: #888;
}
```

**Step 3: Verify layout renders**
```bash
npm run dev
```
Expected: Dark page with camera area placeholder, output panel, legend bar at bottom.

**Step 4: Commit**
```bash
git add index.html src/style.css
git commit -m "feat: add HTML layout shell and base styles"
```

---

## Task 3: Camera Feed

**Files:**
- Create: `src/camera.js`
- Modify: `src/main.js`

**Step 1: Write `src/camera.js`**

```js
export async function startCamera(videoEl) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoEl.srcObject = stream;
  return new Promise(resolve => { videoEl.onloadedmetadata = () => resolve(videoEl); });
}
```

**Step 2: Call it from `src/main.js`**

```js
import { startCamera } from './camera.js';

const video = document.getElementById('camera');
startCamera(video).then(() => console.log('Camera ready'));
```

**Step 3: Verify in browser**
Expected: Webcam feed renders in the top-left box.

**Step 4: Commit**
```bash
git add src/camera.js src/main.js
git commit -m "feat: add webcam feed via getUserMedia"
```

---

## Task 4: MediaPipe Hands Setup

**Files:**
- Modify: `index.html` (CDN script tags)
- Create: `src/mediapipe.js`

**Step 1: Add MediaPipe CDN scripts to `index.html` (before closing `</body>`)**

```html
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
```

**Step 2: Write `src/mediapipe.js`**

```js
export function initHands(videoEl, onResults) {
  const hands = new Hands({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.85,
    minTrackingConfidence: 0.85,
  });

  hands.onResults(onResults);

  const camera = new Camera(videoEl, {
    onFrame: async () => { await hands.send({ image: videoEl }); },
    width: 200,
    height: 150,
  });

  camera.start();
}
```

**Step 3: Wire into `src/main.js`**

```js
import { startCamera } from './camera.js';
import { initHands } from './mediapipe.js';

const video = document.getElementById('camera');

startCamera(video).then(() => {
  initHands(video, (results) => {
    if (results.multiHandLandmarks?.length) {
      console.log('Landmarks:', results.multiHandLandmarks[0]);
    }
  });
});
```

**Step 4: Verify landmarks log in console**
Expected: On hand in frame, console prints an array of 21 `{x, y, z}` objects.

**Step 5: Commit**
```bash
git add index.html src/mediapipe.js src/main.js
git commit -m "feat: integrate MediaPipe Hands via CDN"
```

---

## Task 5: Gesture Classifier (Pure Logic — Testable)

**Files:**
- Create: `src/classifier.js`
- Create: `tests/classifier.test.js`

**Step 1: Install Vitest**
```bash
npm install -D vitest
```
Add to `package.json` scripts: `"test": "vitest"`

**Step 2: Write the failing tests first**

```js
// tests/classifier.test.js
import { describe, it, expect } from 'vitest';
import { classifyGesture } from '../src/classifier.js';

// Helper: build a fake 21-landmark array
// MediaPipe: y increases downward, so extended finger = tip.y < pip.y
function makeLandmarks(overrides = {}) {
  const lm = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));

  const extend = (tip, pip) => { lm[tip].y = 0.2; lm[pip].y = 0.5; };
  const curl   = (tip, pip) => { lm[tip].y = 0.8; lm[pip].y = 0.5; };
  const extendThumb = () => { lm[4].x = 0.2; lm[2].x = 0.5; };
  const curlThumb   = () => { lm[4].x = 0.8; lm[2].x = 0.5; };

  // Curl everything by default
  curlThumb(); curl(8,6); curl(12,10); curl(16,14); curl(20,18);

  if (overrides.thumb)   extendThumb();
  if (overrides.index)   extend(8, 6);
  if (overrides.middle)  extend(12, 10);
  if (overrides.ring)    extend(16, 14);
  if (overrides.pinky)   extend(20, 18);

  return lm;
}

describe('classifyGesture', () => {
  it('returns peace for index + middle extended', () => {
    expect(classifyGesture(makeLandmarks({ index: true, middle: true }))).toBe('peace');
  });
  it('returns thumbs_up for thumb only extended', () => {
    expect(classifyGesture(makeLandmarks({ thumb: true }))).toBe('thumbs_up');
  });
  it('returns hang_loose for thumb + pinky', () => {
    expect(classifyGesture(makeLandmarks({ thumb: true, pinky: true }))).toBe('hang_loose');
  });
  it('returns rock_on for index + pinky', () => {
    expect(classifyGesture(makeLandmarks({ index: true, pinky: true }))).toBe('rock_on');
  });
  it('returns open_palm for all fingers extended', () => {
    expect(classifyGesture(makeLandmarks({ thumb: true, index: true, middle: true, ring: true, pinky: true }))).toBe('open_palm');
  });
  it('returns null for no match', () => {
    expect(classifyGesture(makeLandmarks({ ring: true }))).toBeNull();
  });
});
```

**Step 3: Run tests — confirm they all FAIL**
```bash
npm test
```
Expected: `Cannot find module '../src/classifier.js'`

**Step 4: Write `src/classifier.js`**

```js
// MediaPipe landmark indices
const THUMB_TIP = 4, THUMB_MCP = 2;
const INDEX_TIP = 8,  INDEX_PIP = 6;
const MIDDLE_TIP = 12, MIDDLE_PIP = 10;
const RING_TIP = 16,   RING_PIP = 14;
const PINKY_TIP = 20,  PINKY_PIP = 18;

function isExtended(lm, tip, pip) {
  return lm[tip].y < lm[pip].y;
}
function isThumbExtended(lm) {
  // Thumb extends sideways; for right hand: tip moves left (lower x)
  return lm[THUMB_TIP].x < lm[THUMB_MCP].x;
}

export function classifyGesture(landmarks) {
  const lm = landmarks;
  const thumb  = isThumbExtended(lm);
  const index  = isExtended(lm, INDEX_TIP, INDEX_PIP);
  const middle = isExtended(lm, MIDDLE_TIP, MIDDLE_PIP);
  const ring   = isExtended(lm, RING_TIP, RING_PIP);
  const pinky  = isExtended(lm, PINKY_TIP, PINKY_PIP);

  if (thumb && index && middle && ring && pinky) return 'open_palm';
  if (index && middle && !ring && !pinky)        return 'peace';
  if (thumb && !index && !middle && !ring && !pinky) return 'thumbs_up';
  if (thumb && pinky && !index && !middle && !ring)  return 'hang_loose';
  if (index && pinky && !middle && !ring)            return 'rock_on';

  return null;
}
```

**Step 5: Run tests — confirm they all PASS**
```bash
npm test
```
Expected: `6 passed`

**Step 6: Commit**
```bash
git add src/classifier.js tests/classifier.test.js package.json
git commit -m "feat: add gesture classifier with passing unit tests"
```

---

## Task 6: Debounce + Gesture Event Emitter

**Files:**
- Create: `src/gestures.js`
- Modify: `src/main.js`

**Step 1: Write `src/gestures.js`**

```js
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
```

**Step 2: Update `src/main.js`**

```js
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
```

**Step 3: Verify in browser**
Expected: Hold up ✌️ for 1 second → `GESTURE FIRED: peace` logs once, debounce prevents repeat.

**Step 4: Commit**
```bash
git add src/gestures.js src/main.js
git commit -m "feat: add gesture event emitter with 1s debounce and dispatch wiring"
```

---

## Task 7: UI Feedback — Flash + Gesture Label

**Files:**
- Create: `src/ui.js`
- Modify: `src/style.css`

**Step 1: Write `src/ui.js`**

```js
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
```

**Step 2: Add flash animation to `src/style.css`**

```css
#gesture-indicator.flash {
  animation: flash-in 0.8s ease-out forwards;
}
@keyframes flash-in {
  0%   { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(1); }
}
```

**Step 3: Verify in browser**
Expected: Gesture fires → label shows on camera feed → top-right indicator flashes and fades.

**Step 4: Commit**
```bash
git add src/ui.js src/style.css
git commit -m "feat: add gesture flash animation and camera label overlay"
```

---

## Task 8: Stub Dispatcher (Solo Dev Placeholder)

**Files:**
- Create: `src/dispatcher.js` (STUB — Sam replaces this)

**Step 1: Write stub `src/dispatcher.js`**

```js
// STUB — Sam replaces this with the real implementation
// This lets Bishesh develop and test independently
export function dispatch(gestureName, code = '') {
  const panel = document.getElementById('output-panel');
  panel.textContent = `[STUB] dispatch("${gestureName}")\ncode preview: ${code.slice(0, 80)}...`;
  console.log(`[stub dispatch] gesture=${gestureName}, code length=${code.length}`);
}
```

**Step 2: Verify end-to-end with stub**
Expected: Gesture fires → stub text appears in output panel.

**Step 3: Commit**
```bash
git add src/dispatcher.js
git commit -m "feat: add stub dispatcher for solo development"
```

---

## Task 9: Integration — Swap in Sam's Real Dispatcher

> **Do this step together with Sam, or after Sam pushes his branch.**

**Files:**
- Replace: `src/dispatcher.js` with Sam's real implementation

**Step 1: Pull Sam's changes**
```bash
git fetch origin
# Coordinate with Sam to get his dispatcher.js into src/
```

**Step 2: Verify full integration**
Expected: ✌️ peace → Claude streams bug fix into `#output-panel` → "✓ Copied to clipboard" appears.

**Step 3: Kill console errors**
Open DevTools → Console tab → fix any red errors before continuing.

**Step 4: Commit**
```bash
git add src/dispatcher.js
git commit -m "feat: swap stub for Sam's real dispatcher — integration complete"
```

---

## Task 10: Demo Polish

**Step 1: Test all 5 gestures in normal lighting**
- ✌️ peace → fix fires → Claude streams → clipboard copies
- 👍 thumbs_up → explain fires
- 🤙 hang_loose → commit fires
- 🤘 rock_on → test fires
- ✋ open_palm → stream aborts ("⏹ Stream aborted." in panel)

**Step 2: Run 60-second demo arc 3 times clean**
- Open buggy Python function in editor: `def calculate_average(nums): return sum(nums) / len(nums)`
- Select it → copy
- ✌️ fix → 👍 explain → 🤙 commit message
- All 3 runs: no console errors, no missed gestures

**Step 3: Final commit**
```bash
git add -A
git commit -m "chore: demo polish — all 5 gestures verified, console clean"
```

---

## Alignment Notes (Where Bishesh & Sam Depend on Each Other)

| Contract Point | Bishesh Does | Sam Does |
|---|---|---|
| `dispatch(name, code)` | Calls it | Exports it from `src/dispatcher.js` |
| `#output-panel` div | Creates it in HTML with that exact ID | Renders streaming text into it |
| Clipboard read | Before calling dispatch | N/A — receives pre-read code string |
| `open_palm` | Calls `dispatch('open_palm')` with no code | Handles abort logic inside dispatch |
| Fallback code string | Passes hardcoded string if clipboard denied | Uses whatever code string arrives |

---

## Verification Checklist

- [ ] `npm test` → 6 classifier tests pass
- [ ] Camera feed renders live in browser
- [ ] All 5 gestures log correctly to console
- [ ] 1-second debounce works (hold gesture → fires once, not repeatedly)
- [ ] Flash animation + label appear on gesture fire
- [ ] Clipboard content is read and passed to dispatch
- [ ] Fallback code fires when clipboard permission denied
- [ ] Full integration with Sam's dispatcher: gesture → Claude stream → clipboard copy
- [ ] "✓ Copied to clipboard" confirmation visible in panel
- [ ] Zero console errors during demo arc
- [ ] 60-second demo arc runs clean 3 times in a row
