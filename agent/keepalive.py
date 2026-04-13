import threading
import time

import httpx

HEALTH_URL = "http://localhost:8000/health"
INTERVAL_SECONDS = 600  # 10 minutes


def _ping_loop() -> None:
    while True:
        time.sleep(INTERVAL_SECONDS)
        try:
            httpx.get(HEALTH_URL, timeout=5.0)
        except Exception:
            pass


def start() -> None:
    """Spawn a daemon thread that pings /health every 10 minutes to prevent
    Render's free-tier instances from spinning down due to inactivity."""
    thread = threading.Thread(target=_ping_loop, daemon=True)
    thread.start()
