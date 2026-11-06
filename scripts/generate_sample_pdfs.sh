#!/bin/bash
# PDF generator script for MBBS Resource Library

TMP_DIR="${TMPDIR:-/data/data/com.termux/files/usr/tmp}"
mkdir -p "$TMP_DIR"

generate_pdf() {
    local outfile="$1"
    local title="$2"
    local subject="$3"
    local category="$4"
    local code="$5"
    local desc="$6"
    local college="GOVERNMENT MEDICAL COLLEGE / MBBS LIBRARY"

    local stream_file="$TMP_DIR/pdf_stream_$$.txt"

    # Prepare stream content
    cat << EOF > "$stream_file"
BT
/F1 18 Tf
50 730 Td
($college) Tj
0 -26 Td
/F2 15 Tf
($subject - $category) Tj
0 -24 Td
/F1 12 Tf
(Module Code: $code) Tj
0 -20 Td
/F2 13 Tf
(Topic: $title) Tj
0 -26 Td
/F1 11 Tf
(Document Summary & High-Yield Learning Objectives:) Tj
0 -18 Td
($desc) Tj
0 -30 Td
/F1 10 Tf
(------------------------------------------------------------------------------------------) Tj
0 -16 Td
(Official MBBS Academic Resource - Clean, Free & Accessible) Tj
0 -14 Td
(For Study, Revision and Competency Assessment under Medical Council Guidelines) Tj
0 -14 Td
(Visit the college resource portal for more updates and revision materials.) Tj
ET
EOF

    local stream_len=$(wc -c < "$stream_file")

    # Write PDF
    cat << EOF > "$outfile"
%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Resources <<
    /Font <<
      /F1 5 0 R
      /F2 6 0 R
    >>
  >>
  /Contents 4 0 R
>>
endobj
4 0 obj
<<
  /Length $stream_len
>>
stream
$(cat "$stream_file")
endstream
endobj
5 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica-Bold
>>
endobj
6 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000450 00000 n 
0000000530 00000 n 
trailer
<<
  /Size 7
  /Root 1 0 R
>>
startxref
610
%%EOF
EOF

    rm -f "$stream_file"
}

# Anatomy
generate_pdf "mbbs-resource-library/assets/docs/anatomy/brachial_plexus_notes.pdf" \
  "Brachial Plexus - Roots, Trunks, Divisions, Cords & Branches" \
  "ANATOMY" "NOTES" "AN10.1 - AN10.3" \
  "Comprehensive high-yield notes with schematic diagrams of Erb-Duchenne and Klumpke palsies."

generate_pdf "mbbs-resource-library/assets/docs/anatomy/cranial_nerves_summary.pdf" \
  "12 Cranial Nerves - Nuclei, Functional Components & Clinical Tests" \
  "ANATOMY" "NOTES" "AN62.1 - AN62.6" \
  "Tabular summary of cranial nerve pathways, foramina, and examination protocols."

generate_pdf "mbbs-resource-library/assets/docs/anatomy/histology_workbook_assignment.pdf" \
  "Histology Microscopic Slide Identification & Drawing Assignment" \
  "ANATOMY" "ASSIGNMENTS" "AN65.1" \
  "Practical sketches and identification points for epithelial, connective and muscular tissues."

generate_pdf "mbbs-resource-library/assets/docs/anatomy/inguinal_canal_sdl.pdf" \
  "Inguinal Canal & Hernias - Applied Surgical Anatomy SDL" \
  "ANATOMY" "SDL" "AN47.1 - AN47.5" \
  "Self-directed learning module covering walls, rings, contents and direct vs indirect hernias."

generate_pdf "mbbs-resource-library/assets/docs/anatomy/gross_dissection_manual.pdf" \
  "Gross Anatomy Dissection Guide - Upper & Lower Limb" \
  "ANATOMY" "PRACTICALS" "AN12.1" \
  "Step-by-step cadaveric dissection checklist, relations and vascular bundles."

generate_pdf "mbbs-resource-library/assets/docs/anatomy/anatomy_viva_question_bank.pdf" \
  "First Year Anatomy Viva Voce & University Exam Blueprint" \
  "ANATOMY" "OTHER RESOURCES" "AN-EXAM" \
  "Past 10 years university exam questions, bone markings and surface anatomy flashcards."

# Physiology
generate_pdf "mbbs-resource-library/assets/docs/physiology/cardiac_cycle_ecg_notes.pdf" \
  "Cardiac Cycle, Pressure-Volume Loops and Normal ECG Waves" \
  "PHYSIOLOGY" "NOTES" "PY5.1 - PY5.4" \
  "Detailed Wiggers diagram, mechanical vs electrical cardiac events, and Einthoven triangle."

generate_pdf "mbbs-resource-library/assets/docs/physiology/action_potential_notes.pdf" \
  "Resting Membrane Potential & Nerve Action Potential Mechanisms" \
  "PHYSIOLOGY" "NOTES" "PY3.2 - PY3.5" \
  "Ionic basis of excitation, Hodgkin cycle, saltatory conduction and local anesthetics."

generate_pdf "mbbs-resource-library/assets/docs/physiology/respiratory_cases_assignment.pdf" \
  "Arterial Blood Gas (ABG) & Spirometry Interpretation Assignment" \
  "PHYSIOLOGY" "ASSIGNMENTS" "PY6.3 - PY6.6" \
  "Clinical problem-solving worksheets: Obstructive vs Restrictive lung disease patterns."

generate_pdf "mbbs-resource-library/assets/docs/physiology/hypoxia_altitude_sdl.pdf" \
  "Hypoxia Types & High-Altitude Acclimatization SDL Module" \
  "PHYSIOLOGY" "SDL" "PY6.8" \
  "Physiological responses to acute and chronic hypobaric hypoxia, AMS, HAPE and HACE."

generate_pdf "mbbs-resource-library/assets/docs/physiology/hematology_practical_manual.pdf" \
  "Hematology Practicals: TLC, DLC, RBC Count, ESR, PT & Clotting Time" \
  "PHYSIOLOGY" "PRACTICALS" "PY2.11 - PY2.13" \
  "Standard operating procedures for hemocytometry, differential staining and clinical significance."

generate_pdf "mbbs-resource-library/assets/docs/physiology/normal_lab_values_reference.pdf" \
  "Physiological Normal Reference Values & Clinical Formulae Pocket Card" \
  "PHYSIOLOGY" "OTHER RESOURCES" "PY-REF" \
  "Quick revision reference for vital parameters, GFR equations, and electrolyte norms."

# Biochemistry
generate_pdf "mbbs-resource-library/assets/docs/biochemistry/carbohydrate_metabolism_notes.pdf" \
  "Carbohydrate Metabolism: Glycolysis, TCA Cycle, Gluconeogenesis & HMP Shunt" \
  "BIOCHEMISTRY" "NOTES" "BI3.1 - BI3.7" \
  "High-yield biochemical pathways, key regulatory enzymes, energetics and ATP balances."

generate_pdf "mbbs-resource-library/assets/docs/biochemistry/enzyme_kinetics_notes.pdf" \
  "Enzyme Kinetics, Lineweaver-Burk Plot & Diagnostic Enzymology" \
  "BIOCHEMISTRY" "NOTES" "BI2.3 - BI2.7" \
  "Michaelis-Menten kinetics, competitive vs non-competitive inhibition, and cardiac biomarkers."

generate_pdf "mbbs-resource-library/assets/docs/biochemistry/inborn_errors_assignment.pdf" \
  "Clinical Case Assignment: Inborn Errors of Amino Acid Metabolism" \
  "BIOCHEMISTRY" "ASSIGNMENTS" "BI5.3 - BI5.5" \
  "Clinical vignettes on PKU, Alkaptonuria, Maple Syrup Urine Disease and Homocystinuria."

generate_pdf "mbbs-resource-library/assets/docs/biochemistry/vitamin_deficiencies_sdl.pdf" \
  "Vitamins & Nutritional Deficiencies - CBME Self-Directed Learning" \
  "BIOCHEMISTRY" "SDL" "BI6.1 - BI6.5" \
  "Fat-soluble and water-soluble vitamins: coenzyme forms, deficiency diseases and RDA."

generate_pdf "mbbs-resource-library/assets/docs/biochemistry/clinical_biochem_manual.pdf" \
  "Clinical Biochemistry Practical Manual: Urine Analysis & Serum Creatinine" \
  "BIOCHEMISTRY" "PRACTICALS" "BI11.1 - BI11.4" \
  "Standard chemical procedures for abnormal constituents of urine, Jaffe reaction and colorimetry."

generate_pdf "mbbs-resource-library/assets/docs/biochemistry/clinical_chemistry_cheat_sheet.pdf" \
  "Clinical Chemistry Diagnostic Markers & University Question Bank" \
  "BIOCHEMISTRY" "OTHER RESOURCES" "BI-EXAM" \
  "LFT, RFT, Lipid Profile diagnostic cutoffs, and 10-year University exam essay questions."

echo "All sample PDFs generated successfully!"
