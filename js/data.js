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
    id: "user-phys-physiology_homework-3183",
    title: "Physiology Homework",
    subject: "physiology",
    category: "homework",
    code: "Physiology / Homework",
    description: "Uploaded document: Physiology Homework.pdf. Organized under Physiology (Homework).",
    tags: ["Physiology", "Homework", "Mobile Upload"],
    fileUrl: "assets/docs/physiology/homework/physiology_homework.pdf",
    fileSize: "4.1 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "Nov 2026",
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
    fileUrl: "assets/docs/biochemistry/practicals/biochemistry_practical.pdf",
    fileSize: "13.9 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "Nov 2026",
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
    fileUrl: "assets/docs/physiology/project/physiology_project.pdf",
    fileSize: "3.2 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "Nov 2026",
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
    fileUrl: "assets/docs/physiology/practicals/physiology_practical.pdf",
    fileSize: "16.6 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "Nov 2026",
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
    fileUrl: "assets/docs/anatomy/histology/histology.pdf",
    fileSize: "1.7 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "Nov 2026",
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
    fileUrl: "assets/docs/anatomy/sdl/anatomy_sdl.pdf",
    fileSize: "8.8 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-anatomy_diagrams-0203",
    title: "Anatomy Diagrams",
    subject: "anatomy",
    category: "practicals",
    code: "Anatomy / Practicals",
    description: "Uploaded document: Anatomy Diagrams.pdf. Reference study material for Anatomy.",
    tags: ["Anatomy", "Practicals", "Mobile Upload"],
    fileUrl: "assets/docs/anatomy/practicals/anatomy_diagrams.pdf",
    fileSize: "1 KB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "Nov 2026",
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
    fileUrl: "assets/docs/physiology/assignments/physiology_assignment.pdf",
    fileSize: "17.9 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "Nov 2026",
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
    accent: "#1e3a8a",
    description: "Study of human body architecture, regional dissection, microanatomy, and development.",
    modules: ["Gross Anatomy", "Histology", "Embryology", "Neuroanatomy", "Genetics"],
    statTotal: "AN1.1 - AN82.1"
  },
  physiology: {
    name: "Physiology",
    fullName: "Human Physiology & Biophysics",
    icon: "physiology",
    accent: "#0369a1",
    description: "Understanding bodily organ systems, dynamic functions, homeostatic regulation, and clinical reflexes.",
    modules: ["Hematology", "Cardiovascular", "Respiratory", "Renal", "Neurophysiology", "Endocrine"],
    statTotal: "PY1.1 - PY11.14"
  },
  biochemistry: {
    name: "Biochemistry",
    fullName: "Medical Biochemistry & Molecular Biology",
    icon: "biochemistry",
    accent: "#1d4ed8",
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
