#!/usr/bin/env python3
"""
Inspects OneSignal App configuration, platforms, active subscribers,
and system health.
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

def get_app():
    req = urllib.request.Request(
        f"https://api.onesignal.com/apps/{APP_ID}",
        headers={"Authorization": f"Basic {API_KEY}"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_players():
    req = urllib.request.Request(
        f"https://api.onesignal.com/players?app_id={APP_ID}&limit=50",
        headers={"Authorization": f"Basic {API_KEY}"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    app = get_app()
    print("========================================")
    print(f"OneSignal App: {app.get('name')} ({app.get('id')})")
    print("========================================")
    print(f"Origin:              {app.get('chrome_web_origin')}")
    print(f"Default Icon:        {app.get('chrome_web_default_notification_icon')}")
    print(f"Total Players:       {app.get('players')}")
    print(f"Messageable Players: {app.get('messageable_players')}")
    
    players_data = get_players()
    players = players_data.get("players", [])
    print(f"Registered Devices:  {len(players)}")
    for idx, p in enumerate(players, 1):
        print(f"  [{idx}] ID: {p.get('id')} | Model: {p.get('device_model')} | Invalid: {p.get('invalid_identifier')}")
    print("========================================")

if __name__ == "__main__":
    main()
