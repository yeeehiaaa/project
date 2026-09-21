// Common laboratory test catalog (French names, units, adult reference ranges).
// Used as selectable tags when a patient adds a lab report (bilan).

export interface LabTestCatalogEntry {
  name: string;
  unit?: string;
  referenceMin?: number;
  referenceMax?: number;
}

export interface LabTestCategory {
  category: string;
  tests: LabTestCatalogEntry[];
}

export const LAB_TEST_CATALOG: LabTestCategory[] = [
  {
    category: "Biochimie — Glycémie & Diabète",
    tests: [
      { name: "Glycémie à jeun", unit: "g/L", referenceMin: 0.7, referenceMax: 1.1 },
      { name: "Hémoglobine glyquée (HbA1c)", unit: "%", referenceMin: 4, referenceMax: 6 },
      { name: "Glycémie post-prandiale", unit: "g/L", referenceMin: 0.7, referenceMax: 1.4 },
    ],
  },
  {
    category: "Biochimie — Bilan lipidique",
    tests: [
      { name: "Cholestérol total", unit: "g/L", referenceMin: 1.25, referenceMax: 2 },
      { name: "HDL Cholestérol", unit: "g/L", referenceMin: 0.4, referenceMax: 0.8 },
      { name: "LDL Cholestérol", unit: "g/L", referenceMin: 0.6, referenceMax: 1.6 },
      { name: "Triglycérides", unit: "g/L", referenceMin: 0.4, referenceMax: 1.5 },
    ],
  },
  {
    category: "Biochimie — Fonction rénale",
    tests: [
      { name: "Créatinine", unit: "mg/L", referenceMin: 6, referenceMax: 13 },
      { name: "Urée", unit: "g/L", referenceMin: 0.15, referenceMax: 0.45 },
      { name: "Acide urique", unit: "mg/L", referenceMin: 30, referenceMax: 70 },
      { name: "DFG estimé", unit: "mL/min" },
    ],
  },
  {
    category: "Biochimie — Ionogramme & Minéraux",
    tests: [
      { name: "Sodium (Na+)", unit: "mmol/L", referenceMin: 135, referenceMax: 145 },
      { name: "Potassium (K+)", unit: "mmol/L", referenceMin: 3.5, referenceMax: 5 },
      { name: "Calcium", unit: "mg/L", referenceMin: 85, referenceMax: 105 },
      { name: "Magnésium", unit: "mg/L", referenceMin: 18, referenceMax: 24 },
      { name: "Fer sérique", unit: "µg/dL", referenceMin: 60, referenceMax: 170 },
      { name: "Ferritine", unit: "ng/mL", referenceMin: 15, referenceMax: 300 },
    ],
  },
  {
    category: "Biochimie — Bilan hépatique",
    tests: [
      { name: "ASAT (TGO)", unit: "UI/L", referenceMin: 5, referenceMax: 40 },
      { name: "ALAT (TGP)", unit: "UI/L", referenceMin: 5, referenceMax: 40 },
      { name: "Gamma-GT", unit: "UI/L", referenceMin: 5, referenceMax: 60 },
      { name: "Bilirubine totale", unit: "mg/L", referenceMin: 2, referenceMax: 12 },
      { name: "Phosphatases alcalines", unit: "UI/L", referenceMin: 40, referenceMax: 130 },
    ],
  },
  {
    category: "Biochimie — Inflammation & Vitamines",
    tests: [
      { name: "CRP", unit: "mg/L", referenceMin: 0, referenceMax: 6 },
      { name: "VS (Vitesse de sédimentation)", unit: "mm/h", referenceMin: 0, referenceMax: 20 },
      { name: "Vitamine D", unit: "ng/mL", referenceMin: 30, referenceMax: 100 },
      { name: "Vitamine B12", unit: "pg/mL", referenceMin: 200, referenceMax: 900 },
      { name: "Folates (B9)", unit: "ng/mL", referenceMin: 3, referenceMax: 17 },
    ],
  },
  {
    category: "Hématologie — NFS",
    tests: [
      { name: "NFS (Numération formule sanguine)" },
      { name: "Hémoglobine", unit: "g/dL", referenceMin: 12, referenceMax: 17 },
      { name: "Hématocrite", unit: "%", referenceMin: 36, referenceMax: 50 },
      { name: "Leucocytes (GB)", unit: "/mm³", referenceMin: 4000, referenceMax: 10000 },
      { name: "Plaquettes", unit: "/mm³", referenceMin: 150000, referenceMax: 400000 },
      { name: "VGM", unit: "fL", referenceMin: 80, referenceMax: 100 },
      { name: "Groupe sanguin" },
    ],
  },
  {
    category: "Hormones — Thyroïde",
    tests: [
      { name: "TSH", unit: "mUI/L", referenceMin: 0.4, referenceMax: 4 },
      { name: "T3 libre (FT3)", unit: "pg/mL", referenceMin: 2, referenceMax: 4.4 },
      { name: "T4 libre (FT4)", unit: "ng/dL", referenceMin: 0.8, referenceMax: 1.8 },
      { name: "T3 totale", unit: "ng/mL", referenceMin: 0.8, referenceMax: 2 },
      { name: "T4 totale", unit: "µg/dL", referenceMin: 4.5, referenceMax: 11.5 },
      { name: "Anti-TPO" },
    ],
  },
  {
    category: "Cardiaque",
    tests: [
      { name: "Troponine", unit: "ng/L", referenceMin: 0, referenceMax: 14 },
      { name: "BNP / NT-proBNP", unit: "pg/mL" },
      { name: "D-Dimères", unit: "ng/mL", referenceMin: 0, referenceMax: 500 },
      { name: "CK / CPK", unit: "UI/L", referenceMin: 30, referenceMax: 200 },
    ],
  },
  {
    category: "Urinaire",
    tests: [
      { name: "ECBU" },
      { name: "Protéinurie des 24h", unit: "g/24h", referenceMin: 0, referenceMax: 0.15 },
      { name: "Créatininurie" },
      { name: "Bandelette urinaire" },
    ],
  },
  {
    category: "Autres",
    tests: [
      { name: "PSA", unit: "ng/mL", referenceMin: 0, referenceMax: 4 },
      { name: "Bêta-HCG", unit: "mUI/mL" },
      { name: "Test COVID / Grippe" },
      { name: "Sérologie" },
      { name: "Électrophorèse des protéines" },
    ],
  },
];
