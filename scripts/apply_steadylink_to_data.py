#!/usr/bin/env python3
"""
Updates js/data.js so all resources point to SteadyLink permanent CDN links.
"""

import os
import re
import json

REPO_DIR = "/data/data/com.termux/files/home/mbbs-resource-library"
DATA_FILE = os.path.join(REPO_DIR, "js", "data.js")
MANIFEST_FILE = os.path.join(REPO_DIR, "steadylink_manifest.json")

def normalize_key(s):
    base = os.path.basename(s).lower()
    base = re.sub(r'[^a-z0-9]', '', base)
    return base

def main():
    if not os.path.exists(MANIFEST_FILE):
        print("Manifest file not found!")
        return

    with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    norm_manifest = {}
    for name, data in manifest.items():
        if data.get("url"):
            norm_manifest[normalize_key(name)] = data["url"]

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # Pattern to find each object in MBBS_RESOURCES
    # We will update fileUrl for each item
    def replace_file_url(match):
        orig_line = match.group(0)
        url = match.group(1)
        base = normalize_key(url)
        
        # Check direct or normalized match
        cdn_url = norm_manifest.get(base)
        if not cdn_url:
            # Special check for ak_jain_part1
            if "akjain" in base and "part1" in norm_manifest:
                cdn_url = norm_manifest.get("akjainphysiologypart1pdf")
        
        if cdn_url:
            return f'fileUrl: "{cdn_url}"'
        else:
            return orig_line

    new_content = re.sub(r'fileUrl:\s*"([^"]+)"', replace_file_url, content)

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        f.write(new_content)

    print("Updated js/data.js with SteadyLink CDN URLs successfully.")

if __name__ == "__main__":
    main()
