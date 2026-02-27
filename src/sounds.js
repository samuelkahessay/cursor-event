/**
 * Sound cues via Web Audio API.
 *
 * Tones:
 *   'fire'    — rising chirp when gesture dispatches
 *   'confirm' — two-note chime when stream completes + clipboard copied
 *   'abort'   — descending tone when stream aborted
 *
 * Press M to toggle mute.
 */

let ctx = null;
let muted = false;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

/**
 * Play a short synthesized tone.
 * @param {'fire' | 'confirm' | 'abort'} type
 */
export function playTone(type) {
  if (muted) return;

  const ac = getCtx();
  if (ac.state === 'suspended') ac.resume();

  const now = ac.currentTime;

  if (type === 'fire') {
    // Rising chirp: 400 → 800 Hz over 0.15s
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.15);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  if (type === 'confirm') {
    // Two-note chime: C5 → E5
    [523, 659].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.linearRampToValueAtTime(0, start + 0.2);
      osc.connect(gain).connect(ac.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  if (type === 'abort') {
    // Descending tone: 600 → 300 Hz
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(300, now + 0.2);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }
}

/** Toggle mute on/off. Returns current muted state. */
export function toggleMute() {
  muted = !muted;
  console.log(`[Sound] ${muted ? 'Muted' : 'Unmuted'}`);
  return muted;
}
