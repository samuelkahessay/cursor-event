# GestureDispatch — Sam's Scope
**Role:** AI Pipeline & Output Panel (Person B)
**Codename:** SignalFire
**Last Updated:** February 26, 2026

---

## Your Mission

Own everything from **gesture event → Claude API → rendered output → clipboard**. Your deliverable is a module where calling `dispatch("fix", codeString)` streams Claude's response into a styled output panel and auto-copies the result to clipboard.

---

## Shared Context

### The One-Liner
> "Code snippets — but AI-powered and triggered by hand signs. Same muscle memory, infinite context-awareness."

### The Analogy
GestureDispatch maps gestures to AI workflows the same way snippet shortcuts map to boilerplate. Finite, learnable, fast — but context-aware. The full loop: select code → gesture → AI output → clipboard → paste. Nothing left hanging.

### Technical Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Vite + Vanilla JS | Zero config, fast, no overhead |
| AI | Claude API (claude-sonnet-4) | Fastest output, streaming support |
| Context | Clipboard API | Dead simple, one user action |
| Output handoff | Auto-copy to clipboard | Closes the loop — result is paste-ready |

---

## Your Build Plan

### Minute 0–10 — Clipboard Context + Prompt Templates
**Goal:** Gesture name + code context → ready-to-send payload.

- Build the clipboard reader — `navigator.clipboard.readText()` on gesture fire
- Create a hardcoded fallback demo code string for when clipboard permission is denied
- Define all 5 prompt templates (see below)
- Map gesture name → prompt template, inject `{code}` from clipboard
- Test with a button or keyboard shortcut that simulates a gesture event

**Deliverable:** `{ gesture: "fix", prompt: "Here is a function...", code: "def buggy_fn()..." }` payload assembled.

---

### Minute 10–30 — Claude API Dispatcher + Streaming
**Goal:** Gesture fires Claude, response streams back.

- Set up Claude API client (use `@anthropic-ai/sdk` or direct fetch with streaming)
- Implement `dispatch(gestureName, code)` function:
  - Look up prompt template for gesture
  - Inject code into template
  - Call Claude API with `stream: true`
  - Return a readable stream / fire callbacks with chunks
- Implement abort logic: `dispatch('open_palm')` → cancel active stream via `AbortController`
- **Auto-copy completed result to clipboard** using `navigator.clipboard.writeText()`
- Handle errors gracefully (network failure, API errors, empty clipboard)

```js
// dispatcher.js — your main export
export function dispatch(gestureName, code) { ... }
```

**Deliverable:** `dispatch("fix", code)` → Claude response chunks arriving → result copied to clipboard.

---

### Minute 30–45 — Output Panel
**Goal:** Streaming text renders beautifully in the panel.

- Build the output panel inside the container Bishesh creates (dark bg, fixed position)
- Render streaming text chunk-by-chunk as it arrives
- Add status header with gesture-specific messages (see table below)
- Style code blocks in the response (monospace, syntax-colored if easy)
- Show a loading indicator while waiting for first chunk
- **Show "✓ Copied to clipboard" confirmation when stream completes**
- Clear panel on new gesture dispatch

**Status messages per gesture:**
| Gesture | Status Text |
|---------|------------|
| ✌️ Peace | "▶ Fixing bug in selected code..." |
| 👍 Thumbs up | "▶ Explaining selected code..." |
| 🤙 Hang loose | "▶ Generating commit message..." |
| 🤘 Rock on | "▶ Scaffolding test file..." |
| ✋ Open palm | "⏹ Stream aborted." |

**Deliverable:** Streaming Claude output renders cleanly in the panel with clipboard confirmation.

---

### Minute 45–60 — Integration + Demo Polish
**Goal:** Everything works end-to-end, demo is clean.

- Wire up with Bishesh's gesture events
- Prepare the demo buggy Python function:
  ```python
  def calculate_average(nums):
      return sum(nums) / len(nums)  # crashes on empty list
  ```
- Have a cached fallback response in case internet dies
- Kill any console errors
- Rehearse: select code → ✌️ fix → 👍 explain → 🤙 commit message
- Ensure the 60-second demo arc runs clean 3 times

---

## Interface Contract with Bishesh

Bishesh detects gestures. You consume them.

```js
// dispatcher.js — Bishesh will import and call this

let activeController = null;

export function dispatch(gestureName, code = '') {
  // If open_palm, abort current stream
  if (gestureName === 'open_palm') {
    if (activeController) activeController.abort();
    showStatus('⏹ Stream aborted.');
    return;
  }

  // Abort any existing stream before starting new one
  if (activeController) activeController.abort();
  activeController = new AbortController();

  const prompt = PROMPT_TEMPLATES[gestureName].replace('{code}', code);
  streamClaude(prompt, activeController.signal)
    .then(fullResponse => {
      navigator.clipboard.writeText(fullResponse);
      showStatus('✓ Copied to clipboard');
    });
}
```

---

## Prompt Templates

| Gesture | Snippet Equiv. | Prompt |
|---------|---------------|--------|
| ✌️ Peace (Fix) | `fixbug` | `"Here is a function with a bug. Identify and fix it. Return only the corrected code with a one-line comment explaining the fix: {code}"` |
| 👍 Thumbs up (Explain) | `explain` | `"Explain what this code does in 3 bullet points, written for a developer: {code}"` |
| 🤙 Hang loose (Commit) | `cmsg` | `"Write a concise, conventional git commit message for the following change: {code}"` |
| 🤘 Rock on (Test) | `gentest` | `"Generate a complete pytest test file for this function. Include happy path, edge cases, and error cases: {code}"` |

---

## Your Stretch Goals

If MVP is solid and time permits:

- **Stretch 2 — VS Code Extension Integration:** Inject context directly from active editor selection instead of clipboard. Also insert result directly below the selection. Eliminates "select first" friction on both ends. ~45 minutes.
- **Stretch 3 — Named Gesture Profiles ("Snippet Packs"):** Different gesture sets for different contexts — "code review" pack, "writing" pack, "data science" pack. Same 5 shapes, different dispatches. ~1 hour.
- **Stretch 5 — Agent Chaining:** ✌️ fix → auto-pipes output into 🤘 scaffold test → auto-commits with 🤙. A gesture-triggered pipeline. The "wow" demo moment. ~2 hours.

---

## Your Risks

| Risk | Mitigation |
|------|------------|
| Clipboard permission denied | Hardcoded demo code string as fallback |
| Claude API latency | Streaming makes it feel instant |
| Network failure during demo | Cache a fallback response for the demo function |
| Judges ask "then what?" | Auto-clipboard copy answers this immediately |

---

## Your Success Criteria

- [ ] `dispatch(gestureName, code)` calls Claude with correct prompt
- [ ] Response streams visibly into the panel within 2 seconds
- [ ] Result is auto-copied to clipboard when stream completes
- [ ] "✓ Copied to clipboard" confirmation appears
- [ ] Open palm aborts the active stream
- [ ] Output panel renders code blocks cleanly
- [ ] Cached fallback works if network fails
- [ ] The 60-second demo arc runs clean 3 times in a row
