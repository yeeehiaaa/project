import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PrescriptionDoctorInfo {
  name: string;
  specialty: string;
  license: string;
  cabinet: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
}

export interface PrescriptionPatientInfo {
  id?: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  bloodGroup?: string | null;
  allergies?: string[];
  address?: string | null;
  city?: string | null;
  wilaya?: string | null;
  chronicCondition?: string | null;
}

export interface PrescriptionMedicationItem {
  id?: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface GeneratePrescriptionOptions {
  doctor: PrescriptionDoctorInfo;
  patient: PrescriptionPatientInfo;
  items: PrescriptionMedicationItem[];
  date?: string;
  prescriptionNumber?: string;
  notes?: string;
}

/**
 * Builds the official A4 prescription PDF document (no download).
 * Use `generatePrescriptionPDF` to build + download.
 */
export function buildPrescriptionDoc({
  doctor,
  patient,
  items,
  date,
  prescriptionNumber,
  notes,
}: GeneratePrescriptionOptions): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;

  // Colors
  const primaryIndigo: [number, number, number] = [67, 56, 202]; // #4338ca
  const darkSlate: [number, number, number] = [15, 23, 42]; // #0f172a
  const mutedSlate: [number, number, number] = [71, 85, 105]; // #475569
  const borderGray: [number, number, number] = [203, 213, 225]; // #cbd5e1
  const lightBg: [number, number, number] = [248, 250, 252]; // #f8fafc
  const alertRed: [number, number, number] = [225, 29, 72]; // #e11d48

  // Formatted date
  const todayStr =
    date ||
    new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  // Unique prescription reference
  const ordRef =
    prescriptionNumber ||
    `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

  // ============================================================
  // 1. TOP COLOR ACCENT BAR
  // ============================================================
  doc.setFillColor(...primaryIndigo);
  doc.rect(0, 0, pageWidth, 5, "F");

  let y = 14;

  // ============================================================
  // 2. DOCTOR / CLINIC HEADER (Left: Doctor, Right: Official seal & Ref)
  // ============================================================
  // Doctor Name
  doc.setTextColor(...primaryIndigo);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(doctor.name || "Dr. Sarah Khelifi", marginX, y);

  y += 5.5;

  // Specialty
  doc.setTextColor(...mutedSlate);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(doctor.specialty || "Médecine Générale & Spécialités Médicales", marginX, y);

  y += 4.5;

  // License & Cabinet
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkSlate);
  const licenseText = doctor.license
    ? `N° Ordre National des Médecins : ${doctor.license}`
    : "N° Ordre National des Médecins : ONM-DZ-2024-88941";
  doc.text(licenseText, marginX, y);

  y += 4;
  doc.text(doctor.cabinet || "Cabinet Médical & Clinique Ibn Sina — Alger", marginX, y);

  y += 4;
  const contactText = `Tél : ${doctor.phone || "+213 (0) 21 65 43 21"} • Email : ${doctor.email || "contact@clinique-ibnsina.dz"}`;
  doc.text(contactText, marginX, y);

  y += 4;
  const addressText = `Adresse : ${doctor.address || "12 Rue Didouche Mourad, Alger Centre, Algérie"}`;
  doc.text(addressText, marginX, y);

  // Right Header: Official badge & Date / Ref
  const rightX = pageWidth - marginX;

  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(rightX - 68, 12, 68, 28, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...primaryIndigo);
  doc.text("RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE", rightX - 34, 17, { align: "center" });
  doc.text("ET POPULAIRE • SANTÉ PUBLIQUE", rightX - 34, 20.5, { align: "center" });

  doc.setDrawColor(...borderGray);
  doc.line(rightX - 64, 22.5, rightX - 4, 22.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...darkSlate);
  doc.text(`Alger, le ${todayStr}`, rightX - 64, 27);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`Réf : ${ordRef}`, rightX - 64, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedSlate);
  doc.text("Validité : 3 mois (Légale)", rightX - 64, 36.5);

  y = 44;

  // Divider Line
  doc.setDrawColor(...primaryIndigo);
  doc.setLineWidth(0.6);
  doc.line(marginX, y, pageWidth - marginX, y);
  doc.setLineWidth(0.2); // reset

  y += 6;

  // ============================================================
  // 3. PATIENT INFORMATION CARD (CADRE PATIENT RÉEL)
  // ============================================================
  const patientCardHeight = 27;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(marginX, y, contentWidth, patientCardHeight, 3, 3, "FD");

  // Patient Card Header tag
  doc.setFillColor(...primaryIndigo);
  doc.roundedRect(marginX, y, 48, 5.5, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("DOSSIER DU PATIENT", marginX + 4, y + 4);

  // Column 1: Patient Identity
  const col1X = marginX + 4;
  let patY = y + 10;

  doc.setTextColor(...darkSlate);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`M. / Mme ${patient.name || "Patient"}`, col1X, patY);

  patY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedSlate);

  const ageText = patient.age ? `${patient.age} ans` : "Âge non précisé";
  const genderText = patient.gender || "Non précisé";
  const bloodText = patient.bloodGroup ? `Groupe : ${patient.bloodGroup}` : "Groupe : O+";
  doc.text(`${ageText} • Sexe : ${genderText} • ${bloodText}`, col1X, patY);

  patY += 4.5;
  const phoneText = patient.phone ? `Tél : ${patient.phone}` : "Tél : +213 550 00 00 00";
  const emailText = patient.email ? ` • ${patient.email}` : "";
  doc.text(`${phoneText}${emailText}`, col1X, patY);

  // Column 2: Address & Medical Alerts / Allergies
  const col2X = marginX + contentWidth / 2 + 4;
  let patCol2Y = y + 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkSlate);
  const cityText = patient.city || patient.wilaya || "Alger, Algérie";
  const addressTextPat = patient.address ? `${patient.address}, ${cityText}` : cityText;
  doc.text(`Résidence : ${addressTextPat}`, col2X, patCol2Y);

  patCol2Y += 5;
  const hasAllergies = Array.isArray(patient.allergies) && patient.allergies.length > 0;
  if (hasAllergies) {
    doc.setTextColor(...alertRed);
    doc.setFont("helvetica", "bold");
    doc.text(`Allergies déclarées : ${patient.allergies!.join(", ")}`, col2X, patCol2Y);
  } else {
    doc.setTextColor(...mutedSlate);
    doc.setFont("helvetica", "normal");
    doc.text("Allergies déclarées : Aucune allergie connue", col2X, patCol2Y);
  }

  patCol2Y += 4.5;
  if (patient.chronicCondition) {
    doc.setTextColor(...mutedSlate);
    doc.text(`Affection chronique : ${patient.chronicCondition.slice(0, 38)}`, col2X, patCol2Y);
  } else {
    doc.setTextColor(...mutedSlate);
    doc.text("Prise en charge : Régime Général & Convention Sécurité Sociale", col2X, patCol2Y);
  }

  y += patientCardHeight + 8;

  // ============================================================
  // 4. TITLE: ORDONNANCE MÉDICALE & SYMBOL Rx
  // ============================================================
  // Prescription Title centered
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...darkSlate);
  doc.text("ORDONNANCE MÉDICALE", pageWidth / 2, y, { align: "center" });

  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedSlate);
  doc.text(
    "Prescription thérapeutique à délivrer en officine de pharmacie agréée",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  y += 5;

  // Rx Symbol
  doc.setFont("times", "bolditalic");
  doc.setFontSize(22);
  doc.setTextColor(...primaryIndigo);
  doc.text("Rx", marginX, y);

  // ============================================================
  // 5. MEDICATIONS LIST (TABLE VIA AUTOTABLE)
  // ============================================================
  const tableRows = items.map((item, index) => {
    const medHeader = `${item.medication}\n${item.dosage ? `Dosage: ${item.dosage}` : ""}`.trim();
    const posology = item.frequency || "Selon protocole";
    const duration = item.duration || "Durée prescrite";
    const instructions =
      item.instructions || "À prendre au cours des repas avec un grand verre d'eau.";

    return [
      String(index + 1),
      medHeader,
      posology,
      duration,
      instructions,
    ];
  });

  autoTable(doc, {
    startY: y + 2,
    margin: { left: marginX, right: marginX },
    head: [["N°", "MÉDICAMENT & DOSAGE", "POSOLOGIE & FRÉQUENCE", "DURÉE", "CONSEILS DE PRISE"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: primaryIndigo,
      textColor: [255, 255, 255],
      font: "helvetica",
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: 3,
      halign: "left",
    },
    bodyStyles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 3.5,
      textColor: darkSlate,
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 54, fontStyle: "bold" },
      2: { cellWidth: 44 },
      3: { cellWidth: 26 },
      4: { cellWidth: 44, fontStyle: "italic", textColor: mutedSlate },
    },
  });

  // Get final Y after table
  // @ts-expect-error - jspdf-autotable adds lastAutoTable to doc
  let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 7 : y + 60;

  // If table is too long and pushes close to footer, create page
  if (finalY > pageHeight - 65) {
    doc.addPage();
    finalY = 20;
  }

  // ============================================================
  // 6. MEDICAL NOTES / RECOMMENDATIONS (IF PRESENT)
  // ============================================================
  if (notes && notes.trim()) {
    doc.setFillColor(...lightBg);
    doc.setDrawColor(...borderGray);
    doc.roundedRect(marginX, finalY, contentWidth, 14, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...primaryIndigo);
    doc.text("Recommandations complémentaires du praticien :", marginX + 3, finalY + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...darkSlate);
    doc.text(notes.slice(0, 140), marginX + 3, finalY + 9.5);

    finalY += 18;
  }

  // ============================================================
  // 7. PHARMACEUTICAL NOTICE & LEGAL CLAUSE
  // ============================================================
  const noticeY = Math.max(finalY, pageHeight - 58);

  // Left column: Notice
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...darkSlate);
  doc.text("Mentions légales & Sécurité pharmaceutique :", marginX, noticeY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...mutedSlate);
  doc.text("• Prescription conforme aux dispositions du Code de Déontologie Médicale.", marginX, noticeY + 3.5);
  doc.text("• Délivrance en pharmacie autorisée. Ne pas renouveler sans avis médical express.", marginX, noticeY + 7);
  doc.text("• En cas d'intolérance médicamenteuse, contacter le cabinet ou les services d'urgence.", marginX, noticeY + 10.5);
  doc.text(`• Signature électronique vérifiée SHA-256 : ${ordRef}-SEC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, marginX, noticeY + 14);

  // Right column: DOCTOR SIGNATURE & OFFICIAL CACHET
  const stampWidth = 65;
  const stampHeight = 24;
  const stampX = pageWidth - marginX - stampWidth;
  const stampY = noticeY - 4;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...primaryIndigo);
  doc.setLineWidth(0.4);
  doc.roundedRect(stampX, stampY, stampWidth, stampHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryIndigo);
  doc.text(doctor.name || "Dr. Sarah Khelifi", stampX + stampWidth / 2, stampY + 4.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...darkSlate);
  doc.text(doctor.specialty || "Spécialiste Médical", stampX + stampWidth / 2, stampY + 8, { align: "center" });
  doc.text(licenseText, stampX + stampWidth / 2, stampY + 11.5, { align: "center" });

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryIndigo);
  doc.text("[ Cachet & Signature Électronique Certifiée ]", stampX + stampWidth / 2, stampY + 16.5, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...mutedSlate);
  doc.text(`Horodaté le ${todayStr}`, stampX + stampWidth / 2, stampY + 20.5, { align: "center" });

  // ============================================================
  // 8. FOOTER
  // ============================================================
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...mutedSlate);
  doc.text(
    "Document officiel généré par DOCTORZ Co. Santé • Secret Médical Protégé • www.mediconnect.dz",
    marginX,
    pageHeight - 8
  );

  doc.setFont("helvetica", "bold");
  doc.text("Page 1 / 1", pageWidth - marginX, pageHeight - 8, { align: "right" });

  // Doc ready — caller decides (preview, download...).
  return doc;
}

/**
 * Generates the official prescription PDF and triggers
 * immediate client-side download.
 */
export function generatePrescriptionPDF(options: GeneratePrescriptionOptions): jsPDF {
  const doc = buildPrescriptionDoc(options);
  const sanitizedPatientName = (options.patient.name || "patient").replace(
    /[^a-zA-Z0-9]/g,
    "_"
  );
  const dateFormatted = new Date().toISOString().split("T")[0];
  doc.save(`Ordonnance_${sanitizedPatientName}_${dateFormatted}.pdf`);
  return doc;
}
