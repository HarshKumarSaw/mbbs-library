# MBBS Resource Library - Activity & Implementation Log

## Overview
- **Project**: MBBS Academic Digital Resource Library
- **Maintainer**: HarshKumarSaw (`harshsaw01@gmail.com`)
- **Target Platform**: GitHub Pages (Static, 100% Free, Zero Backend)
- **Local Directory**: `/data/data/com.termux/files/home/mbbs-resource-library`
- **GitHub Repository**: [https://github.com/HarshKumarSaw/mbbs-library](https://github.com/HarshKumarSaw/mbbs-library)
- **Git Remote**: `git@github.com:HarshKumarSaw/mbbs-library.git`
- **Live Website URL**: `https://harshkumarsaw.github.io/mbbs-library/` (once Pages is enabled)

---

## Detailed Chronological Log

### Session 1: Project Architecture & Construction (Nov 6, 2026 ~17:24 - 17:46 UTC)
1. **Environment Setup & Tool Discovery**:
   - Evaluated Termux environment capabilities.
   - Installed `git` (v2.56.0) and `busybox` (v1.38.0).
2. **Directory & Asset Structure**:
   - Created organized directory layout:
     ```
     mbbs-resource-library/
     ├── index.html                   # Central library portal with search & filters
     ├── anatomy.html                 # Dedicated Anatomy department portal
     ├── physiology.html              # Dedicated Physiology department portal
     ├── biochemistry.html            # Dedicated Biochemistry department portal
     ├── 404.html                     # Fallback 404 page for GitHub Pages
     ├── .nojekyll                    # Ensures GitHub Pages serves static files directly
     ├── README.md                    # Deployment and maintenance guide
     ├── PROJECT_LOG.md               # Continuous project progress log
     ├── css/
     │   └── style.css                # Clean white & navy-blue responsive design system
     ├── js/
     │   ├── app.js                   # Instant search engine, category filter, modal PDF reader
     │   └── data.js                  # Centralized client-side resource store
     ├── assets/
     │   └── docs/                    # Organized PDF document repository
     │       ├── anatomy/             # Notes, assignments, SDLs, practicals, exam banks
     │       ├── physiology/          # Wiggers diagrams, ABG cases, hematology SOPs
     │       └── biochemistry/        # Metabolic pathways, inborn errors, lab manuals
     └── scripts/
         └── generate_sample_pdfs.sh  # Script to generate valid starter PDFs
     ```
3. **Frontend & Design System**:
   - Built modern **Navy Blue & Crisp White** design (`#0a192f`, `#1e3a8a`, `#2563eb`, `#ffffff`).
   - Implemented responsive mobile drawer navigation and touch-scrollable category pills.
   - Built dual-action PDF viewer modal (inline reading + new tab + direct download).
   - Designed 5-tier categorization: Notes, Assignments, SDLs, Practicals, and Other Resources.
4. **Starter Resources & PDF Generation**:
   - Generated 18 valid starter medical PDF resources across Anatomy, Physiology, and Biochemistry.
   - Populated `js/data.js` with comprehensive metadata (CBME codes, topics, file sizes, tags).
5. **Local Verification**:
   - Tested web server with `busybox httpd -p 18080`.
   - Verified HTTP 200 responses across all HTML, CSS, JS, and PDF files.
6. **Git Initialization**:
   - Initialized git repository on branch `main`.

---

### Session 2: GitHub Repository Setup & Push (Nov 6, 2026 ~18:03 - 18:22 UTC)
1. **SSH Authentication Verification**:
   - Confirmed SSH authentication as user **`HarshKumarSaw`**.
2. **Commit Attribution Update**:
   - Re-attributed commits to `HarshKumarSaw <harshsaw01@gmail.com>`.
3. **Remote Configuration**:
   - Configured `origin` remote: `git@github.com:HarshKumarSaw/mbbs-library.git`.
   - Set up SSH command with `core.sshCommand = "ssh -o StrictHostKeyChecking=accept-new"`.
4. **Code Push**:
   - Executed `git push -u origin main`.
   - Successfully uploaded 42 objects, created `main` branch tracking `origin/main`.
5. **Next Step**:
   - Enable GitHub Pages under Repository Settings -> Pages (Source: `main`, folder `/root`).

### Auto-Sync from Phone: 2026-11-06 18:36:45 UTC
- **New Files Uploaded**: 2
- Anatomy Diagrams.pdf (Anatomy / Practicals)
- Physiology Assignment.pdf (Physiology / Assignments)
