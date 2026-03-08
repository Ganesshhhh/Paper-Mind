require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    provider: 'groq',
    model: 'llama-3.3-70b-versatile' 
  });
});

// ── Groq proxy ──
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server.' });
  }

  try {
    const { messages, system } = req.body;

    // Format messages for Groq (they use a different structure)
    const groqMessages = [];
    
    // Add system message if provided
    if (system) {
      groqMessages.push({
        role: 'system',
        content: system
      });
    }
    
    // Add conversation history
    if (messages && Array.isArray(messages)) {
      groqMessages.push(...messages);
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Free model, 8k context
        messages: groqMessages,
        max_tokens: 1000,
        temperature: 0.1, // Lower temp for factual answers
        top_p: 0.9,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API error:', data);
      return res.status(response.status).json({ 
        error: data.error?.message || 'Groq API error' 
      });
    }

    // Transform Groq response to match expected format
    const formattedResponse = {
      content: [{
        type: 'text',
        text: data.choices[0]?.message?.content || ''
      }]
    };

    res.json(formattedResponse);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Catch-all → serve index.html ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🧠 Paper Mind (Groq Edition) running at http://localhost:${PORT}`);
  console.log(`   API key: ${process.env.GROQ_API_KEY ? '✓ loaded' : '✗ MISSING — set GROQ_API_KEY in .env'}`);
  console.log(`   Free tier: 30 req/min, no credit card required!\n`);
});
