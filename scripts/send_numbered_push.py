#!/usr/bin/env python3
import json
import subprocess
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY_FILE = os.path.join(REPO_ROOT, ".onesignal_key")

if not os.path.exists(KEY_FILE):
    print("Error: .onesignal_key not found")
    sys.exit(1)

with open(KEY_FILE, "r") as f:
    API_KEY = f.read().strip()

APP_ID = "54db441e-edff-4024-8e24-87bacea1d5fe"
BASE_URL = "https://api.onesignal.com"
LOGO_URL = "https://harshkumarsaw.github.io/mbbs-library/assets/icons/logo-256x256.png"

def run_curl(endpoint, data=None):
    cmd = [
        "curl", "-s", "--retry", "3", "--retry-delay", "1",
        "-H", f"Authorization: Basic {API_KEY}",
        "-H", "Content-Type: application/json; charset=utf-8"
    ]
    if data:
        cmd += ["-X", "POST", "-d", json.dumps(data), f"{BASE_URL}{endpoint}"]
    else:
        cmd += [f"{BASE_URL}{endpoint}"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(res.stdout)
    except Exception:
        return {"raw": res.stdout, "err": res.stderr}

def get_players():
    return run_curl(f"/players?app_id={APP_ID}&limit=50")

def send_to_player(player_id, index, total, model="Device"):
    payload = {
        "app_id": APP_ID,
        "include_player_ids": [player_id],
        "headings": {"en": f"Harsh's Library #{index}"},
        "contents": {"en": f"Device #{index} of {total} ({model[:16]}) — Medical Crest Test 🩺"},
        "url": "https://harshkumarsaw.github.io/mbbs-library/",
        "chrome_web_icon": LOGO_URL,
        "firefox_icon": LOGO_URL
    }
    return run_curl("/notifications", data=payload)

def main():
    data = get_players()
    players = data.get("players", [])
    print(f"Total registered devices in OneSignal: {len(players)}")

    results = []
    # Test each player individually
    for idx, p in enumerate(players, 1):
        pid = p.get("id")
        inv = p.get("invalid_identifier", False)
        model = p.get("device_model", "Android")
        print(f"\n[Device #{idx}] ID: {pid} | Model: {model} | Invalid: {inv}")

        res = send_to_player(pid, idx, len(players), model)
        results.append((idx, pid, inv, res))
        print(f"  -> Result: {res}")

    # Also send broadcast push with sequence number to all subscribed segments
    broadcast_payload = {
        "app_id": APP_ID,
        "target_channel": "push",
        "included_segments": ["Total Subscriptions", "Subscribed Users"],
        "headings": {"en": "Harsh's Library: Broadcast Test"},
        "contents": {"en": f"Broadcast Alert to All Active Devices ({len(players)} total registered) 🩺"},
        "url": "https://harshkumarsaw.github.io/mbbs-library/",
        "chrome_web_icon": LOGO_URL,
        "firefox_icon": LOGO_URL
    }
    b_res = run_curl("/notifications", data=broadcast_payload)
    print(f"\n[Broadcast Push] Result: {b_res}")

if __name__ == "__main__":
    main()

if __name__ == "__main__":
    main()
