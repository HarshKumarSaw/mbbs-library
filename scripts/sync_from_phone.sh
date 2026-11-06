#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# MBBS Resource Library - Dynamic Mobile Phone Auto-Sync & Organize Engine
# 1. Supports ANY custom folders/subfolders created on your phone!
#    Example: Physiology/Project/ -> creates 'Project' category automatically!
# 2. Automatically organizes root files into appropriate subject folders.
# 3. Catalogs new files and publishes live to GitHub Pages.
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

# Normalize string to safe identifier
to_safe_id() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '_' | sed 's/__*/_/g; s/^_//; s/_$//'
}

# Format display label (Title Case with spaces)
format_display() {
    echo "$1" | sed -E 's/[_\-]+/ /g; s/\.[^.]+$//; s/\s+/ /g; s/^\s+|\s+$//' | awk '{
        for (i=1; i<=NF; i++) {
            $i = toupper(substr($i,1,1)) tolower(substr($i,2))
        }
        print
    }'
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

format_safe_filename() {
    local base="$1"
    local ext="${base##*.}"
    local name_no_ext="${base%.*}"
    local safe
    safe=$(echo "$name_no_ext" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9._-' '_' | sed 's/__*/_/g; s/^_//; s/_$//')
    echo "${safe}.${ext,,}"
}

detect_category_from_name() {
    local lower="$1"
    if [[ "$lower" =~ sdl ]]; then
        echo "sdls"
    elif [[ "$lower" =~ note|lecture|slide|theory|summary|class|concept|review|handout ]]; then
        echo "notes"
    elif [[ "$lower" =~ assign|case|problem|homework|worksheet|task|vignette ]]; then
        echo "assignments"
    elif [[ "$lower" =~ pract|lab|manual|spotter|dissect|diagram|sketch|specimen|histology|slide|chart ]]; then
        echo "practicals"
    else
        echo "other"
    fi
}

# ==============================================================================
# PHASE 1: Auto-Organize Phone Files in Root into Subject Folders
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

        # 1. Anatomy subdisciplines
        if [[ "$lower_name" =~ histo ]]; then
            subj_dir="Anatomy/Histology"
        elif [[ "$lower_name" =~ embryo ]]; then
            subj_dir="Anatomy/Embryology"
        elif [[ "$lower_name" =~ neuroanat ]]; then
            subj_dir="Anatomy/Neuroanatomy"
        elif [[ "$lower_name" =~ genetic ]]; then
            subj_dir="Anatomy/Genetics"
        elif [[ "$lower_name" =~ gross ]]; then
            subj_dir="Anatomy/Gross Anatomy"
        # 2. CBME Professional Modules
        elif [[ "$lower_name" =~ aetcom|ethics|communication ]]; then
            subj_dir="AETCOM"
        elif [[ "$lower_name" =~ ece|clinical_exposure|early_clinical ]]; then
            subj_dir="ECE (Early Clinical Exposure)"
        elif [[ "$lower_name" =~ community|psm|epidemiol|field_visit|family_adopt ]]; then
            subj_dir="Community Medicine"
        elif [[ "$lower_name" =~ foundation|orientation|bls|first_aid ]]; then
            subj_dir="Foundation Course"
        # 3. Physiology Subdisciplines
        elif [[ "$lower_name" =~ hemato|blood ]]; then
            subj_dir="Physiology/Hematology"
        elif [[ "$lower_name" =~ cardio|heart|ecg ]]; then
            subj_dir="Physiology/Cardiovascular"
        elif [[ "$lower_name" =~ respirat|lung ]]; then
            subj_dir="Physiology/Respiratory"
        elif [[ "$lower_name" =~ renal|kidney ]]; then
            subj_dir="Physiology/Renal"
        elif [[ "$lower_name" =~ git|gastro|intest ]]; then
            subj_dir="Physiology/Gastrointestinal"
        elif [[ "$lower_name" =~ endocrin|hormon|reproduct ]]; then
            subj_dir="Physiology/Endocrine & Reproduction"
        elif [[ "$lower_name" =~ neurophysio|reflex|cns ]]; then
            subj_dir="Physiology/Neurophysiology"
        elif [[ "$lower_name" =~ physiology|physio ]]; then
            subj_dir="Physiology"
        # 4. Biochemistry Subdisciplines
        elif [[ "$lower_name" =~ enzym|protein|carbo|lipid ]]; then
            subj_dir="Biochemistry/Biomolecules & Enzymes"
        elif [[ "$lower_name" =~ metabol|glycolys|tca|krebs ]]; then
            subj_dir="Biochemistry/Metabolism"
        elif [[ "$lower_name" =~ lft|rft|kft|urine|diagnostic|clinical_chem ]]; then
            subj_dir="Biochemistry/Clinical Biochemistry"
        elif [[ "$lower_name" =~ dna|rna|molecular_bio|pcr ]]; then
            subj_dir="Biochemistry/Molecular Biology"
        elif [[ "$lower_name" =~ vitamin|nutrition|mineral ]]; then
            subj_dir="Biochemistry/Nutrition & Vitamins"
        elif [[ "$lower_name" =~ biochem|chem ]]; then
            subj_dir="Biochemistry"
        # 5. General Anatomy Keywords
        elif [[ "$lower_name" =~ anat|bone|cranial|plexus|muscle|organ|cadaver|dissect|thorax|abdomen|pelvis|limb|head|neck|brain ]]; then
            subj_dir="Anatomy"
        else
            subj_dir="Other"
        fi

        target_phone_dest="$PHONE_DIR/$subj_dir/$base_name"
        mkdir -p "$(dirname "$target_phone_dest")"
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
# PHASE 2: Dynamic Scan of All Folders & Auto-Sync to Website
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

    # Split rel_path into directory hierarchy
    IFS='/' read -r -a path_parts <<< "$rel_path"
    num_parts=${#path_parts[@]}

    # Top folder is the Subject
    top_folder="${path_parts[0]}"
    top_lower=$(echo "$top_folder" | tr '[:upper:]' '[:lower:]')

    if [[ "$top_lower" =~ anatomy|anat ]]; then
        subject="anatomy"
        subj_display="Anatomy"
    elif [[ "$top_lower" =~ physiology|physio ]]; then
        subject="physiology"
        subj_display="Physiology"
    elif [[ "$top_lower" =~ biochemistry|biochem ]]; then
        subject="biochemistry"
        subj_display="Biochemistry"
    elif [[ "$top_lower" =~ community ]]; then
        subject="community_medicine"
        subj_display="Community Medicine"
    elif [[ "$top_lower" =~ aetcom ]]; then
        subject="aetcom"
        subj_display="AETCOM"
    elif [[ "$top_lower" =~ ece ]]; then
        subject="ece"
        subj_display="ECE"
    elif [[ "$top_lower" =~ foundation ]]; then
        subject="foundation"
        subj_display="Foundation Course"
    else
        subject=$(to_safe_id "$top_folder")
        subj_display=$(format_display "$top_folder")
    fi

    # Subfolder determines Category dynamically!
    sub_folder=""
    category=""
    cat_display=""

    if [ "$num_parts" -ge 3 ]; then
        # File is inside e.g. "Physiology/Project/file.pdf"
        sub_folder="${path_parts[1]}"
        sub_lower=$(echo "$sub_folder" | tr '[:upper:]' '[:lower:]')

        if [[ "$sub_lower" =~ ^note ]]; then
            category="notes"
            cat_display="Notes"
        elif [[ "$sub_lower" =~ ^assign ]]; then
            category="assignments"
            cat_display="Assignments"
        elif [[ "$sub_lower" =~ ^sdl ]]; then
            category="sdls"
            cat_display="SDLs"
        elif [[ "$sub_lower" =~ ^pract ]]; then
            category="practicals"
            cat_display="Practicals"
        else
            # Dynamic custom category from ANY folder created by user!
            category=$(to_safe_id "$sub_folder")
            cat_display=$(format_display "$sub_folder")
        fi
    else
        # Directly under Subject folder: infer from filename
        category=$(detect_category_from_name "$base_name")
        cat_display=$(format_display "$category")
    fi

    safe_filename=$(format_safe_filename "$base_name")

    # Target relative path preserving subfolder structure
    if [ -n "$sub_folder" ]; then
        target_rel_url="assets/docs/$subject/$(to_safe_id "$sub_folder")/$safe_filename"
    else
        target_rel_url="assets/docs/$subject/$safe_filename"
    fi

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
        title=$(format_display "$base_name")
        file_bytes=$(wc -c < "$file")
        file_size=$(format_file_size "$file_bytes")
        current_date=$(date +"%b %Y")
        unique_id="user-${subject:0:4}-${safe_filename%.*}-$(date +%s | tail -c 5)"

        # Tags builder
        tags_json="\"$subj_display\""
        if [ -n "$cat_display" ] && [ "$cat_display" != "$subj_display" ]; then
            tags_json="$tags_json, \"$cat_display\""
        fi
        if [ "$num_parts" -ge 4 ]; then
            deep_tag=$(format_display "${path_parts[2]}")
            tags_json="$tags_json, \"$deep_tag\""
        fi
        tags_json="$tags_json, \"Mobile Upload\""

        cat << EOF >> "$TMP_ENTRIES"
  {
    id: "$unique_id",
    title: "$title",
    subject: "$subject",
    category: "$category",
    code: "$subj_display / $cat_display",
    description: "Uploaded document: $base_name. Organized under $subj_display ($cat_display).",
    tags: [$tags_json],
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
            echo -e "${GREEN}📚 MBBS Library:${RESET} in sync with phone folder ($TOTAL_PHONE_FILES files across folders)."
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

### Auto-Sync & Dynamic Folder Sync: $TIMESTAMP
- **Phone Organization**: Organized $ORGANIZED_COUNT file(s) on phone
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
