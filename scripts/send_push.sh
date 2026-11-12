#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Harsh's Library - Instant OneSignal Push Notification Sender
# Usage: ./scripts/send_push.sh "Title" "Message" [URL]
# Example: ./scripts/send_push.sh "Anatomy Exam Notes" "Johari Thorax notes uploaded!"
# ==============================================================================

set -euo pipefail

ONESIGNAL_APP_ID="54db441e-edff-4024-8e24-87bacea1d5fe"
DEFAULT_URL="https://harshkumarsaw.github.io/mbbs-library/"

# Load OneSignal API Key from environment or local key file (kept private via .gitignore)
ONESIGNAL_API_KEY="${ONESIGNAL_API_KEY:-}"
if [ -z "$ONESIGNAL_API_KEY" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  REPO_ROOT="$(dirname "$SCRIPT_DIR")"
  if [ -f "$REPO_ROOT/.onesignal_key" ]; then
    ONESIGNAL_API_KEY="$(cat "$REPO_ROOT/.onesignal_key" | tr -d ' \t\r\n')"
  elif [ -f "$HOME/.onesignal_key" ]; then
    ONESIGNAL_API_KEY="$(cat "$HOME/.onesignal_key" | tr -d ' \t\r\n')"
  fi
fi

if [ -z "$ONESIGNAL_API_KEY" ]; then
  echo "⚠️ Error: OneSignal API Key not found. Please set ONESIGNAL_API_KEY or create .onesignal_key"
  exit 1
fi

TITLE="${1:-Harsh Library: New Study Materials}"
MESSAGE="${2:-New medical study resources have been added to the library! Tap to view.}"
TARGET_URL="${3:-$DEFAULT_URL}"
ICON_URL="${4:-https://harshkumarsaw.github.io/mbbs-library/assets/icons/logo-256x256.png}"

# Colors
GREEN="\033[0;32m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
BOLD="\033[1m"
RESET="\033[0m"

echo -e "${BLUE}${BOLD}╔════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BLUE}${BOLD}║             🔔 HARSH'S LIBRARY - WEB PUSH SENDER               ║${RESET}"
echo -e "${BLUE}${BOLD}╚════════════════════════════════════════════════════════════════╝${RESET}"

echo -e "${CYAN}📢 Title:${RESET}   $TITLE"
echo -e "${CYAN}📝 Message:${RESET} $MESSAGE"
echo -e "${CYAN}🌐 URL:${RESET}     $TARGET_URL"
echo -e "${CYAN}🖼️  Icon:${RESET}    $ICON_URL"
echo ""

echo -e "🚀 Dispatching push notification via OneSignal..."

python3 -c "
import urllib.request, json, sys

api_key = sys.argv[1]
app_id = sys.argv[2]
title = sys.argv[3]
msg = sys.argv[4]
target_url = sys.argv[5]
icon_url = sys.argv[6]

active_ids = []
try:
    req_players = urllib.request.Request(
        f'https://api.onesignal.com/players?app_id={app_id}&limit=300',
        headers={'Authorization': f'Basic {api_key}'}
    )
    with urllib.request.urlopen(req_players, timeout=6) as resp:
        players = json.loads(resp.read().decode()).get('players', [])
    active_ids = [p['id'] for p in players if not p.get('invalid_identifier')]
except Exception:
    pass

payload = {
    'app_id': app_id,
    'priority': 10,
    'headings': {'en': title},
    'contents': {'en': msg},
    'url': target_url,
    'chrome_web_icon': icon_url,
    'firefox_icon': icon_url
}

if active_ids:
    payload['include_player_ids'] = active_ids
else:
    payload['included_segments'] = ['Total Subscriptions', 'Active Subscriptions']

try:
    req = urllib.request.Request(
        'https://api.onesignal.com/notifications',
        headers={
            'Authorization': f'Basic {api_key}',
            'Content-Type': 'application/json; charset=utf-8'
        },
        data=json.dumps(payload).encode('utf-8')
    )
    with urllib.request.urlopen(req, timeout=8) as resp:
        res = json.loads(resp.read().decode())
        print(f'\033[0;32m\033[1m✅ Notification sent successfully to {len(active_ids)} active device(s)! (ID: {res.get(\"id\")})\033[0m\n')
except Exception as e:
    print(f'\033[1;33mOneSignal Response:\033[0m {e}\n')
" "$ONESIGNAL_API_KEY" "$ONESIGNAL_APP_ID" "$TITLE" "$MESSAGE" "$TARGET_URL" "$ICON_URL"
