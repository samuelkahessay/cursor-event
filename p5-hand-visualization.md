# GestureDispatch — p5.js Hand Visualization
**Scope:** Replace raw webcam feed with stylized hand landmark rendering
**Owner:** Bishesh
**Priority:** Core if detection finishes by minute 20, otherwise stretch
**Time estimate:** ~20 minutes
**Last Updated:** February 26, 2026

---

## What This Replaces

The current plan renders the webcam feed in a `<video>` element and overlays gesture labels on top. This replaces that entire area with a p5.js canvas that renders a stylized hand skeleton from MediaPipe's 21-point landmark data.

The webcam still runs — it's just hidden. MediaPipe processes frames from the hidden `<video>`, then passes landmark coordinates to both the gesture classifier (unchanged) and the p5 sketch (new).

```
┌──────────────────────────────────────────────┐
│              BEFORE (raw webcam)             │
│  ┌────────────────────────────────────────┐  │
│  │  Webcam feed of your face/hand        │  │
│  │  with gesture label overlaid          │  │
│  └────────────────────────────────────────┘  │
│                                              │
│              AFTER (p5.js canvas)            │
│  ┌────────────────────────────────────────┐  │
│  │  Dark canvas with glowing landmark    │  │
│  │  skeleton, particle bursts on         │  │
│  │  gesture recognition, confidence      │  │
│  │  ring drawn natively in canvas        │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## Architecture

```
webcam (hidden <video>)
    │
    ▼
MediaPipe Hands (processes frames)
    │
    ├──► gestures.js        — classifies landmarks into gesture name (unchanged)
    │
    └──► handviz.js (p5)    — renders landmarks as stylized skeleton (NEW)
            │
            ├── draw hand skeleton (nodes + bones)
            ├── draw confidence ring
            ├── draw gesture recognition particles
            └── draw idle ambient state
```

MediaPipe's callback provides `results.landmarks[0]` — an array of 21 `{x, y, z}` points normalized to 0–1. The p5 sketch scales these to canvas dimensions and draws every frame.

---

## Loading p5.js

CDN in `index.html`, no npm install:

```html
<script src="https://cdn.jsdelivr.net/npm/p5@1.11.3/lib/p5.min.js"></script>
```

Use p5 in **instance mode** (not global mode) to avoid polluting the global namespace and conflicting with other scripts:

```js
// handviz.js
export function createHandSketch(containerId) {
  return new p5((p) => {
    p.setup = () => { ... };
    p.draw = () => { ... };
  }, document.getElementById(containerId));
}
```

---

## File: `src/handviz.js`

This is the full p5 sketch. It exports one function that `main.js` calls on startup, and exposes an `updateLandmarks()` method that MediaPipe's callback feeds into.

### Data Flow

```js
// main.js — wiring MediaPipe to the sketch
import { createHandSketch } from './handviz.js';

const handViz = createHandSketch('camera-container');

// Inside MediaPipe onResults callback:
function onResults(results) {
  if (results.landmarks && results.landmarks.length > 0) {
    handViz.updateLandmarks(results.landmarks[0]);
  } else {
    handViz.clearLandmarks();
  }
}
```

### Sketch Structure

```js
// handviz.js

// MediaPipe hand connections — which landmarks connect to which
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],       // thumb
  [0,5],[5,6],[6,7],[7,8],       // index
  [0,9],[9,10],[10,11],[11,12],  // middle
  [0,13],[13,14],[14,15],[15,16],// ring
  [0,17],[17,18],[18,19],[19,20],// pinky
  [5,9],[9,13],[13,17]           // palm
];

let landmarks = null;
let particles = [];
let confidenceProgress = 0;  // 0 to 1
let activeGesture = null;

// Gesture-specific colors
const GESTURE_COLORS = {
  peace:      { r: 0, g: 255, b: 150 },   // green
  thumbs_up:  { r: 0, g: 180, b: 255 },   // blue
  hang_loose: { r: 255, g: 180, b: 0 },   // amber
  rock_on:    { r: 255, g: 60, b: 120 },   // pink
  open_palm:  { r: 255, g: 60, b: 60 },    // red
};

const DEFAULT_COLOR = { r: 150, g: 150, b: 255 }; // soft purple when idle

export function createHandSketch(containerId) {
  const sketch = new p5((p) => {

    p.setup = () => {
      const container = document.getElementById(containerId);
      const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
      canvas.parent(containerId);
      p.frameRate(30);
    };

    p.draw = () => {
      p.background(15, 15, 25);  // near-black with slight blue

      if (!landmarks) {
        drawIdleState(p);
        return;
      }

      const color = activeGesture
        ? GESTURE_COLORS[activeGesture] || DEFAULT_COLOR
        : DEFAULT_COLOR;

      drawBones(p, color);
      drawNodes(p, color);
      drawConfidenceRing(p, color);
      updateParticles(p);
      drawParticles(p);
    };

  }, document.getElementById(containerId));

  // Public API
  sketch.updateLandmarks = (lm) => { landmarks = lm; };
  sketch.clearLandmarks = () => { landmarks = null; };
  sketch.setGesture = (name) => { activeGesture = name; };
  sketch.setConfidence = (val) => { confidenceProgress = val; };
  sketch.triggerBurst = (gestureName) => { spawnParticles(gestureName); };

  return sketch;
}
```

---

## Visual Layers

### Layer 1: Idle State (no hand detected)

When no hand is in frame, the canvas shows a calm ambient field — subtle floating dots that drift slowly. This prevents a dead black screen.

```js
function drawIdleState(p) {
  // Slow-moving noise-driven dots
  for (let i = 0; i < 40; i++) {
    const x = p.noise(i * 0.1, p.frameCount * 0.005) * p.width;
    const y = p.noise(i * 0.1 + 100, p.frameCount * 0.005) * p.height;
    p.noStroke();
    p.fill(100, 100, 180, 40);
    p.circle(x, y, 4);
  }

  // Hint text
  p.fill(100, 100, 140);
  p.textAlign(p.CENTER);
  p.textSize(14);
  p.text('show a hand to begin', p.width / 2, p.height / 2);
}
```

### Layer 2: Hand Skeleton (bones + nodes)

The core visualization. Lines connect the 21 landmarks following the hand topology. Nodes glow at each landmark point.

```js
function drawBones(p, color) {
  p.strokeWeight(2);
  p.stroke(color.r, color.g, color.b, 120);

  for (const [a, b] of HAND_CONNECTIONS) {
    const pa = landmarks[a];
    const pb = landmarks[b];
    p.line(
      pa.x * p.width, pa.y * p.height,
      pb.x * p.width, pb.y * p.height
    );
  }
}

function drawNodes(p, color) {
  p.noStroke();
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    const x = lm.x * p.width;
    const y = lm.y * p.height;

    // Outer glow
    p.fill(color.r, color.g, color.b, 30);
    p.circle(x, y, 18);

    // Inner dot
    p.fill(color.r, color.g, color.b, 220);
    p.circle(x, y, 6);

    // Fingertips get larger nodes (landmarks 4, 8, 12, 16, 20)
    if ([4, 8, 12, 16, 20].includes(i)) {
      p.fill(color.r, color.g, color.b, 50);
      p.circle(x, y, 26);
    }
  }
}
```

### Layer 3: Confidence Ring

Drawn around the palm center (landmark 9 — middle finger base). The ring fills as the gesture hold timer progresses. Replaces the separate SVG confidence ring from the expansion PRD — now it's native to the canvas.

```js
function drawConfidenceRing(p, color) {
  if (confidenceProgress <= 0 || !activeGesture) return;

  const cx = landmarks[9].x * p.width;
  const cy = landmarks[9].y * p.height;
  const radius = 50;

  // Background ring (dim)
  p.noFill();
  p.strokeWeight(3);
  p.stroke(color.r, color.g, color.b, 40);
  p.arc(cx, cy, radius, radius, 0, p.TWO_PI);

  // Progress ring
  p.stroke(color.r, color.g, color.b, 220);
  p.arc(cx, cy, radius, radius,
    -p.HALF_PI,
    -p.HALF_PI + p.TWO_PI * confidenceProgress
  );

  // Gesture label below ring
  p.noStroke();
  p.fill(color.r, color.g, color.b, 180);
  p.textAlign(p.CENTER);
  p.textSize(12);
  const labels = {
    peace: 'FIX', thumbs_up: 'EXPLAIN',
    hang_loose: 'COMMIT', rock_on: 'TEST', open_palm: 'STOP'
  };
  p.text(labels[activeGesture] || '', cx, cy + radius / 2 + 20);
}
```

### Layer 4: Particle Burst (on dispatch)

When a gesture completes (confidence ring fills), particles explode outward from all 21 landmarks. Color matches the gesture. Particles fade and shrink over ~30 frames.

```js
function spawnParticles(gestureName) {
  const color = GESTURE_COLORS[gestureName] || DEFAULT_COLOR;
  if (!landmarks) return;

  // Spawn 3 particles per landmark = 63 total
  for (const lm of landmarks) {
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: lm.x * sketch.width,   // sketch ref needed — see full impl
        y: lm.y * sketch.height,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1.0,
        color
      });
    }
  }
}

function updateParticles(p) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.life -= 0.03;
    if (pt.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles(p) {
  p.noStroke();
  for (const pt of particles) {
    p.fill(pt.color.r, pt.color.g, pt.color.b, pt.life * 200);
    p.circle(pt.x, pt.y, pt.life * 8);
  }
}
```

---

## Integration with Existing Modules

### main.js Changes

```js
// Before: show <video> element directly
// After: hide <video>, feed frames to p5 sketch

import { createHandSketch } from './handviz.js';
import { classifyGesture } from './gestures.js';
import { dispatch } from './dispatcher.js';

const video = document.getElementById('webcam');
video.style.display = 'none'; // hidden — MediaPipe still reads from it

const handViz = createHandSketch('camera-container');

let holdTimer = null;
let lastGesture = null;

function onMediaPipeResults(results) {
  if (results.landmarks && results.landmarks.length > 0) {
    const lm = results.landmarks[0];
    handViz.updateLandmarks(lm);

    const gesture = classifyGesture(lm);

    if (gesture && gesture === lastGesture) {
      // Gesture held — update confidence ring progress
      // holdTimer increments, ring fills over 0.8s (24 frames at 30fps)
    } else if (gesture && gesture !== lastGesture) {
      // New gesture — reset ring
      handViz.setGesture(gesture);
      handViz.setConfidence(0);
      lastGesture = gesture;
    } else {
      // No gesture — clear
      handViz.setGesture(null);
      handViz.setConfidence(0);
      lastGesture = null;
    }
  } else {
    handViz.clearLandmarks();
    lastGesture = null;
  }
}

// On confidence ring completion:
function onGestureConfirmed(gestureName) {
  handViz.triggerBurst(gestureName);
  // ... dispatch to Claude
}
```

### gestures.js — No Changes

The gesture classifier operates on raw landmark data. It doesn't know or care about the p5 visualization. Same input, same output.

### dispatcher.js — No Changes

The dispatcher receives a gesture name and code string. The visualization layer is upstream of it.

---

## Visual Design Reference

### Color Palette

```
Background:     #0f0f19  (near-black, slight blue)
Idle dots:      #6464b4  (muted purple, 40% opacity)
Default hand:   #9696ff  (soft purple — no gesture detected)
Peace/Fix:      #00ff96  (green)
Thumbs/Explain: #00b4ff  (blue)
Hang/Commit:    #ffb400  (amber)
Rock/Test:      #ff3c78  (pink)
Palm/Stop:      #ff3c3c  (red)
```

### Animation Timing

| Animation | Duration | Easing |
|-----------|----------|--------|
| Idle dot drift | Continuous | Perlin noise |
| Hand appear/disappear | ~200ms | Opacity fade |
| Bone + node render | Per frame | Immediate |
| Confidence ring fill | 800ms | Linear |
| Particle burst | ~1000ms | Linear decay |
| Particle count | 63 (3 per landmark) | — |

---

## Fallback Strategy

If p5.js fails to load from CDN or causes performance issues:

1. Check for `window.p5` on startup
2. If missing, fall back to showing the raw `<video>` element (unhide it)
3. Gesture detection and dispatch still work — only the visualization is affected
4. Log a warning: `"p5.js not available — falling back to webcam feed"`

```js
if (typeof p5 === 'undefined') {
  console.warn('p5.js not available — falling back to webcam feed');
  document.getElementById('webcam').style.display = 'block';
} else {
  createHandSketch('camera-container');
}
```

---

## Performance Notes

- p5.js canvas at 30fps + MediaPipe at 30fps = ~60fps total GPU work. This is fine on any modern laptop.
- Particle count is capped at 63 per burst, decaying over 30 frames. No accumulation risk.
- p5 instance mode avoids global namespace pollution — safe alongside MediaPipe and Vite.
- The hidden `<video>` element is not rendered by the browser (no compositing cost), but MediaPipe can still read frames from it via `drawImage`.

---

## What This Replaces in the PRD Expansion

The p5 visualization **subsumes** two items from `prd-expansion.md`:

| Expansion Item | Status |
|----------------|--------|
| Confidence ring (Expansion 1) | **Replaced** — now drawn natively in p5 canvas instead of SVG overlay |
| Onboarding state (Expansion 4) | **Replaced** — idle dot field + "show a hand" text replaces the HTML overlay |

The other 4 expansion items (session history, keyboard fallback, sound cues, error handling) remain unchanged.
