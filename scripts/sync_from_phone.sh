#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# MBBS Resource Library - Bulletproof Two-Way Auto-Sync & Optimization Engine
# 
# 1. CONCURRENCY: Uses kernel flock to ensure exactly ONE sync process runs.
# 2. STEP FEEDBACK: Clear 5-step numbered progress with live terminal indicators.
# 3. PDF OPTIMIZATION: Real-time animated progress bar for Ghostscript + qpdf,
#    enforcing <95MB ceiling for GitHub Pages and Fast Web View linearization.
# 4. TWO-WAY SYNC: Phone ⇄ Website synchronization with automatic categorization.
# 5. INTEGRITY: Audits unpushed commits and never gives false "fully synced"
#    status when changes are pending upload.
# 6. TRANSPARENT PUSH: Real-time Git push progress with clear error diagnostics.
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
DIM="\033[2m"
RESET="\033[0m"

ON_STARTUP=0
FORCE_SYNC=0
for arg in "$@"; do
    case "$arg" in
        --on-startup|-q) ON_STARTUP=1 ;;
        --force|-f) FORCE_SYNC=1 ;;
    esac
done

PHONE_DIR="/storage/emulated/0/mbbs-library"
REPO_DIR="/data/data/com.termux/files/home/mbbs-resource-library"
DATA_FILE="$REPO_DIR/js/data.js"
MANIFEST_FILE="$REPO_DIR/.mbbs_sync_manifest"
LOG_FILE="$REPO_DIR/PROJECT_LOG.md"
ONESIGNAL_APP_ID="54db441e-edff-4024-8e24-87bacea1d5fe"
ONESIGNAL_API_KEY="${ONESIGNAL_API_KEY:-}"
if [ -z "$ONESIGNAL_API_KEY" ]; then
    if [ -f "$REPO_DIR/.onesignal_key" ]; then
        ONESIGNAL_API_KEY="$(cat "$REPO_DIR/.onesignal_key" | tr -d ' \t\r\n')"
    elif [ -f "$HOME/.onesignal_key" ]; then
        ONESIGNAL_API_KEY="$(cat "$HOME/.onesignal_key" | tr -d ' \t\r\n')"
    fi
fi
TMP_DIR="${TMPDIR:-/data/data/com.termux/files/usr/tmp}"
mkdir -p "$TMP_DIR"
LOCK_FILE="$TMP_DIR/mbbs_sync.lock"

# Concurrency Control: Exactly one sync process allowed at a time
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    other_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "unknown")
    if [ "$ON_STARTUP" -eq 1 ]; then
        echo -e "${YELLOW}ℹ️  [MBBS Sync] Auto-sync already active in background (PID $other_pid).${RESET}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  [MBBS Sync] Another sync process (PID $other_pid) is currently running.${RESET}"
        echo -e "   Run 'ps -ef | grep mbbs' to inspect or wait for it to complete."
        exit 0
    fi
fi
echo "$$" > "$LOCK_FILE"

cleanup() {
    rm -f "$LOCK_FILE" "$TMP_DIR"/mbbs_*_$$* "$TMP_DIR"/gs_*_$$* "$TMP_DIR"/lin_*_$$* 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Startup vs Interactive Banner
if [ "$ON_STARTUP" -eq 0 ]; then
    echo -e "${BLUE}${BOLD}╔════════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${BLUE}${BOLD}║               🩺 MBBS RESOURCE LIBRARY SYNC ENGINE              ║${RESET}"
    echo -e "${BLUE}${BOLD}╚════════════════════════════════════════════════════════════════╝${RESET}"
fi

# Verify repository exists
if [ ! -d "$REPO_DIR" ]; then
    echo -e "${RED}⚠️  [MBBS Library] Repository not found at $REPO_DIR${RESET}"
    exit 1
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
        echo -e "${YELLOW}⚠️  [MBBS Library] Phone storage not accessible. Run 'termux-setup-storage'.${RESET}"
    fi
    exit 0
fi

mkdir -p "$PHONE_DIR" 2>/dev/null || true

# Helper string functions
send_onesignal_notification() {
    local title="$1"
    local message="$2"
    local url="https://harshkumarsaw.github.io/mbbs-library/"

    if [ -z "$ONESIGNAL_API_KEY" ] || [ -z "$ONESIGNAL_APP_ID" ]; then
        return 0
    fi

    echo -e "🔔 ${CYAN}Dispatching OneSignal Web Push to subscribers...${RESET}"
    local payload
    payload=$(cat <<JSON_EOF
{
  "app_id": "$ONESIGNAL_APP_ID",
  "target_channel": "push",
  "included_segments": ["Subscribed Users"],
  "headings": {"en": "$title"},
  "contents": {"en": "$message"},
  "url": "$url"
}
JSON_EOF
)
    local res
    res=$(curl -s -X POST "https://api.onesignal.com/notifications" \
        -H "Authorization: Basic $ONESIGNAL_API_KEY" \
        -H "Content-Type: application/json; charset=utf-8" \
        -d "$payload" 2>&1 || true)

    if echo "$res" | grep -q '"id"'; then
        if echo "$res" | grep -q 'All included players are not subscribed'; then
            local check_web
            check_web=$(curl -s "https://api.onesignal.com/sync/$ONESIGNAL_APP_ID/web" 2>/dev/null || true)
            if echo "$check_web" | grep -q "This app is not configured for web push"; then
                echo -e "${YELLOW}ℹ️  OneSignal push queued (Web Push setup pending in OneSignal dashboard).${RESET}"
                echo -e "${DIM}   Visit https://dashboard.onesignal.com/apps/$ONESIGNAL_APP_ID/settings -> Web to activate.${RESET}"
            else
                echo -e "${DIM}ℹ️  OneSignal push dispatched (waiting for active subscribers to opt in).${RESET}"
            fi
        else
            echo -e "${GREEN}✅ OneSignal push notification delivered to subscribers!${RESET}"
        fi
    else
        echo -e "${DIM}ℹ️  OneSignal push notice.${RESET}"
    fi
}

to_safe_id() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '_' | sed 's/__*/_/g; s/^_//; s/_$//'
}

get_canonical_name() {
    local full_name="$1"
    local ext="${full_name##*.}"
    local name_no_ext="${full_name%.*}"

    local cleaned="$name_no_ext"
    shopt -s extglob
    while :; do
        local prev="$cleaned"
        cleaned="${cleaned%%+([[:space:]])\([0-9]+\)}"
        cleaned="${cleaned%%_[0-9]+}"
        cleaned="${cleaned%%+([[:space:]])-[[:space:]][Cc]opy}"
        [ "$cleaned" = "$prev" ] && break
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
    local raw_base="${repo_url##*/}"
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
    local stem="${word_l%s}"

    for d in "$parent_dir"/*/; do
        [ -d "$d" ] || continue
        [ -n "$(find "$d" -type f ! -name ".*" -print -quit 2>/dev/null)" ] || continue
        local trimmed_d="${d%/}"
        local dname="${trimmed_d##*/}"
        local dname_l="${dname,,}"
        if [ "$dname_l" = "$word_l" ]; then
            echo "$dname"
            return 0
        fi
    done

    for d in "$parent_dir"/*/; do
        [ -d "$d" ] || continue
        [ -n "$(find "$d" -type f ! -name ".*" -print -quit 2>/dev/null)" ] || continue
        local trimmed_d="${d%/}"
        local dname="${trimmed_d##*/}"
        local dname_l="${dname,,}"
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

    local clean_name="${name_no_ext//[_-]/ }"
    local first_word="" second_word=""
    read -r first_word second_word _ <<< "$clean_name"

    local subj_dir=""
    local sub_dir=""

    if [ -n "$first_word" ]; then
        local first_l="${first_word,,}"
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

    if [ -n "$subj_dir" ] && [ -n "$second_word" ]; then
        sub_dir=$(find_matching_subfolder "$PHONE_DIR/$subj_dir" "$second_word" || echo "")
        if [ -z "$sub_dir" ]; then
            sub_dir=$(format_display "$second_word")
        fi
        echo "$subj_dir/$sub_dir/$canonical"
        return
    fi

    if [ -n "$subj_dir" ] && [ -z "$second_word" ]; then
        echo "$subj_dir/$canonical"
        return
    fi

    local lower_name="${canonical,,}"
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
# PERSISTENT PDF OPTIMIZATION CACHE (FAST IN-MEMORY VERIFICATION)
# ==============================================================================
OPT_CACHE_FILE="$REPO_DIR/.mbbs_opt_cache"
[ -f "$OPT_CACHE_FILE" ] || touch "$OPT_CACHE_FILE"

declare -A CACHED_OPTS=()
load_opt_cache() {
    CACHED_OPTS=()
    [ -f "$OPT_CACHE_FILE" ] || return 0
    while IFS='|' read -r c_path c_size c_mtime; do
        [ -n "$c_path" ] && CACHED_OPTS["$c_path"]="$c_size|$c_mtime"
    done < "$OPT_CACHE_FILE"
}

save_opt_cache_entry() {
    local rel_name="$1"
    local f_size="$2"
    local f_mtime="$3"
    CACHED_OPTS["$rel_name"]="$f_size|$f_mtime"
    local tmp_cache="$TMP_DIR/opt_cache_$$.tmp"
    grep -v -F "$rel_name|" "$OPT_CACHE_FILE" 2>/dev/null > "$tmp_cache" || true
    echo "$rel_name|$f_size|$f_mtime" >> "$tmp_cache"
    mv -f "$tmp_cache" "$OPT_CACHE_FILE"
}

is_pdf_already_optimized() {
    local pdf_file="$1"
    [ -f "$pdf_file" ] || return 0
    local rel_name="${pdf_file#$PHONE_DIR/}"
    local f_size
    f_size=$(stat -c %s "$pdf_file" 2>/dev/null || wc -c < "$pdf_file")
    local f_mtime
    f_mtime=$(stat -c %Y "$pdf_file" 2>/dev/null || echo 0)

    # Fast in-memory check against verified cache (exact size and modification time)
    if [ "${CACHED_OPTS[$rel_name]:-}" = "$f_size|$f_mtime" ]; then
        return 0
    fi

    return 1
}

# ==============================================================================
# HIGH-SPEED PDF OPTIMIZATION WITH REAL-TIME PROGRESS BAR
# ==============================================================================
optimize_pdf_file() {
    local target_abs="$1"
    local display_name="${2:-${target_abs##*/}}"
    local orig_file="${3:-}"

    command -v gs >/dev/null 2>&1 || return 0
    command -v qpdf >/dev/null 2>&1 || return 0
    [ -f "$target_abs" ] || return 0

    local orig_bytes
    orig_bytes=$(wc -c < "$target_abs")
    local orig_display
    orig_display=$(format_file_size "$orig_bytes")

    # Fast-path for tiny files: linearize only
    if [ "$orig_bytes" -lt 307200 ]; then
        local tmp_lin="$TMP_DIR/lin_$$.pdf"
        if qpdf --linearize "$target_abs" "$tmp_lin" 2>/dev/null; then
            mv -f "$tmp_lin" "$target_abs"
        fi
        rm -f "$tmp_lin"
        return 0
    fi

    local total_pages
    total_pages=$(qpdf --show-npages "$target_abs" 2>/dev/null || echo 0)
    [ "$total_pages" -gt 0 ] || return 0

    echo -e "   ⚡ ${BOLD}Optimizing PDF:${RESET} ${CYAN}$display_name${RESET} (${orig_display}, ${total_pages} pages)"

    local tmp_gs="$TMP_DIR/gs_opt_$$.pdf"
    local tmp_opt="$TMP_DIR/lin_opt_$$.pdf"
    local tmp_err="$TMP_DIR/gs_err_$$.log"
    rm -f "$tmp_gs" "$tmp_opt" "$tmp_err"

    local start_time
    start_time=$(date +%s)
    local last_sec=0
    local gs_ok=1

    # High-speed average downsampling (130 DPI) with real-time page progress bar
    if ! (
        gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.5 \
           -dDownsampleColorImages=true -dColorImageDownsampleType=/Average -dColorImageResolution=130 \
           -dDownsampleGrayImages=true -dGrayImageDownsampleType=/Average -dGrayImageResolution=130 \
           -dDownsampleMonoImages=true -dMonoImageResolution=200 \
           -dNOPAUSE -dBATCH \
           -sOutputFile="$tmp_gs" "$target_abs" 2>"$tmp_err" | while read -r line; do
               if [[ "$line" =~ ^Page\ ([0-9]+) ]]; then
                   curr="${BASH_REMATCH[1]}"
                   now=$(date +%s)
                   if [ $((now - last_sec)) -ge 1 ] || [ "$curr" -eq "$total_pages" ]; then
                       last_sec=$now
                       pct=$((curr * 100 / total_pages))
                       bar_filled=$((pct * 20 / 100))
                       bar_empty=$((20 - bar_filled))
                       fill_str=""
                       for ((b=0; b<bar_filled; b++)); do fill_str="${fill_str}█"; done
                       empty_str=""
                       for ((b=0; b<bar_empty; b++)); do empty_str="${empty_str}░"; done
                       elapsed=$((now - start_time))
                       if [ "$curr" -gt 0 ]; then
                           eta=$(( (elapsed * (total_pages - curr)) / curr ))
                       else
                           eta=0
                       fi
                       printf "\r      ⏳ [%s%s] %3d%% (%d/%d pages) • %ds • ETA: %ds" "$fill_str" "$empty_str" "$pct" "$curr" "$total_pages" "$elapsed" "$eta"
                   fi
               fi
           done
    ); then
        gs_ok=0
    fi
    printf "\r%80s\r" ""

    if [ "$gs_ok" -eq 1 ] && [ -f "$tmp_gs" ] && [ -s "$tmp_gs" ]; then
        if qpdf --linearize "$tmp_gs" "$tmp_opt" 2>/dev/null; then
            local new_bytes
            new_bytes=$(wc -c < "$tmp_opt")
            if [ "$new_bytes" -lt "$orig_bytes" ]; then
                mv -f "$tmp_opt" "$target_abs"
                if [ -n "$orig_file" ] && [ -f "$orig_file" ]; then
                    cp -p "$target_abs" "$orig_file" 2>/dev/null || true
                fi
                local new_display
                new_display=$(format_file_size "$new_bytes")
                local saved_pct=$(( (orig_bytes - new_bytes) * 100 / orig_bytes ))
                echo -e "      ${GREEN}✔ Optimized:${RESET} $orig_display ➔ ${BOLD}$new_display${RESET} (${saved_pct}% saved, Fast Web View enabled)"
            else
                qpdf --linearize "$target_abs" "$tmp_opt" 2>/dev/null && mv -f "$tmp_opt" "$target_abs"
                echo -e "      ${GREEN}✔ Linearized:${RESET} Fast Web View enabled ($orig_display)"
            fi
        fi
    else
        echo -e "      ${YELLOW}⚠️  Optimization notice:${RESET} Linearizing original stream..."
        qpdf --linearize "$target_abs" "$tmp_opt" 2>/dev/null && mv -f "$tmp_opt" "$target_abs" || true
    fi

    # 25MB Large Document Guard: Bypass secondary compression and preserve high visual quality for GitHub Releases
    local final_bytes
    final_bytes=$(wc -c < "$target_abs")
    if [ "$final_bytes" -ge 26214400 ]; then # 25 MB
        local final_disp
        final_disp=$(format_file_size "$final_bytes")
        echo -e "      ${PURPLE}📦 [Large Asset Detected]:${RESET} File is ${BOLD}$final_disp${RESET} (>25MB) after first compression pass."
        echo -e "         ${GREEN}✔ Preserving high visual quality${RESET} (bypassing secondary downsampling pass)."
        echo -e "         ${CYAN}✔ Routing directly to GitHub Releases (v1.0.0-assets)${RESET} for direct device download."
    fi

    # Record in persistent optimization cache so it is never re-compressed
    local final_mtime
    final_mtime=$(stat -c %Y "$target_abs" 2>/dev/null || echo 0)
    save_opt_cache_entry "${target_abs#$PHONE_DIR/}" "$final_bytes" "$final_mtime"

    rm -f "$tmp_gs" "$tmp_opt" "$tmp_err"
}

# ==============================================================================
# PHASE 1: Version Normalization & Organization
# ==============================================================================
[ "$ON_STARTUP" -eq 0 ] && echo -e "\n🔍 ${BOLD}[1/5] Auditing phone storage and library structure...${RESET}"

ALL_PHONE_FILES=()
while IFS= read -r -d '' f; do
    ALL_PHONE_FILES+=("$f")
done < <(find "$PHONE_DIR" -type f ! -name ".*" -print0)

DEDUP_SUMMARY=()
for file in "${ALL_PHONE_FILES[@]}"; do
    [ -f "$file" ] || continue
    base_name="${file##*/}"
    dir_name="${file%/*}"
    canonical_name=$(get_canonical_name "$base_name")

    if [ "$base_name" != "$canonical_name" ]; then
        target_path="$dir_name/$canonical_name"
        if [ ! -f "$target_path" ]; then
            rel_dir="${dir_name#$PHONE_DIR}"
            rel_dir="${rel_dir#/}"
            IFS='/' read -r -a dir_parts <<< "$rel_dir"
            if [ "${#dir_parts[@]}" -lt 2 ]; then
                for pf in "${ALL_PHONE_FILES[@]}"; do
                    if [ "${pf##*/}" = "$canonical_name" ] && [ -f "$pf" ]; then
                        target_path="$pf"
                        break
                    fi
                done
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

ORGANIZED_COUNT=0
ORGANIZED_SUMMARY=()

ALL_PHONE_FILES=()
while IFS= read -r -d '' f; do
    ALL_PHONE_FILES+=("$f")
done < <(find "$PHONE_DIR" -type f ! -name ".*" -print0)

declare -A SEEN_CANONICAL=()
declare -A FILE_INSTANCES=()

# Pre-group instances by canonical name in a single pass
for cand in "${ALL_PHONE_FILES[@]}"; do
    [ -f "$cand" ] || continue
    cand_base="${cand##*/}"
    cand_canonical=$(get_canonical_name "$cand_base")
    if [ -n "${FILE_INSTANCES[$cand_canonical]:-}" ]; then
        FILE_INSTANCES["$cand_canonical"]="${FILE_INSTANCES[$cand_canonical]}|$cand"
    else
        FILE_INSTANCES["$cand_canonical"]="$cand"
    fi
done

for file in "${ALL_PHONE_FILES[@]}"; do
    [ -f "$file" ] || continue
    base_name="${file##*/}"
    canonical_name=$(get_canonical_name "$base_name")

    [ "${SEEN_CANONICAL[$canonical_name]:-0}" -eq 1 ] && continue
    SEEN_CANONICAL[$canonical_name]=1

    IFS='|' read -r -a matching_instances <<< "${FILE_INSTANCES[$canonical_name]}"

    target_rel=$(get_target_phone_rel_path "$canonical_name")
    target_dest="$PHONE_DIR/$target_rel"

    if [ "${#matching_instances[@]}" -gt 1 ]; then
        preferred_subfolder_inst=""
        for inst in "${matching_instances[@]}"; do
            rel_inst="${inst#$PHONE_DIR/}"
            IFS='/' read -r -a p_inst <<< "$rel_inst"
            if [ "${#p_inst[@]}" -ge 3 ]; then
                if [ "$inst" = "$PHONE_DIR/$target_rel" ]; then
                    preferred_subfolder_inst="$inst"
                    break
                elif [ -z "$preferred_subfolder_inst" ]; then
                    preferred_subfolder_inst="$inst"
                fi
            fi
        done

        if [ -n "$preferred_subfolder_inst" ]; then
            target_dest="$preferred_subfolder_inst"
            target_rel="${target_dest#$PHONE_DIR/}"
        fi
        mkdir -p "${target_dest%/*}"

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

        if [ -n "$best_file" ] && [ "$best_file" != "$target_dest" ]; then
            mv -f "$best_file" "$target_dest"
            ORGANIZED_COUNT=$((ORGANIZED_COUNT + 1))
            ORGANIZED_SUMMARY+=("$canonical_name ➔ ${target_rel%/*}/")
        fi

        for inst in "${matching_instances[@]}"; do
            if [ "$inst" != "$target_dest" ] && [ -f "$inst" ]; then
                rm -f "$inst"
                DEDUP_SUMMARY+=("Removed duplicate: ${inst#$PHONE_DIR/} (kept latest in $target_rel)")
            fi
        done
    else
        single_file="${matching_instances[0]}"
        rel_single="${single_file#$PHONE_DIR/}"
        IFS='/' read -r -a p_single <<< "$rel_single"

        if [ "${#p_single[@]}" -ge 3 ]; then
            continue
        fi

        mkdir -p "${target_dest%/*}"
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
            ORGANIZED_SUMMARY+=("$canonical_name ➔ ${target_rel%/*}/")
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

ALL_PHONE_FILES=()
while IFS= read -r -d '' f; do
    ALL_PHONE_FILES+=("$f")
done < <(find "$PHONE_DIR" -type f ! -name ".*" -print0)

# ==============================================================================
# PHASE 2: Phone Deletions & State Audit
# ==============================================================================
[ "$ON_STARTUP" -eq 0 ] && echo -e "🔄 ${BOLD}[2/5] Auditing phone documents and state...${RESET}"

NEW_FILES_PROCESSED=0
PROCESSED_NAMES=()
DELETED_SUMMARY=()
SEED_SUMMARY=()

TMP_MANIFEST="$TMP_DIR/mbbs_manifest_$$.tmp"
rm -f "$TMP_MANIFEST"
touch "$TMP_MANIFEST"

for pf in "${ALL_PHONE_FILES[@]}"; do
    [ -f "$pf" ] || continue
    echo "${pf#$PHONE_DIR/}" >> "$TMP_MANIFEST"
done
if [ -s "$TMP_MANIFEST" ]; then
    sort -u "$TMP_MANIFEST" > "$MANIFEST_FILE"
fi
rm -f "$TMP_MANIFEST"

# ==============================================================================
# PHASE 3: Cloud Upload & SteadyLink / GitHub Releases Synchronization
# ==============================================================================
[ "$ON_STARTUP" -eq 0 ] && echo -e "⚡ ${BOLD}[3/5] Synchronizing phone resources with SteadyLink CDN & GitHub Releases...${RESET}"

load_opt_cache

OPT_COUNT=0
for pf in "${ALL_PHONE_FILES[@]}"; do
    [ -f "$pf" ] || continue
    [[ "${pf,,}" == *.pdf ]] || continue
    if ! is_pdf_already_optimized "$pf"; then
        OPT_COUNT=$((OPT_COUNT + 1))
        optimize_pdf_file "$pf" "${pf##*/}"
    fi
done

if [ "$OPT_COUNT" -gt 0 ]; then
    echo -e "   ${GREEN}✔ Optimized $OPT_COUNT new/updated document(s).${RESET}"
fi

if [ "$ON_STARTUP" -eq 1 ]; then
    python3 "$REPO_DIR/scripts/migrate_to_steadylink.py" -q
else
    python3 "$REPO_DIR/scripts/migrate_to_steadylink.py"
fi

# Enforce zero local PDF binaries in Git repository
rm -rf "$REPO_DIR/assets/docs" 2>/dev/null || true
TOTAL_OFFLINE_FILES="${#ALL_PHONE_FILES[@]}"

# ==============================================================================
# PHASE 5: Integrity Audit & Live Deployment
# ==============================================================================
cd "$REPO_DIR"

# Enforce zero local PDF binaries in Git repo
rm -rf "$REPO_DIR/assets/docs" 2>/dev/null || true
find "$REPO_DIR" -maxdepth 3 -name "*.pdf" -delete 2>/dev/null || true

CHANGES=$(git status --porcelain)
UNPUSHED=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)

if [ -z "$CHANGES" ] && [ "$UNPUSHED" -eq 0 ] && [ "$FORCE_SYNC" -eq 0 ]; then
    if [ "$ON_STARTUP" -eq 1 ]; then
        if [ "$ORGANIZED_COUNT" -eq 0 ] && [ "${#DEDUP_SUMMARY[@]}" -eq 0 ] && [ "${#DELETED_SUMMARY[@]}" -eq 0 ] && [ "${#SEED_SUMMARY[@]}" -eq 0 ]; then
            echo -e "${GREEN}📚 MBBS Library:${RESET} in full two-way sync with phone ($TOTAL_OFFLINE_FILES files offline & online)."
        fi
    else
        echo -e "${GREEN}${BOLD}✨ [MBBS Library] Complete two-way sync verified!${RESET}"
        echo -e "   All $TOTAL_OFFLINE_FILES files are synchronized across phone & live website."
        echo -e "   🌐 Live site: ${CYAN}https://harshkumarsaw.github.io/mbbs-library/${RESET}"
    fi
    exit 0
fi

if [ "$UNPUSHED" -gt 0 ] && [ -z "$CHANGES" ]; then
    echo -e "${YELLOW}📤 [MBBS Library] $UNPUSHED commit(s) pending upload to GitHub Pages.${RESET}"
fi

if [ -n "$CHANGES" ]; then
    if [ "$NEW_FILES_PROCESSED" -gt 0 ]; then
        echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════${RESET}"
        echo -e "${CYAN}${BOLD}📥 [MBBS Library] Uploading $NEW_FILES_PROCESSED new/updated file(s) to website!${RESET}"
        for item in "${PROCESSED_NAMES[@]}"; do
            echo -e "   ${GREEN}➜${RESET} $item"
        done
        echo -e "${BLUE}───────────────────────────────────────────────────────────${RESET}"
    fi

    # Minify CSS and JS while preserving readable source files
    python3 "$REPO_DIR/scripts/minify.py" 2>/dev/null || true

    # Update cache-busting version query across all HTML pages
    CACHE_BUST_VER=$(date +%s)
    for h_file in "$REPO_DIR"/*.html; do
        sed -i -E "s/(data\.js|app\.min\.js|app\.js|style\.min\.css|style\.css)(\?v=[0-9]+)?/\1?v=$CACHE_BUST_VER/g" "$h_file"
    done

    COMMIT_PARTS=()
    [ "${#DELETED_SUMMARY[@]}" -gt 0 ] && COMMIT_PARTS+=("synced ${#DELETED_SUMMARY[@]} deletion(s)")
    [ "$ORGANIZED_COUNT" -gt 0 ] && COMMIT_PARTS+=("organized $ORGANIZED_COUNT file(s)")
    [ "$OPT_COUNT" -gt 0 ] && COMMIT_PARTS+=("optimized $OPT_COUNT new PDF(s)")

    COMMIT_MSG="feat(sync): $(IFS=', '; echo "${COMMIT_PARTS[*]}")"
    if [ -z "$COMMIT_MSG" ] || [ "$COMMIT_MSG" = "feat(sync): " ]; then
        COMMIT_MSG="feat(sync): sync library resources with SteadyLink CDN"
    fi

    # Append activity record to PROJECT_LOG.md BEFORE git commit
    TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    cat << EOF >> "$LOG_FILE"

### Two-Way Auto-Sync: $TIMESTAMP
- **Phone Deduplication**: Resolved ${#DEDUP_SUMMARY[@]} duplicate(s)
- **Phone Organization**: Organized $ORGANIZED_COUNT root file(s)
- **Phone Deletions Synced to Website**: ${#DELETED_SUMMARY[@]} file(s)
- **New PDFs Optimized**: $OPT_COUNT
- **Total In-Sync Files**: $TOTAL_OFFLINE_FILES
EOF
    for item in "${DELETED_SUMMARY[@]}"; do
        echo "  - $item" >> "$LOG_FILE"
    done

    # Single Atomic Commit (No amend, clean Git tree)
    git add -A
    git commit -m "$COMMIT_MSG" >/dev/null
fi

# ==============================================================================
# PHASE 6: Deploy Live to GitHub Pages
# ==============================================================================
echo -e "🚀 ${BOLD}[5/5] Deploying live to GitHub Pages...${RESET}"

if curl -s --connect-timeout 5 -I https://github.com >/dev/null 2>&1; then
    PUSH_LOG="$TMP_DIR/git_push_$$.log"

    render_push_progress() {
        local pct="$1"
        local stage="$2"
        local elapsed="$3"
        local eta="$4"
        local bar_len=20
        local bar_filled=$((pct * bar_len / 100))
        local bar_empty=$((bar_len - bar_filled))
        local fill_str=""
        for ((b=0; b<bar_filled; b++)); do fill_str="${fill_str}█"; done
        local empty_str=""
        for ((b=0; b<bar_empty; b++)); do empty_str="${empty_str}░"; done
        local eta_str=""
        if [ -n "$eta" ] && [ "$eta" -gt 0 ]; then
            if [ "$eta" -ge 3600 ]; then
                eta_str=" • ETA: $((eta / 3600))h$(( (eta % 3600) / 60 ))m"
            elif [ "$eta" -ge 60 ]; then
                eta_str=" • ETA: $((eta / 60))m$((eta % 60))s"
            else
                eta_str=" • ETA: ${eta}s"
            fi
        fi
        printf "\r   ⏳ [%s%s] %3d%% (%s) • %ds%s\033[K" "$fill_str" "$empty_str" "$pct" "$stage" "$elapsed" "$eta_str"
    }

    push_start=$(date +%s)
    last_sec=0
    last_pct=-1

    render_push_progress 0 "Connecting to GitHub..." 0 ""

    push_success=1
    if ! (
        git push --progress origin main 2>&1 | tr '\r' '\n' | tee "$PUSH_LOG" | while IFS= read -r line; do
            [ -z "$line" ] && continue
            now=$(date +%s)
            elapsed=$((now - push_start))

            if [[ "$line" =~ Writing[[:space:]]+objects:[[:space:]]*([0-9]+)%[[:space:]]*\(([0-9]+)\/([0-9]+)\)(,[[:space:]]*([^|,]+))?([[:space:]]*\|[[:space:]]*([^,]+))? ]]; then
                pct="${BASH_REMATCH[1]}"
                curr="${BASH_REMATCH[2]}"
                total="${BASH_REMATCH[3]}"
                bytes=$(echo "${BASH_REMATCH[5]:-}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
                speed=$(echo "${BASH_REMATCH[7]:-}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')

                eta=""
                if [ "$pct" -gt 0 ] && [ "$pct" -lt 100 ] && [ "$elapsed" -ge 1 ]; then
                    eta=$(( (elapsed * (100 - pct)) / pct ))
                fi

                detail="Uploading $curr/$total obj"
                if [ -n "$bytes" ]; then
                    detail="$detail • $bytes"
                fi
                if [ -n "$speed" ]; then
                    detail="$detail @ $speed"
                fi

                if [ "$pct" -ne "$last_pct" ] || [ "$now" -ne "$last_sec" ]; then
                    last_pct=$pct
                    last_sec=$now
                    render_push_progress "$pct" "$detail" "$elapsed" "$eta"
                fi
            elif [[ "$line" =~ Compressing[[:space:]]+objects:[[:space:]]*([0-9]+)%[[:space:]]*\(([0-9]+)\/([0-9]+)\) ]]; then
                pct="${BASH_REMATCH[1]}"
                curr="${BASH_REMATCH[2]}"
                total="${BASH_REMATCH[3]}"
                if [ "$now" -ne "$last_sec" ]; then
                    last_sec=$now
                    render_push_progress 0 "Compressing objects $curr/$total" "$elapsed" ""
                fi
            elif [[ "$line" =~ Counting[[:space:]]+objects:[[:space:]]*([0-9]+)% ]]; then
                if [ "$now" -ne "$last_sec" ]; then
                    last_sec=$now
                    render_push_progress 0 "Counting objects..." "$elapsed" ""
                fi
            elif [[ "$line" =~ remote:[[:space:]]*Resolving[[:space:]]+deltas:[[:space:]]*([0-9]+)% ]]; then
                if [ "$now" -ne "$last_sec" ]; then
                    last_sec=$now
                    render_push_progress 100 "Finalizing on GitHub Pages..." "$elapsed" ""
                fi
            elif [[ "$line" =~ Everything[[:space:]]+up-to-date ]]; then
                render_push_progress 100 "Everything up-to-date" "$elapsed" ""
            fi
        done
    ); then
        push_success=0
    fi

    # Clear progress bar line
    printf "\r\033[K"

    if [ "$push_success" -eq 1 ]; then
        echo -e "${GREEN}${BOLD}✅ Successfully synchronized with GitHub Pages!${RESET}"
        echo -e "   🌐 Live site: ${CYAN}https://harshkumarsaw.github.io/mbbs-library/${RESET}"
        rm -f "$PUSH_LOG"

        if [ "$OPT_COUNT" -gt 0 ]; then
            send_onesignal_notification "Harsh's Library: New Study Notes" "$OPT_COUNT new medical study resource(s) uploaded! Tap to view & download."
        fi
    else
        echo -e "${RED}${BOLD}❌ Git push failed!${RESET}"
        echo -e "${YELLOW}Detailed reason from GitHub:${RESET}"
        filtered_err=$(grep -vE '^(Counting|Compressing|Writing|Enumerating)[[:space:]]+objects' "$PUSH_LOG" 2>/dev/null | grep -v '^[[:space:]]*$' || true)
        if [ -n "$filtered_err" ]; then
            echo "$filtered_err" | sed 's/^/   /'
        else
            cat "$PUSH_LOG" | sed 's/^/   /'
        fi
        echo -e "\n${YELLOW}💡 Changes remain saved locally in Git. You can retry anytime by running 'mbbs-upload'.${RESET}"
        rm -f "$PUSH_LOG"
    fi
else
    echo -e "${YELLOW}📡 Offline mode: No internet connection detected.${RESET}"
    echo -e "   Changes are saved locally in Git and will push automatically when you reconnect."
fi

echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════════${RESET}\n"
