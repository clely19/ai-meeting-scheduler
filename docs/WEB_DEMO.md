# Public Web Demo

The browser demo is a lightweight public frontend for the live Render backend.

## Purpose

The original product interface is the iMessage extension. The web demo recreates the same scheduling conversation in a browser so portfolio visitors can try the project without installing an iOS build.

The first public run uses deterministic demo agents, mock calendar availability, and no model API key. After a visitor completes one cycle, the demo offers an optional personalized AI rerun where the visitor can enter their own Gemini key for the current browser session.

## Local URL

Start the backend from the project root:

```bash
cd backend
../.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
```

Open:

```text
http://127.0.0.1:8000/demo/
```

## Render URL

After the changes are pushed and Render redeploys, the public demo will be available at:

```text
https://ai-meeting-scheduler-api.onrender.com/demo/
```

The root URL redirects to the demo:

```text
https://ai-meeting-scheduler-api.onrender.com
```

## What The Demo Does

1. Registers a host and two invitees through `/users/register`.
2. Starts a live negotiation through `/negotiation/start`.
3. Fetches the saved session through `/negotiation/{session_id}`.
4. Displays the result, suggested slot, and negotiation rounds.

## Why It Uses The Same Backend

The demo is served by FastAPI under `/demo`, so browser requests call the same origin as the API. This avoids CORS setup for the first public version and keeps deployment to one Render service.

Public demo runs send `use_ai: false` to `/negotiation/start`, which prevents the backend from using any server-side model key. Personalized reruns send `use_ai: true` plus an `X-User-Gemini-Key` header. That key is used only for the request and is not stored in Supabase.

## Verification

Run backend tests:

```bash
.venv/bin/python -m unittest discover -s tests
```

Check that the static demo routes serve correctly:

```bash
.venv/bin/python - <<'PY'
import sys
sys.path.insert(0, 'backend')
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
for path in ['/', '/demo/', '/demo/app.js', '/health']:
    response = client.get(path, follow_redirects=False)
    print(path, response.status_code)
PY
```
