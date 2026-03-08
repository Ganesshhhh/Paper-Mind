# 🧠 Paper Mind

A RAG-powered document chatbot. Upload company files (PDF, DOCX, XLSX, PPTX, images) and ask questions — answers are grounded entirely in your documents.

---

## Project Structure

```
papermind/
├── server.js          ← Express backend (API proxy)
├── package.json
├── .env.example       ← Copy this to .env and add your key
├── .gitignore
└── public/
    └── index.html     ← The full frontend app
```

---

## Quick Start (Local)

### 1. Install Node.js
Download from https://nodejs.org (v18 or higher)

### 2. Get your Anthropic API key
Go to https://console.anthropic.com/settings/keys and create a key.

### 3. Set up the project

```bash
# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

Open `.env` and replace the placeholder with your real API key:
```
ANTHROPIC_API_KEY=sk-ant-your-real-key-here
```

### 4. Run it

```bash
npm start
```

Open http://localhost:3000 in your browser. That's it!

---

## Deploy to Render (Free, Recommended)

Render is the easiest way to deploy — free tier available.

1. Push this project to a GitHub repo
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Set these values:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add environment variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your API key
6. Click **Deploy** — you'll get a live URL like `papermind.onrender.com`

---

## Deploy to Railway

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Connect your repo
3. Go to Variables tab → add `ANTHROPIC_API_KEY`
4. Railway auto-detects Node and deploys — live in ~60 seconds

---

## Deploy to Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login and launch
fly auth login
fly launch          # follow the prompts
fly secrets set ANTHROPIC_API_KEY=sk-ant-your-key
fly deploy
```

---

## Deploy to Heroku

```bash
heroku create papermind
heroku config:set ANTHROPIC_API_KEY=sk-ant-your-key
git push heroku main
heroku open
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic API key |
| `PORT` | No | Port to run on (default: 3000) |

---

## Notes

- The API key lives **only on the server** — it is never exposed to the browser
- Document text is sent to the API on each request (stateless) — nothing is stored
- Max document context per request: ~8,000 characters per file
- Supported files: PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, CSV, TXT, MD, JSON, PNG, JPG, WEBP, BMP, TIFF
- Scanned PDFs and images use Claude Vision OCR automatically
