# WEconnect

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `GEMINI_API_KEY` in `.env.local` to enable AI-powered component
selection. The key is read only by the server-side selection route and is never
sent to the browser.
