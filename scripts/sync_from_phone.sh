#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# MBBS Resource Library - High-Performance Two-Way Auto-Sync & Deletion Engine
# 
# 1. PHASE 0: Normalizes duplicates: strips (1), (2), _1, - Copy and keeps LATEST.
# 2. PHASE 1: Auto-organizes files dropped in phone root into subject folders.
# 3. PHASE 2: Deletion & Obsolete Path Synchronization (Phone -> Website):
#             Detects any file deleted from the phone folder, automatically deletes
#             its PDF from assets/docs/ and removes its entry from js/data.js.
# 4. PHASE 3: Upstream Sync (Phone -> Website):
#             Syncs new/updated phone files, organizes by subject/subfolder,
#             and registers in js/data.js.
# 5. PHASE 4: Downstream Sync (Website -> Phone):
#             Syncs all website materials & starter documents down to phone
#             folders so the entire MBBS library is always available offline.
# 6. PHASE 5: Manifest Finalization & Git Live Push:
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

# Helper string functions
to_safe_id() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '_' | sed 's/__*/_/g; s/^_//; s/_$//'
}

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

format_display() {
    local lower=$(echo "$1" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
    if [ "$lower" = "sdl" ] || [ "$lower" = "sdls" ]; then
        echo "SDL"
        return
    fi
    if [ "$lower" = "aetcom" ]; then
        echo "AETCOM"
        return
    fi
    if [ "$lower" = "ece" ]; then
        echo "ECE"
        return
    fi
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
        echo "sdl"
    elif [[ "$lower" =~ note|lecture|slide|theory|summary|class|concept|review|handout ]]; then
        echo "notes"
    elif [[ "$lower" =~ homework ]]; then
        echo "homework"
    elif [[ "$lower" =~ project ]]; then
        echo "project"
    elif [[ "$lower" =~ assign|case|problem|worksheet|task|vignette ]]; then
        echo "assignments"
    elif [[ "$lower" =~ histo ]]; then
        echo "histology"
    elif [[ "$lower" =~ pract|lab|manual|spotter|dissect|diagram|sketch|specimen|chart ]]; then
        echo "practicals"
    else
        echo "other"
    fi
}

find_matching_subfolder() {
    local parent_dir="$1"
    local word="$2"
    [ -d "$parent_dir" ] || return 1
    local word_l
    word_l=$(echo "$word" | tr '[:upper:]' '[:lower:]')
    local stem="${word_l%s}" # strip trailing s if any

    # 1. Exact case-insensitive match
    for d in "$parent_dir"/*/; do
        [ -d "$d" ] || continue
        local dname=$(basename "$d")
        local dname_l=$(echo "$dname" | tr '[:upper:]' '[:lower:]')
        if [ "$dname_l" = "$word_l" ]; then
            echo "$dname"
            return 0
        fi
    done

    # 2. Singular / Plural stem match (e.g. assignment -> assignments, diagrams -> diagram)
    for d in "$parent_dir"/*/; do
        [ -d "$d" ] || continue
        local dname=$(basename "$d")
        local dname_l=$(echo "$dname" | tr '[:upper:]' '[:lower:]')
        local d_stem="${dname_l%s}"
        if [ -n "$stem" ] && [ "$d_stem" = "$stem" ]; then
            echo "$dname"
            return 0
        fi
    done

    return 1
}

get_target_phone_rel_path() {
    local fname="$1"
    local canonical
    canonical=$(get_canonical_name "$fname")
    local name_no_ext="${canonical%.*}"
    local ext="${canonical##*.}"

    # Clean words: replace underscores, hyphens, and multiple spaces with a single space
    local cleaned
    cleaned=$(echo "$name_no_ext" | sed -E 's/[_\-]+/ /g; s/[[:space:]]+/ /g; s/^[[:space:]]+|[[:space:]]+$//')

    local first_word
    first_word=$(echo "$cleaned" | awk '{print $1}')
    local second_word
    second_word=$(echo "$cleaned" | awk '{print $2}')

    local subj_dir=""
    local sub_dir=""

    # 1. Identify Subject from first word
    if [ -n "$first_word" ]; then
        local first_l
        first_l=$(echo "$first_word" | tr '[:upper:]' '[:lower:]')
        if [[ "$first_l" =~ ^anat ]]; then
            subj_dir="Anatomy"
        elif [[ "$first_l" =~ ^physio ]]; then
            subj_dir="Physiology"
        elif [[ "$first_l" =~ ^biochem ]]; then
            subj_dir="Biochemistry"
        elif [[ "$first_l" =~ ^community|psm ]]; then
            subj_dir="Community Medicine"
        elif [[ "$first_l" =~ ^aetcom ]]; then
            subj_dir="AETCOM"
        elif [[ "$first_l" =~ ^ece ]]; then
            subj_dir="ECE (Early Clinical Exposure)"
        elif [[ "$first_l" =~ ^foundation ]]; then
            subj_dir="Foundation Course"
        fi
    fi

    # 2. If subject identified and second word exists (Two-Word rule: Word 1 = Subject, Word 2 = Subfolder)
    if [ -n "$subj_dir" ] && [ -n "$second_word" ]; then
        sub_dir=$(find_matching_subfolder "$PHONE_DIR/$subj_dir" "$second_word" || echo "")
        if [ -z "$sub_dir" ]; then
            sub_dir=$(format_display "$second_word")
        fi
        echo "$subj_dir/$sub_dir/$canonical"
        return
    fi

    # 3. If subject identified but NO second word:
    if [ -n "$subj_dir" ] && [ -z "$second_word" ]; then
        echo "$subj_dir/$canonical"
        return
    fi

    # 4. If first word wasn't a subject, fall back to keyword detection on the whole filename:
    local lower_name
    lower_name=$(echo "$canonical" | tr '[:upper:]' '[:lower:]')
    if [[ "$lower_name" =~ histo ]]; then
        echo "Anatomy/Histology/$canonical"
    elif [[ "$lower_name" =~ embryo ]]; then
        echo "Anatomy/Embryology/$canonical"
    elif [[ "$lower_name" =~ neuroanat ]]; then
        echo "Anatomy/Neuroanatomy/$canonical"
    elif [[ "$lower_name" =~ gross ]]; then
        echo "Anatomy/Gross Anatomy/$canonical"
    elif [[ "$lower_name" =~ aetcom ]]; then
        echo "AETCOM/$canonical"
    elif [[ "$lower_name" =~ ece ]]; then
        echo "ECE (Early Clinical Exposure)/$canonical"
    elif [[ "$lower_name" =~ community|psm ]]; then
        echo "Community Medicine/$canonical"
    elif [[ "$lower_name" =~ foundation ]]; then
        echo "Foundation Course/$canonical"
    elif [[ "$lower_name" =~ hemato|blood ]]; then
        echo "Physiology/Hematology/$canonical"
    elif [[ "$lower_name" =~ cardio|heart|ecg ]]; then
        echo "Physiology/Cardiovascular/$canonical"
    elif [[ "$lower_name" =~ respirat|lung ]]; then
        echo "Physiology/Respiratory/$canonical"
    elif [[ "$lower_name" =~ renal|kidney ]]; then
        echo "Physiology/Renal/$canonical"
    elif [[ "$lower_name" =~ physiology|physio ]]; then
        echo "Physiology/$canonical"
    elif [[ "$lower_name" =~ enzym|protein|metabol|biochem ]]; then
        echo "Biochemistry/$canonical"
    elif [[ "$lower_name" =~ anat|bone ]]; then
        echo "Anatomy/$canonical"
    else
        echo "Other/$canonical"
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
# PHASE 0: Version Normalization (Strip (1), (2), _1, - Copy & Keep Latest)
# ==============================================================================
ALL_PHONE_FILES=()
while IFS= read -r -d '' f; do
    ALL_PHONE_FILES+=("$f")
done < <(find "$PHONE_DIR" -type f ! -name ".*" -print0)

DEDUP_SUMMARY=()
for file in "${ALL_PHONE_FILES[@]}"; do
    [ -f "$file" ] || continue
    base_name=$(basename "$file")
    dir_name=$(dirname "$file")
    canonical_name=$(get_canonical_name "$base_name")

    if [ "$base_name" != "$canonical_name" ]; then
        target_path="$dir_name/$canonical_name"
        if [ ! -f "$target_path" ]; then
            # Check if canonical exists in memory list
            for pf in "${ALL_PHONE_FILES[@]}"; do
                if [ "$(basename "$pf")" = "$canonical_name" ] && [ -f "$pf" ]; then
                    target_path="$pf"
                    break
                fi
            done
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

# ==============================================================================
# PHASE 1: Two-Word Auto-Organization & Cross-Folder Deduplication
# ==============================================================================
ORGANIZED_COUNT=0
ORGANIZED_SUMMARY=()

ALL_PHONE_FILES=()
while IFS= read -r -d '' f; do
    ALL_PHONE_FILES+=("$f")
done < <(find "$PHONE_DIR" -type f ! -name ".*" -print0)

declare -A SEEN_CANONICAL=()

for file in "${ALL_PHONE_FILES[@]}"; do
    [ -f "$file" ] || continue
    base_name=$(basename "$file")
    canonical_name=$(get_canonical_name "$base_name")

    [ "${SEEN_CANONICAL[$canonical_name]:-0}" -eq 1 ] && continue
    SEEN_CANONICAL[$canonical_name]=1

    # Find ALL instances of this canonical file across the phone
    matching_instances=()
    for cand in "${ALL_PHONE_FILES[@]}"; do
        [ -f "$cand" ] || continue
        cand_base=$(basename "$cand")
        cand_canonical=$(get_canonical_name "$cand_base")
        if [ "$cand_canonical" = "$canonical_name" ]; then
            matching_instances+=("$cand")
        fi
    done

    # Determine canonical target location based on Two-Word rule:
    # Word 1 = Subject, Word 2 = Subfolder
    target_rel=$(get_target_phone_rel_path "$canonical_name")
    target_dest="$PHONE_DIR/$target_rel"
    mkdir -p "$(dirname "$target_dest")"

    if [ "${#matching_instances[@]}" -gt 1 ]; then
        # Multiple copies found! Identify the latest revision
        best_file=""
        best_mtime=-1
        best_size=0

        for inst in "${matching_instances[@]}"; do
            [ -f "$inst" ] || continue
            mtime=$(stat -c %Y "$inst" 2>/dev/null || echo 0)
            fsize=$(stat -c %s "$inst" 2>/dev/null || echo 0)
            if [ "$mtime" -gt "$best_mtime" ]; then
                best_file="$inst"
                best_mtime="$mtime"
                best_size="$fsize"
            elif [ "$mtime" -eq "$best_mtime" ]; then
                if [ "$inst" = "$target_dest" ]; then
                    best_file="$inst"
                elif [ "$best_file" != "$target_dest" ] && [ "$fsize" -gt "$best_size" ]; then
                    best_file="$inst"
                    best_size="$fsize"
                fi
            fi
        done

        # Move best file to canonical target location
        if [ -n "$best_file" ] && [ "$best_file" != "$target_dest" ]; then
            mv -f "$best_file" "$target_dest"
            ORGANIZED_COUNT=$((ORGANIZED_COUNT + 1))
            ORGANIZED_SUMMARY+=("$canonical_name ➔ $(dirname "$target_rel")/")
        fi

        # Delete all other duplicate copies from phone
        for inst in "${matching_instances[@]}"; do
            if [ "$inst" != "$target_dest" ] && [ -f "$inst" ]; then
                rm -f "$inst"
                DEDUP_SUMMARY+=("Removed duplicate: ${inst#$PHONE_DIR/} (kept latest in $target_rel)")
            fi
        done
    else
        # Exactly one instance. If it is not in its canonical target subfolder, move it!
        single_file="${matching_instances[0]}"
        if [ "$single_file" != "$target_dest" ]; then
            if [ -f "$target_dest" ]; then
                file_mtime=$(stat -c %Y "$single_file" 2>/dev/null || echo 0)
                target_mtime=$(stat -c %Y "$target_dest" 2>/dev/null || echo 0)
                if [ "$file_mtime" -ge "$target_mtime" ]; then
                    mv -f "$single_file" "$target_dest"
                else
                    rm -f "$single_file"
                fi
            else
                mv "$single_file" "$target_dest"
            fi
            ORGANIZED_COUNT=$((ORGANIZED_COUNT + 1))
            ORGANIZED_SUMMARY+=("$canonical_name ➔ $(dirname "$target_rel")/")
        fi
    fi
done

if [ "${#DEDUP_SUMMARY[@]}" -gt 0 ]; then
    echo -e "${CYAN}🔄 [MBBS Library] Resolved ${#DEDUP_SUMMARY[@]} file duplicate(s) / version(s):${RESET}"
    for item in "${DEDUP_SUMMARY[@]}"; do
        echo -e "   ${GREEN}✔${RESET} $item"
    done
fi

if [ "$ORGANIZED_COUNT" -gt 0 ]; then
    echo -e "${CYAN}📁 [MBBS Library] Organized $ORGANIZED_COUNT file(s) into subfolders on phone:${RESET}"
    for item in "${ORGANIZED_SUMMARY[@]}"; do
        echo -e "   ${GREEN}✔${RESET} $item"
    done
fi

# Refresh in-memory list of phone files
ALL_PHONE_FILES=()
while IFS= read -r -d '' f; do
    ALL_PHONE_FILES+=("$f")
done < <(find "$PHONE_DIR" -type f ! -name ".*" -print0)

# ==============================================================================
# PHASE 2: Deletion & Obsolete Path Synchronization (Phone -> Website)
# ==============================================================================
TMP_MANIFEST="${TMPDIR:-/data/data/com.termux/files/usr/tmp}/mbbs_manifest_$$.tmp"
rm -f "$TMP_MANIFEST"
touch "$TMP_MANIFEST"

DELETED_SUMMARY=()

# Scan existing manifest for deletions or obsolete path mismatches
if [ -f "$MANIFEST_FILE" ] && [ -s "$MANIFEST_FILE" ]; then
    while IFS='|' read -r phone_rel repo_url || [ -n "$phone_rel" ]; do
        [ -n "$phone_rel" ] || continue
        [ -n "$repo_url" ] || continue

        phone_full="$PHONE_DIR/$phone_rel"
        if [ -f "$phone_full" ]; then
            # Verify if this repo_url is the canonical URL for this phone path
            canonical_url=$(phone_to_repo_url "$phone_rel")
            if [ "$canonical_url" = "$repo_url" ]; then
                echo "$phone_rel|$repo_url" >> "$TMP_MANIFEST"
            else
                # Stale / duplicate URL pointing to same file! Remove obsolete repo entry
                if [ -f "$REPO_DIR/$repo_url" ]; then
                    rm -f "$REPO_DIR/$repo_url"
                fi
                remove_resource_by_url "$repo_url"
                DELETED_SUMMARY+=("$repo_url (cleaned obsolete duplicate)")
            fi
        else
            # File missing at mapped path. Check if it was moved to another subfolder.
            base_fname=$(basename "$phone_rel")
            base_safe=$(format_safe_filename "$base_fname")
            moved_path=""
            for pf in "${ALL_PHONE_FILES[@]}"; do
                if [ "$(format_safe_filename "$(basename "$pf")")" = "$base_safe" ]; then
                    moved_path="$pf"
                    break
                fi
            done

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
    echo -e "${RED}${BOLD}🗑️  [MBBS Library] Synced ${#DELETED_SUMMARY[@]} deletion(s) / obsolete item(s) from phone:${RESET}"
    for item in "${DELETED_SUMMARY[@]}"; do
        echo -e "   ${YELLOW}✖${RESET} $item"
    done
fi

# ==============================================================================
# PHASE 3: Upstream Sync (Phone -> Website)
# ==============================================================================
NEW_FILES_PROCESSED=0
PROCESSED_NAMES=()
TMP_ENTRIES="${TMPDIR:-/data/data/com.termux/files/usr/tmp}/mbbs_new_entries_$$.tmp"
rm -f "$TMP_ENTRIES"
touch "$TMP_ENTRIES"

for file in "${ALL_PHONE_FILES[@]}"; do
    base_name=$(basename "$file")
    rel_path="${file#$PHONE_DIR/}"

    target_rel_url=$(phone_to_repo_url "$rel_path")
    target_abs_path="$REPO_DIR/$target_rel_url"
    target_dir=$(dirname "$target_abs_path")
    mkdir -p "$target_dir"

    file_copied=0
    if [ ! -f "$target_abs_path" ] || ! cmp -s "$file" "$target_abs_path"; then
        cp -p "$file" "$target_abs_path"
        file_copied=1

        # High-Performance PDF Compression & Fast Web View Linearization
        if [[ "${target_abs_path,,}" == *.pdf ]] && command -v gs >/dev/null 2>&1 && command -v qpdf >/dev/null 2>&1; then
            orig_mtime=$(stat -c %Y "$file" 2>/dev/null || echo 0)
            orig_bytes=$(wc -c < "$target_abs_path")
            tmp_opt="${TMPDIR:-/data/data/com.termux/files/usr/tmp}/opt_sync_$$.pdf"
            tmp_gs="${TMPDIR:-/data/data/com.termux/files/usr/tmp}/gs_sync_$$.pdf"
            rm -f "$tmp_gs" "$tmp_opt"
            if gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.5 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="$tmp_gs" "$target_abs_path" 2>/dev/null; then
                if qpdf --linearize "$tmp_gs" "$tmp_opt" 2>/dev/null; then
                    opt_bytes=$(wc -c < "$tmp_opt")
                    if [ "$opt_bytes" -lt "$orig_bytes" ]; then
                        mv -f "$tmp_opt" "$target_abs_path"
                        # Also optimize the offline phone file so phone saves storage, preserving mtime
                        cp -p "$target_abs_path" "$file" 2>/dev/null || true
                    fi
                fi
            fi
            rm -f "$tmp_gs" "$tmp_opt"
            if [ "$orig_mtime" -gt 0 ]; then
                touch -d "@$orig_mtime" "$target_abs_path" 2>/dev/null || true
                touch -d "@$orig_mtime" "$file" 2>/dev/null || true
            fi
        fi
    fi

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
            elif [[ "$sub_lower" =~ ^homework ]]; then category="homework"; cat_display="Homework"
            elif [[ "$sub_lower" =~ ^project ]]; then category="project"; cat_display="Project"
            elif [[ "$sub_lower" =~ ^sdl ]]; then category="sdl"; cat_display="SDL"
            elif [[ "$sub_lower" =~ ^pract ]]; then category="practicals"; cat_display="Practicals"
            elif [[ "$sub_lower" =~ ^histo ]]; then category="histology"; cat_display="Histology"
            else category=$(to_safe_id "$sub_folder"); cat_display=$(format_display "$sub_folder")
            fi
        else
            category=$(detect_category_from_name "$base_name")
            cat_display=$(format_display "$category")
        fi

        safe_filename=$(format_safe_filename "$base_name")
        title=$(format_display "$base_name")
        file_bytes=$(wc -c < "$target_abs_path")
        file_size=$(format_file_size "$file_bytes")
        file_mtime=$(stat -c %Y "$target_abs_path" 2>/dev/null || echo 0)
        if [ "$file_mtime" -gt 0 ]; then
            file_date=$(date -d "@$file_mtime" +"%d %b %Y" 2>/dev/null || date -r "$target_abs_path" +"%d %b %Y" 2>/dev/null || echo "Date unavailable")
        else
            file_date="Date unavailable"
        fi
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
    date: "$file_date",
    year: "1st Year MBBS"
  },
EOF
        NEW_FILES_PROCESSED=$((NEW_FILES_PROCESSED + 1))
        PROCESSED_NAMES+=("$base_name ($subj_display / $cat_display)")
    elif [ "$file_copied" -eq 1 ]; then
        file_bytes=$(wc -c < "$target_abs_path")
        new_size=$(format_file_size "$file_bytes")
        file_mtime=$(stat -c %Y "$target_abs_path" 2>/dev/null || echo 0)
        if [ "$file_mtime" -gt 0 ]; then
            new_date=$(date -d "@$file_mtime" +"%d %b %Y" 2>/dev/null || date -r "$target_abs_path" +"%d %b %Y" 2>/dev/null || echo "Date unavailable")
        else
            new_date="Date unavailable"
        fi
        awk -v url="$target_rel_url" -v size="$new_size" -v fdate="$new_date" '
        $0 ~ "fileUrl: \"" url "\"" {
            in_item = 1
            print
            next
        }
        in_item && $0 ~ /fileSize:[[:space:]]*"[^"]*"/ {
            print "    fileSize: \"" size "\","
            next
        }
        in_item && $0 ~ /date:[[:space:]]*"[^"]*"/ {
            print "    date: \"" fdate "\","
            in_item = 0
            next
        }
        in_item && $0 ~ /^[[:space:]]*\},?[[:space:]]*$/ {
            in_item = 0
            print
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

# Safety Audit: Clean any orphaned or duplicate resources from js/data.js that are not in active manifest
DATA_URLS=$(awk -F'"' '/fileUrl:[[:space:]]*"/ { print $2 }' "$DATA_FILE")
for d_url in $DATA_URLS; do
    if [ -n "$d_url" ] && ! grep -q "|$d_url$" "$TMP_MANIFEST"; then
        if [ -f "$REPO_DIR/$d_url" ]; then
            rm -f "$REPO_DIR/$d_url"
        fi
        remove_resource_by_url "$d_url"
        DELETED_SUMMARY+=("$d_url (pruned duplicate / obsolete entry)")
    fi
done

# ==============================================================================
# PHASE 4: Downstream Sync (Website -> Phone)
# ==============================================================================
SEED_SUMMARY=()
ACTIVE_WEBSITE_URLS=$(awk -F'"' '/fileUrl:[[:space:]]*"/ { print $2 }' "$DATA_FILE")

for w_url in $ACTIVE_WEBSITE_URLS; do
    repo_physical="$REPO_DIR/$w_url"
    [ -f "$repo_physical" ] || continue

    if grep -q "|$w_url$" "$TMP_MANIFEST"; then
        continue
    fi

    phone_rel_dest=$(repo_to_phone_path "$w_url")
    phone_target_file="$PHONE_DIR/$phone_rel_dest"

    if [ -f "$phone_target_file" ]; then
        echo "$phone_rel_dest|$w_url" >> "$TMP_MANIFEST"
        continue
    fi

    # Check in-memory list
    w_base=$(basename "$w_url")
    found_on_phone=""
    for pf in "${ALL_PHONE_FILES[@]}"; do
        if [ "$(format_safe_filename "$(basename "$pf")")" = "$w_base" ]; then
            found_on_phone="$pf"
            break
        fi
    done

    if [ -n "$found_on_phone" ]; then
        rel_phone="${found_on_phone#$PHONE_DIR/}"
        echo "$rel_phone|$w_url" >> "$TMP_MANIFEST"
        continue
    fi

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

# Clean empty directories inside assets/docs and phone folder
find "$REPO_DIR/assets/docs" -type d -empty -delete 2>/dev/null || true
find "$PHONE_DIR" -depth -type d -empty -delete 2>/dev/null || true

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

if [ "$NEW_FILES_PROCESSED" -gt 0 ]; then
    echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════${RESET}"
    echo -e "${CYAN}${BOLD}📥 [MBBS Library] Uploading $NEW_FILES_PROCESSED new/updated file(s) to website!${RESET}"
    for item in "${PROCESSED_NAMES[@]}"; do
        echo -e "   ${GREEN}➜${RESET} $item"
    done
    echo -e "${BLUE}───────────────────────────────────────────────────────────${RESET}"
fi

# Update cache-busting version query across all HTML pages to force instant browser refreshes
CACHE_BUST_VER=$(date +%s)
for h_file in "$REPO_DIR"/*.html; do
    sed -i -E "s/(data\.js|app\.js|style\.css)(\?v=[0-9]+)?/\1?v=$CACHE_BUST_VER/g" "$h_file"
done

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
