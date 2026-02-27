# 👋 GestureDispatch

**Wave your hand at the webcam, get AI-powered code actions.** No typing, no buttons — just gestures.

Copy a code snippet, throw a hand sign, and an LLM streams back a fix, explanation, commit message, or test scaffold. Result auto-copies to your clipboard.

## How It Works

1. Copy a code snippet (or use the built-in demo)
2. Hold a hand gesture at your webcam for 0.8s
3. AI response streams in real-time
4. Result auto-copies to clipboard

## Gestures

| Key | Gesture | Action |
|-----|---------|--------|
| `1` | 👎 Thumbs down | Fix bugs |
| `2` | ☝️ Point up | Explain code |
| `3` | ✊ Fist | Write commit message |
| `4` | ✌️ Peace | Scaffold tests |
| `0` | ✋ Open palm | Abort stream |

Keyboard shortcuts always work as fallback. Press `M` to mute sound cues.

## Tech Stack

Vanilla JS — no frameworks, no TypeScript. **Vite** bundles it, **MediaPipe Hands** tracks your fingers, **p5.js** draws a stylized hand skeleton with a confidence ring and particle bursts, and **Gemini 2.5 Flash** (via OpenRouter) handles the AI. One HTML page, zero npm dependencies beyond Vite.

## Setup

```bash
npm install
cp .env.example .env       # add your OPENROUTER_API_KEY
npm run dev
```

## Team

**Samuel Kahessay** — AI pipeline, streaming output, clipboard integration

**Bishesh Khanal** — Hand detection, gesture classification, p5.js visualization, sound design

---

*Built at Cursor Meetup Calgary, February 2026*
