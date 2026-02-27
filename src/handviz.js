// ── p5.js Hand Visualization (instance mode) ──
// Renders stylized hand skeleton, confidence ring, and particle bursts
// inside the #camera-wrap container. The webcam stays hidden — MediaPipe
// still reads from it, but the user sees this canvas instead.

// MediaPipe hand connections — which landmarks connect to which
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],          // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],          // index
  [0, 9], [9, 10], [10, 11], [11, 12],     // middle
  [0, 13], [13, 14], [14, 15], [15, 16],   // ring
  [0, 17], [17, 18], [18, 19], [19, 20],   // pinky
  [5, 9], [9, 13], [13, 17],               // palm cross-connections
];

// Fingertip landmark indices (emphasized with larger glow)
const FINGERTIPS = [4, 8, 12, 16, 20];

// Gesture-specific colors — adapted to actual codebase gesture names
const GESTURE_COLORS = {
  peace:       { r: 0, g: 255, b: 150 },   // green  — test
  thumbs_down: { r: 0, g: 180, b: 255 },   // blue   — fix
  point_up:    { r: 255, g: 180, b: 0 },    // amber  — explain
  fist:        { r: 255, g: 60, b: 120 },   // pink   — commit
  open_palm:   { r: 255, g: 60, b: 60 },    // red    — stop
};

const DEFAULT_COLOR = { r: 150, g: 150, b: 255 }; // soft purple when idle

// Action labels shown below the confidence ring
const GESTURE_LABELS = {
  peace:       'TEST',
  thumbs_down: 'FIX',
  point_up:    'EXPLAIN',
  fist:        'COMMIT',
  open_palm:   'STOP',
};

/**
 * Creates a p5.js instance-mode sketch inside the given container.
 * Returns an object with methods to feed landmark data from MediaPipe.
 *
 * @param {string} containerId — DOM id of the container element
 * @returns {{ updateLandmarks, clearLandmarks, setGesture, setConfidence, triggerBurst }}
 */
export function createHandSketch(containerId) {
  let landmarks = null;
  let particles = [];
  let confidenceProgress = 0;  // 0 to 1
  let activeGesture = null;
  let canvasWidth = 0;
  let canvasHeight = 0;

  const sketch = new p5((p) => {
    p.setup = () => {
      const container = document.getElementById(containerId);
      canvasWidth = container.offsetWidth;
      canvasHeight = container.offsetHeight;
      const canvas = p.createCanvas(canvasWidth, canvasHeight);
      canvas.parent(containerId);
      p.frameRate(30);
    };

    p.draw = () => {
      p.background(15, 15, 25); // near-black with slight blue

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
      updateParticles();
      drawParticles(p);
    };
  }, document.getElementById(containerId));

  // ── Layer 1: Idle State ──
  // Calm ambient field with Perlin-noise floating dots when no hand is detected.

  function drawIdleState(p) {
    for (let i = 0; i < 40; i++) {
      const x = p.noise(i * 0.1, p.frameCount * 0.005) * p.width;
      const y = p.noise(i * 0.1 + 100, p.frameCount * 0.005) * p.height;
      p.noStroke();
      p.fill(100, 100, 180, 40);
      p.circle(x, y, 4);
    }

    p.fill(100, 100, 140);
    p.textAlign(p.CENTER);
    p.textSize(14);
    p.text('show a hand to begin', p.width / 2, p.height / 2);
  }

  // ── Layer 2: Hand Skeleton ──
  // Lines connecting 21 landmarks + glowing dots at each node.

  function drawBones(p, color) {
    p.strokeWeight(2);
    p.stroke(color.r, color.g, color.b, 120);

    for (const [a, b] of HAND_CONNECTIONS) {
      const pa = landmarks[a];
      const pb = landmarks[b];
      p.line(
        pa.x * p.width, pa.y * p.height,
        pb.x * p.width, pb.y * p.height,
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

      // Fingertips get larger glow halos
      if (FINGERTIPS.includes(i)) {
        p.fill(color.r, color.g, color.b, 50);
        p.circle(x, y, 26);
      }
    }
  }

  // ── Layer 3: Confidence Ring ──
  // Arc around landmark 9 (palm center) that fills as gesture hold progresses.

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

    // Progress arc
    p.stroke(color.r, color.g, color.b, 220);
    p.arc(
      cx, cy, radius, radius,
      -p.HALF_PI,
      -p.HALF_PI + p.TWO_PI * confidenceProgress,
    );

    // Gesture action label below ring
    p.noStroke();
    p.fill(color.r, color.g, color.b, 180);
    p.textAlign(p.CENTER);
    p.textSize(12);
    p.text(GESTURE_LABELS[activeGesture] || '', cx, cy + radius / 2 + 20);
  }

  // ── Layer 4: Particle Burst ──
  // 63 particles (3 per landmark) on gesture confirmation.

  function spawnParticles(gestureName) {
    const color = GESTURE_COLORS[gestureName] || DEFAULT_COLOR;
    if (!landmarks) return;

    for (const lm of landmarks) {
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: lm.x * canvasWidth,
          y: lm.y * canvasHeight,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 1.0,
          color,
        });
      }
    }
  }

  function updateParticles() {
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

  // ── Public API ──

  return {
    updateLandmarks(lm) { landmarks = lm; },
    clearLandmarks() { landmarks = null; },
    setGesture(name) { activeGesture = name; },
    setConfidence(val) { confidenceProgress = val; },
    triggerBurst(gestureName) { spawnParticles(gestureName); },
  };
}
