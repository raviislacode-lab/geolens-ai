# GeoLens AI

AI-powered rock, mineral, and geological specimen identification for iOS.

## Architecture

- **Mobile**: Expo (React Native) + TypeScript, local SQLite storage
- **Backend**: Python FastAPI with OpenRouter Gemini 2.5 Flash vision, decision engine, and local RAG

## Quick Start

### Backend

```bash
cd services/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../../.env.example ../../.env
# Add your OPENROUTER_API_KEY to .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Mobile

```bash
cd apps/mobile
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` (default: `http://localhost:8000`).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/v1/identify` | Identify specimen from image |
| POST | `/v1/identify/follow-up` | Re-run with follow-up answers |
| GET | `/v1/specimens/{name}` | RAG-backed specimen details |
