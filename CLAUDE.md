# CLAUDE.md — GestureDispatch (SignalFire)

## Project Overview

GestureDispatch is a hackathon project: AI-powered code snippets triggered by hand gestures. A developer selects code, makes a hand sign at their webcam, and the gesture dispatches a Claude API call with that code as context. The result streams into an output panel and auto-copies to clipboard.

**Core loop:** Select code → Gesture → Claude API → Stream result → Clipboard

## Team

- **Bishesh** — Detection & UI Shell (camera, MediaPipe, gesture classifier, visual feedback)
- **Sam** — AI Pipeline & Output (dispatcher, Claude API streaming, output panel, clipboard)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Bundler | Vite (vanilla JS template) |
| Language | Vanilla JS — no TypeScript |
| Hand Detection | MediaPipe Hands via CDN |
| AI | Claude API (claude-sonnet-4-6) via raw `fetch()` with SSE streaming |
| UI | Single HTML page + CSS — no framework |
| Context | Clipboard API (`navigator.clipboard`) |

## Project Structure

```
gesture-dispatch/
├── index.html              ← layout, camera feed, output panel, history
├── style.css               ← all styling
├── src/
│   ├── main.js             ← entry: camera init, MediaPipe setup, gesture loop, keyboard fallback
│   ├── gestures.js         ← landmark → gesture classifier (5 gestures)
│   ├── dispatcher.js       ← dispatch(gesture, code) → Claude API → stream → clipboard
│   ├── sounds.js           ← Web Audio API tone generator for gesture feedback
│   └── history.js          ← session history storage and rendering
├── vite.config.js          ← dev server config (API proxy if needed)
├── .env                    ← ANTHROPIC_API_KEY (gitignored)
└── .env.example            ← template for env vars
```

## Key Conventions

- **No frameworks.** Vanilla DOM manipulation only. `document.getElementById`, `classList`, `textContent`.
- **No TypeScript.** Speed over safety for the hackathon.
- **No npm dependencies beyond Vite.** MediaPipe loads from CDN. Claude API via raw `fetch()`.
- **Single-page app.** Everything renders in `index.html`. No routing.
- **Module pattern.** Each JS file exports functions. `main.js` wires them together.

## Interface Contract

Bishesh's gesture detection calls Sam's dispatcher:

```js
import { dispatch } from './dispatcher.js';

// On gesture detected:
dispatch(gestureName, clipboardCode);

// On open palm (abort):
dispatch('open_palm');
```

## Gesture Vocabulary

| Gesture | Sign | Action | Keyboard Fallback |
|---------|------|--------|-------------------|
| ✌️ Peace | Index + middle up | Fix bug | `1` |
| 👍 Thumbs up | Thumb extended | Explain code | `2` |
| 🤙 Hang loose | Thumb + pinky out | Commit message | `3` |
| 🤘 Rock on | Index + pinky up | Scaffold test | `4` |
| ✋ Open palm | All fingers up | Abort stream | `5` |

## Gesture Classifier Rules

```
Finger extended = tip y-position < pip y-position (tip higher than knuckle)

peace()      → index AND middle AND NOT ring AND NOT pinky
thumbs_up()  → thumb AND NOT index AND NOT middle AND NOT ring AND NOT pinky
hang_loose() → thumb AND pinky AND NOT index AND NOT middle AND NOT ring
rock_on()    → index AND pinky AND NOT middle AND NOT ring
open_palm()  → all five extended
```

- Confidence threshold: 0.85
- Debounce: 1 second between dispatches
- Confidence ring: 0.8s hold required before dispatch fires

## Core PRD + Expansions

- **Core PRD:** `gesture-dispatch-prd.md`
- **Expansions:** `prd-expansion.md`
- **Bishesh's scope:** `bishesh-detection-ui.md`
- **Sam's scope:** `sam-ai-pipeline.md`

### Expansion Features (beyond MVP)

1. **Confidence ring** — radial SVG animation, 0.8s hold before dispatch (Bishesh)
2. **Session history** — scrollable log of past dispatches with re-copy (Sam + Bishesh)
3. **Keyboard fallback** — keys 1-5 map to gestures (Bishesh)
4. **Onboarding overlay** — "hold up a hand to begin" first-load state (Bishesh)
5. **Sound cues** — Web Audio API tones per gesture event (Bishesh)
6. **Error handling UX** — inline error messages for camera/clipboard/API failures (Sam + Bishesh)

## Build & Run

```bash
npm install
npm run dev        # starts Vite dev server
```

Requires `ANTHROPIC_API_KEY` in `.env`.

## Demo Prep

- Demo buggy function: `def calculate_average(nums): return sum(nums) / len(nums)`
- Demo arc: onboarding → ✌️ fix → 👍 explain → 🤙 commit → keyboard fallback → abort
- Fallback: hardcoded demo code string if clipboard permission fails
- Fallback: cached response if network fails
- Sound mute: press `M` if demo room audio is problematic

## Judging Criteria

| Criterion | How We Address It |
|-----------|------------------|
| **Problem Statement** | Snippet analogy — judges have felt this pain. AI dispatch cost is too high. |
| **Creativity** | Confidence ring, sound design, gesture-as-snippet concept. Multi-sensory UX. |
| **Completeness** | Full loop + history + error handling + keyboard fallback + onboarding. |
