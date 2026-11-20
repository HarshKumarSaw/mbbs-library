#!/usr/bin/env python3
"""
MBBS Resource Library - Automated Git Merge Driver for Timetable JSON Cache
Resolves merge conflicts automatically when GitHub Actions and local scripts
both update assets/data/timetable_college.json.
"""
import sys
import os
import shutil
import subprocess

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
target_file = sys.argv[2] if len(sys.argv) > 2 else os.path.join(REPO_DIR, "assets", "data", "timetable_college.json")
other_file = sys.argv[3] if len(sys.argv) > 3 else None

# 1. Try regenerating the latest timetable JSON cache from the calendar feed
try:
    sync_script = os.path.join(REPO_DIR, "scripts", "sync_timetable.py")
    if os.path.isfile(sync_script):
        res = subprocess.run([sys.executable, sync_script], cwd=REPO_DIR, capture_output=True, timeout=15)
        if res.returncode == 0 and os.path.isfile(target_file) and os.path.getsize(target_file) > 100:
            sys.exit(0)
except Exception:
    pass

# 2. Fallback: Copy incoming (theirs/other) version into target file if available
if other_file and os.path.isfile(other_file) and os.path.getsize(other_file) > 100:
    try:
        shutil.copyfile(other_file, target_file)
        sys.exit(0)
    except Exception:
        pass

# Always exit 0 to prevent rebase/merge blockages
sys.exit(0)
