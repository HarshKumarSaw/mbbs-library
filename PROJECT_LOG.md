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

### Auto-Sync from Phone: 2026-11-06 18:40:19 UTC
- **New Files Uploaded**: 1
- Histology.pdf (Anatomy / Other)

### Auto-Sync & Organization: 2026-11-06 18:43:27 UTC
- **Phone Organization**: Organized 2 unorganized files into subject folders
- **New Files Uploaded to Site**: 0

### Auto-Sync & Organization: 2026-11-06 18:43:54 UTC
- **Phone Organization**: Organized 1 unorganized files into subject folders
- **New Files Uploaded to Site**: 1
- Biochemistry Enzymes Notes.pdf (Biochemistry / Notes)

### Auto-Sync & Curriculum Organization: 2026-11-06 18:49:52 UTC
- **Phone Organization**: Organized 1 file(s) into 1st Year MBBS subject & subdiscipline folders
- **New Files Uploaded to Site**: 1
- Anatomy SDL.pdf (Anatomy / Sdls)

### Auto-Sync & Dynamic Folder Sync: 2026-11-06 18:58:37 UTC
- **Phone Organization**: Organized 0 file(s) on phone
- **New Files Uploaded to Site**: 2
- Histology.pdf (Anatomy / Histology)
- ECG Cardiac Project.pdf (Physiology / Project)

### Auto-Sync & Dynamic Folder Sync: 2026-11-06 18:59:16 UTC
- **Phone Organization**: Organized 0 file(s) on phone
- **New Files Uploaded to Site**: 1
- ECG Cardiac Project.pdf [updated file]

### Auto-Sync & Dynamic Folder Sync: 2026-11-06 19:01:22 UTC
- **Phone Organization**: Organized 2 file(s) on phone
- **New Files Uploaded to Site**: 2
- Physiology Project.pdf (Physiology / Other)
- Physiology Practical.pdf (Physiology / Other)

### Auto-Sync & Version Deduplication: 2026-11-06 19:07:36 UTC
- **Phone Deduplication**: Resolved 1 version duplicate(s)
- **Phone Organization**: Organized 0 file(s) on phone
- **Files Uploaded / Updated**: 1
- Anatomy Diagrams.pdf [updated with latest version]

### Auto-Sync & Version Deduplication: 2026-11-06 19:08:10 UTC
- **Phone Deduplication**: Resolved 0 version duplicate(s)
- **Phone Organization**: Organized 0 file(s) on phone
- **Files Uploaded / Updated**: 1
- Anatomy Diagrams.pdf [updated with latest version]

### Auto-Sync & Version Deduplication: 2026-11-06 19:09:59 UTC
- **Phone Deduplication**: Resolved 1 version duplicate(s)
- **Phone Organization**: Organized 1 file(s) on phone
- **Files Uploaded / Updated**: 1
- Biochemistry Practical.pdf (Biochemistry / Other)

### Auto-Sync & Version Deduplication: 2026-11-06 19:13:31 UTC
- **Phone Deduplication**: Resolved 1 version duplicate(s)
- **Phone Organization**: Organized 1 file(s) on phone
- **Files Uploaded / Updated**: 1
- Anatomy try.pdf (Anatomy / Other)

### Auto-Sync & Version Deduplication: 2026-11-06 19:26:24 UTC
- **Phone Deduplication**: Resolved 0 version duplicate(s)
- **Phone Organization**: Organized 1 file(s) on phone
- **Files Uploaded / Updated**: 1
- Physiology Homework.pdf (Physiology / Other)

---

### Session 5: Creator Masterclass Visual Redesign & Mobile-First Overhaul (Nov 6, 2026 ~19:20 - 19:27 UTC)
1. **User Requirement**:
   - Replaced institutional government look with an artistic, vibrant, creator masterclass aesthetic (Ali Abdaal / Notion style).
   - Strict mobile-first design tailored for smartphone touch screens and thumb interaction.
2. **Design System & Typography Overhaul (`css/style.css`)**:
   - Switched to Google Fonts: **`Outfit`** (display, headlines, pills) and **`Plus Jakarta Sans`** (body, high readability).
   - Canvas background: Warm porcelain tone (`#FAF8F5`) instead of rigid dark navy.
   - Vibrant color palette & gradients: Coral Sunrise (`#FF6B6B`), Electric Lavender (`#7950F2`), Mint Fresh (`#20C997`), Sunshine Amber (`#FD79A8`).
   - Tactile mobile cards: Rounded corners (`border-radius: 20px`), subtle elevation shadows, generous 48px touch targets.
   - Mobile-first horizontal scroll tracks: Subject and category filter tracks swipe smoothly with touch scroll-snap (`scrollbar-width: none`).
   - Mobile bottom-sheet PDF modal: Full-height sheet sliding up smoothly with quick 'External' and 'Save' actions.
3. **Template Modernization**:
   - Updated `index.html`: Artistic gradient headline, 1-tap quick search chips (`🔬 Histology`, `🫀 Cardiac Cycle`, `🧠 Cranial Nerves`, `🧪 Enzyme Kinetics`, `💡 SDLs`, `🎯 Projects`), floating stats capsules, department showcase cards.
   - Updated `anatomy.html`, `physiology.html`, and `biochemistry.html`: Shared new glassmorphism navbar, department gradient themes, quick search chips, sticky filter pill bar, and bottom-sheet reader modal.
4. **Interactive Logic Enhancement (`js/app.js`)**:
   - Wired 1-tap `.quick-chip` event listeners to instantly trigger keyword search and smooth scroll down to the catalog.
   - Dynamic subject & category discovery remains fully intact.
5. **Verification & Deployment**:
   - Tested HTTP 200 responses across all static HTML, CSS, JS endpoints via BusyBox HTTP server.
   - Verified that automated phone sync (`mbbs-sync`) seamlessly syncs phone files without conflicting with the new styling.
   - Committed and pushed changes to GitHub `origin/main`. Live at: `https://harshkumarsaw.github.io/mbbs-library/`

### Auto-Sync & Version Deduplication: 2026-11-06 19:36:17 UTC
- **Phone Deduplication**: Resolved 0 version duplicate(s)
- **Phone Organization**: Organized 0 file(s) on phone
- **Files Uploaded / Updated**: 0

---

### Session 6: Ali Abdaal Minimalist & Uncrowded Mobile-First Transformation (Nov 6, 2026 ~19:30 - 19:37 UTC)
1. **User Requirement & Critique**:
   - Previous attempt still felt too small and crowded on phones.
   - Explicitly requested the aesthetic and spacing of **[https://aliabdaal.com/](https://aliabdaal.com/)**.
2. **Root Cause Analysis**:
   - Small font sizes (`0.72rem` - `0.88rem` / 11.5px - 14px) made text look miniature on mobile.
   - Visual clutter: Multi-level badges, subject codes, multiple hashtags (`#Thorax #Heart`), and crowded stat boxes crammed into narrow mobile viewports.
3. **Ali Abdaal Design Principles Implemented**:
   - **Signature Highlighter Effect**: Built CSS `.hero-highlighter` with warm marker pen highlights (`#FDE047` yellow, coral, purple, mint).
   - **Big, Confident Typography**: Base font 16px/17px, card titles 22px-24px, hero title 38px on mobile, relaxed line height (1.65).
   - **Breathable Single-Column Mobile Cards**:
     - 1 column on phones (<768px) with 24px padding and 24px rounded corners (`--radius-card: 24px`).
     - Clear visual hierarchy: Subject badge (e.g. `🦴 Anatomy`) + Category badge ➔ Large bold title ➔ Relaxed description ➔ Clean single-line meta (`📄 Pages • 💾 Size • 📅 Year`).
     - Large thumb-friendly 52px primary action button ("Read PDF ➔") + secondary download icon button.
     - Stripped out unnecessary clutter like dense hashtag clouds.
   - **Generous Touch Targets & Spacious Controls**:
     - 60px thumb-first search bar with large 16px input and search icon.
     - 48px high filter pill buttons with comfortable padding (`0.65rem 1.35rem`) and smooth horizontal momentum scrolling.
     - 46px topic chips with emojis (`🔬 Histology`, `🫀 Cardiac Cycle`, `🧠 Cranial Nerves`, `🧪 Enzyme Kinetics`, `💡 SDLs`).
   - **Streamlined Hero & Header**:
     - Clean single-line announcement ribbon and single-line stats trust ribbon (`📚 24 Master Documents • ⚡ Instant PDF Reader • 📱 Mobile Synced`).
4. **Verification & Deployment**:
   - Tested HTTP 200 on all endpoints via BusyBox HTTP server.
   - Verified that automated phone sync (`mbbs-sync`) pushed live to GitHub Pages.
   - Live URL: `https://harshkumarsaw.github.io/mbbs-library/`

### Auto-Sync & Version Deduplication: 2026-11-06 19:46:20 UTC
- **Phone Deduplication**: Resolved 0 version duplicate(s)
- **Phone Organization**: Organized 0 file(s) on phone
- **Files Uploaded / Updated**: 0

---

### Session 7: Strict Mobile-First Responsive Architecture Overhaul (Nov 6, 2026 ~19:40 - 19:47 UTC)
1. **User Requirement**:
   - Rebuild layout strictly from the mobile viewport up (360px–430px) rather than scaling down desktop components.
   - True single-column layout on mobile with full-width cards, vertical stacking of subject cards and study resources.
   - Fix search input cramping on narrow phones, touch-friendly filters, and compact navigation.
   - Eliminate horizontal scrolling, overflowing components, and awkward wrapping.
   - Clean multi-column grids scaling smoothly on tablets (768px) and desktop (1024px+).
2. **Mobile-First CSS Architecture (`css/style.css`)**:
   - **Boundary Enforcement**: Set `html, body { width: 100%; max-width: 100%; overflow-x: hidden; }` to eliminate any horizontal page wobble.
   - **Mobile Padding**: Standardized container mobile padding at `1rem` (16px), providing optimal usable width (328px on 360px, 358px on 390px, 398px on 430px).
   - **Vertical Stacking**:
     - `.subject-cards-grid`: Flex column on mobile (<768px); 3-column grid on desktop.
     - `.resources-grid`: Flex column on mobile (<768px); 2-column grid on tablet; 3-column grid on desktop.
     - `.guidelines-grid`: Flex column on mobile (<768px); 3-column grid on desktop.
   - **Search Experience**:
     - Mobile (<640px): Full-width search input with magnifying glass and clear button; "Find PDF" button hidden on small screens because typing live-filters in real-time. Desktop (>=640px) displays full button.
   - **Touch Controls**:
     - Quick chips: Smooth horizontal touch carousel on mobile; wrapped on desktop.
     - Filter toolbar: Sticky top with blur, 42px touch-friendly pills with hidden scrollbars.
     - Resource cards: Full width on mobile with 48px high "Read PDF" button and 48px download action.
   - **Responsive Stats**:
     - Mobile: Clean 3-column capsule dashboard with stacked numbers/emojis and labels.
     - Desktop: Inline flex ribbon with bullet dividers.
3. **Template Synchronization**:
   - Updated `index.html`, `anatomy.html`, `physiology.html`, and `biochemistry.html` to share the compact header and responsive stats markup.
4. **Verification**:
   - Tested HTTP 200 on all static endpoints.
   - Verified that automated phone sync (`mbbs-sync`) deployed live to GitHub Pages.
   - Live URL: `https://harshkumarsaw.github.io/mbbs-library/`

### Auto-Sync & Version Deduplication: 2026-11-06 19:57:09 UTC
- **Phone Deduplication**: Resolved 0 version duplicate(s)
- **Phone Organization**: Organized 0 file(s) on phone
- **Files Uploaded / Updated**: 0

---

### Session 8: Distraction-Free Content Cleanup & Instant Access Optimization (Nov 6, 2026 ~19:52 - 19:58 UTC)
1. **User Requirement**:
   - Clean up website by removing unnecessary introductory content, bloated headings, statistics, and decorative cards from the top.
   - Remove promotional sections, study guideline cards, and repeated info from the bottom.
   - Keep only essential header, compact title, and search/filter controls.
   - Make actual study resources the main focus, immediately visible on screen upon opening the site.
2. **Top Content Stripped & Streamlined**:
   - Removed `<aside class="top-bar">` announcement banner across all pages.
   - Removed bloated introductory paragraphs and multi-level heading tags.
   - Removed redundant statistics capsules.
   - Removed the entire `<section class="subjects-overview">` with 3 oversized department cards (since sticky filter pills already provide 1-tap subject switching without page clutter).
   - Replaced with a compact, minimal `.top-section` featuring a focused title, full-width search bar, and 1-tap quick chips.
3. **Bottom Content Stripped & Streamlined**:
   - Removed `<section class="info-section">` (the entire 3-card guidelines/promotional section).
   - Replaced bloated promotional footer with a minimal, clean, 1-line footer (`© 2026 Harsh Kumar Saw • 1st Year MBBS Library • GitHub`).
4. **Subpage Harmonization**:
   - Streamlined `anatomy.html`, `physiology.html`, and `biochemistry.html` identically.
   - Users on mobile and desktop now see the study catalog immediately within the first viewport!
5. **Verification & Deployment**:
   - All PDFs, search filtering, category pill discovery, and mobile modal bottom-sheets verified intact.
   - Deployed live to GitHub Pages: `https://harshkumarsaw.github.io/mbbs-library/`

### Two-Way Auto-Sync & Deletion: 2026-11-06 20:12:16 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 19
- **Total In-Sync Files**: 28

### Two-Way Auto-Sync & Deletion: 2026-11-06 20:12:58 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 1 file(s)
  - Anatomy/Anatomy Try.pdf (deleted from phone)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 27

### Two-Way Auto-Sync & Deletion: 2026-11-06 20:15:33 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 1 file(s)
  - assets/docs/anatomy/histology.pdf (cleaned obsolete duplicate)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 27

### Two-Way Auto-Sync & Deletion: 2026-11-06 20:19:57 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 19 file(s)
  - Anatomy/Anatomy Viva Question Bank.pdf (deleted from phone)
  - Anatomy/Brachial Plexus Notes.pdf (deleted from phone)
  - Anatomy/Cranial Nerves Summary.pdf (deleted from phone)
  - Anatomy/Gross Dissection Manual.pdf (deleted from phone)
  - Anatomy/Histology Workbook Assignment.pdf (deleted from phone)
  - Anatomy/Inguinal Canal Sdl.pdf (deleted from phone)
  - Biochemistry/Carbohydrate Metabolism Notes.pdf (deleted from phone)
  - Biochemistry/Clinical Biochem Manual.pdf (deleted from phone)
  - Biochemistry/Clinical Chemistry Cheat Sheet.pdf (deleted from phone)
  - Biochemistry/Enzyme Kinetics Notes.pdf (deleted from phone)
  - Biochemistry/Inborn Errors Assignment.pdf (deleted from phone)
  - Biochemistry/Vitamin Deficiencies Sdl.pdf (deleted from phone)
  - Physiology/Action Potential Notes.pdf (deleted from phone)
  - Physiology/Cardiac Cycle Ecg Notes.pdf (deleted from phone)
  - Physiology/Hematology Practical Manual.pdf (deleted from phone)
  - Physiology/Hypoxia Altitude Sdl.pdf (deleted from phone)
  - Physiology/Normal Lab Values Reference.pdf (deleted from phone)
  - Physiology/Project/ECG Cardiac Project.pdf (deleted from phone)
  - Physiology/Respiratory Cases Assignment.pdf (deleted from phone)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-06 20:30:05 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 02:25:18 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 03:09:23 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 04:59:53 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 05:14:46 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 05:33:04 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 07:19:20 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 1 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 1
  - Anatomy Diagrams.pdf (Anatomy / Other)
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-07 07:21:03 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 1 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 1
  - Anatomy Diagrams.pdf (Anatomy / Diagrams)
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 10

### Two-Way Auto-Sync & Deletion: 2026-11-07 07:36:40 UTC
- **Phone Deduplication**: Resolved 1 duplicate(s)
- **Phone Organization**: Organized 1 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 07:38:58 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 1 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 1
  - Physiology Notes.pdf (Physiology / Notes)
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-07 07:40:42 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 1 file(s)
  - Physiology/Notes/Physiology Notes.pdf (deleted from phone)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 07:46:51 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 1 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 1
  - Anatomy Diagrams.pdf [updated with latest version]
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 07:49:14 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 1 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 1
  - Anatomy Diagrams.pdf [updated with latest version]
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 08:31:01 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 08:48:26 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 12:12:40 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 13:30:59 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 14:02:55 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 17:48:48 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 18:42:05 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 19:16:05 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-07 19:36:49 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-08 01:12:49 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-08 01:40:20 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-08 01:50:43 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 1 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 2
  - Anatomy Notes Custom.pdf (Anatomy / Mycustomfolder)
  - Physiology TestRoot.pdf (Physiology / Testroot)
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 10

### Two-Way Auto-Sync & Deletion: 2026-11-08 01:51:28 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 2 file(s)
  - Anatomy/MyCustomFolder/Anatomy Notes Custom.pdf (deleted from phone)
  - Physiology/Testroot/Physiology TestRoot.pdf (deleted from phone)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 8

### Two-Way Auto-Sync & Deletion: 2026-11-08 02:30:05 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 1
  - Anatomy Notes Johari.pdf (Anatomy / Notes)
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 03:06:56 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 03:27:28 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 03:47:51 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 03:50:50 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 04:00:53 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 04:09:28 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 04:27:39 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 04:35:01 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 04:46:49 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 04:54:09 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 05:52:13 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 06:16:51 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 06:50:46 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 07:11:37 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 07:18:04 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 9

### Two-Way Auto-Sync & Deletion: 2026-11-08 07:48:07 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 3
  - General Anatomy Notes Johari.pdf (Anatomy / Notes)
  - ANATOMY IMP TOPICS CHAPTER WISE - JOHARI MBBS.pdf (Anatomy / Other)
  - REASONING - UPPER LIMB ANATOMY - JOHARI MBBS.pdf (Anatomy / Other)
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 12

### Two-Way Auto-Sync & Deletion: 2026-11-08 07:53:46 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 8
  - upper limb johari paid .pdf (Anatomy / Notes)
  - thorax johari paid .pdf (Anatomy / Notes)
  - lower limb johari paid .pdf (Anatomy / Notes)
  - head and neck johari paid.pdf (Anatomy / Notes)
  - abdomen pelvis johari paid.pdf (Anatomy / Notes)
  - embryology johari paid.pdf (Anatomy / Notes)
  - general anat johari paid .pdf (Anatomy / Notes)
  - neuro johari paid .pdf (Anatomy / Notes)
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 20

### Two-Way Auto-Sync & Deletion: 2026-11-08 08:23:03 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 20

### Performance & Lazy Loading Enhancement: 2026-11-08 10:07:00 UTC
- **Infinite Scroll & Lazy Loading**: Implemented IntersectionObserver-driven batch card rendering (batch size: 8) for instant initial page paints.
- **Dynamic DOM Rendering**: Replaced heavy monolithic innerHTML injection with smooth insertAdjacentHTML chunking as user scrolls.
- **Progress Counter**: Results info bar dynamically shows `Showing X of Y study resources • scroll for more` up to `Showing all Y MBBS study resources`.
- **Loading & End UI**: Added subtle ivory/navy spinner indicator and end-of-catalog badge with fallback Load More button.
- **Event Delegation**: Centralized card event handling onto resources-grid container, optimizing memory and interaction speed on mobile devices.

### Two-Way Auto-Sync & Deletion: 2026-11-08 10:11:58 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 1 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 1
  - Anatomy Diagrams.pdf [updated with latest version]
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 20

### UI Refinement: 2026-11-08 10:22:00 UTC
- **Clean End of Results**: Removed end-of-catalog badge. Once all documents are loaded, the grid seamlessly transitions directly to the footer with zero artificial indicators or extra spacing.

### UI Fix: 2026-11-08 10:41:00 UTC
- **Resolved Duplicate Search Close Buttons**: Disabled the native browser `::-webkit-search-cancel-button` so WebKit/Chromium no longer renders a duplicate small 'x' next to the custom clear button.
- **Enhanced Search Clear Button**: Replaced unicode text '✕' with a crisp, centered SVG vector icon, added Escape key clearing, and improved touch alignment.

### PageSpeed & Performance Architecture Overhaul: 2026-11-08 12:00:00 UTC
- **Dynamic On-Demand PDF.js Loading (Priority 1)**:
  - Removed static render-blocking `<script src="js/vendor/pdf.min.js"></script>` (~313 KB) from initial page load on `index.html`, `anatomy.html`, `physiology.html`, and `biochemistry.html`.
  - Implemented `ensurePdfJsLoaded()` dynamic loader in `js/app.js` with singleton promise caching and Web Worker assignment (`pdf.worker.min.js`).
  - Added zero-latency predictive preloading on `pointerover` of any `[data-action="view"]` / "Read Online" trigger.
  - Fully preserved all PDF.js streaming options (`rangeChunkSize: 65536`, `disableAutoFetch: true`, `disableStream: true`, progressive progress bar, single and continuous scroll modes).
- **Self-Hosted Variable WOFF2 Fonts (Priority 2)**:
  - Eliminated external render-blocking Google Fonts stylesheets (`fonts.googleapis.com` and `fonts.gstatic.com`).
  - Downloaded modern variable WOFF2 fonts to `assets/fonts/outfit.woff2` (32 KB, weights 500-900) and `assets/fonts/plus-jakarta-sans.woff2` (27 KB, weights 400-800).
  - Replaced `@import` with `@font-face` definitions enforcing `font-display: swap` in `css/style.css`.
  - Added `<link rel="preload" as="font" type="font/woff2" crossorigin>` in `<head>` across all 5 HTML files (`index.html`, `anatomy.html`, `physiology.html`, `biochemistry.html`, `404.html`) for instant text rendering without FOIT.
- **Production Asset Minification Pipeline (Priority 3)**:
  - Created automated build tool `scripts/minify.py` using `rcssmin` and `rjsmin`.
  - Generated minified distribution bundles `css/style.min.css` (64.5 KB, 26.9% saved) and `js/app.min.js` (60.0 KB, 27.3% saved).
  - Kept complete, readable, documented original source files in `css/style.css` and `js/app.js`.
  - Updated `scripts/sync_from_phone.sh` to automatically run `minify.py` and update cache-busting query hashes `?v=[timestamp]` on every phone sync.
- **Accessibility & Heading Hierarchy Compliance (Priority 4)**:
  - Fixed `.lazy-scroll-hint` contrast ratio from ~3.2:1 (`--text-tertiary`) to ~5.8:1 (`--text-muted`), exceeding WCAG AA requirements on `#FAF8F4` ivory canvas.
  - Resolved duplicate `h1` headings: Converted navbar logo title `<h1>` to `<span class="brand-title">` styled identically via `.brand-text .brand-title`.
  - Fixed heading sequence: Added `<h2 class="sr-only">` curriculum section headers so resource cards (`<h3>`) follow directly after `<h2>` with zero skipped heading levels; converted noscript and modal headers to `<h2>`.
- **Reflow & Layout Thrashing Elimination (Priority 5)**:
  - Decoupled `applyMobileZoom()` style mutations from viewport `getBoundingClientRect()` scans using `requestAnimationFrame`.
  - Throttled touch/pointer drag updates in bottom-sheet dismiss listener via `requestAnimationFrame` and cancellation handling.
- **Image Optimization & GitHub Pages Caching (Priority 6)**:
  - Verified WebP picture element with high fetch priority, explicit dimensions, and async decoding for navbar brand logo.
  - Synchronized cache-busting version timestamps across all HTML pages.

### Two-Way Auto-Sync & Deletion: 2026-11-08 13:32:58 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 1
  - AK Jain Physiology.pdf (Physiology / Books)
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 21

### SteadyLink Cloud Storage & Zero-Bloat Architecture Migration: 2026-11-08 18:05:00 UTC
- **Cloud PDF Migration**:
  - Migrated all library PDFs from local Git storage to **SteadyLink Cloud Storage & Global CDN** (`https://steadylink.io`).
  - Successfully uploaded all 20 active medical documents to SteadyLink's permanent CDN endpoints (`https://cdn.steadylink.io/a/{asset_id}`).
  - Built persistent manifest `steadylink_manifest.json` indexing all uploaded assets and their metadata.
- **Git Binary Elimination**:
  - Removed all 33 binary `.pdf` files from Git tracking and working tree.
  - Added `.gitignore` permanently blocking `*.pdf` and `assets/docs/`.
  - Repository source footprint reduced to **~2.8 MB**, eliminating GitHub's 100 MB per-file limit and preventing repository size growth.
- **Client-Side Data & Reader Optimization**:
  - Updated `js/data.js` so 100% of resources point to their SteadyLink CDN URL (`0` local paths remaining).
  - Enhanced `js/app.js` and `js/app.min.js`: clicking "Read PDF" launches external CDN resources directly in the browser's native hardware-accelerated reader via `window.open(..., '_blank')`, avoiding third-party CORS limitations while delivering instant loading and pinch-to-zoom.
- **Automated Cloud Sync Engine**:
  - Created `scripts/migrate_to_steadylink.py` using robust curl streaming PUT upload with retry and backoff logic.
  - Refactored `scripts/sync_from_phone.sh` to integrate directly with SteadyLink API for any new documents added to the phone, keeping the Git repository strictly text/code only.
- **Deployment**:
  - Rebuilt production minified CSS and JavaScript bundles with `scripts/minify.py`.
  - Pushed commit `f258332` to `origin/main` and verified live on GitHub Pages (`https://harshkumarsaw.github.io/mbbs-library/`).

### Two-Way Auto-Sync & Deletion: 2026-11-08 18:15:06 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 20

### Direct Device Download & In-App Document Reading: 2026-11-08 19:00:00 UTC
- **Direct Device Download Implementation**:
  - Implemented `triggerDirectDownload(id)` in `js/app.js` and `js/app.min.js`.
  - Configured download buttons on all cards and in the modal to point to direct attachment endpoints with `Content-Disposition: attachment`.
  - Added GitHub Release asset synchronization workflow `.github/workflows/sync-release-assets.yml` for automated release attachment distribution.
- **In-App Document Reader**:
  - Removed disruptive `window.open` navigation from `openPdfModal`.
  - Embedded in-app viewer within `DOM.pdfViewerContainer` for instant, seamless document reading without leaving the web application.
  - Maintained full toolbar, breadcrumbs, and drag-down-to-dismiss bottom sheet controls.
- **Deployment**:
  - Rebuilt production minified CSS and JavaScript bundles.
  - Pushed commit `04f4d87` to `origin/main` and verified live on GitHub Pages.

### Two-Way Auto-Sync & Deletion: 2026-11-09 06:10:09 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 20

### Large PDF (>95MB) GitHub Releases Pipeline & Visual Quality Preservation: 2026-11-09 06:55:00 UTC
- **Quality Preservation Guard in Sync Engine**:
  - Replaced aggressive secondary downsampling pass (`gs` at 95 DPI) in `scripts/sync_from_phone.sh` with a smart routing guard.
  - If a document exceeds 95MB after the initial 130 DPI downsampling and linearization pass, it retains full 130 DPI resolution and Fast Web View linearization instead of suffering image degradation.
- **Direct GitHub Releases Upload Route**:
  - Added `upload_large_pdf_to_github_release()` in `scripts/migrate_to_steadylink.py` to route >95MB files directly to GitHub Releases (`v1.0.0-assets`).
  - Automatically updates `steadylink_manifest.json` with `storage: "github-release"` and `is_large_file: true`.
  - Updated `sync_data_js()` to generate `js/data.js` entries with `isLargeFile: true` and direct GitHub Release download URLs.
  - Updated `.github/workflows/sync-release-assets.yml` to recognize and bypass SteadyLink fetching for `github-release` storage assets.
- **Client-Side UI Adaptation**:
  - In `js/app.js` and `js/app.min.js`: Rendered distinct `⚡ GitHub Release` meta pills and dedicated **"Direct Download"** action buttons for resources >95MB.
  - Intercepted modal viewer triggers on large files to directly initiate native device download via `triggerDirectDownload()`, safeguarding mobile browsers from Out-Of-Memory (OOM) WebWorker crashes.
  - Added clean styling in `css/style.css` and regenerated minified production bundles (`style.min.css`, `app.min.js`) via `scripts/minify.py`.

### Two-Way Auto-Sync & Deletion: 2026-11-09 07:11:02 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **Files Uploaded / Updated from Phone**: 0
- **Offline Files Seeded to Phone**: 0
- **Total In-Sync Files**: 21

### Two-Way Auto-Sync: 2026-11-09 07:55:20 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 0
- **Total In-Sync Files**: 21

### Two-Way Auto-Sync: 2026-11-09 08:06:16 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 0
- **Total In-Sync Files**: 21

### Two-Way Auto-Sync: 2026-11-09 08:31:03 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 0
- **Total In-Sync Files**: 21

### Two-Way Auto-Sync: 2026-11-09 08:40:50 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 0
- **Total In-Sync Files**: 21

### Two-Way Auto-Sync: 2026-11-09 10:10:03 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 0
- **Total In-Sync Files**: 21

### Two-Way Auto-Sync: 2026-11-09 10:14:37 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 1 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 0
- **Total In-Sync Files**: 21

### Two-Way Auto-Sync: 2026-11-09 10:14:52 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 0
- **Total In-Sync Files**: 21

### Two-Way Auto-Sync: 2026-11-09 10:18:04 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 0
- **Total In-Sync Files**: 21

### Two-Way Auto-Sync: 2026-11-09 10:47:13 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 1
- **Total In-Sync Files**: 21

### Two-Way Auto-Sync: 2026-11-09 10:56:29 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 0
- **Total In-Sync Files**: 21

### Two-Way Auto-Sync: 2026-11-09 11:18:14 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 0
- **Total In-Sync Files**: 21

### Two-Way Auto-Sync: 2026-11-09 11:37:20 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 1
- **Total In-Sync Files**: 22

### Two-Way Auto-Sync: 2026-11-09 11:41:45 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 1
- **Total In-Sync Files**: 23

### High-Resolution Open Graph & Twitter Card Social Sharing Infrastructure: 2026-11-09 12:15:00 UTC
- **Social Media Link Preview Overhaul**:
  - Generated professional, academic preview banner (`1200x630` px, 1.91:1 standard aspect ratio) formatted for WhatsApp, Telegram, Facebook, Twitter/X, and LinkedIn link unfurling.
  - Exported both `og-image.png` (high fidelity) and `og-image.jpg` (lightweight, rapid crawler loading) directly in web root.
- **Static HTML Source Metadata Synchronization**:
  - Implemented complete static Open Graph metadata across all site pages (`index.html`, `anatomy.html`, `physiology.html`, `biochemistry.html`, `404.html`):
    - `og:site_name`: "Harsh's Library"
    - `og:type`: "website"
    - `og:locale`: "en_IN"
    - `og:title`: Standard site title "Harsh's Library – MBBS Study Resources" and tailored department titles.
    - `og:description`: Standard site description "A free collection of MBBS study materials, notes, textbooks and PDFs, organised for easy access." and subject-specific descriptions.
    - `og:url`: Absolute canonical page URLs on GitHub Pages.
    - `og:image` & `og:image:secure_url`: `https://harshkumarsaw.github.io/mbbs-library/og-image.png`
    - `og:image:type`, `og:image:width` (1200), `og:image:height` (630), and accessible `og:image:alt`.
  - Added Twitter Card metadata with `twitter:card` set to `summary_large_image` for large rich media cards.
  - Synchronized Schema.org JSON-LD structured data (`WebSite`, `CollectionPage`, `MedicalWebPage`) with matching banner image and descriptions.

### WhatsApp Link Preview Resolution & Asset Optimization: 2026-11-09 12:35:00 UTC
- **Root Cause Identified**:
  - Live GitHub Pages `og-image.png` was 828.7 KB, well above WhatsApp's strict 300 KB crawler payload cutoff, causing WhatsApp to drop preview image downloads.
  - Stale preview caching on WhatsApp crawler servers persisted previous failed attempts.
- **Fixes Applied**:
  - Optimized `og-image.png` from 828.7 KB down to 154 KB (well under the 600 KB & 300 KB limits) with visually lossless adaptive palette quantizing (PSNR ~39 dB).
  - Optimized `og-image.jpg` down to 118 KB at quality 92 (PSNR ~43 dB).
  - Added cache-busting query parameter `?v=2` across all `og:image`, `og:image:secure_url`, `<link rel="image_src">`, and `twitter:image` tags to invalidate stale crawler caches.
  - Added `prefix="og: https://ogp.me/ns#"` on `<html>` across all HTML pages for strict RDFa/OG compliance.
  - Added `<link rel="image_src">` fallback for legacy mobile/WhatsApp clients.
  - Explicitly whitelisted `facebookexternalhit`, `WhatsApp`, `Twitterbot`, and `TelegramBot` in `robots.txt`.

### Desktop Navbar & Hamburger Menu Architecture Redesign: 2026-11-09 12:48:00 UTC
- **User Requirement**:
  - Hamburger menu was missing in desktop view, and top navigation bar looked plain and unbalanced on wide displays.
  - Mobile view is working well and must remain 100% unchanged.
- **Root Cause**:
  - `@media (min-width: 860px)` explicitly had `.mobile-toggle { display: none; }` and `.nav-links` lacked reset rules for `opacity`, `visibility`, and `pointer-events`, rendering desktop navigation completely absent.
- **Implementation**:
  - **Mobile Preservation**: Retained 100% of existing mobile view styles (`< 860px`), including 42x42 square icon toggle and full-width drawer.
  - **Desktop Hamburger Menu Button**:
    - Re-enabled `.mobile-toggle` on desktop (`display: inline-flex !important;`) styled as a sleek `[ ☰ Menu ]` pill button (`border-radius: 9999px`, height 42px, padding `0 1.2rem`).
    - When open (`aria-expanded="true"`), smoothly transitions to active navy `[ ✕ Close ]` pill with 90° rotating SVG icon.
  - **Desktop Floating Dropdown Card**:
    - On screens `≥ 860px`, clicking the menu toggle opens a floating card (`position: absolute; right: 0; width: 280px; border-radius: 20px;`) with layered box-shadow and smooth entrance transition.
    - Department links feature hover animations, active states, and clean typography.
  - **Rebuilt Minified Bundles**:
    - Ran `scripts/minify.py` to regenerate `css/style.min.css` (26.7% size reduction).
    - Updated cache-busting CSS version query string to `?v=1794228460` across all 5 HTML files.

### Custom Link Preview Banner Integration (`og-preview.jpg`): 2026-11-09 13:12:00 UTC
- **User Request**:
  - Replaced preview image with user's custom uploaded asset `og-preview.jpg`.
- **Verification of Uploaded Asset**:
  - Verified `og-preview.jpg` dimensions: `1200x630` px (standard 1.91:1 aspect ratio).
  - Verified file size: `100,923` bytes (~98.6 KB) — well under WhatsApp's 300 KB / 600 KB limits.
  - Verified format: `image/jpeg`.
- **Metadata Update Across Website**:
  - Updated all 5 HTML documents (`index.html`, `anatomy.html`, `physiology.html`, `biochemistry.html`, `404.html`):
    - `og:image` & `og:image:secure_url`: `https://harshkumarsaw.github.io/mbbs-library/og-preview.jpg`
    - `og:image:type`: `image/jpeg`
    - `og:image:width`: `1200`, `og:image:height`: `630`
    - `<link rel="image_src">`: `https://harshkumarsaw.github.io/mbbs-library/og-preview.jpg`
    - `twitter:image`: `https://harshkumarsaw.github.io/mbbs-library/og-preview.jpg`
    - Schema.org JSON-LD structured data image: `https://harshkumarsaw.github.io/mbbs-library/og-preview.jpg`

### Large File Direct Download & Viewer Download Popup Fix: 2026-11-09 14:58:00 UTC
- **User Requirement**:
  - Remove disruptive Android Chrome popup ("Do you want to download viewer again?").
  - Stop external tab launches (`window.open`).
  - For long PDFs (>25MB), remove the "Read PDF" option and provide **only** the "Direct Download" option (identical to >100MB textbooks).
- **Implementation**:
  - **Direct Download for All >25MB Files**: Set `isLarge = Boolean(item.isLargeFile || item.storage === "github-release" || sizeMB > 25)`. Any file >25MB displays only the full-width "Direct Download" button on the card, triggering direct file download with zero modal or external tab opens.
  - **Eliminated "Download Viewer Again" Loop**:
    - Added `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` to the iframe to strictly block the browser from initiating unauthorized file downloads.
    - Switched to Google Drive's modern `drive.google.com/viewerng/viewer` endpoint.
    - Updated click delegation in `js/app.js` to prioritize `[data-action="download"], .btn-large-dl` before checking view triggers.
  - Rebuilt production minified bundles via `scripts/minify.py`.
  - Updated cache-busting version query string to `?v=1794236372` across all HTML files.

### Storage Architecture Optimization: GitHub Releases for >25MB Files & Universal Release Downloads: 2026-11-09 15:24:00 UTC
- **User Requirement**:
  - Determine optimal storage strategy for files >25MB vs SteadyLink.
  - Fix existing documents in SteadyLink >25MB by migrating them to GitHub Releases.
  - Update sync scripts to route all future files >25MB directly to GitHub Releases.
  - Ensure all download options across the site download from GitHub Releases regardless of file size.
- **Analysis & Architectural Decisions**:
  - SteadyLink CDN is optimized for in-app inline PDF previewing for documents ≤ 25MB.
  - For files >25MB, third-party mobile webviewers (e.g. Google Docs Viewer) fail or trigger memory crashes / download loops. Hence, files >25MB should only offer direct downloading.
  - GitHub Releases is superior for downloads: provides zero bandwidth quota limits, resumes broken downloads, serves proper `Content-Disposition: attachment`, and bypasses CDN rate limits.
  - Files ≤ 25MB: `fileUrl` points to SteadyLink CDN for fast in-modal viewing; `downloadUrl` points to GitHub Releases for resilient, unlimited downloads.
  - Files > 25MB: Both `fileUrl` and `downloadUrl` point to GitHub Releases with `isLargeFile: true` and `storage: "github-release"` (Direct Download only, no viewer).
- **Asset Migration & Verification**:
  - Verified 100% of all 23 documents exist in GitHub Release `v1.0.0-assets`.
  - Uploaded `diFiore Atlas of Histology.pdf` (41.3 MB) and `ak-jain-physiology-practical-manual_compress.pdf` (8.6 MB) to GitHub Releases.
  - Verified `Anatomy Notes Johari.pdf` (52.0 MB) already active in GitHub Releases.
  - Updated `steadylink_manifest.json` and `js/data.js` to mark `diFiore` and `Johari` as `github-release` storage with direct release download URLs.
- **Pipeline & Sync Automation Updates**:
  - `scripts/migrate_to_steadylink.py`: Lowered large document detection cutoff from 95MB to 25MB (`25 * 1024 * 1024`), automatically routing them to GitHub Releases `v1.0.0-assets`.
  - `scripts/sync_from_phone.sh`: Lowered asset guard cutoff from 95MB to 25MB (`26214400` bytes) to skip unnecessary secondary compression passes and route straight to release assets.
  - `.github/workflows/sync-release-assets.yml`: Lowered SteadyLink bypass threshold to 25MB to prevent redundant SteadyLink fetching in CI.
- **Cache-Busting & Bundle Verification**:
  - Updated cache-busting version query string to `?v=1794237536` across all HTML entry points.
  - Verified JS syntax and manifest integrity.

### Two-Way Auto-Sync: 2026-11-09 16:56:05 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 1 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 2
- **Total In-Sync Files**: 25

### Two-Way Auto-Sync: 2026-11-09 17:11:15 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 0
- **Total In-Sync Files**: 25

### Display Exact PDF Page Count & Update Date Icon: 2026-11-09 17:48:00 UTC
- **User Requirement**:
  - Replace the generic label `"Document"` / `"Textbook"` with the actual number of pages the PDF contains (e.g., `41 Pages`, `13 Pages`, `1156 Pages`).
  - Replace the tear-off calendar icon `📅` with the spiral calendar icon `🗓️` across all resource cards.
- **Implementation**:
  - **Automated Page Counting**:
    - Added `get_pdf_page_count()` in `scripts/migrate_to_steadylink.py` using `qpdf --show-npages` to automatically extract exact page counts for both newly added documents and existing records during auto-sync.
    - Updated all 24 resource records in `js/data.js` with their verified page counts (ranging from `3 Pages` for quick review notes up to `1156 Pages` for textbooks like AK Jain Physiology).
  - **Frontend UI & Card Rendering**:
    - Updated `createCardHtml()` in `js/app.js` to render `📄 ${pagesDisplay}` and `🗓️ ${formatResourceDate(item.date)}`.
    - Updated initial pre-rendered static fallback cards across `index.html`, `anatomy.html`, `physiology.html`, and `biochemistry.html` with exact page counts and `🗓️`.
  - **Asset Optimization & Cache Busting**:
    - Recompiled production minified bundle `js/app.min.js` via `scripts/minify.py`.
    - Updated cache-busting version query string to `?v=1794246441` across all HTML entry points.


### Two-Way Auto-Sync: 2026-11-09 17:30:41 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 1
- **Total In-Sync Files**: 24

### Progressive Web App (PWA) Implementation: 2026-11-09 18:42:00 UTC
- **Pre-Implementation Backup Point**:
  - Created Git Tag: `pre-pwa-backup` (`29cba520dab9b85d6b929dd8a67686f8f32f21e7`)
  - Created Git Backup Branch: `backup-pre-pwa`
  - Reversion Command: `git reset --hard pre-pwa-backup`
- **PWA Assets & Manifest**:
  - Generated high-resolution PWA icons:
    - `assets/icons/icon-192x192.png` (Standard 192×192)
    - `assets/icons/icon-512x512.png` (Standard 512×512)
    - `assets/icons/icon-maskable-192x192.png` (Maskable 192×192 with 15% safe padding)
    - `assets/icons/icon-maskable-512x512.png` (Maskable 512×512 with 15% safe padding)
  - Created `manifest.webmanifest` and `manifest.json` with standalone display mode, orientation `any`, theme color `#FAF8F4`, background color `#FAF8F4`, and department quick shortcuts.
- **Service Worker (`sw.js`)**:
  - Implemented smart offline & caching engine:
    - **Network-First with Cache Fallback** for HTML navigation pages (guarantees students immediately see updated notes whenever online, with offline fallback).
    - **Stale-While-Revalidate** for static assets (CSS, JS, Fonts, Icons) for instant 0ms app boot.
    - Automatic cache cleanup and skip-waiting lifecycle for zero-downtime silent updates.
- **Cross-Platform Install Prompts (`js/pwa.js` & `css/style.css`)**:
  - Integrated `beforeinstallprompt` and `appinstalled` listeners for Android/Chromium WebAPK.
  - Added native iOS Safari install guide modal with 3 simple visual steps.
  - Added install trigger buttons in navbar, mobile drawer, and footer.
  - Added floating bottom install banner with session-dismiss memory.
  - Wired into `index.html`, `anatomy.html`, `physiology.html`, `biochemistry.html`, and `404.html`.
- **Minification**:
  - Re-minified `css/style.min.css` (71.6 KB, 26.5% savings).

### Custom Anatomy Department Navbar Logo: 2026-11-10 04:45:00 UTC
- **User Requirement**:
  - Replace the bone emoji (`🦴`) emblem in `anatomy.html` navbar with the custom uploaded logo `logo-anatomy.png`.
- **Image Optimization & Multi-Format Generation**:
  - Preserved original 2048×2048 master artwork at `assets/icons/logo-anatomy-master.png`.
  - Created high-fidelity 256×256 production assets:
    - `logo-anatomy.webp` (16.6 KB, quality 95) for modern browsers.
    - `logo-anatomy.png` (70.1 KB) with transparent background and lossless Lanczos resampling.
    - Synchronized mirrors in `assets/icons/`.
- **HTML & Preload Integration (`anatomy.html`)**:
  - Replaced `<span>🦴</span>` with responsive `<picture>` container utilizing WebP source and fallback PNG at `46x46` px with `fetchpriority="high"`.
  - Added `<link rel="preload" as="image" href="logo-anatomy.webp" type="image/webp" fetchpriority="high">` to `<head>` for instantaneous rendering.
- **Styling & PWA Integration**:
  - Added border reset to `.brand-emblem-logo` in `css/style.css` and regenerated `css/style.min.css` (71.7 KB) via `scripts/minify.py`.
  - Updated Service Worker `sw.js` (bumped to cache `v1.0.3`) to precache `logo-anatomy.webp` and `logo-anatomy.png`.
  - Updated CSS cache-busting timestamp `?v=1794285701` across all HTML templates.


### Two-Way Auto-Sync: 2026-11-10 06:06:00 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 2
- **Total In-Sync Files**: 26

### Real-Time Upload Progress & ETA Engine for GitHub Releases & SteadyLink: 2026-11-10 06:15:00 UTC
- **User Requirement**:
  - Replace silent background uploads (`gh release upload`) with real-time feedback showing actual percentage, transfer speed, elapsed time, and ETA.
- **Implementation in `scripts/migrate_to_steadylink.py`**:
  - **`ProgressFileStream`**: Created custom chunked streaming reader calculating exact bytes transferred across network sockets without buffering large files in RAM.
  - **`render_upload_progress()`**: Built dynamic terminal progress bar (`⏳ [████░░░░] %3d%% (sent / total @ speed) • elapsed • ETA: Xs`) styled consistently with compression and git push indicators.
  - **Direct GitHub Releases Streaming**: Connected directly to GitHub Releases API endpoint (`https://uploads.github.com/repos/.../releases/{id}/assets`) with token auto-detection and asset clobber replacement.
  - **SteadyLink CDN Integration**: Applied `ProgressFileStream` streaming to `upload_single_pdf_curl` for full visibility during all library uploads.
  - **Fallback Safety**: Graceful fallback to `gh release upload` with unsuppressed terminal output if direct streaming is interrupted.

### Relative Timestamp ("Updated X hours ago") for Recent Documents (<24h): 2026-11-10 06:35:00 UTC
- **User Requirement**:
  - For any file uploaded or updated less than 24 hours ago, display a relative timestamp like "Updated (hours) hours ago" (or mins/just now) instead of only a static calendar date.
- **Frontend Implementation (`js/app.js` & `js/app.min.js`)**:
  - Implemented `formatResourceDateInfo(rawDate, rawUpdatedAt)`:
    - Calculates exact difference between current client time and resource `updatedAt` / `date`.
    - If `< 24 hours`: Renders dynamic relative text (`Updated just now`, `Updated X mins ago`, `Updated X hour(s) ago`).
    - Tooltip retains full calendar date (`Uploaded / Updated on DD MMM YYYY (Updated X hours ago)`).
    - If `≥ 24 hours`: Gracefully falls back to standard exact calendar date (`DD MMM YYYY`).
  - Added `.meta-recent` CSS styling in `css/style.css` and `css/style.min.css`:
    - Distinct, high-contrast forest emerald badge (`#065F46` on `#FAF8F4` ivory canvas, > 6.5:1 WCAG contrast) identifying freshly added study materials.
  - Bumped Service Worker cache to `v1.0.4` and updated cache-busting version query string to `?v=1794292214`.

### Two-Way Auto-Sync: 2026-11-10 07:02:23 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 1 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 1
- **Total In-Sync Files**: 26

### Two-Way Auto-Sync: 2026-11-10 08:14:09 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 8
- **Total In-Sync Files**: 34

### Google Tag Manager & Google Analytics (GA4) Integration: 2026-11-10 09:38:00 UTC
- **User Requirement**:
  - Integrate Google Analytics / Google Tag Manager tag (`GTM-PFL9BMBD`).
- **Implementation**:
  - Integrated asynchronous Google Tag Manager loader script and `dataLayer` / `gtag()` initialization in `<head>` across all 5 site pages:
    - `index.html` (Library Portal)
    - `anatomy.html` (Anatomy Department)
    - `physiology.html` (Physiology Department)
    - `biochemistry.html` (Biochemistry Department)
    - `404.html` (Error Fallback)
  - Added official Google Tag Manager `<noscript>` fallback iframe immediately following opening `<body>` tags.
  - Bumped Service Worker cache version in `sw.js` to `v1.0.5` to ensure returning visitors load the fresh HTML containing the analytics tag.

### OneSignal Web Push Notification Engine Integration: 2026-11-10 17:00:00 UTC
- **User Requirement**:
  - Implement zero-maintenance, zero-backend native Web Push notifications for students.
  - Zero complication for maintainer (no manual maintenance, automatic alert dispatch on new PDF syncs).
- **Implementation**:
  - **Credentials & API Authentication**:
    - Configured OneSignal App ID `54db441e-edff-4024-8e24-87bacea1d5fe` and App API Key (`os_v2_app_...`).
    - Verified connectivity with OneSignal v2 REST API endpoint (`https://api.onesignal.com/notifications`).
  - **Service Worker Integration**:
    - Embedded `importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js")` at the synchronous top level of `sw.js`.
    - Added root worker proxy `OneSignalSDKWorker.js` for OneSignal domain validators.
    - Added `OneSignalSDKWorker.js` and `js/push.js` to `RELATIVE_ASSETS` in `sw.js`.
    - Bumped Service Worker cache version to `harsh-library-v1.0.6`.
  - **Frontend Client Controller (`js/push.js`)**:
    - Added asynchronous OneSignal v16 loader via `OneSignalDeferred`.
    - Configured gentle medical-themed Slidedown prompt after 3s delay: *"Get instant notifications on your phone when new MBBS notes, books, and practical guides are uploaded."*
    - Added interactive `🔔 Get Alerts` / `🔔 Alerts Active` toggle buttons in header navigation bar and footer across `index.html`, `anatomy.html`, `physiology.html`, and `biochemistry.html`.
    - Styled with soft ivory/navy/emerald transitions in `css/style.css` and recompiled `css/style.min.css`.
  - **Zero-Maintenance Sync Integration (`scripts/sync_from_phone.sh`)**:
    - Added `send_onesignal_notification` hook to phone sync engine.
    - Whenever new study materials are detected and pushed to GitHub Pages, a push notification is automatically broadcast to all subscribed student phones with zero manual effort.
  - **Instant Push CLI Utility (`scripts/send_push.sh`)**:
    - Built standalone CLI helper script allowing the maintainer to dispatch custom notifications on-demand with: `./scripts/send_push.sh "Title" "Message"`.

### Fix GitHub Release Asset URLs (Vasudevan, BDC Vol 3 & 4, Cunningham, GK Pal): 2026-11-10 17:20:00 UTC
- **User Issue**:
  - Download error 404 reported for `DM Vasudevan Textbook of Biochemistry, 6th Ed`, `BDC Vol 3 & 4 (10th Ed)`, and other documents.
- **Root Cause**:
  - GitHub Releases automatically sanitizes asset filenames by replacing special characters (commas, ampersands, parentheses, single quotes) with dots (`.`).
  - `data.js` and `steadylink_manifest.json` stored URLs with unsanitized characters (e.g. `DM_Vasudevan..._,_6th_Ed.pdf` and `BDC_Vol_3_&_4_(10th_ed).PDF`), resulting in HTTP 404 on download.
- **Resolution**:
  - Audited all resources against actual release assets on GitHub.
  - Corrected mismatched download and preview URLs in `js/data.js` and `steadylink_manifest.json`:
    - `DM_Vasudevan_Textbook_of_Biochemistry_,_6th_Ed.pdf` -> `DM_Vasudevan_Textbook_of_Biochemistry_._6th_Ed.pdf`
    - `BDC_Vol_3_&_4_(10th_ed).PDF` -> `BDC_Vol_3_._4_.10th_ed.PDF`
    - `CUNNINGHAM’S_MANUAL_OF_PRACTICAL_ANATOMY_Volume-3.pdf` -> `CUNNINGHAM.S_MANUAL_OF_PRACTICAL_ANATOMY_Volume-3.pdf`
    - `CUNNINGHAM’S_MANUAL_OF_PRACTICAL_ANATOMY_Volume-2.pdf` -> `CUNNINGHAM.S_MANUAL_OF_PRACTICAL_ANATOMY_Volume-2.pdf`
    - `Cunningham’s_Manual_of_Practical_Anatomy_Volume_1_Upper_and_lower.pdf` -> `Cunningham.s_Manual_of_Practical_Anatomy_Volume_1_Upper_and_lower.pdf`
    - `GK_Pal_Physiology_(1st_Ed).pdf` -> `GK_Pal_Physiology_.1st_Ed.pdf`
    - `general_anat_johari_paid_.pdf` -> `general_anat_johari_paid.pdf`
  - Updated `scripts/migrate_to_steadylink.py` with `sanitize_github_asset_name()` to ensure all future uploads automatically conform to GitHub release naming conventions.
  - Bumped cache query strings across HTML entry points.



### Two-Way Auto-Sync: 2026-11-10 17:28:06 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 0
- **Total In-Sync Files**: 43

### Two-Way Auto-Sync: 2026-11-10 17:28:28 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 0
- **Total In-Sync Files**: 43

### Push Notification Bell UI Enhancements (Floating FAB & Header Quick Bell): 2026-11-10 17:35:00 UTC
- **User Issue**:
  - The notification bell was not visible on the website because navigation items were collapsed inside the drawer menu and initially hidden by CSS.
- **Resolution**:
  - Added a permanent **Floating Action Bell (FAB)** in the bottom-right corner (`.push-floating-bell`) on all pages with pulsing gold notification dot and smooth ivory/navy aesthetics.
  - Added a **Header Quick Bell** button (`.push-top-bell-btn`) directly in the top navigation bar beside the menu toggle for instant mobile and desktop access without opening menus.
  - Updated `.push-notify-trigger` to `display: inline-flex` by default so buttons appear immediately with zero delay.
  - Enhanced `js/push.js` to initialize click events immediately on DOM ready and preserve badge icons across state updates.
  - Recompiled `css/style.min.css` and bumped Service Worker cache to `v1.0.7`.

### Comprehensive URL Sanitization for Recent Uploads & Manifest Sync: 2026-11-10 17:41:00 UTC
- **User Issue**:
  - Download errors reported on recently uploaded documents (Yogesh Sontakke Embryology, Vishram Singh, Bajrang Notes) uploaded prior to the full sanitization engine rollout.
- **Root Cause**:
  - Auto-sync run at 17:28 UTC imported 9 newly synced documents with unsanitized release URLs and re-populated old unsanitized URLs from `steadylink_manifest.json`.
- **Resolution**:
  - Automatically audited all catalog entries against all 52 live GitHub Release assets.
  - Resolved all 6 remaining URL mismatches in `js/data.js` and `steadylink_manifest.json`:
    - `Yogesh Sontakke Textbook of Human Embryology (2018, CBS Publishers & Distributors)` -> Sanitized dots replacing commas/parens/ampersands.
    - `Vishram Singh Textbook of Anatomy Upper Limb and Thorax.` -> Stripped double dot before extension (`.pdf`).
    - `Bajrang Abdomen & Pelvis Notes` -> Sanitized `&` to `._`.
    - `DM Vasudevan 6th Ed`, `BDC Vol 3 & 4`, `GK Pal Physiology` -> Permanent sanitized URLs enforced.
  - Enhanced `load_manifest()` and `migrate_to_steadylink.py` to auto-sanitize every GitHub Release URL upon manifest load and data sync, preventing legacy unsanitized URLs from ever re-entering `data.js`.
  - Bumped cache query strings across all HTML templates.

### UI Streamlining: Remove Bottom-Right Floating Bell, Keep Top Header Bell: 2026-11-10 17:46:00 UTC
- **User Request**:
  - Remove the floating bottom-right bell icon; keep only the top navigation bar bell icon.
- **Resolution**:
  - Removed `.push-floating-bell` DOM elements from `index.html`, `anatomy.html`, `physiology.html`, and `biochemistry.html`.
  - Cleaned up `.push-floating-bell`, `.bell-pulse-dot`, and `@keyframes push-bell-pulse` styles from `css/style.css`.
  - Re-minified CSS via `scripts/minify.py` (`css/style.min.css`).
  - Retained the clean, high-visibility `.push-top-bell-btn` in the sticky top navigation header next to the menu hamburger button.
  - Bumped asset cache-busting timestamps across all pages.

### Push Notification Header Bell Click Handler & Permission Flow Fix: 2026-11-10 17:54:00 UTC
- **User Issue**:
  - Clicking the top bell icon produced no visible reaction or permission prompt.
- **Root Cause**:
  1. `OneSignal.Slidedown.promptPush()` was called without `{ force: true }`, causing OneSignal to evaluate soft prompt rules (time delays, cool-off periods) and silently skip showing anything.
  2. In modern browsers (Chrome/Safari), requesting notification permission requires an active, synchronous user gesture; delayed callbacks outside the click event were blocked.
  3. `swPath` in `OneSignal.init` had an invalid leading slash (`/mbbs-library/sw.js`), causing worker resolution issues on GitHub Pages.
  4. Silent suppression on denied permissions left users unaware if browser site settings were blocking alerts.
- **Resolution**:
  - Overhauled `js/push.js` with direct, synchronous user gesture dispatch for `Notification.requestPermission()`, guaranteeing the browser's native permission modal pops up immediately.
  - Fixed `swPath` to relative `"mbbs-library/sw.js"` without leading slash for GitHub Pages compatibility.
  - Added helpful status prompts for browser-blocked permissions (guiding users to allow notifications in browser site settings), iOS Safari Home Screen installation instructions, and instant unsubscribe confirmation toggles.
  - Synced granted subscriptions immediately with OneSignal `User.PushSubscription.optIn()`.
  - Added `pointer-events: none` on `.push-top-bell-btn span` and explicit touch-action styling.
  - Bumped service worker cache to `harsh-library-v1.0.8` and refreshed cache-busting timestamps across all HTML files.





### Two-Way Auto-Sync: 2026-11-10 18:03:26 UTC
- **Phone Deduplication**: Resolved 0 duplicate(s)
- **Phone Organization**: Organized 0 root file(s)
- **Phone Deletions Synced to Website**: 0 file(s)
- **New PDFs Optimized**: 1
- **Total In-Sync Files**: 44

### Push Subscription Persistence Across Refreshes & OneSignal Web Platform Diagnostics: 2026-11-10 18:12:00 UTC
- **User Issue**:
  1. Sync output reported `OneSignal push dispatched (waiting for subscribers to opt in)` and no push arrived on the user's phone.
  2. Push notification settings appeared to reset back to unsubscribed on page refresh.
- **Root Cause Analysis**:
  1. Investigated OneSignal REST API (`GET https://api.onesignal.com/sync/$APP_ID/web`), which returned `{"success":false,"code":2,"description":"This app is not configured for web push."}`. The OneSignal App had been created, but Web Push was not yet configured in the dashboard (`chrome_web_origin: null`, `push.enabled: false`). Consequently, OneSignal rejected web subscriber registration, keeping active players at 0.
  2. On page load, `push.js` had been relying on `oneSignalInstance.User.PushSubscription.optedIn`, which reset to `false` on every reload because the OneSignal backend rejected the sync.
- **Resolution**:
  - Decoupled subscribed UI state in `push.js` to rely natively on `Notification.permission === 'granted'` and respect `mbbs_push_opted_out`. If the browser has granted notification permissions, the bell remains permanently active (green) across refreshes and never reverts.
  - Automatically invokes background `OneSignal.User.PushSubscription.optIn()` as soon as OneSignal initializes, ensuring that existing subscribers are registered automatically as soon as Web Push is enabled in the OneSignal dashboard without needing to re-click the button.
  - Enhanced `scripts/send_push.sh` and `scripts/sync_from_phone.sh` with automated diagnostics to detect if the OneSignal dashboard Web Push platform is pending setup, outputting direct configuration steps.
  - Bumped Service Worker cache to `harsh-library-v1.0.9` and refreshed cache-busting timestamps across all HTML files.

### OneSignal Dashboard Web Push Activated & Service Worker Integration Finalized: 2026-11-10 18:29:00 UTC
- **User Action**:
  - Successfully configured Web Push in the OneSignal dashboard.
  - Uploaded official `OneSignalSDK-v16-ServiceWorker.zip`.
- **Backend Verification**:
  - Verified live endpoint `https://api.onesignal.com/sync/$APP_ID/web`: returns `{"success": true}` with active Web Push configuration (`origin: https://harshkumarsaw.github.io`, `serviceWorker: OneSignalSDKWorker.js`).
- **Code & Service Worker Alignment**:
  - Extracted and established both `OneSignalSDKWorker.js` and `OneSignalSDKUpdaterWorker.js` at the repository root.
  - Chained PWA offline caching via `importScripts("./sw.js")` inside `OneSignalSDKWorker.js` to ensure zero conflicts between background push alerts and PWA offline caching.
  - Aligned `push.js` with `serviceWorkerPath: "mbbs-library/OneSignalSDKWorker.js"` and scope `"/mbbs-library/"` for GitHub Pages subfolder compatibility.
  - Staged and synced all manifest updates.


