#!/usr/bin/env python3
"""
Harsh's Library - Personalized Push Notification Sender
Send targeted notifications to a specific subscriber by name or device ID.

Usage:
  python3 scripts/send_personal_push.py --name "<NAME>" "<TITLE>" "<MESSAGE>" [URL]
  python3 scripts/send_personal_push.py --device <INDEX_OR_ID> "<TITLE>" "<MESSAGE>" [URL]
  python3 scripts/send_personal_push.py --all "<TITLE>" "<MESSAGE>" [URL]
"""
import os
import sys
import json
import urllib.request
import urllib.error
import argparse

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
DEFAULT_URL = "https://harshkumarsaw.github.io/mbbs-library/"

def api_call(endpoint, method="POST", data=None):
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

def get_players():
    req = urllib.request.Request(
        f"{BASE_URL}/players?app_id={APP_ID}&limit=100",
        headers={"Authorization": f"Basic {API_KEY}"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8")).get("players", [])

def send_push(payload, recipient_desc):
    print(f"🚀 Sending push notification to {recipient_desc}...")
    res = api_call("/notifications", method="POST", data=payload)
    if res.get("id"):
        print(f"✅ Notification dispatched successfully! (ID: {res.get('id')})")
    else:
        print(f"❌ Notification failed: {res}")

def main():
    parser = argparse.ArgumentParser(description="Send personalized push notifications")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--name", "-n", help="Target subscriber by labeled name")
    group.add_argument("--device", "-d", help="Target subscriber by index or Player ID")
    group.add_argument("--all", "-a", action="store_true", help="Broadcast to all subscribers (supports {{ name | default: 'Doctor' }})")

    parser.add_argument("title", help="Notification title")
    parser.add_argument("message", help="Notification message text")
    parser.add_argument("url", nargs="?", default=DEFAULT_URL, help="Target URL (optional)")

    args = parser.parse_args()

    payload = {
        "app_id": APP_ID,
        "priority": 10,
        "headings": {"en": args.title},
        "contents": {"en": args.message},
        "url": args.url,
        "chrome_web_icon": LOGO_URL,
        "firefox_icon": LOGO_URL
    }

    if args.name:
        players = get_players()
        matched = [
            p.get("id") for p in players
            if (p.get("tags") or {}).get("name", "").strip().lower() == args.name.strip().lower()
        ]
        if matched:
            payload["include_player_ids"] = matched
            send_push(payload, f"user labeled '{args.name}' ({len(matched)} matching device(s))")
        else:
            payload["filters"] = [{"field": "tag", "key": "name", "relation": "=", "value": args.name}]
            send_push(payload, f"user labeled '{args.name}' via filter")
    elif args.device:
        players = get_players()
        if args.device.isdigit():
            idx = int(args.device)
            if 1 <= idx <= len(players):
                pid = players[idx - 1].get("id")
            else:
                print(f"Error: Device index {idx} out of range (1-{len(players)})")
                sys.exit(1)
        else:
            pid = args.device
        payload["include_player_ids"] = [pid]
        send_push(payload, f"device '{pid}'")
    elif args.all:
        payload["included_segments"] = ["Total Subscriptions", "Subscribed Users"]
        send_push(payload, "all subscribers")

if __name__ == "__main__":
    main()
