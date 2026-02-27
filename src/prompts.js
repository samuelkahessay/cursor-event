/** Prompt templates keyed by gesture action name. Use {code} as the placeholder. */
export const PROMPT_TEMPLATES = {
  fix: 'Here is a function with a bug. Identify and fix it. Return only the corrected code with a one-line comment explaining the fix:\n\n{code}',
  explain:
    'Explain what this code does in 3 bullet points, written for a developer:\n\n{code}',
  commit:
    'Write a concise, conventional git commit message for the following change:\n\n{code}',
  test: 'Generate a complete pytest test file for this function. Include happy path, edge cases, and error cases:\n\n{code}',
};

/** Status messages shown in the output panel header while streaming. */
export const STATUS_MESSAGES = {
  fix: '▶ Fixing bug in selected code...',
  explain: '▶ Explaining selected code...',
  commit: '▶ Generating commit message...',
  test: '▶ Scaffolding test file...',
  stop: '⏹ Stream aborted.',
};

/** Demo code used when clipboard is unavailable or empty. */
export const FALLBACK_CODE = `def calculate_average(nums):
    return sum(nums) / len(nums)  # crashes on empty list`;

/** Pre-baked response used when the network is down (demo survival). */
export const CACHED_FALLBACK = {
  fix: `def calculate_average(nums):
    if not nums:
        return 0  # fix: guard against empty list to avoid ZeroDivisionError
    return sum(nums) / len(nums)`,
  explain: `• Calculates the arithmetic mean of a list of numbers using sum/len.
• Has a bug: crashes with ZeroDivisionError when given an empty list.
• Simple utility — no input validation or type checking.`,
  commit: `fix: guard against empty list in calculate_average

Prevents ZeroDivisionError by returning 0 for empty input.`,
  test: `import pytest
from calculator import calculate_average

def test_happy_path():
    assert calculate_average([1, 2, 3]) == 2.0

def test_single_element():
    assert calculate_average([5]) == 5.0

def test_empty_list():
    assert calculate_average([]) == 0

def test_negative_numbers():
    assert calculate_average([-2, 2]) == 0.0

def test_floats():
    assert calculate_average([1.5, 2.5]) == 2.0`,
};
