#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# MBBS Resource Library - Two-Way Auto-Sync, Version Normalization & Deletion Engine
# 
# 1. PHASE 0: Normalizes duplicates: strips (1), (2), _1, - Copy and keeps LATEST.
# 2. PHASE 1: Auto-organizes files dropped in phone root into subject folders.
# 3. PHASE 2: Deletion Sync (Phone -> Website):
#             Detects any file deleted from the phone folder, automatically deletes
#             its PDF from assets/docs/ and removes its entry from js/data.js.
# 4. PHASE 3: Upstream Sync (Phone -> Website):
#             Syncs new/updated phone files, organizes by subject/subfolder,
#             and registers in js/data.js.
# 5. PHASE 4: Downstream Sync (Website -> Phone):
#             Syncs all website materials & starter documents down to phone
#             folders so the entire MBBS library is always available offline.
# 6. PHASE 5: Manifest Management & Git Push:
#             Maintains persistent .mbbs_sync_manifest tracking phone <-> repo links,
#             commits changes to Git and pushes live to GitHub Pages.
# ==============================================================================

set -euo pipefail

# ANSI color codes
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
PURPLE="\033[0;35m"
RESET="\033[0m"

ON_STARTUP=0
if [ "${1:-}" = "--on-startup" ] || [ "${1:-}" = "-q" ]; then
    ON_STARTUP=1
fi

PHONE_DIR="/storage/emulated/0/mbbs-library"
REPO_DIR="/data/data/com.termux/files/home/mbbs-resource-library"
DATA_FILE="$REPO_DIR/js/data.js"
MANIFEST_FILE="$REPO_DIR/.mbbs_sync_manifest"
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

# Ensure core MBBS subject directories exist on phone
mkdir -p "$PHONE_DIR/Anatomy/Histology" \
         "$PHONE_DIR/Anatomy/Gross Anatomy" \
         "$PHONE_DIR/Anatomy/Embryology" \
         "$PHONE_DIR/Anatomy/Neuroanatomy" \
         "$PHONE_DIR/Physiology/Hematology" \
         "$PHONE_DIR/Physiology/Cardiovascular" \
         "$PHONE_DIR/Physiology/Respiratory" \
         "$PHONE_DIR/Physiology/Renal" \
         "$PHONE_DIR/Physiology/Neurophysiology" \
         "$PHONE_DIR/Biochemistry/Clinical Biochemistry" \
         "$PHONE_DIR/Biochemistry/Metabolism" \
         "$PHONE_DIR/Biochemistry/Molecular Biology" \
         "$PHONE_DIR/Community Medicine" \
         "$PHONE_DIR/AETCOM" \
         "$PHONE_DIR/ECE (Early Clinical Exposure)" \
         "$PHONE_DIR/Foundation Course" \
         "$PHONE_DIR/Other" 2>/dev/null || true

# Normalize string to safe identifier
to_safe_id() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '_' | sed 's/__*/_/g; s/^_//; s/_$//'
}

# Clean version duplicate suffix like (1), (2), _1, - Copy
get_canonical_name() {
    local full_name="$1"
    local ext="${full_name##*.}"
    local name_no_ext="${full_name%.*}"

    local cleaned="$name_no_ext"
    local prev=""
    while [ "$cleaned" != "$prev" ]; do
        prev="$cleaned"
        cleaned=$(echo "$cleaned" | sed -E \
            -e 's/[[:space:]]*\([0-9]+\)[[:space:]]*$//' \
            -e 's/_[0-9]+$//' \
            -e 's/[[:space:]]*-[[:space:]]*[Cc]opy[[:space:]]*$//')
    done

    echo "${cleaned}.${ext}"
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

get_phone_subject_name() {
    local subj="$1"
    local lower
    lower=$(echo "$subj" | tr '[:upper:]' '[:lower:]')
    if [[ "$lower" =~ anat ]]; then
        echo "Anatomy"
    elif [[ "$lower" =~ physio ]]; then
        echo "Physiology"
    elif [[ "$lower" =~ biochem ]]; then
        echo "Biochemistry"
    elif [[ "$lower" =~ community ]]; then
        echo "Community Medicine"
    elif [[ "$lower" =~ aetcom ]]; then
        echo "AETCOM"
    elif [[ "$lower" =~ ece ]]; then
        echo "ECE (Early Clinical Exposure)"
    elif [[ "$lower" =~ foundation ]]; then
        echo "Foundation Course"
    else
        format_display "$subj"
    fi
}

get_repo_subject_id() {
    local top="$1"
    local top_l
    top_l=$(echo "$top" | tr '[:upper:]' '[:lower:]')
    if [[ "$top_l" =~ anatomy|anat ]]; then
        echo "anatomy"
    elif [[ "$top_l" =~ physiology|physio ]]; then
        echo "physiology"
    elif [[ "$top_l" =~ biochemistry|biochem ]]; then
        echo "biochemistry"
    elif [[ "$top_l" =~ community ]]; then
        echo "community_medicine"
    elif [[ "$top_l" =~ aetcom ]]; then
        echo "aetcom"
    elif [[ "$top_l" =~ ece ]]; then
        echo "ece"
    elif [[ "$top_l" =~ foundation ]]; then
        echo "foundation"
    else
        to_safe_id "$top"
    fi
}

phone_to_repo_url() {
    local rel_path="$1"
    IFS='/' read -r -a parts <<< "$rel_path"
    local num=${#parts[@]}
    local subj
    subj=$(get_repo_subject_id "${parts[0]}")

    if [ "$num" -ge 3 ]; then
        local sub
        sub=$(to_safe_id "${parts[1]}")
        local fname
        fname=$(format_safe_filename "${parts[2]}")
        echo "assets/docs/$subj/$sub/$fname"
    elif [ "$num" -eq 2 ]; then
        local fname
        fname=$(format_safe_filename "${parts[1]}")
        echo "assets/docs/$subj/$fname"
    else
        local fname
        fname=$(format_safe_filename "${parts[0]}")
        echo "assets/docs/other/$fname"
    fi
}

repo_to_phone_path() {
    local repo_url="$1"
    local doc_path="${repo_url#assets/docs/}"
    IFS='/' read -r -a parts <<< "$doc_path"
    local num=${#parts[@]}
    local top="${parts[0]}"
    local phone_subj
    phone_subj=$(get_phone_subject_name "$top")
    local raw_base
    raw_base=$(basename "$repo_url")
    local phone_fname
    phone_fname="$(format_display "$raw_base").pdf"
    if [ "$num" -ge 3 ]; then
        local sub="${parts[1]}"
        local phone_sub
        phone_sub=$(format_display "$sub")
        echo "$phone_subj/$phone_sub/$phone_fname"
    else
        echo "$phone_subj/$phone_fname"
    fi
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

remove_resource_by_url() {
    local target_url="$1"
    local tmp_data="${DATA_FILE}.tmp.$$"
    awk -v target="$target_url" '
    BEGIN { in_obj = 0; obj_buf = "" }
    /^[[:space:]]*\{/ {
        in_obj = 1
        obj_buf = $0 "\n"
        has_target = 0
        next
    }
    in_obj {
        obj_buf = obj_buf $0 "\n"
        if (index($0, target) > 0) {
            has_target = 1
        }
        if ($0 ~ /^[[:space:]]*\},?[[:space:]]*$/) {
            if (!has_target) {
                printf "%s", obj_buf
            }
            in_obj = 0
            obj_buf = ""
        }
        next
    }
    { print }
    ' "$DATA_FILE" > "$tmp_data" && mv "$tmp_data" "$DATA_FILE"
}

# ==============================================================================
# PHASE 0: Version Normalization & Deduplication (Strip (1), (2) & Keep Latest)
# ==============================================================================
DEDUP_FILES=()
while IFS= read -r -d '' f; do
    DEDUP_FILES+=("$f")
done < <(find "$PHONE_DIR" -type f ! -name ".*" -print0)

DEDUP_SUMMARY=()
for file in "${DEDUP_FILES[@]}"; do
    [ -f "$file" ] || continue
    base_name=$(basename "$file")
    dir_name=$(dirname "$file")
    canonical_name=$(get_canonical_name "$base_name")

    if [ "$base_name" != "$canonical_name" ]; then
        target_path="$dir_name/$canonical_name"
        if [ ! -f "$target_path" ]; then
            existing_match=$(find "$PHONE_DIR" -type f -name "$canonical_name" | head -n 1)
            if [ -n "$existing_match" ]; then
                target_path="$existing_match"
            fi
        fi

        if [ -f "$target_path" ] && [ "$file" != "$target_path" ]; then
            file_mtime=$(stat -c %Y "$file" 2>/dev/null || echo 0)
            target_mtime=$(stat -c %Y "$target_path" 2>/dev/null || echo 0)

            if [ "$file_mtime" -ge "$target_mtime" ]; then
                mv -f "$file" "$target_path"
                DEDUP_SUMMARY+=("Updated $canonical_name (kept newer version, replaced $base_name)")
            else
                rm -f "$file"
                DEDUP_SUMMARY+=("Removed older duplicate $base_name (kept $canonical_name)")
            fi
        else
            mv "$file" "$target_path"
            DEDUP_SUMMARY+=("Renamed $base_name ➔ $canonical_name")
        fi
    fi
done

if [ "${#DEDUP_SUMMARY[@]}" -gt 0 ]; then
    echo -e "${CYAN}🔄 [MBBS Library] Resolved ${#DEDUP_SUMMARY[@]} file version(s) / duplicate(s):${RESET}"
    for item in "${DEDUP_SUMMARY[@]}"; do
        echo -e "   ${GREEN}✔${RESET} $item"
    done
fi

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
                    file_mtime=$(stat -c %Y "$file" 2>/dev/null || echo 0)
                    target_mtime=$(stat -c %Y "$target_phone_dest" 2>/dev/null || echo 0)
                    if [ "$file_mtime" -ge "$target_mtime" ]; then
                        mv -f "$file" "$target_phone_dest"
                    else
                        rm -f "$file"
                    fi
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
# PHASE 2: Deletion Synchronization (Phone -> Website)
# Detects any file deleted from the phone and cleans it from assets/docs/ & js/data.js
# ==============================================================================
TMP_MANIFEST="${TMPDIR:-/data/data/com.termux/files/usr/tmp}/mbbs_manifest_$$.tmp"
rm -f "$TMP_MANIFEST"
touch "$TMP_MANIFEST"

DELETED_SUMMARY=()

# Bootstrap manifest if missing
if [ ! -f "$MANIFEST_FILE" ]; then
    touch "$MANIFEST_FILE"
    auto_urls=$(awk -F'"' '/fileUrl:[[:space:]]*"/ { print $2 }' "$DATA_FILE")
    for a_url in $auto_urls; do
        is_mobile=$(awk -v url="$a_url" '
            $0 ~ url { found=1 }
            found && /tags:/ && /Mobile Upload/ { print "yes"; exit }
            found && /^\s*\},?\s*$/ { exit }
        ' "$DATA_FILE" || true)

        if [ "$is_mobile" = "yes" ]; then
            # Verify if an existing phone file maps to this URL
            found_rel=""
            while IFS= read -r -d '' pf; do
                rel_candidate="${pf#$PHONE_DIR/}"
                if [ "$(phone_to_repo_url "$rel_candidate")" = "$a_url" ]; then
                    found_rel="$rel_candidate"
                    break
                fi
            done < <(find "$PHONE_DIR" -type f ! -name ".*" -print0)

            if [ -n "$found_rel" ]; then
                echo "$found_rel|$a_url" >> "$MANIFEST_FILE"
            else
                # DELETED ON PHONE! Remove from repo and js/data.js
                if [ -f "$REPO_DIR/$a_url" ]; then
                    rm -f "$REPO_DIR/$a_url"
                fi
                remove_resource_by_url "$a_url"
                DELETED_SUMMARY+=("$(basename "$a_url") [deleted from phone]")
            fi
        fi
    done
fi

# Scan existing manifest for deletions
if [ -s "$MANIFEST_FILE" ]; then
    while IFS='|' read -r phone_rel repo_url || [ -n "$phone_rel" ]; do
        [ -n "$phone_rel" ] || continue
        [ -n "$repo_url" ] || continue

        phone_full="$PHONE_DIR/$phone_rel"
        if [ -f "$phone_full" ]; then
            echo "$phone_rel|$repo_url" >> "$TMP_MANIFEST"
        else
            # File missing at mapped path. Check if it was moved to another subfolder.
            base_fname=$(basename "$phone_rel")
            moved_path=""
            while IFS= read -r -d '' pf; do
                if [ "$(basename "$pf")" = "$base_fname" ] || [ "$(format_safe_filename "$(basename "$pf")")" = "$(format_safe_filename "$base_fname")" ]; then
                    moved_path="$pf"
                    break
                fi
            done < <(find "$PHONE_DIR" -type f ! -name ".*" -print0)

            if [ -n "$moved_path" ]; then
                new_rel="${moved_path#$PHONE_DIR/}"
                new_repo_url=$(phone_to_repo_url "$new_rel")
                if [ "$new_repo_url" != "$repo_url" ]; then
                    if [ -f "$REPO_DIR/$repo_url" ]; then
                        rm -f "$REPO_DIR/$repo_url"
                    fi
                    remove_resource_by_url "$repo_url"
                fi
                echo "$new_rel|$new_repo_url" >> "$TMP_MANIFEST"
            else
                # FILE WAS DELETED BY USER ON PHONE!
                if [ -f "$REPO_DIR/$repo_url" ]; then
                    rm -f "$REPO_DIR/$repo_url"
                fi
                remove_resource_by_url "$repo_url"
                DELETED_SUMMARY+=("$phone_rel (deleted from phone)")
            fi
        fi
    done < "$MANIFEST_FILE"
fi

if [ "${#DELETED_SUMMARY[@]}" -gt 0 ]; then
    echo -e "${RED}${BOLD}🗑️  [MBBS Library] Synced ${#DELETED_SUMMARY[@]} deletion(s) from phone:${RESET}"
    for item in "${DELETED_SUMMARY[@]}"; do
        echo -e "   ${YELLOW}✖${RESET} $item"
    done
fi

# ==============================================================================
# PHASE 3: Upstream Sync (Phone -> Website)
# ==============================================================================
ALL_PHONE_FILES=()
while IFS= read -r -d '' f; do
    ALL_PHONE_FILES+=("$f")
done < <(find "$PHONE_DIR" -type f ! -name ".*" -print0)

NEW_FILES_PROCESSED=0
PROCESSED_NAMES=()
TMP_ENTRIES="${TMPDIR:-/data/data/com.termux/files/usr/tmp}/mbbs_new_entries_$$.tmp"
rm -f "$TMP_ENTRIES"
touch "$TMP_ENTRIES"

for file in "${ALL_PHONE_FILES[@]}"; do
    base_name=$(basename "$file")
    rel_path="${file#$PHONE_DIR/}"

    # Calculate target repo url
    target_rel_url=$(phone_to_repo_url "$rel_path")
    target_abs_path="$REPO_DIR/$target_rel_url"
    target_dir=$(dirname "$target_abs_path")
    mkdir -p "$target_dir"

    file_copied=0
    if [ ! -f "$target_abs_path" ] || ! cmp -s "$file" "$target_abs_path"; then
        cp -p "$file" "$target_abs_path"
        file_copied=1
    fi

    # Record in active manifest
    echo "$rel_path|$target_rel_url" >> "$TMP_MANIFEST"

    # Check if cataloged in js/data.js
    if ! grep -q "$target_rel_url" "$DATA_FILE"; then
        IFS='/' read -r -a path_parts <<< "$rel_path"
        num_parts=${#path_parts[@]}
        top_folder="${path_parts[0]}"
        subject=$(get_repo_subject_id "$top_folder")
        subj_display=$(get_phone_subject_name "$subject")

        category=""
        cat_display=""
        if [ "$num_parts" -ge 3 ]; then
            sub_folder="${path_parts[1]}"
            sub_lower=$(echo "$sub_folder" | tr '[:upper:]' '[:lower:]')
            if [[ "$sub_lower" =~ ^note ]]; then category="notes"; cat_display="Notes"
            elif [[ "$sub_lower" =~ ^assign ]]; then category="assignments"; cat_display="Assignments"
            elif [[ "$sub_lower" =~ ^sdl ]]; then category="sdls"; cat_display="SDLs"
            elif [[ "$sub_lower" =~ ^pract ]]; then category="practicals"; cat_display="Practicals"
            else category=$(to_safe_id "$sub_folder"); cat_display=$(format_display "$sub_folder")
            fi
        else
            category=$(detect_category_from_name "$base_name")
            cat_display=$(format_display "$category")
        fi

        safe_filename=$(format_safe_filename "$base_name")
        title=$(format_display "$base_name")
        file_bytes=$(wc -c < "$file")
        file_size=$(format_file_size "$file_bytes")
        current_date=$(date +"%b %Y")
        unique_id="user-${subject:0:4}-${safe_filename%.*}-$(date +%s | tail -c 5)"

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
        file_bytes=$(wc -c < "$file")
        new_size=$(format_file_size "$file_bytes")
        awk -v url="$target_rel_url" -v size="$new_size" '
        $0 ~ "fileUrl: \"" url "\"" {
            print
            getline
            print "    fileSize: \"" size "\","
            next
        }
        { print }
        ' "$DATA_FILE" > "$DATA_FILE.tmp" && mv "$DATA_FILE.tmp" "$DATA_FILE"

        NEW_FILES_PROCESSED=$((NEW_FILES_PROCESSED + 1))
        PROCESSED_NAMES+=("$base_name [updated with latest version]")
    fi
done

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

# ==============================================================================
# PHASE 4: Downstream Sync (Website -> Phone)
# Ensures all website materials are also present on the phone for offline use!
# ==============================================================================
SEED_SUMMARY=()
ACTIVE_WEBSITE_URLS=$(awk -F'"' '/fileUrl:[[:space:]]*"/ { print $2 }' "$DATA_FILE")

for w_url in $ACTIVE_WEBSITE_URLS; do
    repo_physical="$REPO_DIR/$w_url"
    [ -f "$repo_physical" ] || continue

    # Check if already present in manifest
    if grep -q "|$w_url$" "$TMP_MANIFEST"; then
        continue
    fi

    # Determine phone path
    phone_rel_dest=$(repo_to_phone_path "$w_url")
    phone_target_file="$PHONE_DIR/$phone_rel_dest"

    if [ -f "$phone_target_file" ]; then
        echo "$phone_rel_dest|$w_url" >> "$TMP_MANIFEST"
        continue
    fi

    # Check if file with matching safe name exists anywhere in that subject
    w_base=$(basename "$w_url")
    found_on_phone=""
    while IFS= read -r -d '' pf; do
        if [ "$(format_safe_filename "$(basename "$pf")")" = "$w_base" ]; then
            found_on_phone="$pf"
            break
        fi
    done < <(find "$PHONE_DIR" -type f ! -name ".*" -print0)

    if [ -n "$found_on_phone" ]; then
        rel_phone="${found_on_phone#$PHONE_DIR/}"
        echo "$rel_phone|$w_url" >> "$TMP_MANIFEST"
        continue
    fi

    # Seed down to phone
    mkdir -p "$(dirname "$phone_target_file")"
    cp -p "$repo_physical" "$phone_target_file"
    echo "$phone_rel_dest|$w_url" >> "$TMP_MANIFEST"
    SEED_SUMMARY+=("$(basename "$phone_rel_dest") ➔ $(dirname "$phone_rel_dest")/")
done

if [ "${#SEED_SUMMARY[@]}" -gt 0 ]; then
    echo -e "${PURPLE}${BOLD}📲 [MBBS Library] Synced ${#SEED_SUMMARY[@]} website resource(s) down to phone for offline reading:${RESET}"
    for item in "${SEED_SUMMARY[@]}"; do
        echo -e "   ${GREEN}✔${RESET} $item"
    done
fi

# ==============================================================================
# PHASE 5: Manifest Finalization & Cleanup
# ==============================================================================
if [ -f "$TMP_MANIFEST" ]; then
    sort -u "$TMP_MANIFEST" > "$MANIFEST_FILE"
    rm -f "$TMP_MANIFEST"
fi

# Clean empty directories inside assets/docs
find "$REPO_DIR/assets/docs" -type d -empty -delete 2>/dev/null || true

# Count total offline phone files
TOTAL_OFFLINE_FILES=$(find "$PHONE_DIR" -type f ! -name ".*" | wc -l)

# ==============================================================================
# PHASE 6: Git Commit & GitHub Pages Live Push
# ==============================================================================
cd "$REPO_DIR"
CHANGES=$(git status --porcelain)

if [ -z "$CHANGES" ]; then
    if [ "$ON_STARTUP" -eq 1 ]; then
        if [ "$ORGANIZED_COUNT" -eq 0 ] && [ "${#DEDUP_SUMMARY[@]}" -eq 0 ] && [ "${#DELETED_SUMMARY[@]}" -eq 0 ] && [ "${#SEED_SUMMARY[@]}" -eq 0 ]; then
            echo -e "${GREEN}📚 MBBS Library:${RESET} in full two-way sync with phone ($TOTAL_OFFLINE_FILES files offline & online)."
        fi
    else
        echo -e "${GREEN}✨ [MBBS Library] Complete two-way sync verified! All $TOTAL_OFFLINE_FILES files are synchronized across phone & website.${RESET}"
    fi
    exit 0
fi

# Print banner for detected uploads
if [ "$NEW_FILES_PROCESSED" -gt 0 ]; then
    echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════${RESET}"
    echo -e "${CYAN}${BOLD}📥 [MBBS Library] Uploading $NEW_FILES_PROCESSED new/updated file(s) to website!${RESET}"
    for item in "${PROCESSED_NAMES[@]}"; do
        echo -e "   ${GREEN}➜${RESET} $item"
    done
    echo -e "${BLUE}───────────────────────────────────────────────────────────${RESET}"
fi

# Stage all changes
git add -A

COMMIT_PARTS=()
[ "${#DELETED_SUMMARY[@]}" -gt 0 ] && COMMIT_PARTS+=("synced ${#DELETED_SUMMARY[@]} phone deletion(s)")
[ "$NEW_FILES_PROCESSED" -gt 0 ] && COMMIT_PARTS+=("uploaded $NEW_FILES_PROCESSED file(s)")
[ "${#SEED_SUMMARY[@]}" -gt 0 ] && COMMIT_PARTS+=("seeded ${#SEED_SUMMARY[@]} offline doc(s)")

COMMIT_MSG="feat(sync): $(IFS=', '; echo "${COMMIT_PARTS[*]}")"
if [ -z "$COMMIT_MSG" ] || [ "$COMMIT_MSG" = "feat(sync): " ]; then
    COMMIT_MSG="feat(sync): two-way offline & deletion synchronization"
fi

git commit -m "$COMMIT_MSG" >/dev/null

# Append to PROJECT_LOG.md
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
cat << EOF >> "$LOG_FILE"

### Two-Way Auto-Sync & Deletion: $TIMESTAMP
- **Phone Deduplication**: Resolved ${#DEDUP_SUMMARY[@]} duplicate(s)
- **Phone Organization**: Organized $ORGANIZED_COUNT root file(s)
- **Phone Deletions Synced to Website**: ${#DELETED_SUMMARY[@]} file(s)
EOF
for item in "${DELETED_SUMMARY[@]}"; do
    echo "  - $item" >> "$LOG_FILE"
done

cat << EOF >> "$LOG_FILE"
- **Files Uploaded / Updated from Phone**: $NEW_FILES_PROCESSED
EOF
for item in "${PROCESSED_NAMES[@]}"; do
    echo "  - $item" >> "$LOG_FILE"
done

cat << EOF >> "$LOG_FILE"
- **Offline Files Seeded to Phone**: ${#SEED_SUMMARY[@]}
- **Total In-Sync Files**: $TOTAL_OFFLINE_FILES
EOF

git add "$LOG_FILE"
git commit --amend --no-edit >/dev/null 2>&1 || true

# Test internet connectivity before pushing
echo -e "🚀 ${BOLD}Connecting to GitHub...${RESET}"
if curl -s --connect-timeout 4 -I https://github.com >/dev/null 2>&1; then
    if git push origin main >/dev/null 2>&1; then
        echo -e "${GREEN}${BOLD}✅ Successfully synchronized with GitHub Pages!${RESET}"
        echo -e "   🌐 Live site: ${CYAN}https://harshkumarsaw.github.io/mbbs-library/${RESET}"
    else
        echo -e "${YELLOW}⚠️  Git push failed. Changes are saved locally and will push next time.${RESET}"
    fi
else
    echo -e "${YELLOW}⚠️  Offline mode: Changes saved locally in Git. Will upload automatically when connected!${RESET}"
fi
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════${RESET}"
