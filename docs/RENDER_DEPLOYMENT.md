# Render Deployment

This project deploys to Render as a Python web service running the FastAPI backend.

## What Render Runs

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

Health check:

```text
/health
```

## Required Environment Variables

Set these in the Render service environment:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GEMINI_API_KEY`

`GEMINI_API_KEY` is optional for deterministic fallback demos, but set it if you want live AI-backed agent responses.

The demo love counter also requires the `public.demo_love_devices` table in Supabase. Run `scripts/create_demo_love_devices.sql` in the Supabase SQL editor before deploying so unique-device counts persist across Render restarts and redeploys.

## Deploy From Render Dashboard

1. Push this repo to GitHub.
2. In Render, choose **New +** then **Web Service**.
3. Connect the GitHub repository.
4. Use these settings:
   - Runtime: `Python`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/health`
5. Add the required environment variables.
6. Deploy.

## Deploy From Blueprint

Render can also read `render.yaml` from the repo root. The blueprint defines the web service, build command, start command, health check, and required env var names.

## Verify After Deploy

Replace the URL with your Render service URL:

```bash
.venv/bin/python scripts/smoke_test_render_backend.py https://your-service.onrender.com
```

Expected result:

- `/health` returns `{"status":"alive","project":"ai-meeting-scheduler"}`
- `/calendar/availability` returns calculated free slots
- `/demo/` serves the public browser demo

Open the demo in a browser:

```text
https://your-service.onrender.com/demo/
```

## What This Does Not Prove Yet

The smoke test does not test Supabase-backed routes like `/users/register` or `/negotiation/start`. After environment variables are set, test those through the API docs at:

```text
https://your-service.onrender.com/docs
```
