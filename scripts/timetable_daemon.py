#!/usr/bin/env python3
"""
MBBS Resource Library - Real-Time Timetable Sync Daemon & Watcher
Watches Google Calendar for changes, extracts verified college sessions,
minifies production assets, and automatically commits & pushes updates
to GitHub Pages so the timetable is ALWAYS 100% up-to-date.

Usage:
  python3 scripts/timetable_daemon.py --once        # Sync now (if changed)
  python3 scripts/timetable_daemon.py --force       # Force sync now
  python3 scripts/timetable_daemon.py --daemon      # Run in background loop
  python3 scripts/timetable_daemon.py --status      # Check daemon status
  python3 scripts/timetable_daemon.py --stop        # Stop running daemon
"""

import os
import sys
import time
import signal
import hashlib
import argparse
import subprocess
import urllib.request

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, REPO_DIR)

import scripts.timetable_proxy as tp
import scripts.sync_timetable as st

PID_FILE = "/data/data/com.termux/files/usr/tmp/mbbs_timetable_daemon.pid"
HASH_FILE = os.path.join(REPO_DIR, "assets", "data", ".timetable_feed_hash")
TARGET_JSON = os.path.join(REPO_DIR, "assets", "data", "timetable_college.json")

def is_online():
    """Quick check for internet connectivity."""
    try:
        req = urllib.request.Request("https://github.com", headers={"User-Agent": "MBBS-Check/1.0"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            return resp.status in (200, 301, 302)
    except Exception:
        return False

def get_feed_hash():
    """Fetches feed and returns its SHA-256 hash and raw bytes."""
    raw_data, url_type, _ = tp.fetch_feed(force_refresh=True)
    h = hashlib.sha256(raw_data).hexdigest()
    return h, len(raw_data)

def get_last_stored_hash():
    if os.path.exists(HASH_FILE):
        try:
            with open(HASH_FILE, "r", encoding="utf-8") as f:
                return f.read().strip()
        except Exception:
            pass
    return ""

def save_stored_hash(h):
    os.makedirs(os.path.dirname(HASH_FILE), exist_ok=True)
    try:
        with open(HASH_FILE, "w", encoding="utf-8") as f:
            f.write(h.strip())
    except Exception as e:
        print(f"⚠️ Warning saving feed hash: {e}")

def update_html_cache_bust():
    """Updates cache-busting version query across all HTML pages."""
    ver = int(time.time())
    pattern = r'(data\.js|app\.min\.js|app\.js|style\.min\.css|style\.css|timetable\.min\.js|timetable\.js|timetable\.min\.css|timetable\.css)(\?v=[0-9]+[a-z0-9]*)?'
    import re
    for fname in os.listdir(REPO_DIR):
        if fname.endswith(".html"):
            fpath = os.path.join(REPO_DIR, fname)
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()
                updated = re.sub(pattern, rf'\1?v={ver}', content)
                if updated != content:
                    with open(fpath, "w", encoding="utf-8") as f:
                        f.write(updated)
            except Exception as e:
                print(f"⚠️ Warning updating cache-bust in {fname}: {e}")

def run_sync_and_push(force=False):
    """Executes full sync pipeline: fetch, parse, JSON, minify, commit, push."""
    if not is_online():
        print("📡 Offline: No internet connection. Skipping sync cycle.")
        return False

    print("🔍 Checking Google Calendar for updates...")
    try:
        new_hash, data_len = get_feed_hash()
    except Exception as e:
        print(f"❌ Failed to fetch calendar feed: {e}")
        return False

    old_hash = get_last_stored_hash()
    if not force and old_hash and old_hash == new_hash:
        print("✅ Google Calendar feed is unchanged. Local timetable is up to date.")
        return True

    print(f"📥 New calendar changes detected ({data_len:,} bytes). Regenerating timetable cache...")
    try:
        st.sync_timetable()
    except Exception as e:
        print(f"❌ Error generating timetable: {e}")
        return False

    # Check git diff for assets/data/timetable_college.json
    diff_res = subprocess.run(["git", "diff", "--name-only", TARGET_JSON], cwd=REPO_DIR, capture_output=True, text=True)
    has_diff = bool(diff_res.stdout.strip())

    if not has_diff and not force:
        save_stored_hash(new_hash)
        print("✅ Timetable JSON already matches latest calendar sessions.")
        return True

    # Minify assets
    print("⚡ Minifying production scripts & stylesheets...")
    minify_script = os.path.join(REPO_DIR, "scripts", "minify.py")
    if os.path.isfile(minify_script):
        subprocess.run([sys.executable, minify_script], cwd=REPO_DIR, capture_output=True)

    # Update cache-busting strings
    update_html_cache_bust()

    # Commit and push
    print("🚀 Committing and deploying to GitHub Pages...")
    subprocess.run(["git", "add", "assets/data/timetable_college.json", "css/", "js/", "*.html", "sw.js"], cwd=REPO_DIR)
    
    commit_msg = "chore(timetable): auto-sync academic timetable with latest Google Calendar [skip ci]"
    commit_res = subprocess.run(["git", "commit", "-m", commit_msg], cwd=REPO_DIR, capture_output=True, text=True)

    # Git push with retry
    pushed = False
    for attempt in range(1, 4):
        push_res = subprocess.run(["git", "push", "origin", "main"], cwd=REPO_DIR, capture_output=True, text=True)
        if push_res.returncode == 0:
            pushed = True
            break
        print(f"🔄 Remote was updated, rebasing before push (attempt {attempt}/3)...")
        subprocess.run(["git", "pull", "--rebase", "origin", "main"], cwd=REPO_DIR, capture_output=True)

    if pushed:
        save_stored_hash(new_hash)
        print("✨ Successfully synchronized timetable with GitHub Pages!")
        print("🌐 Live site: https://harshkumarsaw.github.io/mbbs-library/timetable.html")
        return True
    else:
        print("❌ Git push failed. Will retry on next cycle.")
        return False

def get_running_pid():
    if os.path.exists(PID_FILE):
        try:
            with open(PID_FILE, "r") as f:
                pid = int(f.read().strip())
            # Check if process is still alive
            os.kill(pid, 0)
            return pid
        except (ValueError, OSError):
            try:
                os.remove(PID_FILE)
            except OSError:
                pass
    return None

def stop_daemon():
    pid = get_running_pid()
    if pid:
        try:
            os.kill(pid, signal.SIGTERM)
            print(f"🛑 Timetable sync daemon (PID {pid}) stopped.")
            if os.path.exists(PID_FILE):
                os.remove(PID_FILE)
        except OSError as e:
            print(f"Error stopping daemon: {e}")
    else:
        print("ℹ️ Timetable sync daemon is not running.")

def print_status():
    pid = get_running_pid()
    stored_hash = get_last_stored_hash()
    print("═" * 60)
    print("🩺 MBBS TIMETABLE AUTO-SYNC STATUS")
    print("═" * 60)
    if pid:
        print(f"🟢 Background Daemon:   ACTIVE (PID {pid})")
    else:
        print("⚪ Background Daemon:   INACTIVE")
    print(f"🔒 Calendar Feed Hash:   {stored_hash[:16]}..." if stored_hash else "None")
    print(f"📁 Target File:          {TARGET_JSON}")
    if os.path.exists(TARGET_JSON):
        mtime = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(os.path.getmtime(TARGET_JSON)))
        print(f"🕒 Last Local Build:     {mtime}")
    print("═" * 60)

def daemon_loop(interval_sec=300):
    pid = get_running_pid()
    if pid and pid != os.getpid():
        print(f"⚠️ Daemon already running with PID {pid}.")
        sys.exit(0)

    os.makedirs(os.path.dirname(PID_FILE), exist_ok=True)
    with open(PID_FILE, "w") as f:
        f.write(str(os.getpid()))

    def cleanup(signum, frame):
        if os.path.exists(PID_FILE):
            os.remove(PID_FILE)
        print("\n👋 Timetable sync daemon exiting cleanly.")
        sys.exit(0)

    signal.signal(signal.SIGTERM, cleanup)
    signal.signal(signal.SIGINT, cleanup)

    print(f"🚀 Started MBBS Timetable Sync Daemon (PID {os.getpid()}).")
    print(f"⏱️  Checking Google Calendar every {interval_sec} seconds ({interval_sec // 60} mins)...")

    while True:
        try:
            run_sync_and_push(force=False)
        except Exception as e:
            print(f"⚠️ Error during sync loop: {e}")
        time.sleep(interval_sec)

def main():
    parser = argparse.ArgumentParser(description="MBBS Timetable Sync Daemon & Watcher")
    parser.add_argument("--once", action="store_true", help="Sync once and exit")
    parser.add_argument("--force", action="store_true", help="Force sync and push even if hash unchanged")
    parser.add_argument("--daemon", "-d", action="store_true", help="Run as background daemon loop")
    parser.add_argument("--interval", "-i", type=int, default=300, help="Poll interval in seconds (default: 300)")
    parser.add_argument("--status", action="store_true", help="Check daemon status")
    parser.add_argument("--stop", action="store_true", help="Stop running background daemon")
    args = parser.parse_args()

    if args.stop:
        stop_daemon()
        return

    if args.status:
        print_status()
        return

    if args.daemon:
        daemon_loop(args.interval)
        return

    # Default or --once or --force:
    success = run_sync_and_push(force=args.force)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
