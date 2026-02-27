# GestureDispatch — Bishesh's Scope
**Role:** Detection & UI Shell (Person A)
**Codename:** SignalFire
**Last Updated:** February 26, 2026

---

## Your Mission

Own everything from **camera → recognized gesture event** plus the **visual shell** of the app. Your deliverable is a page where you hold up a hand sign and a reliable event fires with the gesture name.

---

## Shared Context

### The One-Liner
A developer tool that lets you trigger AI-powered coding workflows — unit tests, explanations, commits, scaffolding — using hand signs in front of your webcam.

### Technical Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Vite + Vanilla JS | Zero config, fast, no overhead |
| Hand Detection | MediaPipe Hands (CDN) | Best-in-class, runs in browser, no install |
| UI | Single HTML overlay | Ship fast, no component complexity |

---

## Your Build Plan

### Minute 0–10 — Project Scaffold + Camera Feed
**Goal:** Camera on, hand landmarks visible.

- Scaffold project with Vite + vanilla JS
- Set up the HTML page layout (camera feed area + output panel placeholder)
- Load MediaPipe Hands via CDN
- Get webcam feed rendering in a `<video>` element (top-left, small)
- Confirm hand landmarks are being detected in console

**Deliverable:** Camera feed live with MediaPipe landmarks logging.

---

### Minute 10–25 — Gesture Classifier
**Goal:** 5 gestures reliably detected and logged.

- Implement landmark-to-gesture classifier for all 5 signs
- Use 0.85 confidence threshold
- Add 1-second debounce so a held gesture only fires once
- Console.log gesture name on confident detection

#### Gesture Rules (MediaPipe 21-point landmarks)

```
Finger extended = tip y-position < pip y-position (tip is higher than knuckle)

peace()     → index_extended AND middle_extended AND NOT ring AND NOT pinky
thumbs_up() → thumb_extended AND NOT index AND NOT middle AND NOT ring AND NOT pinky
hang_loose()→ thumb_extended AND NOT index AND NOT middle AND NOT ring AND pinky_extended
rock_on()   → index_extended AND NOT middle AND NOT ring AND pinky_extended
open_palm() → all five fingers extended
```

**Deliverable:** `✌️ → "peace"` logged reliably.

---

### Minute 25–40 — UI Shell + Gesture Feedback
**Goal:** The app looks like the demo mockup and gives visual feedback.

- Build the page layout per the mockup below
- Add gesture name label overlay on camera feed (bottom left, small)
- Add "gesture recognized" flash animation when a gesture fires
- Build the gesture legend bar at the bottom: `✌️ Fix  👍 Explain  🤙 Commit  🤘 Scaffold  ✋ Stop`
- Create the output panel container (dark background, fixed position) — Sam will fill it with streaming content

```
┌─────────────────────────────────────────────────────────┐
│  [Camera Feed — top left, small]     [Gesture: ✌️ FIX]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Output Panel — Sam owns the content]                  │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  ✌️ Fix  👍 Explain  🤙 Commit  🤘 Scaffold  ✋ Stop    │
└─────────────────────────────────────────────────────────┘
```

**Deliverable:** Full visual shell with gesture recognition feedback.

---

### Minute 40–60 — Integration + Demo Polish
**Goal:** Wire up with Sam's dispatcher, polish the demo.

- Connect gesture events to Sam's `dispatch(gestureName, clipboardText)` function
- Add gesture name label to camera feed
- Kill any console errors
- Help rehearse: select code → ✌️ fix → 👍 explain → 🤙 commit message

---

## Interface Contract with Sam

You emit gesture events. Sam consumes them.

```js
// When a gesture is detected, call Sam's dispatcher:
import { dispatch } from './dispatcher.js';

function onGesture(gestureName) {
  if (gestureName === 'open_palm') {
    dispatch('open_palm'); // abort
  } else {
    navigator.clipboard.readText().then(code => {
      dispatch(gestureName, code);
    }).catch(() => {
      dispatch(gestureName, FALLBACK_CODE); // hardcoded demo string
    });
  }
}
```

---

## Gesture Vocabulary (Reference)

| Gesture | Sign | Action |
|---------|------|--------|
| ✌️ Peace | Index + middle up | Fix bug |
| 👍 Thumbs up | Thumb extended up | Explain code |
| 🤙 Hang loose | Thumb + pinky out | Generate commit message |
| 🤘 Rock on | Index + pinky up | Scaffold test file |
| ✋ Open palm | All fingers up | STOP — abort stream |

---

## Your Stretch Goals

If MVP is solid and time permits:

- **Stretch 2 — Gesture Confidence Visualizer:** Show a "charging ring" around the gesture icon that fills over 1 second before dispatch. Prevents accidental fires, looks great in demo.
- **Stretch 3 — Custom Gesture Recorder:** Let user record their own gesture → action mappings. Show landmark visualization while recording. Store in localStorage.
- **Stretch 4 — Two-Hand Modifier System:** Non-dominant hand = "modifier." ✋ (left) + ✌️ (right) = "refactor" instead of "fix." Doubles vocabulary.

---

## Your Risks

| Risk | Mitigation |
|------|------------|
| Lighting kills detection | Test in demo room early, have a lamp ready |
| Gesture misclassification | 0.85 confidence threshold + 1s debounce |

---

## Your Success Criteria

- [ ] Camera detects all 5 gestures reliably in normal office lighting
- [ ] Gesture fires callback with gesture name within 1 second
- [ ] Visual feedback (flash + label) appears on gesture recognition
- [ ] UI shell matches the mockup layout
- [ ] Integration with Sam's dispatcher works end-to-end
