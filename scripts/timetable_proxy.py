#!/usr/bin/env python3
"""
MBBS Resource Library - Secure College Timetable iCal Proxy Server
Handles CORS, in-memory caching, and shields the private Google Calendar iCal feed URL.

Usage:
  python3 scripts/timetable_proxy.py [--port 8080] [--host 0.0.0.0]

Security Note:
  The private iCal URL is read from COLLEGE_ICAL_URL environment variable or local
  .college_ical_url file. It is NEVER exposed in HTTP responses or frontend code.
"""

import os
import sys
import time
import argparse
import urllib.request
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json

PUBLIC_ICAL_URL = "https://calendar.google.com/calendar/ical/harshsaw01%40gmail.com/public/basic.ics"

# In-memory cache for the iCal feed
_cache = {
    "data": None,
    "timestamp": 0,
    "etag": None,
    "url_type": "none"
}
CACHE_TTL_SECONDS = 600  # 10 minutes cache TTL

def resolve_feed_url():
    """
    Resolves the iCal feed URL securely.
    Priority:
      1. Environment variable COLLEGE_ICAL_URL
      2. File .college_ical_url in repo root (git-ignored)
      3. Fallback to PUBLIC_ICAL_URL
    """
    env_url = os.environ.get("COLLEGE_ICAL_URL", "").strip()
    if env_url:
        return env_url, "private_env"

    repo_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    key_file = os.path.join(repo_dir, ".college_ical_url")
    if os.path.exists(key_file):
        try:
            with open(key_file, "r", encoding="utf-8") as f:
                f_url = f.read().strip()
                if f_url:
                    return f_url, "private_file"
        except Exception as e:
            print(f"[Timetable Proxy] Error reading .college_ical_url: {e}", file=sys.stderr)

    return PUBLIC_ICAL_URL, "public_fallback"

def fetch_feed(force_refresh=False):
    """
    Fetches the iCal feed from Google Calendar with in-memory caching.
    """
    now = time.time()
    if not force_refresh and _cache["data"] and (now - _cache["timestamp"] < CACHE_TTL_SECONDS):
        return _cache["data"], _cache["url_type"], False

    feed_url, url_type = resolve_feed_url()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MBBS-Timetable-Proxy/1.0"
    }

    req = urllib.request.Request(feed_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
            _cache["data"] = content
            _cache["timestamp"] = now
            _cache["url_type"] = url_type
            return content, url_type, True
    except Exception as e:
        # If fetch fails but we have stale cache, return stale cache as fallback
        if _cache["data"]:
            print(f"[Timetable Proxy] Upstream fetch failed ({e}), returning stale cache", file=sys.stderr)
            return _cache["data"], _cache["url_type"], False
        raise

class TimetableProxyHandler(SimpleHTTPRequestHandler):
    """
    HTTP Request Handler serving both the iCal proxy API and static website files.
    """

    def end_headers(self):
        # Enable CORS for all API responses
        if self.path.startswith("/api/"):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Cache-Control")
        super().end_headers()

    def do_OPTIONS(self):
        if self.path.startswith("/api/"):
            self.send_response(204)
            self.end_headers()
        else:
            self.send_response(405)
            self.end_headers()

    def do_GET(self):
        clean_path = self.path.split("?")[0]
        query = self.path.split("?")[1] if "?" in self.path else ""

        # Endpoint: /api/timetable or /api/timetable.ics
        if clean_path in ("/api/timetable", "/api/timetable.ics"):
            force = "refresh=1" in query or "force=1" in query
            try:
                data, url_type, fresh = fetch_feed(force_refresh=force)
                self.send_response(200)
                self.send_header("Content-Type", "text/calendar; charset=utf-8")
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Cache-Control", "public, max-age=300")
                self.send_header("X-Proxy-Feed-Type", "private" if "private" in url_type else "public")
                self.send_header("X-Proxy-Cache", "HIT" if not fresh else "MISS")
                self.end_headers()
                self.wfile.write(data)
                return
            except Exception as e:
                err_msg = json.dumps({"error": "Failed to fetch iCal feed", "details": str(e)}).encode("utf-8")
                self.send_response(502)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(err_msg)))
                self.end_headers()
                self.wfile.write(err_msg)
                return

        # Endpoint: /api/timetable/status
        if clean_path == "/api/timetable/status":
            feed_url, url_type = resolve_feed_url()
            status_obj = {
                "status": "healthy",
                "feed_configured": True,
                "feed_type": "private" if "private" in url_type else "public",
                "cached": _cache["data"] is not None,
                "cache_age_seconds": int(time.time() - _cache["timestamp"]) if _cache["timestamp"] else None,
                "cache_ttl_seconds": CACHE_TTL_SECONDS,
                "data_size_bytes": len(_cache["data"]) if _cache["data"] else 0
            }
            body = json.dumps(status_obj, indent=2).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(body)
            return

        # Otherwise, fall back to standard static file serving from repo root
        super().do_GET()

def main():
    parser = argparse.ArgumentParser(description="MBBS Timetable Secure Proxy Server")
    parser.add_argument("--port", type=int, default=8080, help="Port to listen on (default: 8080)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host interface (default: 0.0.0.0)")
    args = parser.parse_args()

    repo_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(repo_dir)

    _, url_type = resolve_feed_url()
    print("═" * 70)
    print("🩺 MBBS RESOURCE LIBRARY - SECURE TIMETABLE PROXY")
    print("═" * 70)
    print(f"📁 Serving static files from: {repo_dir}")
    print(f"🔒 Feed source mode:          {url_type.upper()}")
    print(f"🚀 Local Server URL:          http://localhost:{args.port}")
    print(f"📅 Timetable Page:            http://localhost:{args.port}/timetable.html")
    print(f"🌐 iCal Proxy Endpoint:       http://localhost:{args.port}/api/timetable")
    print(f"📊 Status Endpoint:           http://localhost:{args.port}/api/timetable/status")
    print("═" * 70)

    server = HTTPServer((args.host, args.port), TimetableProxyHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down timetable proxy server.")
        server.server_close()

if __name__ == "__main__":
    main()
