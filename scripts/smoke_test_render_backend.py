import json
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def request_json(url: str, payload: dict | None = None) -> dict:
    data = None
    headers = {}

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request = Request(url, data=data, headers=headers)

    try:
        with urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        body = exc.read().decode("utf-8")
        raise RuntimeError(
            f"{url} returned HTTP {exc.code}: {body}"
        ) from exc
    except URLError as exc:
        raise RuntimeError(f"{url} request failed: {exc}") from exc


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(
            "Usage: .venv/bin/python "
            "scripts/smoke_test_render_backend.py "
            "https://your-render-url.onrender.com"
        )

    base_url = sys.argv[1].rstrip("/")

    health = request_json(f"{base_url}/health")
    if health.get("status") != "alive":
        raise RuntimeError(f"Unexpected health response: {health}")

    availability = request_json(
        f"{base_url}/calendar/availability",
        {
            "user_id": "render-smoke-user",
            "session_id": "render-smoke-session",
            "date_range_start": "2026-03-02T09:00:00",
            "date_range_end": "2026-03-02T18:00:00",
            "duration_minutes": 60,
            "busy_blocks": [
                {
                    "start": "2026-03-02T10:00:00",
                    "end": "2026-03-02T11:00:00",
                }
            ],
        },
    )

    if availability.get("slots_count", 0) < 1:
        raise RuntimeError(
            f"Expected at least one free slot: {availability}"
        )

    print(json.dumps({
        "health": health,
        "availability_source": availability["availability_source"],
        "slots_count": availability["slots_count"],
        "first_slot": availability["free_slots"][0],
    }, indent=2))


if __name__ == "__main__":
    main()
