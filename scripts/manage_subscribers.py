#!/usr/bin/env python3
"""
Harsh's Library - Device & Subscriber Manager
List, label, and manage push notification subscribers.

Usage:
  python3 scripts/manage_subscribers.py --list
  python3 scripts/manage_subscribers.py --label <INDEX_OR_PLAYER_ID> "<NAME>"
  python3 scripts/manage_subscribers.py --delete <INDEX_OR_PLAYER_ID>
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

def get_players():
    res = api_call(f"/players?app_id={APP_ID}&limit=100")
    return res.get("players", [])

def list_players():
    players = get_players()
    print("═" * 70)
    print(f"👥 ACTIVE SUBSCRIBERS IN HARSH'S LIBRARY ({len(players)} Total)")
    print("═" * 70)
    if not players:
        print("No devices currently registered.")
        return

    for idx, p in enumerate(players, 1):
        pid = p.get("id")
        model = p.get("device_model", "Unknown")
        invalid = p.get("invalid_identifier", False)
        tags = p.get("tags", {}) or {}
        name = tags.get("name", "— (unlabeled)")
        role = tags.get("role", "")
        role_str = f" [{role}]" if role else ""
        status = "❌ Invalid" if invalid else "✅ Active"
        
        print(f"[{idx}] 📱 Name: {name}{role_str}")
        print(f"    Player ID: {pid}")
        print(f"    Device:    {model} | Status: {status}")
        print("─" * 70)

def resolve_player_id(target, players):
    if target.isdigit():
        idx = int(target)
        if 1 <= idx <= len(players):
            return players[idx - 1].get("id")
        else:
            print(f"Error: Index {idx} out of range (1-{len(players)})")
            sys.exit(1)
    return target

def label_player(target, name, role=None):
    players = get_players()
    pid = resolve_player_id(target, players)
    
    tags = {"name": name}
    if role:
        tags["role"] = role
    
    res = api_call(f"/players/{pid}", method="PUT", data={"app_id": APP_ID, "tags": tags})
    if res.get("success"):
        print(f"✅ Device '{pid}' successfully labeled as: '{name}'")
    else:
        print(f"❌ Failed to label device: {res}")

def delete_player(target):
    players = get_players()
    pid = resolve_player_id(target, players)
    res = api_call(f"/players/{pid}?app_id={APP_ID}", method="DELETE")
    if res.get("success"):
        print(f"🗑️ Successfully removed device '{pid}'")
    else:
        print(f"❌ Failed to delete device: {res}")

def main():
    parser = argparse.ArgumentParser(description="Manage push notification subscribers")
    parser.add_argument("--list", "-l", action="store_true", help="List all registered devices")
    parser.add_argument("--label", "-n", nargs=2, metavar=("TARGET", "NAME"), help="Label a device by index or ID")
    parser.add_argument("--role", "-r", help="Optional role tag (e.g. Admin, CR, Student)")
    parser.add_argument("--delete", "-d", metavar="TARGET", help="Delete a device by index or ID")
    
    args = parser.parse_args()
    
    if args.label:
        label_player(args.label[0], args.label[1], args.role)
    elif args.delete:
        delete_player(args.delete)
    else:
        list_players()

if __name__ == "__main__":
    main()
