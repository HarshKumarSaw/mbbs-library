#!/usr/bin/env python3
"""
Purges any existing players/subscribers from OneSignal backend
to enforce clean re-subscription.
"""
import os
import sys
import json
import urllib.request
import urllib.error

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY_FILE = os.path.join(REPO_ROOT, ".onesignal_key")

if not os.path.exists(KEY_FILE):
    print("Error: .onesignal_key not found")
    sys.exit(1)

with open(KEY_FILE, "r") as f:
    API_KEY = f.read().strip()

APP_ID = "54db441e-edff-4024-8e24-87bacea1d5fe"
BASE_URL = "https://api.onesignal.com"

def api_call(endpoint, method="GET", data=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Basic {API_KEY}",
            "Content-Type": "application/json; charset=utf-8"
        },
        method=method
    )
    if data:
        req.data = json.dumps(data).encode("utf-8")
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {"success": True}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        return {"error": e.code, "message": err_body}
    except Exception as e:
        return {"error": str(e)}

def main():
    print("Checking registered players in OneSignal...")
    res = api_call(f"/players?app_id={APP_ID}&limit=300")
    players = res.get("players", [])
    print(f"Found {len(players)} player(s) on OneSignal.")
    
    deleted_count = 0
    for p in players:
        pid = p.get("id")
        print(f"Deleting player {pid}...")
        del_res = api_call(f"/players/{pid}?app_id={APP_ID}", method="DELETE")
        if del_res.get("success"):
            deleted_count += 1
            print(f"  -> Deleted {pid}")
        else:
            print(f"  -> Failed to delete {pid}: {del_res}")
            
    print(f"Backend cleanup complete: {deleted_count} player(s) deleted.")

if __name__ == "__main__":
    main()
