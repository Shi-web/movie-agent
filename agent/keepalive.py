import threading, time, requests


def start_keepalive():
    def ping():
        while True:
            time.sleep(840)  # 14 minutes
            try:
                requests.get("http://localhost:8000/health", timeout=5)
            except:
                pass

    t = threading.Thread(target=ping, daemon=True)
    t.start()
