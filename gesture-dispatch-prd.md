# GestureDispatch — Hackathon PRD
**Codename:** SignalFire  
**Format:** 1-Hour MVP + Stretch Goals  
**Last Updated:** February 26, 2026

---

## The One-Liner

> "Code snippets — but AI-powered and triggered by hand signs. Same muscle memory, infinite context-awareness."

---

## The Problem

Every developer knows code snippets. You type `rafce` and a full React component appears. You type `cl` and a console.log wraps your variable. Snippets exist because developers recognized a truth early: **certain outputs are predictable and repeatable, so you shouldn't reconstruct them from scratch every time.**

But snippets have a ceiling. They're static. They can't write the unit test *for your specific function*. They can't generate the commit message *for your actual diff*. They can't explain *this* block of code to your teammate.

So today, when a developer needs to do something rote-but-context-aware — write a test, fix a bug, generate a commit — they break their entire flow state:

1. Stop typing
2. Alt-tab to an AI tool
3. Type a prompt from scratch
4. Paste their code in
5. Copy the output back
6. Re-find their place

**That context switch is the problem.** Not that AI is slow. Not that developers are lazy. The mechanical cost of *dispatching* a known action is too high.

GestureDispatch eliminates the dispatch cost entirely. You already know what you want. A gesture fires it — with your actual code as context — without your hands leaving where they are.

---

## The Solution

A gesture vocabulary that maps directly to developer workflows, the same way snippet shortcuts map to boilerplate. Finite, learnable, fast.

| Snippet World | GestureDispatch World |
|--------------|----------------------|
| Type `rafce` | Flash ✌️ |
| Outputs static boilerplate | Outputs AI result using your actual code |
| No context awareness | Full context from selected code |
| Keyboard only | Hands, always available |

The muscle memory philosophy is identical. The output is intelligent.

---

## Core Hypothesis

> A small, reliable vocabulary of hand gestures mapped to Claude API dispatches is more useful than full mouse/keyboard gesture replacement — and buildable in a single hackathon session.

---

## Scope Philosophy

**Do:** 5 gestures, 5 workflows, reliably detected, clean output panel, result auto-copied to clipboard.  
**Don't:** Custom gesture training, mouse replacement, multi-hand chords, mobile support.

If it doesn't make the demo better in 60 seconds, it's a stretch goal.

---

## Hour-by-Hour Build Plan

### Minute 0–15 — Gesture Detection
**Goal:** Camera on, hand in frame, gesture name printed to console.

- Scaffold project (Vite + vanilla JS)
- Load MediaPipe Hands via CDN
- Implement landmark-to-gesture classifier for 5 signs
- Console.log gesture name on confident detection (>0.85 confidence threshold)
- Add 1-second debounce so a held gesture only fires once

**Deliverable:** `✌️ → "fix"` logged reliably.

---

### Minute 15–30 — Context Grabber
**Goal:** Know what code the developer is looking at.

- Build clipboard listener — when gesture fires, read `navigator.clipboard.readText()`
- UX contract: *"Select code, then gesture."* One sentence. That's it.
- Attach clipboard content + gesture name to a payload object
- Print payload to confirm context is captured

**Deliverable:** `{ gesture: "fix", code: "def buggy_fn()..." }` on gesture fire.

---

### Minute 30–50 — Claude Dispatcher + Output Panel
**Goal:** Gesture fires a Claude API call, streams the result, copies it to clipboard.

- Map each gesture to a prompt template (see Gesture Vocabulary below)
- Call Claude API with `stream: true`, inject clipboard code as context
- Build a minimal floating output panel — fixed position, dark background, streaming text
- Add a visual flash when gesture is recognized — developer knows it fired
- **Auto-copy result to clipboard when stream completes** — closes the loop
- Wire ✋ open palm to abort the active stream

**Deliverable:** Hold up ✌️ → fixed code streams into panel → copied to clipboard. Ready to paste.

---

### Minute 50–60 — Polish the Demo
**Goal:** Make the 60-second demo arc flawless.

- Have a buggy Python function ready as the demo file
- Rehearse: select code → ✌️ fix → 👍 explain → 🤙 commit message
- Add gesture name label to camera feed (bottom left, small)
- Kill any console errors
- Fallback: hardcoded demo code string if clipboard permission fails

**Deliverable:** Clean, repeatable demo that tells a story.

---

## Gesture Vocabulary (MVP — The "Snippet Library")

| Gesture | Sign | Snippet Equivalent | Action | Prompt Sent to Claude |
|---------|------|--------------------|--------|----------------------|
| ✌️ Peace | Index + middle up | `fixbug` | Fix bug | `"Here is a function with a bug. Identify and fix it. Return only the corrected code with a one-line comment explaining the fix: {code}"` |
| 👍 Thumbs up | Thumb extended | `explain` | Explain code | `"Explain what this code does in 3 bullet points, written for a developer: {code}"` |
| 🤙 Hang loose | Thumb + pinky out | `cmsg` | Generate commit message | `"Write a concise, conventional git commit message for the following change: {code}"` |
| 🤘 Rock on | Index + pinky up | `gentest` | Scaffold test file | `"Generate a complete pytest test file for this function. Include happy path, edge cases, and error cases: {code}"` |
| ✋ Open palm | All fingers up | `ESC` | STOP | Abort active Claude stream |

---

## Gesture Classifier — Implementation Notes

Use MediaPipe's 21-point hand landmark model. Each gesture maps to a simple rule based on which fingers are extended. No ML training needed — pure landmark geometry.

```
Finger extended = tip y-position < pip y-position (tip higher than knuckle)

peace()      → index_extended AND middle_extended AND NOT ring AND NOT pinky
thumbs_up()  → thumb_extended AND NOT index AND NOT middle AND NOT ring AND NOT pinky
hang_loose() → thumb_extended AND pinky_extended AND NOT index AND NOT middle AND NOT ring
rock_on()    → index_extended AND pinky_extended AND NOT middle AND NOT ring
open_palm()  → all five fingers extended
```

---

## Technical Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Vite + Vanilla JS | Zero config, fast, no overhead |
| Hand Detection | MediaPipe Hands (CDN) | Best-in-class, runs in browser, no install |
| AI | Claude API (claude-sonnet-4) | Fastest output, streaming support |
| UI | Single HTML overlay | Ship fast, no component complexity |
| Context | Clipboard API | Dead simple, one user action |
| Output handoff | Auto-copy to clipboard | Closes the loop — result is paste-ready |

---

## What the Demo Looks Like

```
┌─────────────────────────────────────────────────────────┐
│  [Camera Feed]                        [✌️  FIX FIRED]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ▶ Fixing bug in selected code...                       │
│                                                         │
│  def calculate_average(nums):                           │
│      if not nums:                                       │
│          return 0  # handle empty list edge case        │
│      return sum(nums) / len(nums)                       │
│                                                         │
│  ✓ Copied to clipboard                                  │
│  ─────────────────────────────────────────────────────  │
│  ✌️ fix  👍 explain  🤙 commit  🤘 test  ✋ stop         │
└─────────────────────────────────────────────────────────┘
```

---

## Stretch Goals (If You Have Time)

Ordered by impact-to-effort. Do them in sequence.

### Stretch 1 — Gesture Confidence Ring
Show a small circular fill around the recognized gesture icon that completes over 0.8 seconds before dispatch. Prevents accidental fires. Makes it feel intentional and satisfying to watch. ~30 minutes.

### Stretch 2 — VS Code Extension Integration
Instead of clipboard, inject context directly from the active editor selection. Eliminates the "select first" UX friction and closes the loop in the opposite direction too — result inserts directly below the selection. ~45 minutes.

### Stretch 3 — Named Gesture Profiles ("Snippet Packs")
Different gesture sets for different contexts — a "code review" pack, a "writing" pack, a "data science" pack. Same 5 gesture shapes, different dispatches. Extends the snippet analogy naturally. ~1 hour.

### Stretch 4 — Two-Hand Modifier System
Non-dominant hand held up = modifier key. Doubles the vocabulary with no new gestures to memorize. `✋ (left, held) + ✌️ (right)` = "refactor" instead of "fix bug." ~1.5 hours.

### Stretch 5 — Agent Chaining
✌️ fix → output auto-piped into 🤘 scaffold test → auto-committed with 🤙. A gesture-triggered pipeline. The "wow" moment if you can pull it off. ~2 hours.

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Lighting kills detection | High | Test in demo room early, bring a lamp |
| Gesture misclassification | Medium | 0.85 confidence threshold + 1s debounce |
| Clipboard permission denied | Medium | Hardcoded demo code string as fallback |
| Claude API latency | Low | Streaming makes it feel instant |
| Judges ask "then what?" | Low | Auto-clipboard copy answers this immediately |

---

## Success Criteria

- [ ] Camera detects all 5 gestures reliably in normal office lighting
- [ ] Gesture fires Claude API with clipboard code as context
- [ ] Output streams visibly into panel within 2 seconds
- [ ] Result is auto-copied to clipboard when stream completes
- [ ] Open palm aborts the stream
- [ ] The 60-second demo arc runs clean 3 times in a row

---

## Judging Criteria Mapping

| Criterion | How We Address It |
|-----------|------------------|
| **Problem Statement** | Developers already know the villain — snippet dispatch is fast, AI dispatch isn't. We're closing that gap. Judges have felt this personally. |
| **Creativity** | Gesture-as-snippet is a tight, original analogy. Not "gestures + AI" generically — a specific, coherent design philosophy with a clear lineage from a tool developers already love. |
| **Completeness** | Full loop: select code → gesture → AI output → clipboard → paste. Nothing left hanging. |

---

## The Pitch

> Every developer uses code snippets because they learned something early: if you already know the shape of what you want, you shouldn't have to reconstruct it from scratch. You type three letters and it appears.
>
> But snippets are static. They can't write the test for *your* function. They can't explain *this* block. They can't commit *your* diff.
>
> So today, every time a developer wants to do something rote-but-context-aware, they break flow state — alt-tab, type a prompt, paste code, copy output back. A four-step tax on every action they already knew they wanted to take.
>
> GestureDispatch is AI-powered snippets triggered by hand signs. Same muscle memory. Same finite vocabulary. Infinite context-awareness. One gesture — your code goes in, the right output comes out, straight to your clipboard.
>
> You already knew what you wanted. Now dispatch is free.

---

*Cut scope before cutting demo quality. Three gestures that work perfectly beat five that work sometimes.*
