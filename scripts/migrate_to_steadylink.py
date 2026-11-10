#!/usr/bin/env python3
"""
MBBS Resource Library - SteadyLink Cloud Storage & Sync Engine
Uploads PDF resources directly to SteadyLink CDN, maintains the manifest,
and synchronizes entries in js/data.js without storing PDF binaries in Git.
"""

import os
import sys
import re
import time
import json
import subprocess
import urllib.request
import urllib.parse
import steadylink

API_KEY = os.getenv("STEADYLINK_API_KEY", "slk_8Zsm4lcaK1VUbRTnnmf9y2zVGiaxmFq2EYsYGozCTrE")
BUCKET_ID = "483cf5d1-f274-4918-a607-a643710eac24"

REPO_DIR = "/data/data/com.termux/files/home/mbbs-resource-library"
PHONE_DIR = "/storage/emulated/0/mbbs-library"
if not os.path.isdir(PHONE_DIR) and os.path.isdir(os.path.expanduser("~/storage/shared/mbbs-library")):
    PHONE_DIR = os.path.expanduser("~/storage/shared/mbbs-library")

MANIFEST_FILE = os.path.join(REPO_DIR, "steadylink_manifest.json")
DATA_FILE = os.path.join(REPO_DIR, "js", "data.js")

def normalize_key(s):
    base = os.path.basename(s).lower()
    return re.sub(r'[^a-z0-9]', '', base)

def format_file_size(num_bytes):
    if num_bytes >= 1048576:
        return f"{num_bytes / 1048576:.1f} MB"
    elif num_bytes >= 1024:
        return f"{num_bytes / 1024:.0f} KB"
    return f"{num_bytes} B"

def format_title(name):
    clean = re.sub(r'\.pdf$', '', name, flags=re.IGNORECASE)
    clean = re.sub(r'[_\-]+', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean.title()

def sanitize_github_asset_name(name):
    # GitHub sanitizes release asset filenames: spaces -> _, non-alphanumeric -> .
    clean = name.replace(' ', '_')
    clean = re.sub(r'[^a-zA-Z0-9_\-\.]', '.', clean)
    clean = re.sub(r'\.{2,}', '.', clean)
    return clean

def detect_subject(path_or_name):
    low = path_or_name.lower()
    if 'anat' in low:
        return 'anatomy', 'Anatomy'
    elif 'phys' in low:
        return 'physiology', 'Physiology'
    elif 'biochem' in low:
        return 'biochemistry', 'Biochemistry'
    elif 'community' in low or 'psm' in low:
        return 'community_medicine', 'Community Medicine'
    elif 'aetcom' in low:
        return 'aetcom', 'AETCOM'
    elif 'ece' in low:
        return 'ece', 'ECE'
    elif 'foundation' in low:
        return 'foundation', 'Foundation'
    return 'other', 'Library'

def detect_category(path_or_name):
    low = path_or_name.lower()
    if 'sdl' in low:
        return 'sdl', 'SDL'
    elif 'note' in low or 'lecture' in low or 'theory' in low:
        return 'notes', 'Notes'
    elif 'homework' in low:
        return 'homework', 'Homework'
    elif 'project' in low:
        return 'project', 'Project'
    elif 'assign' in low:
        return 'assignments', 'Assignments'
    elif 'histo' in low:
        return 'histology', 'Histology'
    elif 'diagram' in low or 'pract' in low or 'manual' in low:
        return 'practicals', 'Practicals'
    elif 'book' in low:
        return 'books', 'Books'
    return 'other', 'Other'

def get_pdf_page_count(filepath):
    if not filepath or not os.path.exists(filepath):
        return None
    try:
        out = subprocess.check_output(['qpdf', '--show-npages', filepath], stderr=subprocess.DEVNULL).decode().strip()
        count = int(out)
        if count == 1:
            return "1 Page"
        elif count > 1:
            return f"{count} Pages"
    except Exception:
        pass
    return None

def load_manifest():
    if os.path.exists(MANIFEST_FILE):
        try:
            with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning loading manifest: {e}")
    return {}

def save_manifest(manifest):
    new_json = json.dumps(manifest, indent=2, ensure_ascii=False)
    if os.path.exists(MANIFEST_FILE):
        try:
            with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
                if f.read().strip() == new_json.strip():
                    return
        except Exception:
            pass
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        f.write(new_json + "\n")

def get_existing_bucket_objects(client, bucket_id):
    try:
        data = client.request("GET", f"/api/assets/{bucket_id}/objects")
        items = data.get("items", [])
        existing = {}
        for item in items:
            key = item.get("key") or item.get("name")
            asset_id = item.get("objectAssetId")
            if key and asset_id:
                existing[key] = {
                    "asset_id": asset_id,
                    "url": f"https://cdn.steadylink.io/a/{asset_id}",
                    "size": item.get("size", 0),
                    "status": "ready"
                }
        return existing
    except Exception as e:
        print(f"Could not fetch bucket objects: {e}")
        return {}

def format_speed(bps):
    if bps >= 1073741824:
        return f"{bps / 1073741824:.2f} GB/s"
    elif bps >= 1048576:
        return f"{bps / 1048576:.2f} MB/s"
    elif bps >= 1024:
        return f"{bps / 1024:.0f} KB/s"
    return f"{bps:.0f} B/s"

def render_upload_progress(pct, sent_bytes, total_bytes, speed_bps, elapsed_sec, eta_sec):
    bar_len = 20
    filled = int(pct * bar_len / 100)
    empty = max(0, bar_len - filled)
    bar_str = "█" * filled + "░" * empty

    sent_str = format_file_size(sent_bytes)
    tot_str = format_file_size(total_bytes)
    spd_str = format_speed(speed_bps) if speed_bps > 0 else "-- KB/s"

    if eta_sec is not None and eta_sec > 0:
        sec = int(eta_sec)
        if sec >= 3600:
            eta_str = f" • ETA: {sec // 3600}h{(sec % 3600) // 60}m"
        elif sec >= 60:
            eta_str = f" • ETA: {sec // 60}m{sec % 60}s"
        else:
            eta_str = f" • ETA: {sec}s"
    else:
        eta_str = ""

    sys.stdout.write(f"\r   ⏳ [{bar_str}] {pct:3d}% ({sent_str} / {tot_str} @ {spd_str}) • {int(elapsed_sec)}s{eta_str}\033[K")
    sys.stdout.flush()

class ProgressFileStream:
    def __init__(self, filepath, on_progress=None, chunk_size=131072):
        self.file_obj = open(filepath, "rb")
        self.total_size = os.path.getsize(filepath)
        self.bytes_sent = 0
        self.on_progress = on_progress
        self.chunk_size = chunk_size
        self.start_time = time.time()
        self.last_update = 0

    def read(self, size=-1):
        amt = self.chunk_size if size <= 0 else min(size, self.chunk_size)
        chunk = self.file_obj.read(amt)
        if chunk:
            self.bytes_sent += len(chunk)
            now = time.time()
            if self.on_progress and (now - self.last_update >= 0.25 or self.bytes_sent >= self.total_size):
                self.last_update = now
                elapsed = max(now - self.start_time, 0.001)
                pct = int(self.bytes_sent * 100 / self.total_size)
                speed = self.bytes_sent / elapsed
                eta = (self.total_size - self.bytes_sent) / max(speed, 1) if speed > 0 else 0
                self.on_progress(pct, self.bytes_sent, self.total_size, speed, elapsed, eta)
        return chunk

    def __len__(self):
        return self.total_size

    def close(self):
        self.file_obj.close()

def upload_large_pdf_to_github_release(file_path, filename):
    """
    Directly uploads large documents (>25MB) to GitHub Releases (v1.0.0-assets)
    with real-time animated upload progress (percentage, transfer speed, elapsed, and ETA).
    Preserves document quality without aggressive secondary downsampling.
    """
    safe_filename = sanitize_github_asset_name(filename)
    size = os.path.getsize(file_path)
    size_str = format_file_size(size)
    print(f"\n📦 Large Document (>25MB) detected: {filename} ({size_str})")
    print(f"   🚀 Routing directly to GitHub Releases (v1.0.0-assets)...")

    release_tag = "v1.0.0-assets"
    repo = "HarshKumarSaw/mbbs-library"
    download_url = f"https://github.com/{repo}/releases/download/{release_tag}/{safe_filename}"

    # 1. Obtain GitHub token
    token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
    if not token:
        try:
            tok_res = subprocess.run(["gh", "auth", "token"], capture_output=True, text=True)
            if tok_res.returncode == 0:
                token = tok_res.stdout.strip()
        except Exception:
            token = None

    uploaded = False

    # 2. Primary Route: Direct GitHub Releases Streaming API with Live Progress Bar
    if token:
        for attempt in range(1, 4):
            try:
                # Fetch release details and release ID
                tag_url = f"https://api.github.com/repos/{repo}/releases/tags/{release_tag}"
                tag_req = urllib.request.Request(tag_url)
                tag_req.add_header("Authorization", f"token {token}")
                tag_req.add_header("User-Agent", "MBBS-Sync-Client")
                tag_req.add_header("Accept", "application/vnd.github+json")

                with urllib.request.urlopen(tag_req, timeout=30) as resp:
                    rel_data = json.load(resp)
                    release_id = rel_data.get("id")
                    assets = rel_data.get("assets", [])

                # Clobber: Delete old asset if already exists
                for asset in assets:
                    if asset.get("name") == safe_filename:
                        del_url = f"https://api.github.com/repos/{repo}/releases/assets/{asset.get('id')}"
                        del_req = urllib.request.Request(del_url, method="DELETE")
                        del_req.add_header("Authorization", f"token {token}")
                        del_req.add_header("User-Agent", "MBBS-Sync-Client")
                        try:
                            urllib.request.urlopen(del_req, timeout=30)
                        except Exception:
                            pass

                # Upload asset with streaming ProgressFileStream
                encoded_name = urllib.parse.quote(safe_filename)
                upload_url = f"https://uploads.github.com/repos/{repo}/releases/{release_id}/assets?name={encoded_name}"

                pstream = ProgressFileStream(file_path, render_upload_progress, chunk_size=131072)
                up_req = urllib.request.Request(upload_url, data=pstream, method="POST")
                up_req.add_header("Authorization", f"token {token}")
                up_req.add_header("User-Agent", "MBBS-Sync-Client")
                up_req.add_header("Content-Type", "application/octet-stream")
                up_req.add_header("Content-Length", str(size))

                # Render initial 0% frame
                render_upload_progress(0, 0, size, 0, 0, 0)
                t0 = time.time()
                try:
                    with urllib.request.urlopen(up_req, timeout=3600) as up_resp:
                        if up_resp.status in (200, 201):
                            sys.stdout.write("\r\033[K")
                            sys.stdout.flush()
                            elapsed = time.time() - t0
                            speed_mb = (size / 1048576) / max(elapsed, 0.1)
                            print(f"   ✅ Successfully uploaded {safe_filename} to GitHub Releases in {elapsed:.1f}s ({speed_mb:.2f} MB/s)!")
                            uploaded = True
                            break
                        else:
                            sys.stdout.write("\r\033[K")
                            sys.stdout.flush()
                            print(f"   ⚠️  GitHub API returned status {up_resp.status} (attempt {attempt}/3)")
                finally:
                    pstream.close()

            except Exception as api_err:
                sys.stdout.write("\r\033[K")
                sys.stdout.flush()
                if attempt < 3:
                    print(f"   ⚠️  Upload attempt {attempt} failed ({api_err}). Retrying in 2s...")
                    time.sleep(2)
                else:
                    print(f"   ⚠️  Direct API upload encountered an issue ({api_err}), trying gh CLI fallback...")

    # 3. Fallback: gh CLI if token was missing or direct API was interrupted
    if not uploaded:
        gh_available = subprocess.run(["command", "-v", "gh"], shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).returncode == 0
        if gh_available:
            auth_proc = subprocess.run(["gh", "auth", "status"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if auth_proc.returncode == 0 or token:
                print(f"   ⬆️  Uploading {safe_filename} to release {release_tag} via gh CLI...")
                upload_cmd = ["gh", "release", "upload", release_tag, file_path, "--clobber", "--repo", repo]
                res = subprocess.run(upload_cmd)
                if res.returncode == 0:
                    print(f"   ✅ Successfully uploaded {safe_filename} to GitHub Releases!")
                    uploaded = True
                else:
                    print(f"   ⚠️  gh release upload failed with exit code {res.returncode}")
            else:
                print(f"   ⚠️  gh CLI not logged in. Run 'gh auth login' or export GH_TOKEN.")
        else:
            print(f"   ⚠️  gh CLI not installed.")

    if not uploaded:
        return None

    return {
        "asset_id": f"gh-release-{safe_filename}",
        "url": download_url,
        "download_url": download_url,
        "size": size,
        "status": "ready",
        "storage": "github-release",
        "is_large_file": True
    }

def upload_single_pdf_curl(client, file_path, filename, retries=3):
    size = os.path.getsize(file_path)
    if size > 25 * 1024 * 1024:
        return upload_large_pdf_to_github_release(file_path, filename)

    print(f"\n📦 Preparing upload: {filename} ({format_file_size(size)})...")

    for attempt in range(1, retries + 1):
        try:
            # 1. Create upload batch
            upload_file = steadylink.UploadFile(
                filename=filename,
                size=size,
                contentType="application/pdf",
                path=""
            )
            batch = client.create_upload_batch(BUCKET_ID, [upload_file])
            batch_id = batch["id"]
            file_info = batch["files"][0]
            session_id = file_info["id"]

            content_url = f"https://api.steadylink.io/api/upload-sessions/{session_id}/content"
            print(f"   ⬆️  Streaming {filename} to SteadyLink CDN (attempt {attempt}/{retries})...")

            # Stream via ProgressFileStream with real-time animated progress bar
            pstream = ProgressFileStream(file_path, render_upload_progress, chunk_size=65536)
            put_req = urllib.request.Request(content_url, data=pstream, method="PUT")
            put_req.add_header("X-API-Key", API_KEY)
            put_req.add_header("Content-Type", "application/octet-stream")
            put_req.add_header("Content-Length", str(size))

            render_upload_progress(0, 0, size, 0, 0, 0)
            t0 = time.time()
            try:
                with urllib.request.urlopen(put_req, timeout=300) as put_resp:
                    if put_resp.status in (200, 204):
                        sys.stdout.write("\r\033[K")
                        sys.stdout.flush()
                        elapsed = time.time() - t0
                        speed_mb = (size / 1048576) / max(elapsed, 0.1)
                        print(f"   ✔ Bytes transferred in {elapsed:.1f}s ({speed_mb:.2f} MB/s)")
            except Exception:
                sys.stdout.write("\r\033[K")
                sys.stdout.flush()
                # Fallback to curl
                cmd = [
                    "curl", "-sS", "-w", "\nHTTP %{http_code} in %{time_total}s\n",
                    "--connect-timeout", "30",
                    "--max-time", "300",
                    "-X", "PUT",
                    "-T", file_path,
                    "-H", f"X-API-Key: {API_KEY}",
                    "-H", "Content-Type: application/octet-stream",
                    content_url
                ]
                res = subprocess.run(cmd, capture_output=True, text=True)
                if "200" in res.stdout or "204" in res.stdout:
                    elapsed = time.time() - t0
                    speed_mb = (size / 1048576) / max(elapsed, 0.1)
                    print(f"   ✔ Bytes transferred in {elapsed:.1f}s ({speed_mb:.2f} MB/s)")
                else:
                    raise RuntimeError(f"Curl content upload failed: {res.stdout} / {res.stderr}")
            finally:
                pstream.close()

            # 3. Complete session
            print("   🔄 Finalizing session...")
            client.complete_upload(session_id)

            # 4. Poll batch status
            asset_id = None
            for _ in range(60):
                time.sleep(1.5)
                batch_status = client.request("GET", f"/api/upload-batches/{batch_id}")
                current_file = batch_status["files"][0]
                status = current_file.get("status")
                if status == "ready":
                    asset_id = current_file.get("objectAssetId")
                    break
                elif status in ("failed", "blocked", "cancelled"):
                    raise RuntimeError(f"Upload failed: status={status}, error={current_file.get('error')}")

            if not asset_id:
                raise TimeoutError(f"Upload timed out waiting for asset processing on {filename}")

            cdn_url = f"https://cdn.steadylink.io/a/{asset_id}"
            print(f"   🎉 Ready on CDN: {cdn_url}")

            return {
                "asset_id": asset_id,
                "url": cdn_url,
                "size": size,
                "filename": filename,
                "uploaded_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
            }

        except Exception as e:
            print(f"   ⚠️  Attempt {attempt} failed: {e}")
            if attempt < retries:
                time.sleep(3)
            else:
                raise

def collect_phone_pdfs():
    pdfs = {}
    if os.path.isdir(PHONE_DIR):
        for root, _, files in os.walk(PHONE_DIR):
            for f in files:
                if f.lower().endswith(".pdf"):
                    pdfs[f] = os.path.join(root, f)
    return pdfs

def sync_data_js(manifest, phone_pdfs, quiet=False):
    """Ensure js/data.js reflects active phone PDFs with their SteadyLink CDN URLs."""
    if not os.path.exists(DATA_FILE):
        return

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    norm_manifest = {}
    for name, item in manifest.items():
        if item.get("url") and item.get("status") != "pending_upload":
            norm_manifest[normalize_key(name)] = item["url"]

    # Rewrite any existing local fileUrl to CDN link
    def repl_url(m):
        orig = m.group(0)
        url = m.group(1)
        if url.startswith("http"):
            return orig
        base = normalize_key(url)
        if base in norm_manifest:
            return f'fileUrl: "{norm_manifest[base]}"'
        return orig

    new_content = re.sub(r'fileUrl:\s*"([^"]+)"', repl_url, content)

    # 2. Prune any auto-synced resources whose document was deleted from phone
    phone_filenames_norm = {normalize_key(f) for f in phone_pdfs.keys()}

    def prune_deleted_items(text):
        # Match each resource object: { ... }
        def obj_filter(match):
            block = match.group(0)
            # Only prune auto-synced / mobile upload items
            if "Mobile Upload" in block or "Uploaded document:" in block:
                doc_m = re.search(r'Uploaded document:\s*([^.]+?\.pdf)', block, re.IGNORECASE)
                if doc_m:
                    doc_fname = doc_m.group(1).strip()
                    if normalize_key(doc_fname) not in phone_filenames_norm:
                        print(f"🗑️  Pruned deleted document from data.js: {doc_fname}")
                        return ""
            return block

        return re.sub(r'\{\s*id:\s*"[^"]+"[^{}]*?\n\s*\},?', obj_filter, text)

    new_content = prune_deleted_items(new_content)

    # 3. Add or update phone PDFs in data.js
    missing_entries = []
    for fname, fpath in phone_pdfs.items():
        base_norm = normalize_key(fname)
        meta = manifest.get(fname) or manifest.get(base_norm)
        if not meta or not meta.get("url") or meta.get("status") == "pending_upload":
            continue

        cdn_url = meta["url"]
        subj_id, subj_disp = detect_subject(fpath)
        cat_id, cat_disp = detect_category(fpath)
        title = format_title(fname)
        f_size = os.path.getsize(fpath) if os.path.exists(fpath) else 0
        size_disp = format_file_size(f_size)
        pages_count = get_pdf_page_count(fpath)
        f_mtime = os.path.getmtime(fpath) if os.path.exists(fpath) else time.time()
        f_date = time.strftime("%d %b %Y", time.localtime(f_mtime))
        f_updated_ts = int(f_mtime)
        safe_fname = sanitize_github_asset_name(fname)
        dl_url = meta.get("download_url") or f"https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/{safe_fname}"

        # Match existing entry in data.js by uploaded filename or title strictly within single object braces
        doc_pattern = rf'(\{{\s*id:\s*"[^"]+"[^{{}}]*?Uploaded document:\s*{re.escape(fname)}[^{{}}]*?\n\s*\}})'
        m = re.search(doc_pattern, new_content, re.IGNORECASE)
        if not m:
            doc_pattern = rf'(\{{\s*id:\s*"[^"]+"[^{{}}]*?title:\s*"{re.escape(title)}"[^{{}}]*?\n\s*\}})'
            m = re.search(doc_pattern, new_content)

        if m:
            old_block = m.group(1)
            updated_block = old_block
            updated_block = re.sub(r'fileUrl:\s*"[^"]+"', f'fileUrl: "{cdn_url}"', updated_block, count=1)
            updated_block = re.sub(r'downloadUrl:\s*"[^"]+"', f'downloadUrl: "{dl_url}"', updated_block, count=1)
            updated_block = re.sub(r'fileSize:\s*"[^"]+"', f'fileSize: "{size_disp}"', updated_block, count=1)
            if pages_count:
                if "pages:" in updated_block:
                    updated_block = re.sub(r'pages:\s*"[^"]+"', f'pages: "{pages_count}"', updated_block, count=1)
                else:
                    updated_block = re.sub(r'(fileSize:\s*"[^"]+")', rf'\1,\n    pages: "{pages_count}"', updated_block, count=1)
            updated_block = re.sub(r'date:\s*"[^"]+"', f'date: "{f_date}"', updated_block, count=1)

            if "updatedAt:" in updated_block:
                updated_block = re.sub(r'updatedAt:\s*\d+', f'updatedAt: {f_updated_ts}', updated_block, count=1)
            else:
                updated_block = re.sub(r'(date:\s*"[^"]+")', rf'\1,\n    updatedAt: {f_updated_ts}', updated_block, count=1)

            is_large = (f_size >= 25 * 1024 * 1024) or (meta.get("storage") == "github-release")
            if is_large:
                if "isLargeFile" not in updated_block:
                    updated_block = re.sub(r'(\n\s*year:\s*"[^"]+")', r'\1,\n    isLargeFile: true,\n    storage: "github-release"', updated_block)
                else:
                    updated_block = re.sub(r'isLargeFile:\s*(?:true|false)', 'isLargeFile: true', updated_block)
                    updated_block = re.sub(r'storage:\s*"[^"]+"', 'storage: "github-release"', updated_block)

            if updated_block != old_block:
                new_content = new_content.replace(old_block, updated_block, 1)
                print(f"✔ Updated entry in js/data.js: {title} ({size_disp})")
        else:
            safe_slug = re.sub(r'[^a-z0-9]', '_', fname.lower()).strip('_')
            uid = f"user-{subj_id[:4]}-{safe_slug[:20]}-{int(time.time()) % 10000:04d}"

            # Check if large document (>25MB) or hosted on GitHub Releases
            is_large = (f_size >= 25 * 1024 * 1024) or (meta.get("storage") == "github-release")
            tags = [subj_disp, cat_disp, "Mobile Upload"]
            if is_large:
                tags.append("Large Book")
                desc = f"Uploaded document: {fname}. Comprehensive reference book ({size_disp}) hosted on GitHub Releases for high-speed direct download."
                pages_disp = pages_count if pages_count else "Textbook"
                large_meta = """,
    isLargeFile: true,
    storage: "github-release"
"""
            else:
                desc = f"Uploaded document: {fname}. Organized under {subj_disp} ({cat_disp})."
                pages_disp = pages_count if pages_count else "Document"
                large_meta = ""

            entry = f"""  {{
    id: "{uid}",
    title: "{title}",
    subject: "{subj_id}",
    category: "{cat_id}",
    code: "{subj_disp} / {cat_disp}",
    description: "{desc}",
    tags: {json.dumps(tags)},
    fileUrl: "{cdn_url}",
    downloadUrl: "{dl_url}",
    fileSize: "{size_disp}",
    pages: "{pages_disp}",
    author: "HarshKumarSaw",
    date: "{f_date}",
    updatedAt: {f_updated_ts},
    year: "1st Year MBBS"{large_meta}
  }},"""
            missing_entries.append(entry)

    if missing_entries:
        insert_marker = "// __AUTO_RESOURCES_START__"
        if insert_marker in new_content:
            parts = new_content.split(insert_marker, 1)
            new_content = parts[0] + insert_marker + "\n" + "\n".join(missing_entries) + parts[1]

    # Re-sort all auto-synced resources from newest to oldest by updated date / timestamp
    start_marker = "// __AUTO_RESOURCES_START__"
    end_marker = "// __AUTO_RESOURCES_END__"
    if start_marker in new_content and end_marker in new_content:
        pre, rest = new_content.split(start_marker, 1)
        mid, post = rest.split(end_marker, 1)

        blocks = [b.group(1).strip() for b in re.finditer(r'(\{\s*id:\s*"[^"]+"[^{}]*?\})', mid)]

        def block_sort_key(b):
            m_up = re.search(r'updatedAt:\s*(\d+)', b)
            if m_up:
                return int(m_up.group(1))
            m_d = re.search(r'date:\s*"([^"]+)"', b)
            if m_d:
                try:
                    return int(time.mktime(time.strptime(m_d.group(1), "%d %b %Y")))
                except Exception:
                    pass
            return 0

        blocks.sort(key=block_sort_key, reverse=True)

        formatted_blocks = []
        for b in blocks:
            lines = b.splitlines()
            if lines and not lines[0].startswith("  "):
                lines[0] = "  " + lines[0]
            formatted_blocks.append("\n".join(lines))

        sorted_mid = "\n" + ",\n".join(formatted_blocks) + ",\n  "
        new_content = pre + start_marker + sorted_mid + end_marker + post

    if new_content != content:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("✔ Synced js/data.js with active resources.")
    elif not quiet:
        print("✔ js/data.js is already up-to-date.")

def main():
    quiet = "-q" in sys.argv or "--quiet" in sys.argv
    force_refresh = "--refresh" in sys.argv or "--force" in sys.argv
    if not quiet:
        print("=" * 65)
        print("  🩺 MBBS LIBRARY ➔ STEADYLINK CLOUD ENGINE")
        print("=" * 65)

    # 1. Load manifest & discover phone PDFs
    manifest = load_manifest()
    phone_pdfs = collect_phone_pdfs()
    if not quiet:
        print(f"📋 Found {len(phone_pdfs)} PDF document(s) on phone.")

    norm_manifest = {
        normalize_key(k): v for k, v in manifest.items()
        if v.get("url") and v.get("status") != "pending_upload"
    }

    # Check if any phone PDFs are missing from manifest OR have changed size
    missing_from_manifest = []
    for fn, fp in phone_pdfs.items():
        base_norm = normalize_key(fn)
        meta = manifest.get(fn) or manifest.get(base_norm)
        if not meta or not meta.get("url") or meta.get("status") == "pending_upload":
            missing_from_manifest.append(fn)
        else:
            curr_size = os.path.getsize(fp) if os.path.exists(fp) else 0
            if curr_size != meta.get("size"):
                missing_from_manifest.append(fn)

    client = None
    if missing_from_manifest or force_refresh:
        client = steadylink.SteadyLink(api_key=API_KEY)
        existing_bucket = get_existing_bucket_objects(client, BUCKET_ID)
        for name, item in existing_bucket.items():
            if name not in manifest:
                manifest[name] = item
        save_manifest(manifest)
        norm_manifest = {
            normalize_key(k): v for k, v in manifest.items()
            if v.get("url") and v.get("status") != "pending_upload"
        }

    uploaded_count = 0
    skipped_count = 0

    for filename, file_path in phone_pdfs.items():
        base_norm = normalize_key(filename)
        curr_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
        existing_meta = manifest.get(filename) or manifest.get(base_norm)

        if existing_meta and existing_meta.get("url") and existing_meta.get("status") != "pending_upload":
            if existing_meta.get("size") == curr_size:
                skipped_count += 1
                continue
            else:
                print(f"🔄 Detected updated document: {filename} (was {format_file_size(existing_meta.get('size', 0))}, now {format_file_size(curr_size)})")

        if client is None:
            client = steadylink.SteadyLink(api_key=API_KEY)

        try:
            res = upload_single_pdf_curl(client, file_path, filename)
            if res:
                manifest[filename] = res
                norm_manifest[base_norm] = res.get("url") if isinstance(res, dict) else res
                save_manifest(manifest)
                uploaded_count += 1
        except Exception as e:
            print(f"❌ Error uploading {filename}: {e}")

    # 3. Synchronize js/data.js
    sync_data_js(manifest, phone_pdfs, quiet=quiet)

    if not quiet or uploaded_count > 0:
        print("=" * 65)
        print(f" Migration Status:")
        print(f"   - Newly uploaded: {uploaded_count}")
        print(f"   - Already on CDN: {skipped_count}")
        print(f"   - Total managed:  {len(manifest)}")
        print("=" * 65)

if __name__ == "__main__":
    main()
