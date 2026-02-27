/**
 * Vercel Edge Function that proxies POST /api/chat → OpenRouter API
 * and streams the response back as Server-Sent Events.
 *
 * Replaces vite-plugin-claude-proxy.js for production deployment.
 * The OPENROUTER_API_KEY is read from Vercel environment variables.
 */

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let parsed;
  try {
    parsed = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { prompt } = parsed;
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Missing "prompt" field' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'OPENROUTER_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Stream from OpenRouter and re-emit as simplified SSE
  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://gesturedispatch.dev',
      'X-Title': 'GestureDispatch',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      max_tokens: 1024,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return new Response(
      JSON.stringify({ error: `OpenRouter ${upstream.status}: ${err}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Transform the OpenRouter SSE stream into our simplified format
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const payload = trimmed.slice(6);
          if (payload === '[DONE]') continue;

          try {
            const event = JSON.parse(payload);
            const text = event.choices?.[0]?.delta?.content;
            if (text) {
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
              );
            }
          } catch {
            // incomplete JSON chunk, skip
          }
        }
      }

      await writer.write(encoder.encode('data: [DONE]\n\n'));
    } catch (err) {
      const errorMsg = JSON.stringify({ error: err.message || 'OpenRouter API error' });
      await writer.write(encoder.encode(`data: ${errorMsg}\n\n`));
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
