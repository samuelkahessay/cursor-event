/**
 * Vite plugin that proxies POST /api/chat → OpenRouter API and streams the
 * response back as Server-Sent Events. The API key is read from
 * process.env.OPENROUTER_API_KEY (never exposed to the browser).
 */
export default function claudeProxy() {
  return {
    name: 'claude-proxy',

    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        // ── Parse request body ──
        let body = '';
        for await (const chunk of req) body += chunk;

        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }

        const { prompt } = parsed;
        if (!prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing "prompt" field' }));
          return;
        }

        // ── Validate API key ──
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error:
                'OPENROUTER_API_KEY not set. Copy .env.example to .env and add your key.',
            }),
          );
          return;
        }

        // ── Stream from OpenRouter API ──
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });

        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://gesturedispatch.dev',
              'X-Title': 'GestureDispatch',
            },
            body: JSON.stringify({
              model: 'anthropic/claude-sonnet-4',
              max_tokens: 1024,
              stream: true,
              messages: [{ role: 'user', content: prompt }],
            }),
          });

          if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenRouter ${response.status}: ${err}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

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
                  res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
              } catch {
                // incomplete JSON chunk, skip
              }
            }
          }

          res.write('data: [DONE]\n\n');
        } catch (err) {
          const errorMsg = JSON.stringify({
            error: err.message || 'OpenRouter API error',
          });
          res.write(`data: ${errorMsg}\n\n`);
        }

        res.end();
      });
    },
  };
}
