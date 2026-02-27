# GestureDispatch — Hackathon PRD
**Codename:** SignalFire  
**Format:** 1-Hour MVP + Stretch Goals  
**Last Updated:** February 26, 2026

---

## The One-Liner

A developer tool that lets you trigger AI-powered coding workflows — unit tests, explanations, commits, scaffolding — using hand signs in front of your webcam. No keyboard. No mouse. Just intent.

---

## Problem

Developers context-switch constantly between writing code, running commands, and prompting AI tools. Every alt-tab, copy-paste, and typing interruption breaks flow. Gesture-based dispatch lets you trigger high-value agent actions without leaving the keyboard home row — or without touching the keyboard at all.

---

## Core Hypothesis

> A small, reliable vocabulary of hand gestures mapped to Claude API dispatches is more useful than full mouse/keyboard gesture replacement, and is achievable in a single hackathon session.

---

## Scope Philosophy

**Do:** 5 gestures, 5 workflows, reliably detected, clean output panel.  
**Don't:** Custom gesture training, mouse replacement, multi-hand chords, mobile support.

If it doesn't make the demo better in 60 seconds, it's a stretch goal.

---

## Hour-by-Hour Build Plan

### Minute 0–15 — Gesture Detection
**Goal:** Camera on, hand in frame, gesture name printed to console.

- Scaffold project (Vite + vanilla JS, or Next.js if you want a head start on UI)
- Load MediaPipe Hands via CDN
- Implement landmark-to-gesture classifier for 5 signs
- Console.log gesture name on confident detection (>0.85 confidence threshold)
- Add 1-second debounce so a held gesture only fires once

**Deliverable:** `✌️ → "peace"` logged reliably.

---

### Minute 15–30 — Context Grabber
**Goal:** Know what code the developer is looking at.

- Build a clipboard listener — when a gesture fires, read `navigator.clipboard.readText()`
- Instruct the user: *"Select code, then gesture."* That's the UX contract. Simple.
- Attach clipboard content + gesture name to a payload object
- Print payload to confirm context is captured

**Deliverable:** `{ gesture: "peace", code: "def buggy_fn()..." }` on gesture fire.

---

### Minute 30–50 — Claude Dispatcher + Output Panel
**Goal:** Gesture fires a Claude API call and streams the result visibly.

- Map each gesture to a prompt template (see Gesture Vocabulary below)
- Call Claude API with `stream: true`, inject clipboard code as context
- Build a minimal floating output panel — fixed position, dark background, streaming text
- Add a visual "gesture recognized" flash so the user knows it fired
- Wire a ✋ open palm to abort the active stream

**Deliverable:** Hold up ✌️ → unit test streams into panel within 2 seconds.

---

### Minute 50–60 — Polish the Demo
**Goal:** Make the 60-second demo arc flawless.

- Record a buggy Python function as the demo file
- Rehearse: select code → ✌️ fix → 👍 explain → 🤙 commit message
- Add gesture name label to camera feed (bottom left, small)
- Kill any console errors
- Make sure it works without internet dying (have a cached fallback response)

**Deliverable:** Clean, repeatable demo that tells a story.

---

## Gesture Vocabulary (MVP)

| Gesture | Sign | Action | Prompt Sent to Claude |
|---------|------|---------|----------------------|
| ✌️ Peace | Index + middle up | Fix bug | `"Here is a Python function with a bug. Identify and fix it, return only the corrected code with a one-line comment explaining the fix: {code}"` |
| 👍 Thumbs up | Thumb extended up | Explain code | `"Explain what this code does in 3 bullet points, written for a developer: {code}"` |
| 🤙 Hang loose | Thumb + pinky out | Generate commit message | `"Write a concise, conventional git commit message for the following change: {code}"` |
| 🤘 Rock on | Index + pinky up | Scaffold test file | `"Generate a complete pytest test file for this function. Include happy path, edge cases, and error cases: {code}"` |
| ✋ Open palm | All fingers up | STOP | Abort active Claude stream |

---

## Gesture Classifier — Implementation Notes

Use MediaPipe's 21-point hand landmark model. Each gesture maps to a simple rule based on which fingers are extended.

```
Finger extended = tip y-position < pip y-position (tip is higher than knuckle)

peace()     → index_extended AND middle_extended AND NOT ring AND NOT pinky
thumbs_up() → thumb_extended AND NOT index AND NOT middle AND NOT ring AND NOT pinky  
hang_loose()→ thumb_extended AND NOT index AND NOT middle AND NOT ring AND pinky_extended
rock_on()   → index_extended AND NOT middle AND NOT ring AND pinky_extended
open_palm() → all five fingers extended
```

No ML training needed. Pure landmark geometry. This is the right call for a hackathon.

---

## Technical Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Vite + Vanilla JS | Zero config, fast, no overhead |
| Hand Detection | MediaPipe Hands (CDN) | Best-in-class, runs in browser, no install |
| AI | Claude API (claude-sonnet-4) | Fastest good output, streaming support |
| UI | Single HTML overlay | Ship fast, no component complexity |
| Context | Clipboard API | Dead simple, requires one user action |

---

## What the Demo Looks Like

```
┌─────────────────────────────────────────────────────────┐
│  [Camera Feed — top left, small]     [Gesture: ✌️ FIX]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ▶ Fixing bug in selected code...                       │
│                                                         │
│  def calculate_average(nums):                           │
│      if not nums:                                       │
│          return 0  # handle empty list edge case        │
│      return sum(nums) / len(nums)                       │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  ✌️ Fix  👍 Explain  🤙 Commit  🤘 Scaffold  ✋ Stop    │
└─────────────────────────────────────────────────────────┘
```

---

## Stretch Goals (If You Have Time)

Ordered by impact-to-effort ratio. Do them in sequence.

### Stretch 1 — VS Code Extension Integration
Instead of clipboard, inject context directly from the active editor selection via a VS Code extension. Eliminates the "select first" UX friction. Adds ~45 minutes.

### Stretch 2 — Gesture Confidence Visualizer
Show a small "charging ring" around the gesture icon that fills over 1 second before dispatch. Prevents accidental fires and makes the UI feel intentional and satisfying.

### Stretch 3 — Custom Gesture Recorder
Let the user record their own gesture → action mappings. Show landmark visualization while recording. Store in localStorage. Adds ~1.5 hours but makes the product feel personal.

### Stretch 4 — Two-Hand Modifier System
Non-dominant hand held up = "modifier." Combines with dominant hand gesture for a second action tier. Example: ✋ (left, held) + ✌️ (right) = "refactor this code" instead of "fix bug." Doubles vocabulary with no new gestures to memorize.

### Stretch 5 — Voice Fallback Layer
Add Web Speech API so the user can also say "fix", "explain", "commit" as a fallback input channel. Same dispatcher, two input modalities. Good for accessibility narrative in the pitch.

### Stretch 6 — Agent Chaining
✌️ fix → auto-pipes output into 🤘 scaffold test → auto-commits with 🤙. A gesture-triggered pipeline. This is the "wow" demo moment if you can pull it off.

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Lighting kills detection | High | Test in demo room early, have a lamp ready |
| Gesture misclassification | Medium | 0.85 confidence threshold + 1s debounce |
| Clipboard permission denied | Medium | Have a hardcoded demo code string as fallback |
| Claude API latency | Low | Stream output so it feels fast immediately |
| "Gorilla arm" fatigue in demo | Low | Gestures are quick signs, not sustained holds |

---

## Success Criteria

The MVP is done when:

- [ ] Camera detects all 5 gestures reliably in normal office lighting  
- [ ] Gesture fires Claude API with clipboard code as context  
- [ ] Output streams visibly into the panel within 2 seconds  
- [ ] Open palm aborts the stream  
- [ ] The 60-second demo arc runs clean 3 times in a row  

---

## Pitch Angle

> "Keyboard shortcuts are 1970s technology mapped onto 2020s workflows. We built a gesture layer that lets you dispatch AI agents the same way a conductor cues an orchestra — with your hands. No typing. No clicking. Just intent."

---

*Cut scope before cutting demo quality. A tight demo with 3 working gestures beats a buggy demo with 10.*
