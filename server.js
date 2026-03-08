require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '50mb' })); // large limit for document content + images
app.use(express.static(path.join(__dirname, 'public')));

// ── Health check ──
app.get('/api/health', (req, res) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  res.json({ status: 'ok', apiKey: hasKey ? 'configured' : 'MISSING' });
});

// ── Anthropic proxy ──
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server.' });
  }

  try {
    const { model, max_tokens, system, messages } = req.body;

    console.log(`→ /api/chat  model=${model}  messages=${messages?.length}  hasSystem=${!!system}`);

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      model      || 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 1000,
        system,
        messages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      console.error(`❌ Anthropic ${anthropicRes.status}:`, JSON.stringify(data));
      return res.status(anthropicRes.status).json({
        error: data?.error?.message || 'Anthropic API error',
        type:  data?.error?.type,
        full:  data,
      });
    }

    console.log(`✓ ok  stop_reason=${data.stop_reason}`);
    res.json(data);

  } catch (err) {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ── Catch-all → serve index.html (SPA) ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🧠 Paper Mind running at http://localhost:${PORT}`);
  console.log(`   API key: ${process.env.ANTHROPIC_API_KEY ? '✓ loaded' : '✗ MISSING — set ANTHROPIC_API_KEY in .env'}\n`);
});
