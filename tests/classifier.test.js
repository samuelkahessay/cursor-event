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
  const thumbDown   = () => { lm[4].y = 0.8; lm[2].y = 0.5; lm[4].x = 0.5; lm[2].x = 0.5; };

  // Curl everything by default
  curlThumb(); curl(8,6); curl(12,10); curl(16,14); curl(20,18);

  if (overrides.thumb)     extendThumb();
  if (overrides.thumbDown) thumbDown();
  if (overrides.index)     extend(8, 6);
  if (overrides.middle)    extend(12, 10);
  if (overrides.ring)      extend(16, 14);
  if (overrides.pinky)     extend(20, 18);

  return lm;
}

describe('classifyGesture', () => {
  it('returns thumbs_down for thumb pointing down', () => {
    expect(classifyGesture(makeLandmarks({ thumbDown: true }))).toBe('thumbs_down');
  });
  it('returns point_up for index only extended', () => {
    expect(classifyGesture(makeLandmarks({ index: true }))).toBe('point_up');
  });
  it('returns fist for all fingers curled', () => {
    expect(classifyGesture(makeLandmarks({}))).toBe('fist');
  });
  it('returns peace for index + middle extended', () => {
    expect(classifyGesture(makeLandmarks({ index: true, middle: true }))).toBe('peace');
  });
  it('returns open_palm for all fingers extended', () => {
    expect(classifyGesture(makeLandmarks({ thumb: true, index: true, middle: true, ring: true, pinky: true }))).toBe('open_palm');
  });
  it('returns null for no match', () => {
    expect(classifyGesture(makeLandmarks({ ring: true }))).toBeNull();
  });
});
