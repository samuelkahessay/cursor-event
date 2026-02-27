const PROMPT_TEMPLATES = {
  peace: "Here is a function with a bug. Identify and fix it. Return only the corrected code with a one-line comment explaining the fix: {code}",
  thumbs_up: "Explain what this code does in 3 bullet points, written for a developer: {code}",
  hang_loose: "Write a concise, conventional git commit message for the following change: {code}",
  rock_on: "Generate a complete pytest test file for this function. Include happy path, edge cases, and error cases: {code}",
};

const STATUS_MESSAGES = {
  peace: "▶ Fixing bug in selected code...",
  thumbs_up: "▶ Explaining selected code...",
  hang_loose: "▶ Generating commit message...",
  rock_on: "▶ Scaffolding test file...",
  open_palm: "⏹ Stream aborted.",
};

const MOCK_RESPONSES = {
  peace: "def calculate_average(nums):\n    if not nums:\n        return 0  # Fixed: handle empty list\n    return sum(nums) / len(nums)",
  thumbs_up: "- Calculates the average of a list of numbers\n- Uses built-in sum() and len() functions\n- Currently crashes if the input list is empty",
  hang_loose: "fix: handle empty list in calculate_average to prevent ZeroDivisionError",
  rock_on: "import pytest\nfrom main import calculate_average\n\ndef test_calculate_average_happy_path():\n    assert calculate_average([1, 2, 3]) == 2.0\n\ndef test_calculate_average_empty_list():\n    assert calculate_average([]) == 0",
};

let activeController = null;

function showStatus(msg) {
  const panel = document.getElementById('output-panel');
  let statusEl = document.getElementById('status-header');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'status-header';
    statusEl.style.fontWeight = 'bold';
    statusEl.style.marginBottom = '10px';
    statusEl.style.color = '#a3e635';
    panel.prepend(statusEl);
  }
  statusEl.textContent = msg;
}

function appendContent(text) {
  const panel = document.getElementById('output-panel');
  let contentEl = document.getElementById('output-content');
  if (!contentEl) {
    contentEl = document.createElement('pre');
    contentEl.id = 'output-content';
    contentEl.style.whiteSpace = 'pre-wrap';
    panel.appendChild(contentEl);
  }
  contentEl.textContent += text;
}

function clearPanel() {
  const panel = document.getElementById('output-panel');
  panel.innerHTML = '';
}

async function streamMockClaude(gestureName, signal) {
  const response = MOCK_RESPONSES[gestureName] || "No response available.";
  const chunks = response.split(' ');
  
  for (let i = 0; i < chunks.length; i++) {
    if (signal.aborted) throw new Error('AbortError');
    appendContent(chunks[i] + (i < chunks.length - 1 ? ' ' : ''));
    await new Promise(r => setTimeout(r, 50)); // simulate network delay
  }
  return response;
}

export function dispatch(gestureName, code = '') {
  const panel = document.getElementById('output-panel');
  
  if (gestureName === 'open_palm') {
    if (activeController) activeController.abort();
    showStatus(STATUS_MESSAGES.open_palm);
    return;
  }

  if (activeController) activeController.abort();
  activeController = new AbortController();
  
  clearPanel();
  showStatus(STATUS_MESSAGES[gestureName] || `▶ Processing ${gestureName}...`);

  streamMockClaude(gestureName, activeController.signal)
    .then(fullResponse => {
      navigator.clipboard.writeText(fullResponse).catch(err => console.error("Clipboard write failed", err));
      showStatus('✓ Copied to clipboard');
    })
    .catch(err => {
      if (err.message === 'AbortError') {
        showStatus(STATUS_MESSAGES.open_palm);
      } else {
        showStatus('❌ Error occurred');
        console.error(err);
      }
    });
}