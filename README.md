# caleio-backend

Clari AI API for the [Caleio](https://github.com) iOS app.

## Endpoints

- `GET /health` — health check
- `POST /clari` — ask Clari (JSON body from the app)

## Environment variables (Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `OPENAI_MODEL` | No | Default: `gpt-4o-mini` |
| `PORT` | No | Set automatically on Railway |

## Local run

```bash
npm install
OPENAI_API_KEY=sk-... npm start
```

## Railway

1. New Project → Deploy from GitHub → `caleio-backend`
2. Add variable `OPENAI_API_KEY`
3. Copy the public URL and set in iOS: `ClariConfig.baseURL = "https://YOUR-APP.railway.app/clari"`
