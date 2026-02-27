# GestureDispatch — PRD Expansion
**Scope:** Hackathon-scoped additions to the core PRD
**Criteria Targeted:** Completeness + Creativity (balanced)
**Constraint:** Everything here must fit within the existing 1-hour build plan
**Last Updated:** February 26, 2026

---

## Expansion Philosophy

The core PRD delivers a working loop: gesture → Claude → clipboard. These expansions make that loop feel like a **finished product** (completeness) and **memorable** (creativity) — without adding new systems or architectural complexity.

Rule of thumb: if it takes more than 15 minutes to build, it doesn't belong here.

---

## Expansion 1 — Gesture Confidence Ring (Creativity)

**What:** A radial progress animation around the detected gesture icon that fills over ~0.8 seconds before the dispatch fires. The gesture must be held steadily for the ring to complete. If the hand drops or changes, the ring resets.

**Why this matters:**
- Prevents accidental misfires (held briefly = no dispatch)
- Visually satisfying — the "loading ring" communicates intent
- Makes the demo feel deliberate and polished, not twitchy
- Judges see a UI that communicates state, not just reacts

**Implementation notes:**
- SVG circle with `stroke-dashoffset` animation driven by a JS timer
- Timer starts on gesture detection, resets if gesture changes or hand disappears
- On completion: dispatch fires + brief "confirmed" flash
- Position: overlaid on the gesture icon in the camera feed area

**Owner:** Bishesh (detection + UI)
**Time estimate:** ~15 minutes
**Judging impact:** High — this is the visual "wow" moment

---

## Expansion 2 — Session History Panel (Completeness)

**What:** A scrollable sidebar or collapsible log of all gesture dispatches in the current session. Each entry shows: gesture icon, timestamp, first line of the code context, and a "copy" button to re-copy the result.

**Why this matters:**
- Proves the app isn't a one-shot demo — it handles repeated use
- Judges can see the *sequence* of dispatches, which tells a story
- Re-copy button means no result is ever lost
- Fills the "what happens after the first gesture?" completeness gap

**Implementation notes:**
- Array of dispatch results stored in memory (no persistence needed)
- Rendered as a simple list in a sidebar or below the output panel
- Each entry: `{ gesture, timestamp, codePreview, fullResult }`
- "Copy" button calls `navigator.clipboard.writeText(entry.fullResult)`
- Auto-scrolls to latest entry

**Layout integration:**
```
┌─────────────────────────────────────────────────────────┐
│  [Camera Feed + Confidence Ring]    [✌️  FIX FIRED]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Active Output Panel — streaming result]               │
│                                                         │
│  ✓ Copied to clipboard                                  │
├─────────────────────────────────────────────────────────┤
│  History                                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ✌️ 2:34 PM  "def calculate_average..."  [Copy]  │    │
│  │ 👍 2:35 PM  "def calculate_average..."  [Copy]  │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  ✌️ fix  👍 explain  🤙 commit  🤘 test  ✋ stop         │
└─────────────────────────────────────────────────────────┘
```

**Owner:** Sam (output panel + dispatcher owns the data), Bishesh (UI rendering)
**Time estimate:** ~10 minutes
**Judging impact:** Medium-high — closes the "is this a real tool?" question

---

## Expansion 3 — Keyboard Fallback (Completeness)

**What:** Number keys 1–5 trigger the same dispatches as gestures. Acts as both an accessibility feature and a demo safety net.

| Key | Gesture Equivalent | Action |
|-----|-------------------|--------|
| `1` | ✌️ Peace | Fix bug |
| `2` | 👍 Thumbs up | Explain code |
| `3` | 🤙 Hang loose | Commit message |
| `4` | 🤘 Rock on | Scaffold test |
| `5` | ✋ Open palm | Abort stream |

**Why this matters:**
- If lighting kills camera detection mid-demo, the show goes on
- Accessibility answer for judges: "What about developers who can't use gestures?"
- Takes ~5 minutes to wire up — pure ROI

**Implementation notes:**
- Single `keydown` event listener on `document`
- Maps key code to gesture name, calls the same `dispatch()` function
- Same confidence ring animation plays on keypress (visual consistency)

**Owner:** Bishesh (event listener lives in main.js alongside gesture detection)
**Time estimate:** ~5 minutes
**Judging impact:** Medium — small effort, big completeness signal

---

## Expansion 4 — Onboarding State (Completeness)

**What:** When the app first loads (before any gesture is detected), show a clean overlay on the output panel:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              👋 Hold up a hand sign to begin             │
│                                                         │
│         Copy some code first, then gesture at the       │
│         camera. Your first result appears here.         │
│                                                         │
│              ✌️ fix  👍 explain  🤙 commit                │
│              🤘 test  ✋ stop                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Why this matters:**
- First impression isn't a blank dark panel — it's an invitation
- Self-documenting: new users (and judges) immediately know what to do
- Disappears on first gesture, never returns — zero friction after onboarding

**Implementation notes:**
- A `div` overlay with `display: flex; align-items: center; justify-content: center`
- Hidden via `classList.add('hidden')` on first gesture callback
- CSS transition: fade out over 300ms

**Owner:** Bishesh (UI shell)
**Time estimate:** ~5 minutes
**Judging impact:** Medium — prevents the "dead screen" first impression

---

## Expansion 5 — Sound Cues (Creativity)

**What:** Subtle, distinct audio feedback for each gesture recognition. Not notification sounds — short, clean tones that feel like part of the UI.

| Event | Sound |
|-------|-------|
| Gesture recognized (ring starts) | Soft rising tone (~200ms) |
| Dispatch confirmed (ring completes) | Crisp confirmation chime (~150ms) |
| Stream complete + clipboard copy | Subtle "done" tone (~200ms) |
| Abort (open palm) | Quick descending tone (~150ms) |

**Why this matters:**
- Multi-sensory feedback makes the demo feel alive
- Developer doesn't need to look at the screen to know the gesture fired
- Judges remember what they *hear* as much as what they see
- Different tones per gesture reinforce the "vocabulary" concept

**Implementation notes:**
- Use the Web Audio API (`AudioContext`) — no audio files needed
- Each sound is a programmatically generated tone (sine wave with envelope)
- ~20 lines of code for a simple `playTone(frequency, duration)` utility
- Mute toggle via `M` key in case demo room audio is problematic

**Owner:** Bishesh (tied to gesture recognition events)
**Time estimate:** ~10 minutes
**Judging impact:** Medium-high — memorable sensory detail

---

## Expansion 6 — Error Handling UX (Completeness)

**What:** Every failure mode shows a clear, styled inline message instead of silently failing or showing a blank screen.

| Failure | UX Response |
|---------|-------------|
| Camera permission denied | Panel shows: "📷 Camera access needed — click the address bar to allow" |
| Clipboard empty (no code selected) | Panel shows: "📋 No code on clipboard — select some code and try again" |
| Claude API error / network failure | Panel shows: "⚠️ Couldn't reach Claude — check your connection" + retry button |
| API key missing | Panel shows: "🔑 API key not configured — add ANTHROPIC_API_KEY to .env" |
| Gesture not recognized | No error — confidence ring simply doesn't start filling |

**Why this matters:**
- Completeness means handling the unhappy path, not just the demo path
- Judges will deliberately try to break things — graceful errors are impressive
- Each error message tells the user exactly what to do next

**Implementation notes:**
- Error messages render in the same output panel container
- Styled differently from AI output (yellow/orange accent instead of green)
- Retry button on API errors re-dispatches the last gesture+code pair
- `lastDispatch = { gesture, code }` stored for retry

**Owner:** Sam (dispatcher error handling), Bishesh (UI rendering of error states)
**Time estimate:** ~10 minutes
**Judging impact:** High — separates "prototype" from "product"

---

## Updated Time Budget

These expansions fit within the existing build plan by running parallel to the core work:

| Expansion | Minutes | Who | When |
|-----------|---------|-----|------|
| Confidence ring | 15 | Bishesh | During UI shell phase (min 25–40) |
| Session history | 10 | Sam + Bishesh | During output panel phase (min 30–45) |
| Keyboard fallback | 5 | Bishesh | During integration phase (min 40–60) |
| Onboarding state | 5 | Bishesh | During UI shell phase (min 25–40) |
| Sound cues | 10 | Bishesh | During polish phase (min 50–60) |
| Error handling UX | 10 | Sam + Bishesh | During integration phase (min 40–60) |
| **Total** | **~55 min** | | Distributed across existing phases |

Note: These overlap with existing phase work — they're additions *to* those phases, not separate phases. Realistic additional time: **~30 minutes** when built alongside the core features.

---

## Updated Demo Arc

The demo now tells a richer story:

1. **App loads** → onboarding overlay invites the judge to watch
2. **First gesture** → confidence ring fills, confirmation chime plays, overlay fades
3. **Fix streams in** → output panel fills with corrected code, "Copied" confirmation
4. **Second gesture (explain)** → different tone, result streams, history panel now shows 2 entries
5. **Keyboard fallback** → "and if you prefer keyboard..." press `3` → commit message generates
6. **Abort** → flash open palm, descending tone, "Stream aborted"
7. **Error recovery** → (if time) show clipboard empty state → select code → retry works

60 seconds. Complete loop. Multiple modalities. Graceful failures. Memorable sounds.

---

## Judging Criteria Coverage (Updated)

| Criterion | Core PRD | + Expansions |
|-----------|----------|-------------|
| **Problem Statement** | Strong — clear pain point, snippet analogy | Unchanged — already solid |
| **Creativity** | Good — gesture-as-snippet concept | **Strong** — confidence ring, sound design, multi-sensory UX |
| **Completeness** | Partial — happy path only | **Strong** — history, errors, onboarding, keyboard fallback, retry |
