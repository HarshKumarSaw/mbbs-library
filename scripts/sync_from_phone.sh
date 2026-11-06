#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# MBBS Resource Library - Automatic Mobile Phone Upload & Sync Script
# 1. Automatically organizes unorganized files on phone into subject folders:
#    - Anatomy/
#    - Physiology/
#    - Biochemistry/
#    - Other/
# 2. Automatically catalogs and uploads all files to GitHub Pages website.
# ==============================================================================

set -euo pipefail

# ANSI color codes
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RESET="\033[0m"

ON_STARTUP=0
if [ "${1:-}" = "--on-startup" ] || [ "${1:-}" = "-q" ]; then
    ON_STARTUP=1
fi

PHONE_DIR="/storage/emulated/0/mbbs-library"
REPO_DIR="/data/data/com.termux/files/home/mbbs-resource-library"
DATA_FILE="$REPO_DIR/js/data.js"
LOG_FILE="$REPO_DIR/PROJECT_LOG.md"

# Verify repository exists
if [ ! -d "$REPO_DIR" ]; then
    echo -e "${YELLOW}⚠️  [MBBS Library] Repository not found at $REPO_DIR${RESET}"
    exit 0
fi

# Fallback for phone directory if /storage/emulated/0 is mapped via Termux storage
if [ ! -d "$PHONE_DIR" ]; then
    if [ -d "$HOME/storage/shared/mbbs-library" ]; then
        PHONE_DIR="$HOME/storage/shared/mbbs-library"
    else
        mkdir -p "$PHONE_DIR" 2>/dev/null || true
    fi
fi

if [ ! -d "$PHONE_DIR" ]; then
    if [ "$ON_STARTUP" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  [MBBS Library] Phone folder not found. Please run 'termux-setup-storage'.${RESET}"
    fi
    exit 0
fi

# Ensure standard subject folders exist on phone
mkdir -p "$PHONE_DIR/Anatomy" "$PHONE_DIR/Physiology" "$PHONE_DIR/Biochemistry" "$PHONE_DIR/Other"

# ==============================================================================
# PHASE 1: Auto-Organize Phone Files Subject-Wise
# ==============================================================================
ORGANIZED_COUNT=0
ORGANIZED_SUMMARY=()

UNORGANIZED_FILES=()
while IFS= read -r -d '' f; do
    UNORGANIZED_FILES+=("$f")
done < <(find "$PHONE_DIR" -maxdepth 1 -type f ! -name ".*" -print0)

if [ "${#UNORGANIZED_FILES[@]}" -gt 0 ]; then
    for file in "${UNORGANIZED_FILES[@]}"; do
        base_name=$(basename "$file")
        lower_name=$(echo "$base_name" | tr '[:upper:]' '[:lower:]')

        # Detect subject for folder organization
        if [[ "$lower_name" =~ physiology|physio|cardio|heart|ecg|respirat|lung|renal|kidney|hemato|blood|nerve|reflex|endocrine ]]; then
            subj_dir="Physiology"
        elif [[ "$lower_name" =~ biochem|metabol|enzym|lipid|carbo|protein|amino|vitamin|mineral|inborn|genetic|dna|rna|urine|lft ]]; then
            subj_dir="Biochemistry"
        elif [[ "$lower_name" =~ anat|gross|histo|embryo|bone|neuroanat|cranial|plexus|muscle|organ|cadaver|dissect|thorax|abdomen|pelvis|limb|head|neck|brain ]]; then
            subj_dir="Anatomy"
        else
            subj_dir="Other"
        fi

        target_phone_dest="$PHONE_DIR/$subj_dir/$base_name"
        if [ "$file" != "$target_phone_dest" ]; then
            if [ -f "$target_phone_dest" ]; then
                if cmp -s "$file" "$target_phone_dest"; then
                    rm -f "$file"
                else
                    mv "$file" "$PHONE_DIR/$subj_dir/${base_name%.*}_$(date +%s).${base_name##*.}"
                fi
            else
                mv "$file" "$target_phone_dest"
            fi
            ORGANIZED_COUNT=$((ORGANIZED_COUNT + 1))
            ORGANIZED_SUMMARY+=("$base_name ➔ $subj_dir/")
        fi
    done
fi

if [ "$ORGANIZED_COUNT" -gt 0 ]; then
    echo -e "${CYAN}📁 [MBBS Library] Organized $ORGANIZED_COUNT file(s) into subject folders on phone:${RESET}"
    for item in "${ORGANIZED_SUMMARY[@]}"; do
        echo -e "   ${GREEN}✔${RESET} $item"
    done
fi

# ==============================================================================
# Helper Detection Functions
# ==============================================================================
detect_subject() {
    local path_lower="$1"
    if [[ "$path_lower" =~ /physiology/|physiology|physio|cardio|heart|ecg|respirat|lung|renal|kidney|hemato|blood|nerve|reflex|endocrine ]]; then
        echo "physiology"
    elif [[ "$path_lower" =~ /biochemistry/|biochem|metabol|enzym|lipid|carbo|protein|amino|vitamin|mineral|inborn|genetic|dna|rna|urine|lft ]]; then
        echo "biochemistry"
    else
        echo "anatomy"
    fi
}

detect_category() {
    local path_lower="$1"
    if [[ "$path_lower" =~ note|lecture|slide|theory|summary|class|concept|review|handout ]]; then
        echo "notes"
    elif [[ "$path_lower" =~ assign|case|problem|homework|worksheet|task|vignette ]]; then
        echo "assignments"
    elif [[ "$path_lower" =~ sdl|self|competency|directed ]]; then
        echo "sdls"
    elif [[ "$path_lower" =~ pract|lab|manual|spotter|dissect|diagram|sketch|specimen|histology_slide|chart ]]; then
        echo "practicals"
    else
        echo "other"
    fi
}

format_file_size() {
    local bytes="$1"
    if [ "$bytes" -ge 1048576 ]; then
        awk "BEGIN {printf \"%.1f MB\", $bytes/1048576}"
    elif [ "$bytes" -ge 1024 ]; then
        awk "BEGIN {printf \"%.0f KB\", $bytes/1024}"
    else
        echo "${bytes} B"
    fi
}

format_title() {
    local raw="$1"
    echo "$raw" | sed -E 's/[_\-]+/ /g; s/\.[^.]+$//; s/\s+/ /g; s/^\s+|\s+$//' | awk '{
        for (i=1; i<=NF; i++) {
            $i = toupper(substr($i,1,1)) tolower(substr($i,2))
        }
        print
    }'
}

format_safe_filename() {
    local base="$1"
    local ext="${base##*.}"
    local name_no_ext="${base%.*}"
    local safe
    safe=$(echo "$name_no_ext" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9._-' '_' | sed 's/__*/_/g; s/^_//; s/_$//')
    echo "${safe}.${ext,,}"
}

# ==============================================================================
# PHASE 2: Scan All Organized Files and Sync to Website
# ==============================================================================
ALL_FILES=()
while IFS= read -r -d '' f; do
    ALL_FILES+=("$f")
done < <(find "$PHONE_DIR" -type f ! -name ".*" -print0)

TOTAL_PHONE_FILES=${#ALL_FILES[@]}

if [ "$TOTAL_PHONE_FILES" -eq 0 ]; then
    if [ "$ON_STARTUP" -eq 0 ]; then
        echo -e "${CYAN}ℹ️  [MBBS Library] No files in phone folder ($PHONE_DIR).${RESET}"
    fi
    exit 0
fi

NEW_FILES_PROCESSED=0
PROCESSED_NAMES=()
TMP_ENTRIES="${TMPDIR:-/data/data/com.termux/files/usr/tmp}/mbbs_new_entries_$$.tmp"
rm -f "$TMP_ENTRIES"
touch "$TMP_ENTRIES"

for file in "${ALL_FILES[@]}"; do
    base_name=$(basename "$file")
    rel_path="${file#$PHONE_DIR/}"
    lower_path=$(echo "$rel_path" | tr '[:upper:]' '[:lower:]')

    subject=$(detect_subject "$lower_path")
    category=$(detect_category "$lower_path")

    safe_filename=$(format_safe_filename "$base_name")
    target_rel_url="assets/docs/$subject/$safe_filename"
    target_abs_path="$REPO_DIR/$target_rel_url"
    target_dir=$(dirname "$target_abs_path")

    mkdir -p "$target_dir"

    file_copied=0
    # Check if physical file exists and is identical
    if [ ! -f "$target_abs_path" ] || ! cmp -s "$file" "$target_abs_path"; then
        cp -p "$file" "$target_abs_path"
        file_copied=1
    fi

    # Check if cataloged in js/data.js
    if ! grep -q "$target_rel_url" "$DATA_FILE"; then
        title=$(format_title "$base_name")
        file_bytes=$(wc -c < "$file")
        file_size=$(format_file_size "$file_bytes")
        current_date=$(date +"%b %Y")
        unique_id="user-${subject:0:4}-${safe_filename%.*}-$(date +%s | tail -c 5)"

        subj_display=$(awk "BEGIN {print toupper(substr(\"$subject\",1,1)) tolower(substr(\"$subject\",2))}")
        cat_display=$(awk "BEGIN {print toupper(substr(\"$category\",1,1)) tolower(substr(\"$category\",2))}")

        cat << EOF >> "$TMP_ENTRIES"
  {
    id: "$unique_id",
    title: "$title",
    subject: "$subject",
    category: "$category",
    code: "CBME Mobile",
    description: "Uploaded document: $base_name. Reference study material.",
    tags: ["$subj_display", "$cat_display", "Mobile Upload"],
    fileUrl: "$target_rel_url",
    fileSize: "$file_size",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "$current_date",
    year: "1st Year MBBS"
  },
EOF
        NEW_FILES_PROCESSED=$((NEW_FILES_PROCESSED + 1))
        PROCESSED_NAMES+=("$base_name ($subj_display / $cat_display)")
    elif [ "$file_copied" -eq 1 ]; then
        NEW_FILES_PROCESSED=$((NEW_FILES_PROCESSED + 1))
        PROCESSED_NAMES+=("$base_name [updated file]")
    fi
done

# If there are new entries to insert into js/data.js
if [ -s "$TMP_ENTRIES" ]; then
    ENTRIES_CONTENT=$(cat "$TMP_ENTRIES")
    awk -v entries="$ENTRIES_CONTENT" '
    /\/\/ __AUTO_RESOURCES_START__/ {
        print
        print entries
        next
    }
    { print }
    ' "$DATA_FILE" > "$DATA_FILE.tmp"
    mv "$DATA_FILE.tmp" "$DATA_FILE"
fi
rm -f "$TMP_ENTRIES"

# Check git status for changes
cd "$REPO_DIR"
CHANGES=$(git status --porcelain)

if [ -z "$CHANGES" ]; then
    if [ "$ON_STARTUP" -eq 1 ]; then
        if [ "$ORGANIZED_COUNT" -eq 0 ]; then
            echo -e "${GREEN}📚 MBBS Library:${RESET} in sync with phone folder ($TOTAL_PHONE_FILES files across subject folders)."
        fi
    else
        echo -e "${GREEN}✨ [MBBS Library] All $TOTAL_PHONE_FILES files on phone are organized and synced to website!${RESET}"
    fi
    exit 0
fi

# Print banner for detected new uploads
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════${RESET}"
echo -e "${CYAN}${BOLD}📥 [MBBS Library] Uploading $NEW_FILES_PROCESSED new/updated file(s) to website!${RESET}"
for item in "${PROCESSED_NAMES[@]}"; do
    echo -e "   ${GREEN}➜${RESET} $item"
done
echo -e "${BLUE}───────────────────────────────────────────────────────────${RESET}"

# Stage all changes
git add .

COMMIT_MSG="feat: auto-upload from phone: ${PROCESSED_NAMES[0]:-materials}"
if [ "${#PROCESSED_NAMES[@]}" -gt 1 ]; then
    COMMIT_MSG="feat: auto-upload ${#PROCESSED_NAMES[@]} files from phone (${PROCESSED_NAMES[0]}, ...)"
fi
git commit -m "$COMMIT_MSG" >/dev/null

# Append to PROJECT_LOG.md
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
cat << EOF >> "$LOG_FILE"

### Auto-Sync & Organization: $TIMESTAMP
- **Phone Organization**: Organized $ORGANIZED_COUNT unorganized files into subject folders
- **New Files Uploaded to Site**: $NEW_FILES_PROCESSED
EOF
for item in "${PROCESSED_NAMES[@]}"; do
    echo "- $item" >> "$LOG_FILE"
done

git add "$LOG_FILE"
git commit --amend --no-edit >/dev/null 2>&1 || true

# Test internet connectivity before pushing
echo -e "🚀 ${BOLD}Connecting to GitHub...${RESET}"
if curl -s --connect-timeout 4 -I https://github.com >/dev/null 2>&1; then
    if git push origin main >/dev/null 2>&1; then
        echo -e "${GREEN}${BOLD}✅ Successfully uploaded to GitHub Pages!${RESET}"
        echo -e "   🌐 Live site: ${CYAN}https://harshkumarsaw.github.io/mbbs-library/${RESET}"
    else
        echo -e "${YELLOW}⚠️  Git push failed. Changes are saved locally and will push next time.${RESET}"
    fi
else
    echo -e "${YELLOW}⚠️  Offline mode: Changes saved locally in Git. Will upload automatically when connected!${RESET}"
fi
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════${RESET}"
