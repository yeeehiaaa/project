"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  Edit3,
  FileText,
  HeartPulse,
  Loader2,
  Phone,
  Pill,
  RefreshCw,
  Save,
  ShieldCheck,
  Stethoscope,
  Syringe,
  UserRound,
  X,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: string | null;
  birthDate: string | null;
  address: string | null;
  city: string | null;
  wilaya: string | null;
  postalCode: string | null;
  avatarUrl: string | null;
};

type Patient = {
  id: string;

  bloodType: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  currentMedications: string | null;
  medicalHistory: string | null;
  surgicalHistory: string | null;
  familyMedicalHistory: string | null;
  vaccinationHistory: string | null;

  smokingStatus: string | null;
  alcoholConsumption: string | null;
  physicalActivity: string | null;
  diet: string | null;

  additionalMedicalInfo: string | null;

  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;

  guardianFirstName: string | null;
  guardianLastName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  guardianRelation: string | null;

  updatedAt: string;
};

type MedicalRecord = {
  id: string;
  title: string;
  diagnosis: string | null;
  symptoms: string | null;
  notes: string | null;
  recordDate: string;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    specialties: string[];
  } | null;
};

type Appointment = {
  id: string;
  appointmentDate: string;
  status: string;
  type: string;
  reason: string | null;
  doctor: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    specialties: string[];
  } | null;
};

type PrescriptionItem = {
  id: string;
  medicationName: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
};

type Prescription = {
  id: string;
  prescribedAt: string;
  status: string;
  notes: string | null;
  doctor: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    specialties: string[];
  } | null;
  items: PrescriptionItem[];
};

type LaboratoryParameter = {
  id: string;
  name: string;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  flag: string | null;
};

type LaboratoryResult = {
  id: string;
  testName: string;
  resultDate: string;
  status: string;
  laboratoryName: string | null;
  parameters: LaboratoryParameter[];
};

type Vaccination = {
  id: string;
  vaccineName: string;
  doseNumber: number | null;
  administeredAt: string;
  notes: string | null;
};

type MedicalRecordResponse = {
  success: boolean;
  profile: Profile;
  patient: Patient;
  medicalRecords: MedicalRecord[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  laboratoryResults: LaboratoryResult[];
  vaccinations: Vaccination[];
};

/* ============================================================
   FORM
============================================================ */

type MedicalForm = {
  bloodType: string;

  allergies: string;
  chronicConditions: string;
  currentMedications: string;
  medicalHistory: string;
  surgicalHistory: string;
  familyMedicalHistory: string;
  vaccinationHistory: string;

  smokingStatus: string;
  alcoholConsumption: string;
  physicalActivity: string;
  diet: string;

  additionalMedicalInfo: string;

  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;

  guardianFirstName: string;
  guardianLastName: string;
  guardianEmail: string;
  guardianPhone: string;
  guardianRelation: string;
};

/* ============================================================
   HELPERS
============================================================ */

const emptyForm: MedicalForm = {
  bloodType: "",

  allergies: "",
  chronicConditions: "",
  currentMedications: "",
  medicalHistory: "",
  surgicalHistory: "",
  familyMedicalHistory: "",
  vaccinationHistory: "",

  smokingStatus: "",
  alcoholConsumption: "",
  physicalActivity: "",
  diet: "",

  additionalMedicalInfo: "",

  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",

  guardianFirstName: "",
  guardianLastName: "",
  guardianEmail: "",
  guardianPhone: "",
  guardianRelation: "",
};

function formatDate(date: string | null | undefined) {
  if (!date) return "Not provided";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function calculateAge(birthDate: string | null) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

function getInitials(
  firstName: string,
  lastName: string
) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function toForm(patient: Patient): MedicalForm {
  return {
    bloodType: patient.bloodType ?? "",

    allergies: patient.allergies ?? "",
    chronicConditions: patient.chronicConditions ?? "",
    currentMedications: patient.currentMedications ?? "",
    medicalHistory: patient.medicalHistory ?? "",
    surgicalHistory: patient.surgicalHistory ?? "",
    familyMedicalHistory:
      patient.familyMedicalHistory ?? "",
    vaccinationHistory:
      patient.vaccinationHistory ?? "",

    smokingStatus: patient.smokingStatus ?? "",
    alcoholConsumption:
      patient.alcoholConsumption ?? "",
    physicalActivity:
      patient.physicalActivity ?? "",
    diet: patient.diet ?? "",

    additionalMedicalInfo:
      patient.additionalMedicalInfo ?? "",

    emergencyContactName:
      patient.emergencyContactName ?? "",
    emergencyContactPhone:
      patient.emergencyContactPhone ?? "",
    emergencyContactRelation:
      patient.emergencyContactRelation ?? "",

    guardianFirstName:
      patient.guardianFirstName ?? "",
    guardianLastName:
      patient.guardianLastName ?? "",
    guardianEmail:
      patient.guardianEmail ?? "",
    guardianPhone:
      patient.guardianPhone ?? "",
    guardianRelation:
      patient.guardianRelation ?? "",
  };
}

/* ============================================================
   REUSABLE UI
============================================================ */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
        {icon}
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>
      
    </div>
  );
}

function FieldLabel({
  children,
  optional = false,
}: {
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      {children}

      {optional && (
        <span className="ml-1 font-normal text-slate-400">
          (optional)
        </span>
      )}
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  optional = false,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        >
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function MedicalRecordPage() {
  const [data, setData] =
    useState<MedicalRecordResponse | null>(null);

  const [form, setForm] =
    useState<MedicalForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  /* ============================================================
     LOAD
  ============================================================ */

  async function loadMedicalRecord() {
    try {
      setLoading(true);
      setError(null);

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !sessionData.session
      ) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      const response = await fetch(
        "/api/dashboard/patient/medical-record",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to load your medical record."
        );
      }

      setData(result);
      setForm(toForm(result.patient));
    } catch (err) {
      console.error(
        "Medical record loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your medical record."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedicalRecord();
  }, []);

  /* ============================================================
     FORM CHANGE
  ============================================================ */

  function updateField(
    field: keyof MedicalForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* ============================================================
     SAVE
  ============================================================ */

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !sessionData.session
      ) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      const response = await fetch(
        "/api/dashboard/patient/medical-record",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to save your medical information."
        );
      }

      setSuccessMessage(
        "Your medical information has been saved successfully."
      );

      setEditing(false);

      await loadMedicalRecord();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Medical record save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your medical information."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ============================================================
     DERIVED DATA
  ============================================================ */

  const age = useMemo(
    () =>
      calculateAge(
        data?.profile.birthDate ?? null
      ),
    [data]
  );

  const hasMedicalInformation = useMemo(() => {
    if (!data?.patient) return false;

    const patient = data.patient;

    return Boolean(
      patient.bloodType ||
        patient.allergies ||
        patient.chronicConditions ||
        patient.currentMedications ||
        patient.medicalHistory ||
        patient.surgicalHistory ||
        patient.familyMedicalHistory ||
        patient.vaccinationHistory ||
        patient.smokingStatus ||
        patient.alcoholConsumption ||
        patient.physicalActivity ||
        patient.diet ||
        patient.additionalMedicalInfo
    );
  }, [data]);

  const latestDoctor =
    data?.medicalRecords?.[0]?.doctor ??
    data?.appointments?.[0]?.doctor ??
    null;

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
            <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
          </div>

          <p className="text-sm font-medium text-slate-500">
            Loading your medical record...
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     ERROR
  ============================================================ */

  if (error && !data) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>

          <h2 className="text-lg font-bold text-slate-900">
            Unable to load medical record
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            onClick={loadMedicalRecord}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  /* ============================================================
     RENDER
  ============================================================ */





const handleDownloadPDF = () => {
  if (!data) {
    setError(
      "Les informations médicales ne sont pas encore disponibles."
    );
    return;
  }

  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor: [number, number, number] = [
    99, 102, 241,
  ];

  const darkColor: [number, number, number] = [
    30, 41, 59,
  ];

  const grayColor: [number, number, number] = [
    100, 116, 139,
  ];

  const profile = data.profile;
  const patient = data.patient;

  const value = (
    text: string | null | undefined
  ) => {
    return text?.trim()
      ? text.trim()
      : "Non renseigné";
  };

  const formatPDFDate = (
    date: string | null | undefined
  ) => {
    if (!date) return "Non renseigné";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("fr-FR");
  };

  const addHeader = () => {
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 32, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);

    doc.text(
      "MediConnect AI",
      15,
      14
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.text(
      "Dossier médical du patient",
      15,
      23
    );

    doc.setTextColor(...darkColor);
  };

  const addFooter = () => {
    const pageCount =
      doc.getNumberOfPages();

    for (
      let i = 1;
      i <= pageCount;
      i++
    ) {
      doc.setPage(i);

      doc.setDrawColor(
        226,
        232,
        240
      );

      doc.line(
        15,
        pageHeight - 15,
        pageWidth - 15,
        pageHeight - 15
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8);

      doc.setTextColor(
        ...grayColor
      );

      doc.text(
        "MediConnect AI — Document médical personnel",
        15,
        pageHeight - 9
      );

      doc.text(
        `Page ${i} / ${pageCount}`,
        pageWidth - 35,
        pageHeight - 9
      );
    }
  };

  const addSectionTitle = (
    title: string,
    y: number
  ) => {
    doc.setFillColor(
      238,
      242,
      255
    );

    doc.roundedRect(
      15,
      y - 6,
      pageWidth - 30,
      11,
      3,
      3,
      "F"
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.setTextColor(
      ...primaryColor
    );

    doc.text(
      title,
      20,
      y + 1
    );

    return y + 14;
  };

  addHeader();

  let y = 45;

  // ============================================================
  // INFORMATIONS PERSONNELLES
  // ============================================================

  y = addSectionTitle(
    "Informations personnelles",
    y
  );

  autoTable(doc, {
    startY: y,
    margin: {
      left: 15,
      right: 15,
    },
    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 4,
      textColor: darkColor,
    },

    columnStyles: {
      0: {
        cellWidth: 55,
        fontStyle: "bold",
      },
    },

    body: [
      [
        "Nom complet",
        `${value(
          profile.firstName
        )} ${value(
          profile.lastName
        )}`,
      ],

      [
        "Email",
        value(profile.email),
      ],

      [
        "Téléphone",
        value(profile.phone),
      ],

      [
        "Date de naissance",
        formatPDFDate(
          profile.birthDate
        ),
      ],

      [
        "Sexe",
        value(profile.gender),
      ],

      [
        "Adresse",
        value(profile.address),
      ],

      [
        "Ville",
        value(profile.city),
      ],

      [
        "Wilaya",
        value(profile.wilaya),
      ],

      [
        "Code postal",
        value(profile.postalCode),
      ],
    ],
  });

  y =
    (doc as any).lastAutoTable
      .finalY + 15;

  // ============================================================
  // INFORMATIONS MÉDICALES
  // ============================================================

  y = addSectionTitle(
    "Informations médicales",
    y
  );

  autoTable(doc, {
    startY: y,
    margin: {
      left: 15,
      right: 15,
    },
    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 4,
      overflow: "linebreak",
      textColor: darkColor,
    },

    columnStyles: {
      0: {
        cellWidth: 55,
        fontStyle: "bold",
      },
    },

    body: [
      [
        "Groupe sanguin",
        value(patient.bloodType),
      ],

      [
        "Allergies",
        value(patient.allergies),
      ],

      [
        "Maladies chroniques",
        value(
          patient.chronicConditions
        ),
      ],

      [
        "Médicaments actuels",
        value(
          patient.currentMedications
        ),
      ],

      [
        "Antécédents médicaux",
        value(
          patient.medicalHistory
        ),
      ],

      [
        "Antécédents chirurgicaux",
        value(
          patient.surgicalHistory
        ),
      ],

      [
        "Antécédents familiaux",
        value(
          patient.familyMedicalHistory
        ),
      ],

      [
        "Historique vaccinal",
        value(
          patient.vaccinationHistory
        ),
      ],
    ],
  });

  y =
    (doc as any).lastAutoTable
      .finalY + 15;

  // ============================================================
  // MODE DE VIE
  // ============================================================

  y = addSectionTitle(
    "Mode de vie",
    y
  );

  autoTable(doc, {
    startY: y,
    margin: {
      left: 15,
      right: 15,
    },
    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 4,
      overflow: "linebreak",
      textColor: darkColor,
    },

    columnStyles: {
      0: {
        cellWidth: 55,
        fontStyle: "bold",
      },
    },

    body: [
      [
        "Tabagisme",
        value(
          patient.smokingStatus
        ),
      ],

      [
        "Consommation d'alcool",
        value(
          patient.alcoholConsumption
        ),
      ],

      [
        "Activité physique",
        value(
          patient.physicalActivity
        ),
      ],

      [
        "Alimentation",
        value(patient.diet),
      ],

      [
        "Informations supplémentaires",
        value(
          patient.additionalMedicalInfo
        ),
      ],
    ],
  });

  y =
    (doc as any).lastAutoTable
      .finalY + 15;

  // ============================================================
  // CONTACT D'URGENCE
  // ============================================================

  if (
    patient.emergencyContactName ||
    patient.emergencyContactPhone ||
    patient.emergencyContactRelation
  ) {
    y = addSectionTitle(
      "Contact d'urgence",
      y
    );

    autoTable(doc, {
      startY: y,
      margin: {
        left: 15,
        right: 15,
      },
      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 4,
        textColor: darkColor,
      },

      columnStyles: {
        0: {
          cellWidth: 55,
          fontStyle: "bold",
        },
      },

      body: [
        [
          "Nom",
          value(
            patient.emergencyContactName
          ),
        ],

        [
          "Téléphone",
          value(
            patient.emergencyContactPhone
          ),
        ],

        [
          "Relation",
          value(
            patient.emergencyContactRelation
          ),
        ],
      ],
    });

    y =
      (doc as any).lastAutoTable
        .finalY + 15;
  }

  // ============================================================
  // TUTEUR / RESPONSABLE
  // ============================================================

  if (
    patient.guardianFirstName ||
    patient.guardianLastName ||
    patient.guardianEmail ||
    patient.guardianPhone ||
    patient.guardianRelation
  ) {
    y = addSectionTitle(
      "Tuteur / Responsable légal",
      y
    );

    autoTable(doc, {
      startY: y,
      margin: {
        left: 15,
        right: 15,
      },
      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 4,
        textColor: darkColor,
      },

      columnStyles: {
        0: {
          cellWidth: 55,
          fontStyle: "bold",
        },
      },

      body: [
        [
          "Nom complet",
          `${value(
            patient.guardianFirstName
          )} ${value(
            patient.guardianLastName
          )}`,
        ],

        [
          "Email",
          value(
            patient.guardianEmail
          ),
        ],

        [
          "Téléphone",
          value(
            patient.guardianPhone
          ),
        ],

        [
          "Relation",
          value(
            patient.guardianRelation
          ),
        ],
      ],
    });

    y =
      (doc as any).lastAutoTable
        .finalY + 15;
  }

  // ============================================================
  // DOSSIERS MÉDICAUX
  // ============================================================

  if (
    data.medicalRecords.length > 0
  ) {
    y = addSectionTitle(
      "Historique des consultations",
      y
    );

    autoTable(doc, {
      startY: y,
      margin: {
        left: 15,
        right: 15,
      },
      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
      },

      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },

      head: [
        [
          "Date",
          "Titre",
          "Diagnostic",
          "Symptômes",
          "Notes",
        ],
      ],

      body: data.medicalRecords.map(
        (record) => [
          formatPDFDate(
            record.recordDate
          ),
          value(record.title),
          value(record.diagnosis),
          value(record.symptoms),
          value(record.notes),
        ]
      ),
    });

    y =
      (doc as any).lastAutoTable
        .finalY + 15;
  }

  // ============================================================
  // PRESCRIPTIONS
  // ============================================================

  if (
    data.prescriptions.length > 0
  ) {
    y = addSectionTitle(
      "Prescriptions",
      y
    );

    autoTable(doc, {
      startY: y,
      margin: {
        left: 15,
        right: 15,
      },
      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
      },

      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },

      head: [
        [
          "Date",
          "Statut",
          "Médecin",
          "Médicaments",
        ],
      ],

      body: data.prescriptions.map(
        (prescription) => [
          formatPDFDate(
            prescription.prescribedAt
          ),

          value(
            prescription.status
          ),

          prescription.doctor
            ? `Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}`
            : "Non renseigné",

          prescription.items.length > 0
            ? prescription.items
                .map(
                  (item) =>
                    `${item.medicationName}${
                      item.dosage
                        ? ` (${item.dosage})`
                        : ""
                    }`
                )
                .join(", ")
            : "Aucun médicament",
        ]
      ),
    });

    y =
      (doc as any).lastAutoTable
        .finalY + 15;
  }

  // ============================================================
  // LABORATOIRE
  // ============================================================

  if (
    data.laboratoryResults.length > 0
  ) {
    y = addSectionTitle(
      "Résultats de laboratoire",
      y
    );

    autoTable(doc, {
      startY: y,
      margin: {
        left: 15,
        right: 15,
      },
      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
      },

      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },

      head: [
        [
          "Date",
          "Examen",
          "Statut",
        ],
      ],

      body: data.laboratoryResults.map(
        (result) => [
          formatPDFDate(
            result.resultDate
          ),
          value(result.testName),
          value(result.status),
        ]
      ),
    });

    y =
      (doc as any).lastAutoTable
        .finalY + 15;
  }

  // ============================================================
  // VACCINATIONS
  // ============================================================

  if (
    data.vaccinations.length > 0
  ) {
    y = addSectionTitle(
      "Vaccinations enregistrées",
      y
    );

    autoTable(doc, {
      startY: y,
      margin: {
        left: 15,
        right: 15,
      },
      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
      },

      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },

      head: [
        [
          "Vaccin",
          "Date",
          "Dose",
        ],
      ],

      body: data.vaccinations.map(
        (vaccination) => [
          value(
            vaccination.vaccineName
          ),

          formatPDFDate(
            vaccination.administeredAt
          ),

          vaccination.doseNumber
            ? String(
                vaccination.doseNumber
              )
            : "Non renseigné",
        ]
      ),
    });
  }

  // ============================================================
  // FOOTER
  // ============================================================

  addFooter();

  const patientName =
    `${profile.firstName}-${profile.lastName}`
      .trim()
      .replace(/\s+/g, "-")
      .replace(
        /[^a-zA-Z0-9À-ÿ-]/g,
        ""
      );

  doc.save(
    `MediConnectAI-Dossier-Medical-${patientName || "Patient"}.pdf`
  );
};






  
  return (
    <div className="space-y-6 pb-10">
      {/* ========================================================
          HEADER
      ======================================================== */}

<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
  <div>
    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-600">
      <HeartPulse className="h-4 w-4" />
      Personal Health
    </div>

    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
      Medical Record
    </h1>

    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
      Keep your medical information up to date so
      healthcare professionals can better understand
      your health history.
    </p>
  </div>

  {!editing && (
    <div className="flex flex-wrap items-center gap-3">
      {/* Download PDF */}
      <button
        type="button"
        onClick={handleDownloadPDF}
        disabled={!data?.profile || !data?.patient}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white px-5 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        Download PDF
      </button>

      {/* Edit */}
      <button
        type="button"
        onClick={() => {
          setForm(toForm(data.patient));
          setEditing(true);
          setSuccessMessage(null);
        }}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:scale-[1.01] hover:shadow-xl"
      >
        <Edit3 className="h-4 w-4" />
        Edit medical information
      </button>
    </div>
  )}
</div>


      {/* ========================================================
          SUCCESS
      ======================================================== */}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && data && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* ========================================================
          PATIENT HERO
      ======================================================== */}

      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-7 text-white shadow-xl shadow-violet-200/50">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/15 text-xl font-bold backdrop-blur">
              {data.profile.avatarUrl ? (
                <img
                  src={data.profile.avatarUrl}
                  alt={`${data.profile.firstName} ${data.profile.lastName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(
                  data.profile.firstName,
                  data.profile.lastName
                )
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-white/70">
                Patient
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {data.profile.firstName}{" "}
                {data.profile.lastName}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/75">
                {age !== null && (
                  <span>{age} years old</span>
                )}

                {data.profile.city && (
                  <span>• {data.profile.city}</span>
                )}

                {data.profile.wilaya && (
                  <span>• {data.profile.wilaya}</span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wider text-white/60">
              Last updated
            </p>

            <p className="mt-1 text-sm font-semibold">
              {formatDate(data.patient.updatedAt)}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          FIRST TIME / EMPTY STATE
      ======================================================== */}

      {!hasMedicalInformation && !editing && (
        <section className="rounded-[30px] border border-violet-100 bg-white p-8 shadow-sm">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-600">
              <ClipboardList className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Complete your medical record
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
              Add your allergies, medical history,
              medications, lifestyle information and
              emergency contact. You can update these
              details whenever necessary.
            </p>

            <button
              onClick={() => {
                setEditing(true);
                setSuccessMessage(null);
              }}
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:scale-[1.01]"
            >
              <FileText className="h-4 w-4" />
              Complete my medical record
            </button>
          </div>
        </section>
      )}

      {/* ========================================================
          FORM
      ======================================================== */}

      {editing && (
        <div className="space-y-6">
          {/* MEDICAL INFORMATION */}

          <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm">
            <SectionHeader
              icon={<HeartPulse className="h-5 w-5" />}
              title="Medical information"
              description="Information about your current and past health."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <SelectInput
                label="Blood type"
                value={form.bloodType}
                onChange={(value) =>
                  updateField("bloodType", value)
                }
                options={[
                  { value: "A+", label: "A+" },
                  { value: "A-", label: "A-" },
                  { value: "B+", label: "B+" },
                  { value: "B-", label: "B-" },
                  { value: "AB+", label: "AB+" },
                  { value: "AB-", label: "AB-" },
                  { value: "O+", label: "O+" },
                  { value: "O-", label: "O-" },
                  {
                    value: "UNKNOWN",
                    label: "I don't know",
                  },
                ]}
              />

              <div />

              <TextArea
                label="Allergies"
                value={form.allergies}
                onChange={(value) =>
                  updateField("allergies", value)
                }
                placeholder="Example: Penicillin, peanuts, pollen..."
                optional
              />

              <TextArea
                label="Chronic conditions"
                value={form.chronicConditions}
                onChange={(value) =>
                  updateField(
                    "chronicConditions",
                    value
                  )
                }
                placeholder="Example: Asthma, diabetes, hypertension..."
                optional
              />

              <TextArea
                label="Current medications"
                value={form.currentMedications}
                onChange={(value) =>
                  updateField(
                    "currentMedications",
                    value
                  )
                }
                placeholder="List the medications you currently take..."
                optional
              />

              <TextArea
                label="Medical history"
                value={form.medicalHistory}
                onChange={(value) =>
                  updateField(
                    "medicalHistory",
                    value
                  )
                }
                placeholder="Important previous illnesses or medical events..."
                optional
              />

              <TextArea
                label="Surgical history"
                value={form.surgicalHistory}
                onChange={(value) =>
                  updateField(
                    "surgicalHistory",
                    value
                  )
                }
                placeholder="Previous surgeries or procedures..."
                optional
              />

              <TextArea
                label="Family medical history"
                value={form.familyMedicalHistory}
                onChange={(value) =>
                  updateField(
                    "familyMedicalHistory",
                    value
                  )
                }
                placeholder="Relevant illnesses in your immediate family..."
                optional
              />

              <TextArea
                label="Vaccination history"
                value={form.vaccinationHistory}
                onChange={(value) =>
                  updateField(
                    "vaccinationHistory",
                    value
                  )
                }
                placeholder="Important vaccines or missing vaccinations..."
                optional
              />
            </div>
          </section>

          {/* LIFESTYLE */}

          <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm">
            <SectionHeader
              icon={<Activity className="h-5 w-5" />}
              title="Lifestyle"
              description="This information helps healthcare professionals understand your daily habits."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <SelectInput
                label="Smoking"
                value={form.smokingStatus}
                onChange={(value) =>
                  updateField(
                    "smokingStatus",
                    value
                  )
                }
                options={[
                  {
                    value: "NEVER",
                    label: "Never",
                  },
                  {
                    value: "FORMER",
                    label: "Former smoker",
                  },
                  {
                    value: "OCCASIONAL",
                    label: "Occasionally",
                  },
                  {
                    value: "REGULAR",
                    label: "Regularly",
                  },
                ]}
                optional
              />

              <SelectInput
                label="Alcohol consumption"
                value={form.alcoholConsumption}
                onChange={(value) =>
                  updateField(
                    "alcoholConsumption",
                    value
                  )
                }
                options={[
                  {
                    value: "NONE",
                    label: "None",
                  },
                  {
                    value: "OCCASIONAL",
                    label: "Occasionally",
                  },
                  {
                    value: "REGULAR",
                    label: "Regularly",
                  },
                ]}
                optional
              />

              <SelectInput
                label="Physical activity"
                value={form.physicalActivity}
                onChange={(value) =>
                  updateField(
                    "physicalActivity",
                    value
                  )
                }
                options={[
                  {
                    value: "NONE",
                    label: "Little or none",
                  },
                  {
                    value: "LOW",
                    label: "Light",
                  },
                  {
                    value: "MODERATE",
                    label: "Moderate",
                  },
                  {
                    value: "HIGH",
                    label: "High",
                  },
                ]}
                optional
              />

              <TextInput
                label="Diet"
                value={form.diet}
                onChange={(value) =>
                  updateField("diet", value)
                }
                placeholder="Example: balanced, vegetarian..."
                optional
              />

              <div className="md:col-span-2">
                <TextArea
                  label="Additional medical information"
                  value={form.additionalMedicalInfo}
                  onChange={(value) =>
                    updateField(
                      "additionalMedicalInfo",
                      value
                    )
                  }
                  placeholder="Anything else your healthcare professional should know..."
                  optional
                />
              </div>
            </div>
          </section>

          {/* EMERGENCY */}

          <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm">
            <SectionHeader
              icon={<Phone className="h-5 w-5" />}
              title="Emergency contact"
              description="Someone who can be contacted in case of emergency."
            />

            <div className="grid gap-5 md:grid-cols-3">
              <TextInput
                label="Full name"
                value={form.emergencyContactName}
                onChange={(value) =>
                  updateField(
                    "emergencyContactName",
                    value
                  )
                }
                placeholder="Full name"
                optional
              />

              <TextInput
                label="Phone"
                value={form.emergencyContactPhone}
                onChange={(value) =>
                  updateField(
                    "emergencyContactPhone",
                    value
                  )
                }
                placeholder="+213..."
                type="tel"
                optional
              />

              <TextInput
                label="Relationship"
                value={form.emergencyContactRelation}
                onChange={(value) =>
                  updateField(
                    "emergencyContactRelation",
                    value
                  )
                }
                placeholder="Father, mother, sibling..."
                optional
              />
            </div>
          </section>

          {/* GUARDIAN */}

          <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm">
            <SectionHeader
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Parent / guardian"
              description="Required for patients under 18."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <TextInput
                label="First name"
                value={form.guardianFirstName}
                onChange={(value) =>
                  updateField(
                    "guardianFirstName",
                    value
                  )
                }
                placeholder="First name"
                optional
              />

              <TextInput
                label="Last name"
                value={form.guardianLastName}
                onChange={(value) =>
                  updateField(
                    "guardianLastName",
                    value
                  )
                }
                placeholder="Last name"
                optional
              />

              <TextInput
                label="Email"
                value={form.guardianEmail}
                onChange={(value) =>
                  updateField(
                    "guardianEmail",
                    value
                  )
                }
                placeholder="parent@example.com"
                type="email"
                optional
              />

              <TextInput
                label="Phone"
                value={form.guardianPhone}
                onChange={(value) =>
                  updateField(
                    "guardianPhone",
                    value
                  )
                }
                placeholder="+213..."
                type="tel"
                optional
              />

              <TextInput
                label="Relationship"
                value={form.guardianRelation}
                onChange={(value) =>
                  updateField(
                    "guardianRelation",
                    value
                  )
                }
                placeholder="Father / Mother / Guardian"
                optional
              />
            </div>
          </section>

          {/* ACTIONS */}

          <div className="sticky bottom-5 z-10 flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white/95 p-4 shadow-2xl backdrop-blur md:flex-row md:justify-end">
            <button
              onClick={() => {
                setForm(toForm(data.patient));
                setEditing(false);
                setError(null);
              }}
              disabled={saving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save medical information
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          DISPLAY MODE
      ======================================================== */}

      {!editing && hasMedicalInformation && (
        <>
          {/* MEDICAL OVERVIEW */}

          <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <SectionHeader
                icon={<HeartPulse className="h-5 w-5" />}
                title="Medical overview"
                description="Your main health information."
              />

              <button
                onClick={() => {
                  setForm(toForm(data.patient));
                  setEditing(true);
                }}
                className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-violet-600 transition hover:bg-violet-50 sm:flex"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard
                label="Blood type"
                value={
                  data.patient.bloodType ===
                  "UNKNOWN"
                    ? "Unknown"
                    : data.patient.bloodType
                }
                icon={<HeartPulse />}
              />

              <InfoCard
                label="Allergies"
                value={
                  data.patient.allergies ||
                  "None provided"
                }
                icon={<AlertCircle />}
              />

              <InfoCard
                label="Chronic conditions"
                value={
                  data.patient.chronicConditions ||
                  "None provided"
                }
                icon={<Activity />}
              />

              <InfoCard
                label="Current medications"
                value={
                  data.patient.currentMedications ||
                  "None provided"
                }
                icon={<Pill />}
              />
            </div>
          </section>

          {/* HISTORY */}

          <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm">
            <SectionHeader
              icon={<ClipboardList className="h-5 w-5" />}
              title="Medical history"
            />

            <div className="grid gap-5 md:grid-cols-2">
              <HistoryCard
                title="Previous medical history"
                value={data.patient.medicalHistory}
              />

              <HistoryCard
                title="Surgical history"
                value={data.patient.surgicalHistory}
              />

              <HistoryCard
                title="Family medical history"
                value={
                  data.patient.familyMedicalHistory
                }
              />

              <HistoryCard
                title="Vaccination history"
                value={
                  data.patient.vaccinationHistory
                }
              />
            </div>
          </section>

          {/* LIFESTYLE */}

          <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm">
            <SectionHeader
              icon={<Activity className="h-5 w-5" />}
              title="Lifestyle"
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard
                label="Smoking"
                value={
                  data.patient.smokingStatus ||
                  "Not provided"
                }
                icon={<Activity />}
              />

              <InfoCard
                label="Alcohol"
                value={
                  data.patient.alcoholConsumption ||
                  "Not provided"
                }
                icon={<Activity />}
              />

              <InfoCard
                label="Physical activity"
                value={
                  data.patient.physicalActivity ||
                  "Not provided"
                }
                icon={<Activity />}
              />

              <InfoCard
                label="Diet"
                value={
                  data.patient.diet ||
                  "Not provided"
                }
                icon={<Activity />}
              />
            </div>

            {data.patient.additionalMedicalInfo && (
              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Additional information
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {data.patient.additionalMedicalInfo}
                </p>
              </div>
            )}
          </section>

          {/* EMERGENCY */}

          {(data.patient.emergencyContactName ||
            data.patient.emergencyContactPhone) && (
            <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm">
              <SectionHeader
                icon={<Phone className="h-5 w-5" />}
                title="Emergency contact"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard
                  label="Name"
                  value={
                    data.patient.emergencyContactName ||
                    "Not provided"
                  }
                  icon={<UserRound />}
                />

                <InfoCard
                  label="Phone"
                  value={
                    data.patient.emergencyContactPhone ||
                    "Not provided"
                  }
                  icon={<Phone />}
                />

                <InfoCard
                  label="Relationship"
                  value={
                    data.patient.emergencyContactRelation ||
                    "Not provided"
                  }
                  icon={<UserRound />}
                />
              </div>
            </section>
          )}

          {/* GUARDIAN */}

          {(age !== null && age < 18) &&
            (data.patient.guardianFirstName ||
              data.patient.guardianLastName) && (
              <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm">
                <SectionHeader
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Parent / guardian"
                />

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <InfoCard
                    label="Name"
                    value={`${data.patient.guardianFirstName ?? ""} ${data.patient.guardianLastName ?? ""}`.trim()}
                    icon={<UserRound />}
                  />

                  <InfoCard
                    label="Email"
                    value={
                      data.patient.guardianEmail ||
                      "Not provided"
                    }
                    icon={<FileText />}
                  />

                  <InfoCard
                    label="Phone"
                    value={
                      data.patient.guardianPhone ||
                      "Not provided"
                    }
                    icon={<Phone />}
                  />
                </div>
              </section>
            )}

          {/* EXISTING MEDICAL RECORDS */}

          <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm">
            <SectionHeader
              icon={<Stethoscope className="h-5 w-5" />}
              title="Doctor records"
              description="Medical records created during your consultations."
            />

            {data.medicalRecords.length === 0 ? (
              <EmptyState
                icon={<FileText />}
                title="No doctor records yet"
                description="Your consultation records will appear here when a healthcare professional adds them."
              />
            ) : (
              <div className="space-y-4">
                {data.medicalRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {record.title}
                        </h3>

                        {record.doctor && (
                          <p className="mt-1 text-sm text-slate-500">
                            Dr.{" "}
                            {record.doctor.firstName}{" "}
                            {record.doctor.lastName}
                          </p>
                        )}
                      </div>

                      <span className="text-xs font-medium text-slate-400">
                        {formatDate(
                          record.recordDate
                        )}
                      </span>
                    </div>

                    {record.symptoms && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Symptoms
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {record.symptoms}
                        </p>
                      </div>
                    )}

                    {record.diagnosis && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Diagnosis
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {record.diagnosis}
                        </p>
                      </div>
                    )}

                    {record.notes && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Notes
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {record.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* PRESCRIPTIONS */}

          <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm">
            <SectionHeader
              icon={<Pill className="h-5 w-5" />}
              title="Prescriptions"
            />

            {data.prescriptions.length === 0 ? (
              <EmptyState
                icon={<Pill />}
                title="No prescriptions yet"
                description="Prescriptions issued by your doctors will appear here."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {data.prescriptions.map(
                  (prescription) => (
                    <div
                      key={prescription.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900">
                            Prescription
                          </h3>

                          {prescription.doctor && (
                            <p className="mt-1 text-sm text-slate-500">
                              Dr.{" "}
                              {
                                prescription.doctor
                                  .firstName
                              }{" "}
                              {
                                prescription.doctor
                                  .lastName
                              }
                            </p>
                          )}
                        </div>

                        <span className="text-xs text-slate-400">
                          {formatDate(
                            prescription.prescribedAt
                          )}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {prescription.items.map(
                          (item) => (
                            <div
                              key={item.id}
                              className="rounded-xl bg-white p-4"
                            >
                              <p className="font-semibold text-slate-800">
                                {
                                  item.medicationName
                                }
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {item.dosage ||
                                  "Dosage not specified"}
                                {item.frequency &&
                                  ` • ${item.frequency}`}
                                {item.duration &&
                                  ` • ${item.duration}`}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* LABORATORY */}

          <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm">
            <SectionHeader
              icon={<FileText className="h-5 w-5" />}
              title="Laboratory results"
            />

            {data.laboratoryResults.length === 0 ? (
              <EmptyState
                icon={<FileText />}
                title="No laboratory results yet"
                description="Your laboratory analyses and results will appear here."
              />
            ) : (
              <div className="space-y-4">
                {data.laboratoryResults.map(
                  (result) => (
                    <div
                      key={result.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {result.testName}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {result.laboratoryName ||
                              "Laboratory"}
                          </p>
                        </div>

                        <span className="text-xs text-slate-400">
                          {formatDate(
                            result.resultDate
                          )}
                        </span>
                      </div>

                      {result.parameters.length >
                        0 && (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-white">
                          <div className="divide-y divide-slate-100">
                            {result.parameters.map(
                              (parameter) => (
                                <div
                                  key={
                                    parameter.id
                                  }
                                  className="grid grid-cols-2 gap-4 px-4 py-3 text-sm md:grid-cols-4"
                                >
                                  <span className="font-medium text-slate-700">
                                    {
                                      parameter.name
                                    }
                                  </span>

                                  <span className="text-slate-600">
                                    {
                                      parameter.value
                                    }{" "}
                                    {parameter.unit}
                                  </span>

                                  <span className="text-slate-400">
                                    {parameter.referenceRange ||
                                      "—"}
                                  </span>

                                  <span className="font-semibold text-slate-600">
                                    {parameter.flag ||
                                      "Normal"}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* VACCINATIONS */}

          <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm">
            <SectionHeader
              icon={<Syringe className="h-5 w-5" />}
              title="Vaccination history"
            />

            {data.vaccinations.length === 0 ? (
              <EmptyState
                icon={<Syringe />}
                title="No vaccination records yet"
                description="Vaccination records will appear here when available."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.vaccinations.map(
                  (vaccination) => (
                    <div
                      key={vaccination.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {
                              vaccination.vaccineName
                            }
                          </h3>

                          {vaccination.doseNumber && (
                            <p className="mt-1 text-sm text-slate-500">
                              Dose{" "}
                              {
                                vaccination.doseNumber
                              }
                            </p>
                          )}
                        </div>

                        <span className="text-xs text-slate-400">
                          {formatDate(
                            vaccination.administeredAt
                          )}
                        </span>
                      </div>

                      {vaccination.notes && (
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                          {vaccination.notes}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* APPOINTMENTS */}

          <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm">
            <SectionHeader
              icon={<Stethoscope className="h-5 w-5" />}
              title="Appointments"
            />

            {data.appointments.length === 0 ? (
              <EmptyState
                icon={<Stethoscope />}
                title="No appointments yet"
                description="Your appointments will appear here."
              />
            ) : (
              <div className="space-y-3">
                {data.appointments.map(
                  (appointment) => (
                    <div
                      key={appointment.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                          <Stethoscope className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {appointment.doctor
                              ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                              : "Doctor"}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {formatDate(
                              appointment.appointmentDate
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold capitalize text-violet-600">
                          {appointment.status
                            .toLowerCase()
                            .replaceAll(
                              "_",
                              " "
                            )}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
        {icon}
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-800">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function HistoryCard({
  title,
  value,
}: {
  title: string;
  value: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
        {value || "No information provided."}
      </p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}
