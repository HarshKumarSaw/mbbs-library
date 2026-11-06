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
    category: "other",
    code: "Physiology / Other",
    description: "Uploaded document: Physiology Homework.pdf. Organized under Physiology (Other).",
    tags: ["Physiology", "Other", "Mobile Upload"],
    fileUrl: "assets/docs/physiology/physiology_homework.pdf",
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
    category: "other",
    code: "Biochemistry / Other",
    description: "Uploaded document: Biochemistry Practical.pdf. Organized under Biochemistry (Other).",
    tags: ["Biochemistry", "Other", "Mobile Upload"],
    fileUrl: "assets/docs/biochemistry/biochemistry_practical.pdf",
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
    category: "other",
    code: "Physiology / Other",
    description: "Uploaded document: Physiology Project.pdf. Organized under Physiology (Other).",
    tags: ["Physiology", "Other", "Mobile Upload"],
    fileUrl: "assets/docs/physiology/physiology_project.pdf",
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
    category: "other",
    code: "Physiology / Other",
    description: "Uploaded document: Physiology Practical.pdf. Organized under Physiology (Other).",
    tags: ["Physiology", "Other", "Mobile Upload"],
    fileUrl: "assets/docs/physiology/physiology_practical.pdf",
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
    id: "user-phys-ecg_cardiac_project-1517",
    title: "Ecg Cardiac Project",
    subject: "physiology",
    category: "project",
    code: "Physiology / Project",
    description: "Uploaded document: ECG Cardiac Project.pdf. Organized under Physiology (Project).",
    tags: ["Physiology", "Project", "Mobile Upload"],
    fileUrl: "assets/docs/physiology/project/ecg_cardiac_project.pdf",
    fileSize: "28 B",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-anatomy_sdl-0990",
    title: "Anatomy Sdl",
    subject: "anatomy",
    category: "sdls",
    code: "CBME Core",
    description: "Uploaded document: Anatomy SDL.pdf. Reference study material for Anatomy.",
    tags: ["Anatomy", "Sdls", "Self-Directed Learning", "Mobile Upload"],
    fileUrl: "assets/docs/anatomy/anatomy_sdl.pdf",
    fileSize: "8.8 MB",
    pages: "Document",
    author: "HarshKumarSaw",
    date: "Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "user-anat-histology-0419",
    title: "Histology",
    subject: "anatomy",
    category: "other",
    code: "CBME Mobile",
    description: "Uploaded document: Histology.pdf. Reference study material.",
    tags: ["Anatomy", "Other", "Mobile Upload"],
    fileUrl: "assets/docs/anatomy/histology.pdf",
    fileSize: "1.7 MB",
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
    code: "CBME Mobile",
    description: "Uploaded document: Anatomy Diagrams.pdf. Reference study material.",
    tags: ["Anatomy", "Practicals", "Mobile Upload"],
    fileUrl: "assets/docs/anatomy/anatomy_diagrams.pdf",
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
    code: "CBME Mobile",
    description: "Uploaded document: Physiology Assignment.pdf. Reference study material.",
    tags: ["Physiology", "Assignments", "Mobile Upload"],
    fileUrl: "assets/docs/physiology/physiology_assignment.pdf",
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
  {
    id: "anat-notes-01",
    title: "Brachial Plexus: Roots, Trunks, Cords & Clinical Palsies",
    subject: "anatomy",
    category: "notes",
    code: "AN10.1 - AN10.3",
    description: "Comprehensive lecture notes with schematic diagrams of roots, trunks, divisions, cords and branches. Details Erb-Duchenne and Klumpke palsies.",
    tags: ["Upper Limb", "Nerves", "Clinical Palsies", "Gross Anatomy"],
    fileUrl: "assets/docs/anatomy/brachial_plexus_notes.pdf",
    fileSize: "1.4 MB",
    pages: "16 pages",
    author: "Dept. of Anatomy",
    date: "Oct 2026",
    year: "1st Year MBBS"
  },
  {
    id: "anat-notes-02",
    title: "12 Cranial Nerves: Nuclei, Pathways & Bedside Examination",
    subject: "anatomy",
    category: "notes",
    code: "AN62.1 - AN62.6",
    description: "Tabular overview of cranial nerve origins, skull exit foramina, functional components, clinical testing protocols and lesion localizations.",
    tags: ["Neuroanatomy", "Cranial Nerves", "Clinical Testing", "Brainstem"],
    fileUrl: "assets/docs/anatomy/cranial_nerves_summary.pdf",
    fileSize: "2.1 MB",
    pages: "22 pages",
    author: "Dept. of Anatomy",
    date: "Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "anat-assign-01",
    title: "Histology Microscopic Slide Identification & Sketches Workbook",
    subject: "anatomy",
    category: "assignments",
    code: "AN65.1 - AN65.2",
    description: "Practical record workbook assignment. Identification criteria, labeled hand-drawn diagrams, and histological features of primary tissues.",
    tags: ["Histology", "Microscopy", "Workbook", "Tissue Types"],
    fileUrl: "assets/docs/anatomy/histology_workbook_assignment.pdf",
    fileSize: "1.8 MB",
    pages: "14 pages",
    author: "Histology Section",
    date: "Sep 2026",
    year: "1st Year MBBS"
  },
  {
    id: "anat-sdl-01",
    title: "Inguinal Canal & Hernias: Applied Surgical Anatomy SDL",
    subject: "anatomy",
    category: "sdls",
    code: "AN47.1 - AN47.5",
    description: "Self-Directed Learning module detailing the walls, rings, boundaries and contents of the inguinal canal, comparing direct vs indirect inguinal hernias.",
    tags: ["Abdomen", "Inguinal Canal", "Hernias", "SDL", "Surgical Anatomy"],
    fileUrl: "assets/docs/anatomy/inguinal_canal_sdl.pdf",
    fileSize: "1.2 MB",
    pages: "10 pages",
    author: "CBME Curriculum Cell",
    date: "Oct 2026",
    year: "1st Year MBBS"
  },
  {
    id: "anat-prac-01",
    title: "Gross Anatomy Dissection Manual: Pectoral Region & Limbs",
    subject: "anatomy",
    category: "practicals",
    code: "AN12.1 - AN12.4",
    description: "Step-by-step cadaveric dissection checklist, fascial planes, arterial relations, and safe dissection practices in the dissection hall.",
    tags: ["Dissection", "Pectoral Region", "Axilla", "Practical Manual"],
    fileUrl: "assets/docs/anatomy/gross_dissection_manual.pdf",
    fileSize: "3.2 MB",
    pages: "28 pages",
    author: "Dissection Hall Faculty",
    date: "Aug 2026",
    year: "1st Year MBBS"
  },
  {
    id: "anat-other-01",
    title: "First Year Anatomy Viva Voce & University Exam Blueprint",
    subject: "anatomy",
    category: "other",
    code: "AN-EXAM-REV",
    description: "Question bank of previous 10 years university essay topics, short notes, spotter checklists, and osteology viva flashcards.",
    tags: ["Question Bank", "Viva Voce", "Exam Prep", "Osteology"],
    fileUrl: "assets/docs/anatomy/anatomy_viva_question_bank.pdf",
    fileSize: "2.5 MB",
    pages: "34 pages",
    author: "Academic Council",
    date: "Nov 2026",
    year: "1st Year MBBS"
  },

  // ==========================================
  // PHYSIOLOGY
  // ==========================================
  {
    id: "phys-notes-01",
    title: "Cardiac Cycle, Pressure-Volume Loops & Normal ECG Vectors",
    subject: "physiology",
    category: "notes",
    code: "PY5.1 - PY5.4",
    description: "In-depth review of the Wiggers diagram, mechanical versus electrical events in the heart, cardiac output regulation and standard 12-lead ECG interpretation.",
    tags: ["Cardiovascular", "ECG", "Cardiac Cycle", "Wiggers Diagram"],
    fileUrl: "assets/docs/physiology/cardiac_cycle_ecg_notes.pdf",
    fileSize: "1.9 MB",
    pages: "20 pages",
    author: "Dept. of Physiology",
    date: "Oct 2026",
    year: "1st Year MBBS"
  },
  {
    id: "phys-notes-02",
    title: "Resting Membrane Potential & Nerve Action Potential Mechanisms",
    subject: "physiology",
    category: "notes",
    code: "PY3.2 - PY3.5",
    description: "Biophysical basis of excitation: Nernst and Goldman equations, voltage-gated ion channels, refractory periods, and pharmacological channel blockers.",
    tags: ["General Physiology", "Nerve Muscle", "Action Potential", "Electrophysiology"],
    fileUrl: "assets/docs/physiology/action_potential_notes.pdf",
    fileSize: "1.3 MB",
    pages: "15 pages",
    author: "Dept. of Physiology",
    date: "Sep 2026",
    year: "1st Year MBBS"
  },
  {
    id: "phys-assign-01",
    title: "Arterial Blood Gas (ABG) & Spirometry Interpretation Assignment",
    subject: "physiology",
    category: "assignments",
    code: "PY6.3 - PY6.6",
    description: "Clinical case problem scenarios on respiratory acidosis/alkalosis, metabolic compensations, FEV1/FVC ratios and obstructive vs restrictive pulmonary patterns.",
    tags: ["Respiratory", "ABG", "Spirometry", "Case Assignment"],
    fileUrl: "assets/docs/physiology/respiratory_cases_assignment.pdf",
    fileSize: "1.1 MB",
    pages: "12 pages",
    author: "Clinical Physiology Unit",
    date: "Oct 2026",
    year: "1st Year MBBS"
  },
  {
    id: "phys-sdl-01",
    title: "Hypoxia Types & High-Altitude Acclimatization SDL Module",
    subject: "physiology",
    category: "sdls",
    code: "PY6.8 - PY6.9",
    description: "Self-directed study module covering hypoxic, anemic, stagnant and histotoxic hypoxia, along with acute mountain sickness (AMS, HAPE, HACE).",
    tags: ["Hypoxia", "High Altitude", "Environmental Physiology", "SDL"],
    fileUrl: "assets/docs/physiology/hypoxia_altitude_sdl.pdf",
    fileSize: "1.5 MB",
    pages: "14 pages",
    author: "CBME Curriculum Cell",
    date: "Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "phys-prac-01",
    title: "Hematology Practicals: TLC, DLC, RBC Count, ESR, PT & Clotting Time",
    subject: "physiology",
    category: "practicals",
    code: "PY2.11 - PY2.13",
    description: "Standard operating procedures and clinical significance for Neubaer hemocytometer cell counts, Leishman staining, Westergren ESR, and bleeding/clotting times.",
    tags: ["Hematology", "Practical Manual", "Blood Counts", "Clinical Lab"],
    fileUrl: "assets/docs/physiology/hematology_practical_manual.pdf",
    fileSize: "2.8 MB",
    pages: "26 pages",
    author: "Physiology Practical Lab",
    date: "Aug 2026",
    year: "1st Year MBBS"
  },
  {
    id: "phys-other-01",
    title: "Physiological Normal Reference Values & Clinical Formulae Pocket Card",
    subject: "physiology",
    category: "other",
    code: "PY-REF-VALUES",
    description: "Concise cheat sheet with vital signs, standard hemodynamic equations, pulmonary volumes, glomerular filtration rate equations, and electrolyte norms.",
    tags: ["Reference Card", "Normal Values", "Formulas", "Pocket Guide"],
    fileUrl: "assets/docs/physiology/normal_lab_values_reference.pdf",
    fileSize: "0.9 MB",
    pages: "8 pages",
    author: "Academic Council",
    date: "Oct 2026",
    year: "1st Year MBBS"
  },

  // ==========================================
  // BIOCHEMISTRY
  // ==========================================
  {
    id: "bioc-notes-01",
    title: "Carbohydrate Metabolism: Glycolysis, TCA Cycle & Gluconeogenesis",
    subject: "biochemistry",
    category: "notes",
    code: "BI3.1 - BI3.7",
    description: "Complete metabolic pathways with key rate-limiting regulatory enzymes, high-energy phosphate calculations (ATP balances), and hormonal regulation by insulin/glucagon.",
    tags: ["Carbohydrates", "Metabolism", "Glycolysis", "Krebs Cycle", "Bioenergetics"],
    fileUrl: "assets/docs/biochemistry/carbohydrate_metabolism_notes.pdf",
    fileSize: "2.4 MB",
    pages: "24 pages",
    author: "Dept. of Biochemistry",
    date: "Oct 2026",
    year: "1st Year MBBS"
  },
  {
    id: "bioc-notes-02",
    title: "Enzyme Kinetics, Lineweaver-Burk Plot & Diagnostic Enzymology",
    subject: "biochemistry",
    category: "notes",
    code: "BI2.3 - BI2.7",
    description: "Michaelis-Menten kinetics, Km and Vmax calculations, competitive vs non-competitive enzyme inhibition, and cardiac/hepatic serum biomarker enzymes.",
    tags: ["Enzymology", "Enzyme Kinetics", "Isoenzymes", "Clinical Markers"],
    fileUrl: "assets/docs/biochemistry/enzyme_kinetics_notes.pdf",
    fileSize: "1.7 MB",
    pages: "18 pages",
    author: "Dept. of Biochemistry",
    date: "Sep 2026",
    year: "1st Year MBBS"
  },
  {
    id: "bioc-assign-01",
    title: "Clinical Vignettes: Inborn Errors of Amino Acid Metabolism",
    subject: "biochemistry",
    category: "assignments",
    code: "BI5.3 - BI5.5",
    description: "Case-based problem solving on Phenylketonuria (PKU), Alkaptonuria, Maple Syrup Urine Disease (MSUD), and Homocystinuria with dietary management.",
    tags: ["Inborn Errors", "Amino Acids", "Clinical Cases", "Assignment"],
    fileUrl: "assets/docs/biochemistry/inborn_errors_assignment.pdf",
    fileSize: "1.2 MB",
    pages: "11 pages",
    author: "Clinical Biochemistry Unit",
    date: "Oct 2026",
    year: "1st Year MBBS"
  },
  {
    id: "bioc-sdl-01",
    title: "Vitamins & Nutritional Deficiencies: CBME Self-Directed Learning",
    subject: "biochemistry",
    category: "sdls",
    code: "BI6.1 - BI6.5",
    description: "Coenzyme roles of water-soluble and fat-soluble vitamins, biochemical mechanisms of deficiency syndromes (Scurvy, Beriberi, Pellagra, Rickets) and hypervitaminosis.",
    tags: ["Vitamins", "Nutrition", "Deficiencies", "SDL", "Coenzymes"],
    fileUrl: "assets/docs/biochemistry/vitamin_deficiencies_sdl.pdf",
    fileSize: "1.6 MB",
    pages: "16 pages",
    author: "CBME Curriculum Cell",
    date: "Nov 2026",
    year: "1st Year MBBS"
  },
  {
    id: "bioc-prac-01",
    title: "Clinical Biochemistry Practical Manual: Urine Analysis & Creatinine",
    subject: "biochemistry",
    category: "practicals",
    code: "BI11.1 - BI11.4",
    description: "Laboratory procedures for testing abnormal constituents in urine (proteins, ketone bodies, bile pigments), Jaffe colorimetric method for serum creatinine, and spectrophotometry.",
    tags: ["Practical Manual", "Urine Analysis", "Spectrophotometry", "Clinical Lab"],
    fileUrl: "assets/docs/biochemistry/clinical_biochem_manual.pdf",
    fileSize: "2.3 MB",
    pages: "22 pages",
    author: "Biochemistry Lab Faculty",
    date: "Aug 2026",
    year: "1st Year MBBS"
  },
  {
    id: "bioc-other-01",
    title: "Clinical Chemistry Diagnostic Markers & University Exam Question Bank",
    subject: "biochemistry",
    category: "other",
    code: "BI-EXAM-REV",
    description: "Liver function tests (LFT), Renal function tests (RFT), Lipid profile cutoffs, and 10-year compiled university exam questions with model answers.",
    tags: ["Question Bank", "Diagnostic Markers", "Exam Prep", "Lab Values"],
    fileUrl: "assets/docs/biochemistry/clinical_chemistry_cheat_sheet.pdf",
    fileSize: "2.0 MB",
    pages: "30 pages",
    author: "Academic Council",
    date: "Nov 2026",
    year: "1st Year MBBS"
  }
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
  assignments: { label: "Assignments", badgeClass: "badge-assignments", icon: "assignment", desc: "Worksheets, clinical vignettes & records" },
  sdls: { label: "SDLs", badgeClass: "badge-sdls", icon: "sdl", desc: "Self-Directed Learning modules & tasks" },
  practicals: { label: "Practicals", badgeClass: "badge-practicals", icon: "practical", desc: "Lab manuals, procedures & spotters" },
  other: { label: "Other Resources", badgeClass: "badge-other", icon: "other", desc: "Question banks, flashcards & cheat sheets" }
};
