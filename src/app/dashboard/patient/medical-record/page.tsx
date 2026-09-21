"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePatientTheme } from "@/components/patient/PatientThemeContext";
import { PButton, PIconButton } from "@/components/patient/buttons";
import PatientWelcomeBanner from "@/components/patient/PatientWelcomeBanner";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  Edit3,
  Eye,
  FileText,
  HeartPulse,
  Loader2,
  Phone,
  Pill,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Tag,
  Trash2,
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
  prescribedDate: string;
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
  testDate: string;
  status: string;
  laboratoryName: string | null;
  parameters: LaboratoryParameter[];
};

type Vaccination = {
  id: string;
  vaccineName: string;
  dose: string | null;
  vaccinationDate: string;
  nextDueDate: string | null;
  provider: string | null;
  batchNumber: string | null;
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
  const { isDark } = usePatientTheme();
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className={isDark ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-300" : "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600"}>
        {icon}
      </div>

      <div>
        <h2 className={isDark ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>
          {title}
        </h2>

        {description && (
          <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>
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
  const { isDark } = usePatientTheme();
  return (
    <label className={isDark ? "mb-2 block text-sm font-semibold text-slate-200" : "mb-2 block text-sm font-semibold text-slate-700"}>
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
  const { isDark } = usePatientTheme();
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={isDark ? "h-12 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/20" : "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"}
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
  const { isDark } = usePatientTheme();
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={isDark ? "w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/20" : "w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"}
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
  const { isDark } = usePatientTheme();
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={isDark ? "h-12 w-full appearance-none rounded-2xl border border-slate-700 bg-slate-950 px-4 pr-10 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-500/20" : "h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"}
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
  const { isDark } = usePatientTheme();
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
     RECORDS VIEW STATE (lab-style)
  ============================================================ */

  const [activeView, setActiveView] =
    useState<"records" | "profile">("records");

  const [recordSearch, setRecordSearch] =
    useState("");

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [addDate, setAddDate] = useState(
    todayInputValue()
  );

  const [addTitle, setAddTitle] = useState("");
  const [addSymptoms, setAddSymptoms] =
    useState("");

  const [addDiagnosis, setAddDiagnosis] =
    useState("");

  const [addNotes, setAddNotes] = useState("");

  const [isAddingRecord, setIsAddingRecord] =
    useState(false);

  const [addError, setAddError] = useState<
    string | null
  >(null);

  const [selectedRecord, setSelectedRecord] =
    useState<MedicalRecord | null>(null);

  const [deletingId, setDeletingId] = useState<
    string | null
  >(null);

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
     PERSONAL RECORDS (lab-style view)
  ============================================================ */

  function todayInputValue(): string {
    const d = new Date();

    return `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }

  function symptomTags(
    symptoms: string | null
  ): string[] {
    if (!symptoms) return [];

    return symptoms
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const filteredRecords = useMemo(() => {
    const q = recordSearch
      .trim()
      .toLowerCase();

    const records =
      data?.medicalRecords ?? [];

    if (!q) return records;

    return records.filter((record) => {
      if (
        record.title
          .toLowerCase()
          .includes(q)
      )
        return true;

      if (
        record.diagnosis &&
        record.diagnosis
          .toLowerCase()
          .includes(q)
      )
        return true;

      if (
        record.symptoms &&
        record.symptoms
          .toLowerCase()
          .includes(q)
      )
        return true;

      if (
        record.doctor &&
        `${record.doctor.firstName} ${record.doctor.lastName}`
          .toLowerCase()
          .includes(q)
      )
        return true;

      return false;
    });
  }, [data, recordSearch]);

  function resetAddForm() {
    setAddDate(todayInputValue());
    setAddTitle("");
    setAddSymptoms("");
    setAddDiagnosis("");
    setAddNotes("");
    setAddError(null);
  }

  async function refreshRecords() {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
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
        "Medical record refresh error:",
        err
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleAddRecord() {
    if (isAddingRecord) return;

    setAddError(null);

    if (!addTitle.trim()) {
      setAddError(
        "Please provide a title for the record."
      );

      return;
    }

    setIsAddingRecord(true);

    try {
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
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            title: addTitle.trim(),
            recordDate: addDate || undefined,
            symptoms:
              addSymptoms.trim() || undefined,
            diagnosis:
              addDiagnosis.trim() || undefined,
            notes: addNotes.trim() || undefined,
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Unable to save the record."
        );
      }

      setShowAddModal(false);
      resetAddForm();
      await loadMedicalRecord();
    } catch (err) {
      setAddError(
        err instanceof Error
          ? err.message
          : "Unable to save the record."
      );
    } finally {
      setIsAddingRecord(false);
    }
  }

  async function handleDeleteRecord(
    id: string
  ) {
    if (
      !confirm("Delete this personal record?")
    )
      return;

    setDeletingId(id);

    try {
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
        `/api/dashboard/patient/medical-record?id=${encodeURIComponent(
          id
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        }
      );

      const result = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Unable to delete the record."
        );
      }

      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }

      await loadMedicalRecord();
    } catch (err) {
      console.error(
        "Delete record error:",
        err
      );
    } finally {
      setDeletingId(null);
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
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={28} />
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
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 cursor-pointer active:scale-[0.97]"
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
      "DOCTORZ Co.",
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
        "DOCTORZ Co. — Document médical personnel",
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
            prescription.prescribedDate
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
            result.testDate
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
            vaccination.vaccinationDate
          ),

          vaccination.dose
            ? String(
                vaccination.dose
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
    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-600">
      <HeartPulse className="h-4 w-4" />
      Personal Health
    </div>

    <h1 className={isDark ? "text-3xl font-bold tracking-tight text-white" : "text-3xl font-bold tracking-tight text-slate-900"}>
      Medical Record
    </h1>

    <p className={isDark ? "mt-2 max-w-2xl text-sm leading-6 text-slate-400" : "mt-2 max-w-2xl text-sm leading-6 text-slate-500"}>
      Keep your medical information up to date so
      healthcare professionals can better understand
      your health history.
    </p>
  </div>

  {!editing && activeView === "profile" && (
    <div className="flex flex-wrap items-center gap-3">
      {/* Download PDF */}
      <button
        type="button"
        onClick={handleDownloadPDF}
        disabled={!data?.profile || !data?.patient}
        className={isDark ? "inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-sky-700 bg-slate-900 px-5 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/10 cursor-pointer active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50" : "inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 cursor-pointer active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"}
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
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 text-sm font-semibold text-white transition hover:scale-[1.01] hover:from-blue-600 hover:to-sky-400 cursor-pointer active:scale-[0.97]"
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

      {/* ========================================================
           VIEW SWITCHER
      ======================================================== */}

      {!editing && (
        <div className={isDark ? "inline-flex rounded-2xl border border-slate-800 bg-slate-900/80 p-1" : "inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"}>
          <button
            type="button"
            onClick={() => setActiveView("records")}
            className={activeView === "records" ? "rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 cursor-pointer active:scale-[0.97]" : isDark ? "rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 transition hover:text-white hover:bg-white/10 cursor-pointer active:scale-[0.97]" : "rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900 hover:bg-slate-100 cursor-pointer active:scale-[0.97]"}
          >
            My records
          </button>

          <button
            type="button"
            onClick={() => setActiveView("profile")}
            className={activeView === "profile" ? "rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 cursor-pointer active:scale-[0.97]" : isDark ? "rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 transition hover:text-white hover:bg-white/10 cursor-pointer active:scale-[0.97]" : "rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900 hover:bg-slate-100 cursor-pointer active:scale-[0.97]"}
          >
            Health profile
          </button>
        </div>
      )}

      {/* ========================================================
           MY RECORDS (lab-style)
      ======================================================== */}

      {activeView === "records" && !editing && (
        <div className="space-y-6">
          {/* Header card */}
          <div
            className={`p-6 rounded-3xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
              isDark ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${isDark ? "bg-blue-500/15 border-blue-500/30 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-600"}`}>
                <Stethoscope size={24} />
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-bold">My Medical Records</h2>

                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {data?.medicalRecords.length ?? 0} record{(data?.medicalRecords.length ?? 0) > 1 ? "s" : ""} available
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  placeholder="Search title, diagnosis..."
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  className={`pl-9 pr-8 py-2 rounded-xl text-xs border focus:outline-none transition w-56 ${
                    isDark
                      ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                  }`}
                />

                {recordSearch && (
                  <button
                    type="button"
                    onClick={() => setRecordSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer active:scale-[0.97]"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Refresh */}
              <PIconButton
                title="Refresh"
                isDark={isDark}
                disabled={isRefreshing}
                onClick={refreshRecords}
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-500" : ""} />
              </PIconButton>

              {/* Export PDF */}
              <PButton
                variant="secondary"
                isDark={isDark}
                disabled={!data?.profile || !data?.patient}
                title="Export PDF"
                onClick={handleDownloadPDF}
              >
                <Download size={14} />
                <span>Export PDF</span>
              </PButton>

              {/* Add record */}
              <PButton
                variant="primary"
                isDark={isDark}
                onClick={() => {
                  resetAddForm();
                  setShowAddModal(true);
                }}
              >
                <Plus size={15} />
                <span>Add record</span>
              </PButton>
            </div>
          </div>

          {/* Cards grid / empty state */}
          {filteredRecords.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
              <Stethoscope size={32} className="mx-auto text-slate-400 opacity-50" />

              <h3 className="mt-3 text-base font-bold">No medical records found</h3>

              <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                {recordSearch
                  ? `No record matches "${recordSearch}". Try another title, diagnosis or doctor name.`
                  : "Your consultation records and personal entries will appear here. Add your first personal entry using the button above."}
              </p>

              {recordSearch ? (
                <PButton
                  variant="primary"
                  isDark={isDark}
                  className="mt-4"
                  onClick={() => setRecordSearch("")}
                >
                  Clear search
                </PButton>
              ) : (
                <PButton
                  variant="primary"
                  isDark={isDark}
                  className="mt-4"
                  onClick={() => {
                    resetAddForm();
                    setShowAddModal(true);
                  }}
                >
                  Add record
                </PButton>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={`p-5 rounded-3xl border shadow-xs transition flex flex-col justify-between gap-4 cursor-pointer ${
                    isDark ? "bg-slate-900/85 border-slate-800 hover:border-blue-500/50" : "bg-white border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                          {record.title}
                        </h3>

                        <p className={`mt-1 text-[11px] flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          <Calendar size={11} />

                          <span>
                            {new Date(record.recordDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </p>

                        <div className="mt-2">
                          {record.doctor ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${isDark ? "bg-blue-500/15 text-blue-300 border-blue-500/30" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                              <Stethoscope size={10} />
                              Dr. {record.doctor.firstName} {record.doctor.lastName}
                              {record.doctor.specialties.length > 0 && (
                                <span className="font-normal opacity-80">• {record.doctor.specialties[0]}</span>
                              )}
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${isDark ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                              <FileText size={10} />
                              Personal entry
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                          }}
                          title="View"
                          className={`p-1.5 rounded-lg border transition cursor-pointer active:scale-[0.97] ${isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"}`}
                        >
                          <Eye size={14} />
                        </button>

                        {record.doctor === null && (
                          <button
                            type="button"
                            disabled={deletingId === record.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRecord(record.id);
                            }}
                            title="Delete"
                            className={`p-1.5 rounded-lg transition cursor-pointer active:scale-[0.97] disabled:opacity-50 ${isDark ? "text-slate-500 hover:text-rose-400 hover:bg-rose-500/10" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {record.diagnosis && (
                      <p className={`mt-3 text-xs font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                        {record.diagnosis}
                      </p>
                    )}

                    {symptomTags(record.symptoms).length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {symptomTags(record.symptoms).map((tag) => (
                          <span
                            key={tag}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                              isDark ? "bg-blue-500/15 text-blue-300 border-blue-500/30" : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {record.notes && (
                      <p className={`mt-2 text-[11px] italic line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {record.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ADD MODAL */}
          {showAddModal && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget && !isAddingRecord) setShowAddModal(false);
              }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            >
              <div
                className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
                  isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                }`}
              >
                {/* Header */}
                <div className={`p-5 border-b flex items-center justify-between ${isDark ? "border-slate-800 bg-slate-950/50" : "border-slate-100 bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md">
                      <Stethoscope size={18} />
                    </div>

                    <div>
                      <h3 className="font-bold text-base">New medical record</h3>

                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Add a personal health entry to your file
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isAddingRecord}
                    onClick={() => setShowAddModal(false)}
                    className={`p-2 rounded-xl transition cursor-pointer active:scale-[0.97] ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-200 text-slate-600"}`}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Record date
                      </label>

                      <input
                        type="date"
                        value={addDate}
                        max={todayInputValue()}
                        onChange={(e) => setAddDate(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                          isDark ? "bg-slate-950 border-slate-700 text-white focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Title
                      </label>

                      <input
                        type="text"
                        placeholder="Ex: Migraine episode, Flu symptoms..."
                        value={addTitle}
                        onChange={(e) => setAddTitle(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                          isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Symptoms
                    </label>

                    <input
                      type="text"
                      placeholder="Ex: headache, fever, fatigue"
                      value={addSymptoms}
                      onChange={(e) => setAddSymptoms(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                        isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                      }`}
                    />

                    <p className="mt-1 text-[11px] text-slate-400">
                      Separate symptoms with commas.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Diagnosis (optional)
                    </label>

                    <input
                      type="text"
                      placeholder="Ex: suspected migraine..."
                      value={addDiagnosis}
                      onChange={(e) => setAddDiagnosis(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                        isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Notes (optional)
                    </label>

                    <textarea
                      rows={3}
                      placeholder="Any additional details about this entry..."
                      value={addNotes}
                      onChange={(e) => setAddNotes(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition resize-none ${
                        isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                      }`}
                    />
                  </div>

                  {addError && (
                    <div className="p-3 rounded-xl text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      {addError}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className={`p-4 border-t flex items-center justify-end gap-2.5 ${isDark ? "border-slate-800 bg-slate-950/50" : "border-slate-100 bg-slate-50"}`}>
                  <button
                    type="button"
                    disabled={isAddingRecord}
                    onClick={() => setShowAddModal(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-[0.97] ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-600"}`}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={isAddingRecord}
                    onClick={handleAddRecord}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold transition cursor-pointer active:scale-[0.97]"
                  >
                    {isAddingRecord ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    <span>{isAddingRecord ? "Saving..." : "Save record"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DETAIL MODAL */}
          {selectedRecord && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedRecord(null);
              }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            >
              <div
                className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
                  isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                }`}
              >
                {/* Header */}
                <div className={`p-5 border-b flex items-center justify-between ${isDark ? "border-slate-800 bg-slate-950/50" : "border-slate-100 bg-slate-50"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shrink-0">
                      <FileText size={18} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-base truncate">{selectedRecord.title}</h3>

                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {new Date(selectedRecord.recordDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className={`p-2 rounded-xl transition cursor-pointer active:scale-[0.97] shrink-0 ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-200 text-slate-600"}`}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
                  <div>
                    {selectedRecord.doctor ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${isDark ? "bg-blue-500/15 text-blue-300 border-blue-500/30" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                        <Stethoscope size={10} />
                        Dr. {selectedRecord.doctor.firstName} {selectedRecord.doctor.lastName}
                        {selectedRecord.doctor.specialties.length > 0 && (
                          <span className="font-normal opacity-80">• {selectedRecord.doctor.specialties.join(", ")}</span>
                        )}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${isDark ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                        <FileText size={10} />
                        Personal entry
                      </span>
                    )}

                    {selectedRecord.doctor && (
                      <p className="mt-2 text-[11px] text-slate-400">
                        Written by your doctor — read-only.
                      </p>
                    )}
                  </div>

                  {selectedRecord.diagnosis && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Diagnosis
                      </p>

                      <p className={`text-xs leading-6 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                        {selectedRecord.diagnosis}
                      </p>
                    </div>
                  )}

                  {symptomTags(selectedRecord.symptoms).length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Symptoms
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {symptomTags(selectedRecord.symptoms).map((tag) => (
                          <span
                            key={tag}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                              isDark ? "bg-blue-500/15 text-blue-300 border-blue-500/30" : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRecord.notes && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Notes
                      </p>

                      <p className={`text-xs leading-6 whitespace-pre-wrap ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                        {selectedRecord.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className={`p-4 border-t flex items-center justify-end gap-2.5 ${isDark ? "border-slate-800 bg-slate-950/50" : "border-slate-100 bg-slate-50"}`}>
                  {selectedRecord.doctor === null && (
                    <button
                      type="button"
                      disabled={deletingId === selectedRecord.id}
                      onClick={() => handleDeleteRecord(selectedRecord.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-semibold transition cursor-pointer active:scale-[0.97]"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-[0.97] ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-600"}`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === "profile" && (
      <>
      <PatientWelcomeBanner
        patient={{
          firstName: data.profile.firstName,
          lastName: data.profile.lastName,
          email: data.profile.email,
          phone: data.profile.phone,
          city: data.profile.city,
          wilaya: data.profile.wilaya,
          avatarUrl: data.profile.avatarUrl,
          accountStatus: (data.profile as any).accountStatus || "ACTIVE",
          bloodType: data.patient.bloodType,
        }}
        stats={{
          upcomingAppointments: (data.appointments || []).filter(
            (a: any) =>
              new Date(a.appointmentDate) >= new Date() &&
              a.status !== "CANCELLED" &&
              a.status !== "NO_SHOW"
          ).length,
          activePrescriptions: (data.prescriptions || []).filter(
            (p: any) => p.status === "ACTIVE"
          ).length,
          pendingLabs: (data.laboratoryResults || []).filter((l: any) =>
            ["PENDING", "PROCESSING"].includes(l.status)
          ).length,
        }}
        isDark={isDark}
        showActions={false}
      />

      {/* ========================================================
          FIRST TIME / EMPTY STATE
      ======================================================== */}

      {!hasMedicalInformation && !editing && (
        <section className={isDark ? "rounded-[30px] border border-sky-800 bg-slate-900/80 p-8 shadow-sm" : "rounded-[30px] border border-sky-100 bg-white p-8 shadow-sm"}>
          <div className="mx-auto max-w-2xl text-center">
            <div className={isDark ? "mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-500/20 text-sky-300" : "mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-100 text-sky-600"}>
              <ClipboardList className="h-8 w-8" />
            </div>

            <h2 className={isDark ? "mt-5 text-2xl font-bold text-white" : "mt-5 text-2xl font-bold text-slate-900"}>
              Complete your medical record
            </h2>

            <p className={isDark ? "mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400" : "mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500"}>
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
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-6 text-sm font-semibold text-white transition hover:scale-[1.01] hover:from-blue-600 hover:to-sky-400 cursor-pointer active:scale-[0.97]"
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

          <section className={isDark ? "rounded-[30px] border border-slate-800 bg-slate-900/80 p-7 shadow-sm" : "rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"}>
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

          <section className={isDark ? "rounded-[30px] border border-slate-800 bg-slate-900/80 p-7 shadow-sm" : "rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"}>
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

          <section className={isDark ? "rounded-[30px] border border-slate-800 bg-slate-900/80 p-7 shadow-sm" : "rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"}>
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

          <section className={isDark ? "rounded-[30px] border border-slate-800 bg-slate-900/80 p-7 shadow-sm" : "rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"}>
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

          <div className={isDark ? "sticky bottom-5 z-10 flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur md:flex-row md:justify-end" : "sticky bottom-5 z-10 flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white/95 p-4 shadow-2xl backdrop-blur md:flex-row md:justify-end"}>
            <button
              onClick={() => {
                setForm(toForm(data.patient));
                setEditing(false);
                setError(null);
              }}
              disabled={saving}
              className={isDark ? "inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-6 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 cursor-pointer active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50" : "inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-7 text-sm font-semibold text-white transition hover:scale-[1.01] hover:from-blue-600 hover:to-sky-400 cursor-pointer active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
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

          <section className={isDark ? "rounded-[30px] border border-slate-800 bg-slate-900/80 p-7 shadow-sm" : "rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"}>
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
                className={isDark ? "hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/10 cursor-pointer active:scale-[0.97] sm:flex" : "hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-50 cursor-pointer active:scale-[0.97] sm:flex"}
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

          <section className={isDark ? "rounded-[30px] border border-slate-800 bg-slate-900/80 p-7 shadow-sm" : "rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"}>
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

          <section className={isDark ? "rounded-[30px] border border-slate-800 bg-slate-900/80 p-7 shadow-sm" : "rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"}>
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
              <div className={isDark ? "mt-5 rounded-2xl bg-slate-950/60 p-5" : "mt-5 rounded-2xl bg-slate-50 p-5"}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Additional information
                </p>

                <p className={isDark ? "mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-200" : "mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700"}>
                  {data.patient.additionalMedicalInfo}
                </p>
              </div>
            )}
          </section>

          {/* EMERGENCY */}

          {(data.patient.emergencyContactName ||
            data.patient.emergencyContactPhone) && (
            <section className={isDark ? "rounded-[30px] border border-slate-800 bg-slate-900/80 p-7 shadow-sm" : "rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"}>
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
              <section className={isDark ? "rounded-[30px] border border-slate-800 bg-slate-900/80 p-7 shadow-sm" : "rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"}>
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

          <section className={isDark ? "rounded-[30px] border border-slate-800 bg-slate-900/80 p-7 shadow-sm" : "rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"}>
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
                    className={isDark ? "rounded-2xl border border-slate-800 bg-slate-950/60 p-5" : "rounded-2xl border border-slate-100 bg-slate-50/70 p-5"}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className={isDark ? "font-bold text-white" : "font-bold text-slate-900"}>
                          {record.title}
                        </h3>

                        {record.doctor && (
                          <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>
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

                        <p className={isDark ? "mt-1 text-sm leading-6 text-slate-300" : "mt-1 text-sm leading-6 text-slate-600"}>
                          {record.symptoms}
                        </p>
                      </div>
                    )}

                    {record.diagnosis && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Diagnosis
                        </p>

                        <p className={isDark ? "mt-1 text-sm leading-6 text-slate-300" : "mt-1 text-sm leading-6 text-slate-600"}>
                          {record.diagnosis}
                        </p>
                      </div>
                    )}

                    {record.notes && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Notes
                        </p>

                        <p className={isDark ? "mt-1 text-sm leading-6 text-slate-300" : "mt-1 text-sm leading-6 text-slate-600"}>
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

          <section className={isDark ? "rounded-[30px] border border-slate-800 bg-slate-900/80 p-7 shadow-sm" : "rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"}>
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
                      className={isDark ? "rounded-2xl border border-slate-800 bg-slate-950/60 p-5" : "rounded-2xl border border-slate-100 bg-slate-50/70 p-5"}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={isDark ? "font-bold text-white" : "font-bold text-slate-900"}>
                            Prescription
                          </h3>

                          {prescription.doctor && (
                            <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>
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
                            prescription.prescribedDate
                          )}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {prescription.items.map(
                          (item) => (
                            <div
                              key={item.id}
                              className={isDark ? "rounded-xl bg-slate-950/60 p-4" : "rounded-xl bg-white p-4"}
                            >
                              <p className={isDark ? "font-semibold text-slate-100" : "font-semibold text-slate-800"}>
                                {
                                  item.medicationName
                                }
                              </p>

                              <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>
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

          <section className={isDark ? "rounded-[30px] border border-slate-800 bg-slate-900/80 p-7 shadow-sm" : "rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"}>
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
              <div className="space-y-3">
                {data.laboratoryResults.map(
                  (result) => (
                    <div
                      key={result.id}
                      className={isDark ? "rounded-2xl border border-slate-800 bg-slate-950/60 p-4" : "rounded-2xl border border-slate-100 bg-slate-50/70 p-4"}
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className={isDark ? "font-bold text-white" : "font-bold text-slate-900"}>
                          {result.testName}
                        </h3>

                        <span className="text-xs text-slate-400">
                          {formatDate(
                            result.testDate
                          )}
                        </span>
                      </div>

                      <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>
                        {result.laboratoryName ||
                          "Laboratory"}
                      </p>

                      {result.parameters.length >
                        0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {result.parameters.map(
                            (parameter) => (
                              <span
                                key={
                                  parameter.id
                                }
                                className={isDark ? "inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-300" : "inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"}
                              >
                                {
                                  parameter.name
                                }
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* VACCINATIONS */}

          <section className={isDark ? "rounded-[30px] border border-slate-800 bg-slate-900/80 p-7 shadow-sm" : "rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"}>
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
                      className={isDark ? "rounded-2xl border border-slate-800 bg-slate-950/60 p-5" : "rounded-2xl border border-slate-100 bg-slate-50/70 p-5"}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className={isDark ? "font-bold text-white" : "font-bold text-slate-900"}>
                            {
                              vaccination.vaccineName
                            }
                          </h3>

                          {vaccination.dose && (
                            <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>
                              Dose{" "}
                              {
                                vaccination.dose
                              }
                            </p>
                          )}
                        </div>

                        <span className="text-xs text-slate-400">
                          {formatDate(
                            vaccination.vaccinationDate
                          )}
                        </span>
                      </div>

                      {vaccination.notes && (
                        <p className={isDark ? "mt-3 text-sm leading-6 text-slate-400" : "mt-3 text-sm leading-6 text-slate-500"}>
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

          <section className={isDark ? "rounded-[30px] border border-slate-800 bg-slate-900/80 p-7 shadow-sm" : "rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"}>
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
                      className={isDark ? "flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 md:flex-row md:items-center md:justify-between" : "flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 md:flex-row md:items-center md:justify-between"}
                    >
                      <div className="flex items-center gap-4">
                        <div className={isDark ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-300" : "flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600"}>
                          <Stethoscope className="h-5 w-5" />
                        </div>

                        <div>
                          <p className={isDark ? "font-semibold text-white" : "font-semibold text-slate-900"}>
                            {appointment.doctor
                              ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                              : "Doctor"}
                          </p>

                          <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>
                            {formatDate(
                              appointment.appointmentDate
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={isDark ? "rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-semibold capitalize text-sky-300" : "rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold capitalize text-sky-600"}>
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
      </>)}
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
  const { isDark } = usePatientTheme();
  return (
    <div className={isDark ? "rounded-2xl border border-slate-800 bg-slate-950/60 p-5" : "rounded-2xl border border-slate-100 bg-slate-50/70 p-5"}>
      <div className={isDark ? "mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-sky-300 shadow-sm" : "mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm"}>
        {icon}
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className={isDark ? "mt-2 break-words text-sm font-semibold leading-6 text-slate-100" : "mt-2 break-words text-sm font-semibold leading-6 text-slate-800"}>
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
  const { isDark } = usePatientTheme();
  return (
    <div className={isDark ? "rounded-2xl border border-slate-800 bg-slate-950/60 p-5" : "rounded-2xl border border-slate-100 bg-slate-50/70 p-5"}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <p className={isDark ? "mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300" : "mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600"}>
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
  const { isDark } = usePatientTheme();
  return (
    <div className={isDark ? "rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 px-6 py-10 text-center" : "rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center"}>
      <div className={isDark ? "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 shadow-sm" : "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm"}>
        {icon}
      </div>

      <h3 className={isDark ? "mt-4 text-sm font-bold text-slate-100" : "mt-4 text-sm font-bold text-slate-800"}>
        {title}
      </h3>

      <p className={isDark ? "mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400" : "mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500"}>
        {description}
      </p>
    </div>
  );
}
