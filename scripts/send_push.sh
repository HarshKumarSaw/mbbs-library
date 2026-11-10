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
echo ""

PAYLOAD=$(cat <<JSON_EOF
{
  "app_id": "$ONESIGNAL_APP_ID",
  "target_channel": "push",
  "included_segments": ["Subscribed Users"],
  "headings": {"en": "$TITLE"},
  "contents": {"en": "$MESSAGE"},
  "url": "$TARGET_URL"
}
JSON_EOF
)

echo -e "🚀 Dispatching push notification via OneSignal..."
RESPONSE=$(curl -s -X POST "https://api.onesignal.com/notifications" \
  -H "Authorization: Basic $ONESIGNAL_API_KEY" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$PAYLOAD" 2>&1)

if echo "$RESPONSE" | grep -q '"id"'; then
  if echo "$RESPONSE" | grep -q 'All included players are not subscribed'; then
    echo -e "${YELLOW}ℹ️  OneSignal API acknowledged notification (0 active subscribers registered).${RESET}"
    
    # Check if Web Push has been activated in OneSignal dashboard
    CONFIG_CHECK=$(curl -s "https://api.onesignal.com/sync/$ONESIGNAL_APP_ID/web" 2>/dev/null || true)
    if echo "$CONFIG_CHECK" | grep -q "This app is not configured for web push"; then
      echo -e "${YELLOW}${BOLD}⚠️  ACTION REQUIRED IN ONESIGNAL DASHBOARD:${RESET}"
      echo -e "   Web Push platform is not yet configured for App ID: ${CYAN}$ONESIGNAL_APP_ID${RESET}"
      echo -e "   Please complete the 1-minute Web setup in your OneSignal dashboard:"
      echo -e "   1. Open: ${CYAN}https://dashboard.onesignal.com/apps/$ONESIGNAL_APP_ID/settings${RESET}"
      echo -e "   2. Under 'Platforms' (or 'Push & In-App' -> 'Web'), click 'Configure' on Web"
      echo -e "   3. Select 'Custom Code' and enter Site URL: ${CYAN}https://harshkumarsaw.github.io/mbbs-library/${RESET}"
      echo -e "   4. Click 'Save' at the bottom."
      echo -e "   Once saved, any student or phone visiting the site will be automatically registered!\n"
    else
      echo -e "   (Web push is active! Once students visit the site and allow alerts, they will receive notifications.)\n"
    fi
  else
    echo -e "${GREEN}${BOLD}✅ Notification sent successfully to all subscribers!${RESET}\n"
  fi
else
  echo -e "${YELLOW}OneSignal Response:${RESET} $RESPONSE\n"
fi
