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