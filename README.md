# MBBS Medical Resource Library 🩺📚

A modern, lightweight, mobile-friendly academic digital library website built for medical colleges. Designed with a clean **white and navy-blue** aesthetic, instant client-side search, organized subject categories, and seamless PDF preview and download capabilities.

**100% Free • No Database • No Logins • Zero Maintenance Costs • GitHub Pages Ready**

---

## 🌟 Key Features

- **Departmental Sections**:
  - **Anatomy**: Gross Anatomy, Histology, Embryology, Neuroanatomy
  - **Physiology**: Cardiovascular, Respiratory, Hematology, Electrophysiology, Renal
  - **Biochemistry**: Metabolic Pathways, Clinical Enzymology, Genetics, Lab Diagnostics
- **5-Tier Resource Categorization**:
  1. 📝 **Notes**: Lecture summaries, slides, high-yield exam points
  2. 📋 **Assignments**: Clinical vignettes, problem-based learning worksheets
  3. 💡 **SDLs**: Competency-Based Medical Education (CBME) Self-Directed Learning modules
  4. 🔬 **Practicals**: Dissection guides, lab manuals, microscopic spotters
  5. 📦 **Other Resources**: Previous 10-year university question banks, viva flashcards, normal values cheat sheets
- **Dual PDF Action**:
  - **View PDF**: Responsive in-page document reader modal with fullscreen and external browser tab options.
  - **Download PDF**: Direct, one-click download with standard HTML5 download attributes.
- **Instant Live Search & Filters**:
  - Real-time search by topic title, competency code (e.g., `AN10.1`, `PY5.1`, `BI3.2`), keywords, or tags.
  - Multi-criteria filtering by Subject and Resource Type.
- **Mobile-First Responsive Design**:
  - Collapsible navigation drawer.
  - Touch-friendly horizontal filter pills.
  - Optimized readability on smartphones, tablets, and desktops.

---

## 📁 Repository Structure

```
mbbs-resource-library/
├── index.html                   # Central library portal with search & filters
├── anatomy.html                 # Dedicated Anatomy department portal
├── physiology.html              # Dedicated Physiology department portal
├── biochemistry.html            # Dedicated Biochemistry department portal
├── 404.html                     # Fallback not-found page
├── .nojekyll                    # Ensures GitHub Pages serves files directly
├── css/
│   └── style.css                # Clean navy & white responsive design system
├── js/
│   ├── app.js                   # Live search engine, filters, modal viewer
│   └── data.js                  # Centralized client-side resource database
├── assets/
│   └── docs/                    # Stored medical PDF documents
│       ├── anatomy/             # Anatomy notes, SDLs, practical manuals
│       ├── physiology/          # Physiology notes, ECG cases, lab guides
│       └── biochemistry/        # Biochemistry metabolic charts & manuals
└── scripts/
    └── generate_sample_pdfs.sh  # Generator for valid starter PDFs
```

---

## 🚀 How to Deploy to GitHub Pages (100% Free in 2 Minutes)

Hosting on **GitHub Pages** is completely free forever, with unlimited bandwidth, custom domain support, and automatic HTTPS/SSL:

### Step 1: Create a GitHub Repository
1. Log in to [GitHub](https://github.com/).
2. Click **New Repository** (green button).
3. Name your repository (e.g., `mbbs-library` or `college-mbbs-library`).
4. Set visibility to **Public** and leave other options unchecked.
5. Click **Create repository**.

### Step 2: Push the Files
In your terminal, navigate to the project directory and run:

```bash
cd mbbs-resource-library
git init
git add .
git commit -m "Initial commit of MBBS Resource Library"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

*(Replace `<YOUR_GITHUB_USERNAME>` and `<YOUR_REPOSITORY_NAME>` with your actual details).*

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** (tab at the top).
3. In the left sidebar, click **Pages**.
4. Under **Build and deployment > Source**, select **Deploy from a branch**.
5. Under **Branch**, select `main` and folder `/ (root)`, then click **Save**.
6. Wait 30–60 seconds. GitHub will display your live website URL:
   ```
   https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPOSITORY_NAME>/
   ```

---

## ✏️ How to Add New Resources & PDFs

Adding a new document takes under a minute:

### 1. Place the PDF file
Copy your PDF into the appropriate subject folder inside `assets/docs/`:
- Anatomy: `assets/docs/anatomy/your_file.pdf`
- Physiology: `assets/docs/physiology/your_file.pdf`
- Biochemistry: `assets/docs/biochemistry/your_file.pdf`

### 2. Add an entry in `js/data.js`
Open `js/data.js` and add an object to the `MBBS_RESOURCES` array:

```javascript
{
  id: "anat-notes-03",
  title: "Circle of Willis & Cerebral Arterial Supply",
  subject: "anatomy",           // "anatomy" | "physiology" | "biochemistry"
  category: "notes",            // "notes" | "assignments" | "sdls" | "practicals" | "other"
  code: "AN62.1",               // NMC / CBME Competency Code
  description: "Arterial circulation of brain, aneurysm sites and stroke syndromes.",
  tags: ["Neuroanatomy", "Circle of Willis", "Cerebral Blood Flow"],
  fileUrl: "assets/docs/anatomy/circle_of_willis.pdf",
  fileSize: "1.8 MB",
  pages: "12 pages",
  author: "Dept. of Anatomy",
  date: "Dec 2026",
  year: "1st Year MBBS"
},
```

Commit and push to GitHub — GitHub Pages will automatically update in seconds!

---

## 🎨 Customization

- **College Name**: Search and replace `Government Medical College` in `index.html`, `anatomy.html`, `physiology.html`, and `biochemistry.html` with your institution's name.
- **Emblem / Logo**: Replace the SVG inside `<div class="brand-emblem">` with your college crest or an image tag `<img src="assets/logo.png" alt="College Logo">`.
- **Colors**: All color variables are defined at the top of `css/style.css` in the `:root` block for easy customization.

---

## 💻 Local Testing

To test the site locally:

Using Busybox:
```bash
busybox httpd -f -p 8080 -h mbbs-resource-library
```
Then visit `http://localhost:8080` in your web browser.

---

## 📄 License & Sharing
This resource library template is open-source under the MIT License. Freely adapt and deploy it for your medical college or university student council!
