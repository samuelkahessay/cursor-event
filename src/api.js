/**
 * Streams a chat response from the /api/chat proxy endpoint.
 *
 * @param {string}            prompt   – The full prompt to send.
 * @param {AbortSignal}       signal   – Used to cancel the request mid-stream.
 * @param {(chunk: string) => void} onChunk – Called with each text delta.
 * @returns {Promise<string>} The full accumulated response text.
 */
export async function streamChat(prompt, signal, onChunk) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by double newlines
    const parts = buffer.split('\n\n');
    // Keep the last (possibly incomplete) part in the buffer
    buffer = parts.pop();

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data: ')) continue;

      const payload = line.slice(6); // strip "data: "
      if (payload === '[DONE]') continue;

      try {
        const parsed = JSON.parse(payload);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.text) {
          accumulated += parsed.text;
          onChunk(parsed.text);
        }
      } catch (e) {
        if (e.message !== 'Unexpected end of JSON input') throw e;
      }
    }
  }

  return accumulated;
}
