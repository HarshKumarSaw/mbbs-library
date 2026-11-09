/**
 * MBBS Resource Library Data Store
 * Government Medical College - Academic Digital Repository
 * 
 * Free, lightweight, client-side data store.
 * To add a new resource, simply add an object to this array.
 */

const MBBS_RESOURCES = [
  // ==========================================
  // MOBILE AUTO-SYNCED RESOURCES
  // ==========================================
  // __AUTO_RESOURCES_START__
  {
    id: "user-phys-ak_jain_physiology_p-8261",
    title: "Ak Jain Physiology",
    subject: "physiology",
    category: "books",
    code: "Physiology / Books",
    description: "Uploaded document: AK Jain Physiology.pdf. Comprehensive reference book (212.1 MB) hosted on GitHub Releases for high-speed direct download.",
    tags: ["Physiology", "Books", "Mobile Upload", "Large Book"],
    fileUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/AK_Jain_Physiology.pdf",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/AK_Jain_Physiology.pdf",
    fileSize: "212.1 MB",
    pages: "Textbook",
    author: "HarshKumarSaw",
    date: "09 Nov 2026",
    year: "1st Year MBBS"
    isLargeFile: true,
    storage: "github-release",
  },
  {
    id: "user-anat-upper_limb_johari_paid-4324",
    title: "Upper Limb Johari Paid",
    subject: "anatomy",
    category: "notes",
    code: "Anatomy / Notes",
    description: "Uploaded document: upper limb johari paid .pdf. Organized under Anatomy (Notes).",
    tags: ["Anatomy", "Notes", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/2b6bb845-0762-475a-9435-974116c354c6",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/upper_limb_johari_paid_.pdf",
    fileSize: "4.7 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "01 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-thorax_johari_paid-4345",
    title: "Thorax Johari Paid",
    subject: "anatomy",
    category: "notes",
    code: "Anatomy / Notes",
    description: "Uploaded document: thorax johari paid .pdf. Organized under Anatomy (Notes).",
    tags: ["Anatomy", "Notes", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/ba1d766b-7345-4cdd-8a8d-f0cf6bb083bf",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/thorax_johari_paid_.pdf",
    fileSize: "3.6 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "01 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-lower_limb_johari_paid-4360",
    title: "Lower Limb Johari Paid",
    subject: "anatomy",
    category: "notes",
    code: "Anatomy / Notes",
    description: "Uploaded document: lower limb johari paid .pdf. Organized under Anatomy (Notes).",
    tags: ["Anatomy", "Notes", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/b064981e-90cb-4fae-a8cb-2279d2eb4e94",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/lower_limb_johari_paid_.pdf",
    fileSize: "3.6 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "01 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-head_and_neck_johari_paid-4383",
    title: "Head And Neck Johari Paid",
    subject: "anatomy",
    category: "notes",
    code: "Anatomy / Notes",
    description: "Uploaded document: head and neck johari paid.pdf. Organized under Anatomy (Notes).",
    tags: ["Anatomy", "Notes", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/87755371-aedc-4313-a655-dd2445942173",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/head_and_neck_johari_paid.pdf",
    fileSize: "4.0 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "01 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-abdomen_pelvis_johari_paid-4409",
    title: "Abdomen Pelvis Johari Paid",
    subject: "anatomy",
    category: "notes",
    code: "Anatomy / Notes",
    description: "Uploaded document: abdomen pelvis johari paid.pdf. Organized under Anatomy (Notes).",
    tags: ["Anatomy", "Notes", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/5116126b-2c85-4d46-aaa8-b02e04aa17b6",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/abdomen_pelvis_johari_paid.pdf",
    fileSize: "4.8 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "01 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-embryology_johari_paid-4415",
    title: "Embryology Johari Paid",
    subject: "anatomy",
    category: "notes",
    code: "Anatomy / Notes",
    description: "Uploaded document: embryology johari paid.pdf. Organized under Anatomy (Notes).",
    tags: ["Anatomy", "Notes", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/86e588bd-b08e-485d-8ede-8a13f229f7ff",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/embryology_johari_paid.pdf",
    fileSize: "2.0 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "02 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-general_anat_johari_paid-4418",
    title: "General Anat Johari Paid",
    subject: "anatomy",
    category: "notes",
    code: "Anatomy / Notes",
    description: "Uploaded document: general anat johari paid .pdf. Organized under Anatomy (Notes).",
    tags: ["Anatomy", "Notes", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/6b49362e-be1b-4c94-b295-4e4ab2a5ac83",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/general_anat_johari_paid.pdf",
    fileSize: "1.4 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "07 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-neuro_johari_paid-4421",
    title: "Neuro Johari Paid",
    subject: "anatomy",
    category: "notes",
    code: "Anatomy / Notes",
    description: "Uploaded document: neuro johari paid .pdf. Organized under Anatomy (Notes).",
    tags: ["Anatomy", "Notes", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/36805bfc-99e4-4d99-b482-26f707f2dcd5",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/neuro_johari_paid_.pdf",
    fileSize: "1.6 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "01 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-general_anatomy_notes_johari-4066",
    title: "General Anatomy Notes Johari",
    subject: "anatomy",
    category: "notes",
    code: "Anatomy / Notes",
    description: "Uploaded document: General Anatomy Notes Johari.pdf. Organized under Anatomy (Notes).",
    tags: ["Anatomy", "Notes", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/89736d4f-da47-489c-a1ef-cbcaad3233fb",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/General_Anatomy_Notes_Johari.pdf",
    fileSize: "10.1 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "09 Oct 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-anatomy_imp_topics_chapter_wise_-_johari_mbbs-4068",
    title: "Anatomy Imp Topics Chapter Wise Johari Mbbs",
    subject: "anatomy",
    category: "other",
    code: "Anatomy / Other",
    description: "Uploaded document: ANATOMY IMP TOPICS CHAPTER WISE - JOHARI MBBS.pdf. Organized under Anatomy (Other).",
    tags: ["Anatomy", "Other", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/4fb74d6f-55ac-4188-9e94-9875931c245c",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/ANATOMY_IMP_TOPICS_CHAPTER_WISE_-_JOHARI_MBBS.pdf",
    fileSize: "1017 KB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "10 Oct 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-reasoning_-_upper_limb_anatomy_-_johari_mbbs-4082",
    title: "Reasoning Upper Limb Anatomy Johari Mbbs",
    subject: "anatomy",
    category: "other",
    code: "Anatomy / Other",
    description: "Uploaded document: REASONING - UPPER LIMB ANATOMY - JOHARI MBBS.pdf. Organized under Anatomy (Other).",
    tags: ["Anatomy", "Other", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/2826a071-3340-4053-a412-76117a3f7849",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/reasoning_-_upper_limb_anatomy_-_johari_mbbs.pdf",
    fileSize: "2.7 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "01 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-anatomy_notes_johari-4993",
    title: "Anatomy Notes Johari",
    subject: "anatomy",
    category: "notes",
    code: "Anatomy / Notes",
    description: "Uploaded document: Anatomy Notes Johari.pdf. Organized under Anatomy (Notes).",
    tags: ["Anatomy", "Notes", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/304e6533-3360-4906-b086-edee6f0c2094",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/Anatomy_Notes_Johari.pdf",
    fileSize: "52.0 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "08 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-anatomy_diagrams-6058",
    title: "Anatomy Diagrams",
    subject: "anatomy",
    category: "diagrams",
    code: "Anatomy / Diagrams",
    description: "Uploaded document: Anatomy Diagrams.pdf. Organized under Anatomy (Diagrams).",
    tags: ["Anatomy", "Diagrams", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/92fb8c97-2fae-4b6d-aad9-797e7f0acf45",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/Anatomy_Diagrams.pdf",
    fileSize: "696 KB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "07 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-phys-physiology_homework-3183",
    title: "Physiology Homework",
    subject: "physiology",
    category: "homework",
    code: "Physiology / Homework",
    description: "Uploaded document: Physiology Homework.pdf. Organized under Physiology (Homework).",
    tags: ["Physiology", "Homework", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/ba1cfd7a-6008-49c5-aa78-081c440130b7",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/Physiology_Homework.pdf",
    fileSize: "1.5 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "07 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-bioc-biochemistry_practical-2198",
    title: "Biochemistry Practical",
    subject: "biochemistry",
    category: "practicals",
    code: "Biochemistry / Practicals",
    description: "Uploaded document: Biochemistry Practical.pdf. Organized under Biochemistry (Practicals).",
    tags: ["Biochemistry", "Practicals", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/d894b7c2-f8ad-4f63-baab-6548aaabd822",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/Biochemistry_Practical.pdf",
    fileSize: "3.4 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "07 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-phys-physiology_project-1680",
    title: "Physiology Project",
    subject: "physiology",
    category: "project",
    code: "Physiology / Project",
    description: "Uploaded document: Physiology Project.pdf. Organized under Physiology (Project).",
    tags: ["Physiology", "Project", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/bb2f5834-ee25-4518-a0f8-e5cd111e87ca",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/Physiology_Project.pdf",
    fileSize: "1.9 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "07 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-phys-physiology_practical-1680",
    title: "Physiology Practical",
    subject: "physiology",
    category: "practicals",
    code: "Physiology / Practicals",
    description: "Uploaded document: Physiology Practical.pdf. Organized under Physiology (Practicals).",
    tags: ["Physiology", "Practicals", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/3aa9201d-5f23-40b6-9389-01c13efa1899",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/Physiology_Practical.pdf",
    fileSize: "5.1 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "07 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-histology-1516",
    title: "Histology",
    subject: "anatomy",
    category: "histology",
    code: "Anatomy / Histology",
    description: "Uploaded document: Histology.pdf. Organized under Anatomy (Histology).",
    tags: ["Anatomy", "Histology", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/622c0d91-dcb4-4d3b-9f40-6f3c2000eb79",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/Histology.pdf",
    fileSize: "1023 KB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "07 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-anatomy_sdl-0990",
    title: "Anatomy SDL",
    subject: "anatomy",
    category: "sdl",
    code: "Anatomy / SDL",
    description: "Uploaded document: Anatomy SDL.pdf. Reference study material for Anatomy.",
    tags: ["Anatomy", "SDL", "Self-Directed Learning", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/c01d6f67-476f-479d-8dd2-8d4f89dbda44",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/Anatomy_SDL.pdf",
    fileSize: "3.2 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "07 Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-phys-physiology_assignment-0203",
    title: "Physiology Assignment",
    subject: "physiology",
    category: "assignments",
    code: "Physiology / Assignments",
    description: "Uploaded document: Physiology Assignment.pdf. Reference study material for Physiology.",
    tags: ["Physiology", "Assignments", "Mobile Upload"],
    fileUrl: "https://cdn.steadylink.io/a/9ae47c72-150c-4fe3-b959-10b36adcea1b",
    downloadUrl: "https://github.com/HarshKumarSaw/mbbs-library/releases/download/v1.0.0-assets/Physiology_Assignment.pdf",
    fileSize: "4.8 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "06 Nov 2026",
    year: "1st Year MBBS"
  },
  // __AUTO_RESOURCES_END__

  // ==========================================
  // ANATOMY
  // ==========================================

  // ==========================================
  // PHYSIOLOGY
  // ==========================================

  // ==========================================
  // BIOCHEMISTRY
  // ==========================================
];

// Subject metadata
const SUBJECT_INFO = {
  anatomy: {
    name: "Anatomy",
    fullName: "Human Anatomy, Embryology & Histology",
    icon: "anatomy",
    accent: "#F2BFC1",
    description: "Study of human body architecture, regional dissection, microanatomy, and development.",
    modules: ["Gross Anatomy", "Histology", "Embryology", "Neuroanatomy", "Genetics"],
    statTotal: "AN1.1 - AN82.1"
  },
  physiology: {
    name: "Physiology",
    fullName: "Human Physiology & Biophysics",
    icon: "physiology",
    accent: "#DCCBFA",
    description: "Understanding bodily organ systems, dynamic functions, homeostatic regulation, and clinical reflexes.",
    modules: ["Hematology", "Cardiovascular", "Respiratory", "Renal", "Neurophysiology", "Endocrine"],
    statTotal: "PY1.1 - PY11.14"
  },
  biochemistry: {
    name: "Biochemistry",
    fullName: "Medical Biochemistry & Molecular Biology",
    icon: "biochemistry",
    accent: "#BCEBD9",
    description: "Molecular mechanisms of life, metabolic pathways, enzyme kinetics, genetics, and clinical diagnostics.",
    modules: ["Biomolecules", "Metabolism", "Enzymology", "Molecular Biology", "Clinical Chemistry"],
    statTotal: "BI1.1 - BI11.24"
  },
  community_medicine: {
    name: "Community Medicine",
    fullName: "Community Medicine & Preventive Healthcare",
    icon: "community",
    accent: "#0d9488",
    description: "Epidemiological principles, family health study, public health programs, and biostatistics.",
    modules: ["Epidemiology", "Family Health Survey", "Environmental Health", "Nutrition", "Demography"],
    statTotal: "CM1.1 - CM20.4"
  },
  aetcom: {
    name: "AETCOM",
    fullName: "Attitude, Ethics and Communication Module",
    icon: "aetcom",
    accent: "#7c3aed",
    description: "Foundational professional values, doctor-patient communication, medical empathy, and bioethics.",
    modules: ["Doctor-Patient Relationship", "Cadaver Respect", "Empathy", "Working in Health Teams"],
    statTotal: "Modules 1.1 - 1.5"
  },
  ece: {
    name: "ECE",
    fullName: "Early Clinical Exposure",
    icon: "ece",
    accent: "#ea580c",
    description: "Pre-clinical hospital and community correlation linking basic science to clinical presentation.",
    modules: ["Hospital OPD Visits", "Clinical Case Correlation", "Diagnostic Skills"],
    statTotal: "ECE Core"
  },
  foundation: {
    name: "Foundation Course",
    fullName: "1st Year MBBS Foundation Course",
    icon: "foundation",
    accent: "#475569",
    description: "Medical college orientation, basic life support (BLS), language skills, and medical humanities.",
    modules: ["Orientation", "Skills Module (BLS)", "Field Visits", "Professional Growth"],
    statTotal: "FC 1 - FC 6"
  }
};

// Category metadata
const CATEGORY_INFO = {
  notes: { label: "Notes", badgeClass: "badge-notes", icon: "notes", desc: "Lecture slides & high-yield revision" },
  note: { label: "Notes", badgeClass: "badge-notes", icon: "notes", desc: "Lecture slides & high-yield revision" },
  assignments: { label: "Assignments", badgeClass: "badge-assignments", icon: "assignment", desc: "Worksheets, clinical vignettes & records" },
  assignment: { label: "Assignments", badgeClass: "badge-assignments", icon: "assignment", desc: "Worksheets, clinical vignettes & records" },
  homework: { label: "Homework", badgeClass: "badge-assignments", icon: "assignment", desc: "Homework assignments and exercises" },
  project: { label: "Project", badgeClass: "badge-assignments", icon: "assignment", desc: "Projects and student research" },
  projects: { label: "Project", badgeClass: "badge-assignments", icon: "assignment", desc: "Projects and student research" },
  sdls: { label: "SDL", badgeClass: "badge-sdls", icon: "sdl", desc: "Self-Directed Learning modules & tasks" },
  sdl: { label: "SDL", badgeClass: "badge-sdls", icon: "sdl", desc: "Self-Directed Learning modules & tasks" },
  practicals: { label: "Practicals", badgeClass: "badge-practicals", icon: "practical", desc: "Lab manuals, procedures & spotters" },
  practical: { label: "Practicals", badgeClass: "badge-practicals", icon: "practical", desc: "Lab manuals, procedures & spotters" },
  other: { label: "Other Resources", badgeClass: "badge-other", icon: "other", desc: "Question banks, flashcards & cheat sheets" },
  others: { label: "Other Resources", badgeClass: "badge-other", icon: "other", desc: "Question banks, flashcards & cheat sheets" },
  histology: { label: "Histology", badgeClass: "badge-other", icon: "other", desc: "Histology slides & practical workbooks" }
};
