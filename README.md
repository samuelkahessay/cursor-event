# GestureDispatch (SignalFire)

AI-powered code snippets triggered by hand gestures. Select code, make a hand sign at your webcam, and the gesture dispatches a Claude API call with that code as context. The result streams into an output panel and auto-copies to clipboard.

**Core loop:** Select code → Gesture → Claude API → Stream result → Clipboard

## Demo

1. Copy a code snippet (or use the built-in demo code)
2. Make a hand gesture at your webcam
3. Watch the AI response stream in real-time
4. Result auto-copies to your clipboard

## Gestures

| Key | Gesture | Action |
|-----|---------|--------|
| `1` | 👎 Thumbs down | Fix bugs |
| `2` | ☝️ Point up | Explain code |
| `3` | ✊ Fist | Write commit message |
| `4` | ✌️ Peace | Scaffold tests |
| `0` | ✋ Open palm | Abort stream |

Gestures require a 0.8s hold before dispatch fires. Keyboard shortcuts are always available as a fallback.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Bundler | Vite |
| Language | Vanilla JS |
| Hand Detection | MediaPipe Hands (CDN) |
| AI | Claude via OpenRouter (`anthropic/claude-sonnet-4`) |
| Visualization | p5.js (CDN) — stylized hand landmark rendering |
| UI | Single HTML page + CSS |

## Project Structure

```
├── index.html              ← layout: camera left, output + activity log right
├── src/
│   ├── main.js             ← entry: camera init, MediaPipe, gesture loop, keyboard fallback
│   ├── classifier.js       ← landmark → gesture classifier
│   ├── dispatcher.js       ← dispatch(gesture, code) → Claude API → stream → clipboard
│   ├── output-panel.js     ← streaming output DOM controller
│   ├── activity-log.js     ← timestamped activity log (bottom-right panel)
│   ├── api.js              ← OpenRouter SSE streaming
│   ├── prompts.js          ← prompt templates, status messages, fallback data
│   ├── handviz.js          ← p5.js hand skeleton, confidence ring, particles
│   ├── sounds.js           ← Web Audio API tone generator
│   ├── camera.js           ← webcam setup
│   ├── mediapipe.js        ← MediaPipe Hands init
│   ├── ui.js               ← gesture feedback UI
│   └── styles.css          ← all styling
├── api/
│   └── chat.js             ← Vercel Edge Function (production API proxy)
├── vite.config.js          ← dev server config + API proxy
└── .env                    ← OPENROUTER_API_KEY (gitignored)
```

## Setup

```bash
npm install
cp .env.example .env       # add your OPENROUTER_API_KEY
npm run dev                 # starts Vite dev server
```

## Layout

- **Left:** Camera feed with p5.js hand visualization overlay (skeleton, confidence ring, particle bursts)
- **Top right:** Code output panel — streams AI responses with syntax highlighting
- **Bottom right:** Activity log — timestamped events for gestures, dispatches, clipboard copies, and errors

## Team

- **Bishesh** — Detection & UI (camera, MediaPipe, gesture classifier, p5.js visualization, sound)
- **Sam** — AI Pipeline & Output (dispatcher, Claude API streaming, output panel, clipboard)
