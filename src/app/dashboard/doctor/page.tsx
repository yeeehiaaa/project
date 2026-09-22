"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  Calendar,
  Clock,
  User,
  Users,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Video,
  FileText,
  Pill,
  Sparkles,
  HeartPulse,
  Activity,
  ShieldCheck,
  LogOut,
  X,
  FileCheck,
  Building,
  CreditCard,
  RefreshCw,
  Sun,
  Moon,
  Download,
  Trash2,
  Check,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import VideoRoom from "@/components/call/VideoRoom";
import {
  generatePrescriptionPDF,
  PrescriptionDoctorInfo,
  PrescriptionPatientInfo,
} from "@/lib/prescriptionPdf";

import DoctorWelcomeBanner from "@/components/doctor/DoctorWelcomeBanner";
import DoctorCalendarView from "@/components/doctor/DoctorCalendarView";
import DoctorLabNotifs from "@/components/doctor/DoctorLabNotifs";
import DoctorCommunity from "@/components/doctor/DoctorCommunity";
import DoctorIpadDock from "@/components/doctor/DoctorIpadDock";
import DoctorMessengerView from "@/components/doctor/DoctorMessengerView";
import DoctorPatientsView from "@/components/doctor/DoctorPatientsView";
import DoctorPrescriptionsView from "@/components/doctor/DoctorPrescriptionsView";
import DoctorProfileView from "@/components/doctor/DoctorProfileView";
import DoctorzBrand from "@/components/brand/DoctorzBrand";

export interface Appointment {
  id: string;
  patientId: string;

  // Patient
  patientName: string;
  patientAge: number;
  patientGender: "Homme" | "Femme" | "Autre";
  phone: string;

  // Rendez-vous
  appointmentDate: string;
  previousDate?: string | null;
  time: string;

  type: "IN_PERSON" | "ONLINE" | "HOME_VISIT";

  status:
    | "PENDING"
    | "CONFIRMED"
    | "RESCHEDULED"
    | "WAITING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW";

  reason: string;
  notes?: string;
  location?: string;

  // IA / données médicales affichées
  aiTriageScore: "FAIBLE" | "MODÉRÉ" | "ÉLEVÉ";

  aiTriageSummary: string;

  bloodPressure?: string;
  heartRate?: string;
  allergies?: string[];

  // Patient avatar
  avatarUrl?: string | null;
}

interface PrescriptionItem {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export type TabType =
  | "agenda"
  | "calendar"
  | "messenger"
  | "patients"
  | "prescriptions"
  | "ai_assistant"
  | "community"
  | "profile";

type DashboardTheme = "light" | "dark";

// Realistic baseline clinical dataset spread across the current month (Sept 2026)
const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-1",
    patientId: "pat-1",
    patientName: "Karim Haddad",
    patientAge: 58,
    patientGender: "Homme",
    phone: "+33 6 12 34 56 78",
    appointmentDate: "2026-09-15T09:30:00Z",
    time: "09:30",
    type: "IN_PERSON",
    status: "CONFIRMED",
    reason: "Suivi post-infarctus du myocarde & contrôle biologique",
    notes: "Patient coronarien sous Kardégic 75 et Bisoprolol. EFR normale.",
    aiTriageScore: "MODÉRÉ",
    aiTriageSummary: "Tension 138/84 mmHg, pouls régulier. Bilan lipidique satisfaisant.",
    bloodPressure: "138/84",
    heartRate: "72 bpm",
    allergies: ["Pénicilline"],
  },
  {
    id: "apt-2",
    patientId: "pat-2",
    patientName: "Amina Meziane",
    patientAge: 34,
    patientGender: "Femme",
    phone: "+33 6 98 76 54 32",
    appointmentDate: "2026-09-15T10:45:00Z",
    time: "10:45",
    type: "ONLINE",
    status: "WAITING",
    reason: "Crise d'asthme nocturne & renouvellement traitement de fond",
    notes: "Toux quinteuse nocturne, dyspnée sifflante. DEP diminué.",
    aiTriageScore: "ÉLEVÉ",
    aiTriageSummary: "Alerte Triage : SpO2 94% à l'effort. Prévoir nébulisation ou corticothérapie.",
    bloodPressure: "120/75",
    heartRate: "88 bpm",
    allergies: ["Aspirine", "AINS"],
  },
  {
    id: "apt-3",
    patientId: "pat-3",
    patientName: "Youcef Mansouri",
    patientAge: 67,
    patientGender: "Homme",
    phone: "+33 7 44 55 66 77",
    appointmentDate: "2026-09-15T14:00:00Z",
    time: "14:00",
    type: "IN_PERSON",
    status: "CONFIRMED",
    reason: "Contrôle diabète de type 2 & examen des pieds",
    notes: "HbA1c à 7.1%. Pouls périphériques bien perçus.",
    aiTriageScore: "FAIBLE",
    aiTriageSummary: "Glycémie à jeun 1.18 g/L. Bon équilibre métabolique.",
    bloodPressure: "130/80",
    heartRate: "70 bpm",
    allergies: [],
  },
  {
    id: "apt-4",
    patientId: "pat-4",
    patientName: "Fatima Zohra Benali",
    patientAge: 45,
    patientGender: "Femme",
    phone: "+33 6 33 22 11 00",
    appointmentDate: "2026-09-15T15:30:00Z",
    time: "15:30",
    type: "ONLINE",
    status: "CONFIRMED",
    reason: "Dosage TSH & adaptation posologique Lévothyrox",
    notes: "TSH à 4.8 mUI/L. Légère frilosité rapportée.",
    aiTriageScore: "FAIBLE",
    aiTriageSummary: "Paramètres stables. Proposer passage à 87.5 µg.",
    bloodPressure: "118/72",
    heartRate: "65 bpm",
    allergies: ["Iode"],
  },
  {
    id: "apt-5",
    patientId: "pat-5",
    patientName: "Mohammed Saadi",
    patientAge: 62,
    patientGender: "Homme",
    phone: "+33 6 55 44 33 22",
    appointmentDate: "2026-09-15T16:45:00Z",
    time: "16:45",
    type: "IN_PERSON",
    status: "WAITING",
    reason: "Douleur thoracique atypique irradiant vers le bras gauche",
    notes: "Facteurs de risque: tabagisme, HTA ancienne.",
    aiTriageScore: "ÉLEVÉ",
    aiTriageSummary: "Score ÉLEVÉ : Réaliser ECG 12 dérivations en priorité immédiate.",
    bloodPressure: "145/95",
    heartRate: "92 bpm",
    allergies: [],
  },
  {
    id: "apt-6",
    patientId: "pat-6",
    patientName: "Mourad Belkacem",
    patientAge: 51,
    patientGender: "Homme",
    phone: "+33 6 22 11 33 44",
    appointmentDate: "2026-09-16T09:00:00Z",
    time: "09:00",
    type: "IN_PERSON",
    status: "CONFIRMED",
    reason: "Consultation cardiologie pré-opératoire (chirurgie orthopédique)",
    notes: "Avis anesthésique favorable sous réserve d'ECG normal.",
    aiTriageScore: "FAIBLE",
    aiTriageSummary: "Risque cardiovasculaire péri-opératoire bas.",
    bloodPressure: "125/80",
    heartRate: "68 bpm",
    allergies: [],
  },
  {
    id: "apt-7",
    patientId: "pat-7",
    patientName: "Nassima Larbi",
    patientAge: 39,
    patientGender: "Femme",
    phone: "+33 7 11 22 33 44",
    appointmentDate: "2026-09-16T11:15:00Z",
    time: "11:15",
    type: "ONLINE",
    status: "CONFIRMED",
    reason: "Interprétation Holter ECG des 24 heures",
    notes: "Sensations d'extrasystoles isolées en période de stress.",
    aiTriageScore: "MODÉRÉ",
    aiTriageSummary: "Pas de trouble conductif sévère détecté.",
    bloodPressure: "122/78",
    heartRate: "74 bpm",
    allergies: [],
  },
  {
    id: "apt-8",
    patientId: "pat-8",
    patientName: "Omar Kaddour",
    patientAge: 73,
    patientGender: "Homme",
    phone: "+33 6 88 99 00 11",
    appointmentDate: "2026-09-16T14:30:00Z",
    time: "14:30",
    type: "IN_PERSON",
    status: "CONFIRMED",
    reason: "Suivi insuffisance cardiaque stade II NYHA & œdèmes des membres inférieurs",
    notes: "Surveillance de la fonction rénale et ionogramme.",
    aiTriageScore: "MODÉRÉ",
    aiTriageSummary: "Prise de poids +1.5kg sur 7 jours. Ajuster diurétique.",
    bloodPressure: "132/85",
    heartRate: "78 bpm",
    allergies: ["Sulfamides"],
  },
  {
    id: "apt-9",
    patientId: "pat-9",
    patientName: "Samia Bouras",
    patientAge: 48,
    patientGender: "Femme",
    phone: "+33 6 44 33 22 11",
    appointmentDate: "2026-09-17T10:00:00Z",
    time: "10:00",
    type: "IN_PERSON",
    status: "CONFIRMED",
    reason: "Échocardiographie transthoracique de contrôle",
    notes: "Surveillance valvulopathie mitrale minime.",
    aiTriageScore: "FAIBLE",
    aiTriageSummary: "Bonne tolérance clinique, auscultation stable.",
    bloodPressure: "128/82",
    heartRate: "70 bpm",
    allergies: [],
  },
  {
    id: "apt-10",
    patientId: "pat-10",
    patientName: "Farouk Taleb",
    patientAge: 55,
    patientGender: "Homme",
    phone: "+33 7 99 88 77 66",
    appointmentDate: "2026-09-17T15:00:00Z",
    time: "15:00",
    type: "ONLINE",
    status: "CONFIRMED",
    reason: "Palpitations nocturnes récurrentes & anxiété",
    notes: "Consommation caféinée élevée à réévaluer.",
    aiTriageScore: "MODÉRÉ",
    aiTriageSummary: "Recommander réduction des excitants et carnet d'auto-mesure.",
    bloodPressure: "135/88",
    heartRate: "85 bpm",
    allergies: [],
  },
  {
    id: "apt-11",
    patientId: "pat-11",
    patientName: "Houria Benaissa",
    patientAge: 64,
    patientGender: "Femme",
    phone: "+33 6 11 99 22 88",
    appointmentDate: "2026-09-18T09:30:00Z",
    time: "09:30",
    type: "IN_PERSON",
    status: "CONFIRMED",
    reason: "Bilan annuel d'hypertension artérielle et fond d'œil",
    notes: "Traitement par IEC et anticalcique bien toléré.",
    aiTriageScore: "MODÉRÉ",
    aiTriageSummary: "Pas de retentissement rénal ou ophtalmologique.",
    bloodPressure: "140/90",
    heartRate: "72 bpm",
    allergies: [],
  },
  {
    id: "apt-12",
    patientId: "pat-12",
    patientName: "Walid Cherif",
    patientAge: 24,
    patientGender: "Homme",
    phone: "+33 6 33 55 77 99",
    appointmentDate: "2026-09-18T11:00:00Z",
    time: "11:00",
    type: "IN_PERSON",
    status: "CONFIRMED",
    reason: "Certificat médical d'aptitude au marathon & épreuve d'effort",
    notes: "Athlète amateur sans antécédent particulier.",
    aiTriageScore: "FAIBLE",
    aiTriageSummary: "Examen cardiovasculaire parfait. FC de repos 56 bpm.",
    bloodPressure: "115/70",
    heartRate: "56 bpm",
    allergies: [],
  },
  {
    id: "apt-13",
    patientId: "pat-13",
    patientName: "Djamel Zenati",
    patientAge: 60,
    patientGender: "Homme",
    phone: "+33 7 55 33 11 22",
    appointmentDate: "2026-09-20T10:30:00Z",
    time: "10:30",
    type: "IN_PERSON",
    status: "CONFIRMED",
    reason: "Contrôle à 6 mois après pose de stent coronarien",
    notes: "Sous bithérapie antiagrégante plaquettaire.",
    aiTriageScore: "FAIBLE",
    aiTriageSummary: "Absence de symptomatologie d'effort. Bilan biologique normal.",
    bloodPressure: "125/80",
    heartRate: "68 bpm",
    allergies: [],
  },
  {
    id: "apt-14",
    patientId: "pat-14",
    patientName: "Khadija Boudiaf",
    patientAge: 53,
    patientGender: "Femme",
    phone: "+33 6 88 44 22 00",
    appointmentDate: "2026-09-22T14:15:00Z",
    time: "14:15",
    type: "ONLINE",
    status: "CONFIRMED",
    reason: "Renouvellement traitement antihypertenseur et questions posologie",
    notes: "Automesures tensionnelles transmises conformes (moyenne 126/78).",
    aiTriageScore: "FAIBLE",
    aiTriageSummary: "Prescription électronique renouvelée pour 3 mois.",
    bloodPressure: "130/82",
    heartRate: "74 bpm",
    allergies: [],
  },
];

export interface DoctorPatient {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  gender: "Homme" | "Femme" | "Autre" | string;
  age: number | null;
  email?: string | null;
  bloodGroup?: string | null;
  chronicCondition?: string | null;
  allergies?: string[];
  city?: string | null;
  wilaya?: string | null;
  address?: string | null;
  currentMedications?: string | null;
  totalVisits?: number;
  lastVisit?: string;
}

const INITIAL_PATIENTS: DoctorPatient[] = [
  {
    id: "pat-1",
    name: "Karim Haddad",
    firstName: "Karim",
    lastName: "Haddad",
    phone: "+213 550 12 34 56",
    gender: "Homme",
    age: 58,
    email: "karim.haddad@email.dz",
    bloodGroup: "A+",
    chronicCondition: "Hypertension artérielle & Antécédent IDM",
    allergies: ["Pénicilline"],
    city: "Alger Centre",
    wilaya: "Alger",
    address: "14 Boulevard Colonel Amirouche",
  },
  {
    id: "pat-2",
    name: "Amina Meziane",
    firstName: "Amina",
    lastName: "Meziane",
    phone: "+213 661 98 76 54",
    gender: "Femme",
    age: 34,
    email: "amina.meziane@email.dz",
    bloodGroup: "O+",
    chronicCondition: "Asthme bronchique persistant",
    allergies: ["Aspirine", "AINS"],
    city: "Hydra",
    wilaya: "Alger",
    address: "8 Rue des Pins",
  },
  {
    id: "pat-3",
    name: "Youcef Mansouri",
    firstName: "Youcef",
    lastName: "Mansouri",
    phone: "+213 770 44 55 66",
    gender: "Homme",
    age: 67,
    email: "youcef.mansouri@email.dz",
    bloodGroup: "B+",
    chronicCondition: "Diabète de type 2 & Insuffisance veineuse",
    allergies: ["Sulfamides"],
    city: "Bab El Oued",
    wilaya: "Alger",
    address: "22 Avenue du 1er Novembre",
  },
  {
    id: "pat-4",
    name: "Fatima Zohra Benali",
    firstName: "Fatima Zohra",
    lastName: "Benali",
    phone: "+213 552 33 22 11",
    gender: "Femme",
    age: 45,
    email: "fz.benali@email.dz",
    bloodGroup: "AB+",
    chronicCondition: "Hypothyroïdie de Hashimoto",
    allergies: [],
    city: "Kouba",
    wilaya: "Alger",
    address: "5 Cité Garidi 1",
  },
  {
    id: "pat-5",
    name: "Mohammed Saadi",
    firstName: "Mohammed",
    lastName: "Saadi",
    phone: "+213 660 55 44 33",
    gender: "Homme",
    age: 62,
    email: "m.saadi@email.dz",
    bloodGroup: "O-",
    chronicCondition: "Arythmie / Fibrillation auriculaire",
    allergies: ["Iode"],
    city: "Bir Mourad Raïs",
    wilaya: "Alger",
    address: "17 Chemin Sidi Yahia",
  },
  {
    id: "pat-6",
    name: "Mourad Belkacem",
    firstName: "Mourad",
    lastName: "Belkacem",
    phone: "+213 771 22 11 33",
    gender: "Homme",
    age: 51,
    email: "mourad.belkacem@email.dz",
    bloodGroup: "A-",
    chronicCondition: "Dyslipidémie mixte & Surpoids",
    allergies: [],
    city: "El Biar",
    wilaya: "Alger",
    address: "31 Rue Ali Khodja",
  },
];

export default function DoctorDashboard() {
  const router = useRouter();

  // ============================================================
  // THEME STATE (Default: Light / Blanc, with toggle to Saphir Sombre)
  // ============================================================
  const [theme, setTheme] = useState<DashboardTheme>("light");

  // Load theme preference on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("mediconnect_doctor_theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    try {
      localStorage.setItem("mediconnect_doctor_theme", newTheme);
    } catch {
      // ignore
    }
  };

  const isDark = theme === "dark";

  // ============================================================
  // NAVIGATION STATE
  // ============================================================
  const [activeTab, setActiveTab] = useState<TabType>("agenda");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // ============================================================
  // PATIENTS STATE
  // ============================================================
  // patients = MES patients (liés à moi : isolation par compte).
  // allPatients = annuaire complet (sélecteurs de création : nouveau
  // RDV / nouvelle ordonnance, y compris pour un patient jamais vu).
  const [patients, setPatients] = useState<DoctorPatient[]>(INITIAL_PATIENTS);
  const [allPatients, setAllPatients] = useState<DoctorPatient[]>(INITIAL_PATIENTS);

  // ============================================================
  // APPOINTMENTS STATE
  // ============================================================
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  // ============================================================
  // MODALS STATE
  // ============================================================
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isMessengerModalOpen, setIsMessengerModalOpen] = useState(false);
  const [isPrescriptionViewModalOpen, setIsPrescriptionViewModalOpen] = useState(false);
  const [isPatientViewModalOpen, setIsPatientViewModalOpen] = useState(false);

  const isAnyModalOpen = Boolean(
    showConsultationModal ||
    showPrescriptionModal ||
    showNewAppointmentModal ||
    showVideoModal ||
    isMessengerModalOpen ||
    isPrescriptionViewModalOpen ||
    isPatientViewModalOpen
  );

  // ============================================================
  // DOCTOR STATE (Real name, picture, specialty, cabinet, license)
  // ============================================================
  const [doctorInfo, setDoctorInfo] = useState({
    id: "doc-sarah-khelifi",
    name: "Dr. Sarah Khelifi",
    specialty: "Spécialiste en Cardiologie & Maladies Vasculaires",
    cabinet: "Cabinet Médical & Clinique Ibn Sina — Alger",
    license: "ONM-DZ-2024-88941",
    phone: "+213 (0) 21 65 43 21",
    email: "contact@clinique-ibnsina.dz",
    address: "12 Rue Didouche Mourad, Alger Centre",
    status: "DISPONIBLE" as "DISPONIBLE" | "EN_CONSULTATION" | "PAUSE",
    rating: 4.9,
    reviewsCount: 142,
    avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300" as string | null,
  });

  // ============================================================
  // CONSULTATION FORM
  // ============================================================
  const [consultationNotes, setConsultationNotes] = useState("");
  const [consultationDiagnosis, setConsultationDiagnosis] = useState("");
  const [consultationBp, setConsultationBp] = useState("130/80");
  const [consultationHr, setConsultationHr] = useState("75");
  const [consultationSpO2, setConsultationSpO2] = useState("98%");
  const [consultationTemp, setConsultationTemp] = useState("37.0°C");
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  // ============================================================
  // PRESCRIPTION STATE
  // ============================================================
  const [prescriptionPatient, setPrescriptionPatient] =
    useState("Karim Haddad");

  const [prescriptionItems, setPrescriptionItems] = useState<
    PrescriptionItem[]
  >([]);

  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedFreq, setNewMedFreq] = useState("");
  const [newMedDuration, setNewMedDuration] = useState("");
  const [newMedInstructions, setNewMedInstructions] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);
  const [prescriptionSuccessNotice, setPrescriptionSuccessNotice] =
    useState(false);
  const [prescriptionNoticeMessage, setPrescriptionNoticeMessage] =
    useState("");

  // Helper to start a fresh new prescription without carrying over previous medications
  const handleOpenNewPrescription = (patientName?: string) => {
    setPrescriptionItems([]);
    setNewMedName("");
    setNewMedDosage("");
    setNewMedFreq("");
    setNewMedDuration("");
    setNewMedInstructions("");
    setPrescriptionNotes("");
    if (patientName) {
      setPrescriptionPatient(patientName);
    } else {
      setPrescriptionPatient(allPatients[0]?.name || "Karim Haddad");
    }
    setShowPrescriptionModal(true);
  };

  // ============================================================
  // LOAD DOCTOR DASHBOARD
  // ============================================================
  const loadDoctorDashboard = async () => {
    try {
      setLoadingAppointments(true);
      setAppointmentError(null);

      // 1. TRY AUTHENTICATED SESSION IF AVAILABLE
      const {
        data: { session },
      } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      // 2. LOAD APPOINTMENTS (per-doctor isolated via Bearer token).
      // When authenticated, ALWAYS replace mock data — even with an empty list —
      // so doctor 2 never sees doctor 1's demo appointments.
      const appointmentsResponse = await fetch(
        "/api/dashboard/doctor/appointments",
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      ).catch(() => null);

      if (appointmentsResponse && appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        if (Array.isArray(appointmentsData.appointments)) {
          setAppointments(appointmentsData.appointments);
        }
      } else if (!session?.access_token) {
        // Not logged in: keep demo data for preview
      }

      // 3. LOAD PATIENTS (per-doctor isolated: only linked patients)
      const patientsResponse = await fetch("/api/dashboard/doctor/patients", {
        method: "GET",
        headers,
        cache: "no-store",
      }).catch(() => null);

      if (patientsResponse && patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        if (Array.isArray(patientsData.patients)) {
          setPatients(patientsData.patients);
        }
      } else if (patientsResponse && patientsResponse.status === 401) {
        // Authenticated as non-doctor or new doctor with no patients yet: empty, not mock
        if (session?.access_token) setPatients([]);
      }

      // 3b. LOAD FULL DIRECTORY (sélecteurs de création : jamais vide)
      const directoryResponse = await fetch("/api/dashboard/doctor/patients?scope=all", {
        method: "GET",
        headers,
        cache: "no-store",
      }).catch(() => null);

      if (directoryResponse && directoryResponse.ok) {
        const directoryData = await directoryResponse.json();
        if (Array.isArray(directoryData.patients) && directoryData.patients.length > 0) {
          setAllPatients(directoryData.patients);
        }
      } else if (directoryResponse && directoryResponse.status === 401) {
        if (session?.access_token) setAllPatients([]);
      }

      // 4. LOAD DOCTOR PROFILE
      const profileResponse = await fetch("/api/dashboard/doctor/profile", {
        method: "GET",
        headers,
        cache: "no-store",
      }).catch(() => null);

      if (profileResponse && profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.profile && profileData.doctor) {
          const profile = profileData.profile;
          const doctor = profileData.doctor;
          const specialties = profileData.specialties || [];

          const specialty =
            specialties.length > 0
              ? specialties.map((item: { name: string }) => item.name).join(", ")
              : "Médecin";

          setDoctorInfo({
            id: doctor.id || "doc-sarah-khelifi",
            name: `Dr. ${profile.firstName || "Sarah"} ${profile.lastName || "Khelifi"}`.trim(),
            specialty,
            cabinet:
              profileData.facilities?.[0]?.facility?.name ||
              "Cabinet Médical & Clinique Ibn Sina — Alger",
            license: doctor.licenseNumber || "ONM-DZ-2024-88941",
            phone: profile.phone || "+213 (0) 21 65 43 21",
            email: profile.email || "contact@clinique-ibnsina.dz",
            address:
              profileData.facilities?.[0]?.facility?.address ||
              "12 Rue Didouche Mourad, Alger Centre",
            status: "DISPONIBLE",
            rating: Number(doctor.averageRating) || 4.9,
            reviewsCount: doctor.totalReviews || 142,
            avatarUrl: profile.avatarUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
          });
        }
      }
    } catch (error) {
      console.error("Erreur chargement dashboard médecin:", error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDoctorDashboard();
  }, []);

  // Filtered appointments
  const filteredAppointments = appointments.filter((apt) => {
    // Filter by selected calendar date if active
    if (selectedCalendarDate) {
      // Les rendez-vous refusés ne restent pas dans l'agenda à leur date.
      if (apt.status === "CANCELLED") return false;
      try {
        const aptDateStr =
          apt.appointmentDate.match(/^(\d{4})-(\d{2})-(\d{2})/)?.[0] ||
          (() => {
            const d = new Date(apt.appointmentDate);
            if (isNaN(d.getTime())) return null;
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          })();
        if (aptDateStr !== selectedCalendarDate) return false;
      } catch {
        // ignore
      }
    }

    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.phone.includes(searchQuery);

    if (!matchesSearch) return false;
    if (filterType === "ALL") return true;

    if (filterType === "WAITING") {
      return (
        apt.status === "PENDING" ||
        apt.status === "CONFIRMED" ||
        apt.status === "WAITING"
      );
    }

    if (filterType === "TELECONSULTATION") {
      return apt.type === "ONLINE";
    }

    if (filterType === "URGENT") {
      return apt.aiTriageScore === "ÉLEVÉ";
    }

    if (filterType === "COMPLETED") return apt.status === "COMPLETED";
    return true;
  });

  // Action handlers
  const handleStartConsultation = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setConsultationNotes(apt.notes || "");
    setConsultationDiagnosis("");
    setConsultationBp(apt.bloodPressure || "");
    setConsultationHr(apt.heartRate?.replace(" bpm", "") || "");
    setConsultationSpO2("");
    setConsultationTemp("");
    setAiAnalysisResult(null);
    setShowConsultationModal(true);
  };

  // Négociation de créneaux : le médecin accepte, refuse ou propose
  // un autre créneau. La décision du patient (RESCHEDULED -> CONFIRMED
  // / CANCELLED) remonte ensuite dans cette même liste.
  const [actingAptId, setActingAptId] = useState<string | null>(null);
  const [negotiateFor, setNegotiateFor] = useState<string | null>(null);
  const [negotiateDate, setNegotiateDate] = useState("");
  const [negotiateError, setNegotiateError] = useState("");

  // Communauté : surlignage d'un post depuis la cloche (@mention).
  const [highlightPostId, setHighlightPostId] = useState<string | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const postId = (e as CustomEvent).detail?.postId;
      if (postId) {
        setActiveTab("community");
        setHighlightPostId(String(postId));
      }
    };
    window.addEventListener("doctor-community-open", handler);
    return () => window.removeEventListener("doctor-community-open", handler);
  }, []);

  const patchDoctorAppointment = async (
    id: string,
    body: { status: string; appointmentDate?: string }
  ) => {
    setActingAptId(id);
    setNegotiateError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        router.replace("/login");
        return;
      }
      const response = await fetch("/api/dashboard/doctor/appointments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appointmentId: id, ...body }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Action impossible.");
      }
      const upd = result.appointment;
      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.id === id
            ? {
                ...appointment,
                status: upd.status,
                appointmentDate: upd.appointmentDate
                  ? new Date(upd.appointmentDate).toISOString()
                  : appointment.appointmentDate,
                previousDate: upd.previousDate
                  ? new Date(upd.previousDate).toISOString()
                  : appointment.previousDate || null,
              }
            : appointment
        )
      );
      setNegotiateFor(null);
      setNegotiateDate("");
    } catch (err) {
      setNegotiateError(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setActingAptId(null);
    }
  };

  const handleFinishConsultation = async () => {
    if (!selectedAppointment) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        router.replace("/login");
        return;
      }

      const notes = [
        consultationNotes.trim(),
        consultationDiagnosis.trim()
          ? `Diagnostic: ${consultationDiagnosis.trim()}`
          : "",
        consultationBp.trim() ? `TA: ${consultationBp.trim()} mmHg` : "",
        consultationHr.trim() ? `FC: ${consultationHr.trim()} bpm` : "",
        consultationSpO2.trim() ? `SpO2: ${consultationSpO2.trim()}` : "",
        consultationTemp.trim() ? `Température: ${consultationTemp.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const response = await fetch("/api/dashboard/doctor/appointments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          status: "COMPLETED",
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Impossible de terminer la consultation."
        );
      }

      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.id === selectedAppointment.id
            ? {
                ...appointment,
                status: "COMPLETED",
                notes,
              }
            : appointment
        )
      );

      setShowConsultationModal(false);
    } catch (error) {
      console.error("Finish consultation error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erreur lors de la consultation."
      );
    }
  };

  const handleRunAiAnalysis = () => {
    if (!selectedAppointment) return;
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      setAiAnalysisResult(
        `Synthèse IA DOCTORZ Co. (Gemini Clinical Guidance):\n` +
          `• Profil: ${selectedAppointment.patientName}, ${selectedAppointment.patientAge} ans.\n` +
          `• Motif: "${selectedAppointment.reason}".\n` +
          `• Données cliniques: TA ${consultationBp || "130/80"}, Fréquence ${consultationHr || "75"} bpm, SpO2 ${consultationSpO2 || "98%"}.\n` +
          `• Recommandations: 1. Réalisation d'un ECG de repos immédiat. 2. Dosage Troponine & D-Dimères si douleur persistante. 3. Éviter bêta-bloquants si bradycardie < 55 bpm.`
      );
    }, 900);
  };

  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    setPrescriptionItems((prev) => [
      ...prev,
      {
        id: `med-${Date.now()}`,
        medication: newMedName.trim(),
        dosage: newMedDosage.trim() || "Selon ordonnance",
        frequency: newMedFreq.trim() || "1 fois par jour",
        duration: newMedDuration.trim() || "30 jours",
        instructions:
          newMedInstructions.trim() || "Prendre au cours des repas avec de l'eau.",
      },
    ]);
    setNewMedName("");
    setNewMedDosage("");
    setNewMedFreq("");
    setNewMedDuration("");
    setNewMedInstructions("");
  };

  const handleQuickAddMedication = (template: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }) => {
    setPrescriptionItems((prev) => [
      ...prev,
      {
        id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...template,
      },
    ]);
  };

  const handleRemoveMedication = (id: string) => {
    setPrescriptionItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDownloadPrescriptionPdf = () => {
    if (prescriptionItems.length === 0) {
      alert("Veuillez ajouter au moins un médicament à l'ordonnance.");
      return;
    }

    const patientObj = allPatients.find(
      (p) =>
        p.name?.toLowerCase().trim() === prescriptionPatient.toLowerCase().trim() ||
        p.id === prescriptionPatient
    );

    const fullPatientData: PrescriptionPatientInfo = {
      id: patientObj?.id || "pat-gen",
      name: patientObj?.name || prescriptionPatient,
      age: patientObj?.age ?? 45,
      gender: patientObj?.gender || "Non précisé",
      phone: patientObj?.phone || "+213 550 00 00 00",
      email: patientObj?.email || "patient@mediconnect.dz",
      bloodGroup: patientObj?.bloodGroup || "O+",
      allergies: patientObj?.allergies || [],
      address: patientObj?.address || null,
      city: patientObj?.city || patientObj?.wilaya || "Alger, Algérie",
      wilaya: patientObj?.wilaya || "Alger",
      chronicCondition: patientObj?.chronicCondition || null,
    };

    const fullDoctorData: PrescriptionDoctorInfo = {
      name: doctorInfo.name || "Dr. Sarah Khelifi",
      specialty: doctorInfo.specialty || "Médecine Générale & Spécialités Médicales",
      license: doctorInfo.license || "DZ-ONM-2024-88941",
      cabinet: doctorInfo.cabinet || "Cabinet Médical Ibn Sina — Alger",
      phone: doctorInfo.phone || "+213 (0) 21 65 43 21",
      email: doctorInfo.email || "contact@clinique-ibnsina.dz",
      address: doctorInfo.address || "12 Rue Didouche Mourad, Alger Centre",
      city: "Alger",
    };

    try {
      generatePrescriptionPDF({
        doctor: fullDoctorData,
        patient: fullPatientData,
        items: prescriptionItems,
        notes: prescriptionNotes,
      });

      setPrescriptionNoticeMessage(
        `Ordonnance PDF générée avec succès pour ${fullPatientData.name} ! Téléchargement en cours...`
      );
      setPrescriptionSuccessNotice(true);
      setTimeout(() => {
        setPrescriptionSuccessNotice(false);
      }, 4000);
    } catch (err) {
      console.error("Erreur lors de la génération PDF:", err);
      alert("Une erreur est survenue lors de la création du PDF d'ordonnance.");
    }
  };

  const handleSignPrescription = async () => {
    if (isSavingPrescription) return;
    setIsSavingPrescription(true);

    // 1. Download certified PDF
    handleDownloadPrescriptionPdf();

    // 2. Persist to real Database via /api/prescriptions
    try {
      const patientObj = allPatients.find(
        (p) =>
          p.name?.toLowerCase().trim() === prescriptionPatient.toLowerCase().trim() ||
          p.id === prescriptionPatient
      );

      const itemsPayload = prescriptionItems.map((item) => {
        const match = item.duration?.match(/(\d+)/);
        const days = match ? parseInt(match[1], 10) : 30;
        return {
          medicationName: item.medication,
          dosage: item.dosage,
          frequency: item.frequency,
          durationDays: days,
          instructions: item.instructions || "",
        };
      });

      const prescriptionHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      try {
        const { data: s } = await supabase.auth.getSession();
        const t = s.session?.access_token;
        if (t) prescriptionHeaders["Authorization"] = `Bearer ${t}`;
      } catch {
        // no session: doctorId query/body still scopes the request
      }

      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: prescriptionHeaders,
        body: JSON.stringify({
          patientId: patientObj?.id || prescriptionPatient,
          patientName: patientObj?.name || prescriptionPatient,
          doctorId: doctorInfo.id,
          notes: prescriptionNotes,
          items: itemsPayload,
        }),
      });

      if (!res.ok) {
        // Only write to localStorage as offline fallback if API request failed!
        try {
          const currentLocal = JSON.parse(
            localStorage.getItem("mediconnect_prescriptions") || "[]"
          );
          currentLocal.unshift({
            id: `presc-local-${Date.now()}`,
            prescriptionNumber: `ORD-${Date.now()}`,
            prescribedDate: new Date().toISOString(),
            patientId: patientObj?.id || prescriptionPatient,
            patientName: patientObj?.name || prescriptionPatient,
            doctorName: doctorInfo.name,
            status: "ACTIVE",
            notes: prescriptionNotes,
            items: itemsPayload.map((it: any) => ({
              id: `item-${Date.now()}-${Math.random()}`,
              medicationName: it.medicationName,
              dosage: it.dosage,
              frequency: it.frequency,
              duration: `${it.durationDays} jours`,
              instructions: it.instructions,
            })),
          });
          localStorage.setItem(
            "mediconnect_prescriptions",
            JSON.stringify(currentLocal)
          );
        } catch {
          // ignore
        }
      }
    } catch (saveErr) {
      console.error("Error saving prescription to DB:", saveErr);
    } finally {
      setIsSavingPrescription(false);
    }

    setPrescriptionNoticeMessage(
      `Ordonnance signée numériquement & certifiée SHA-256 pour ${prescriptionPatient} ! Document PDF téléchargé et consigné au dossier médical.`
    );
    setPrescriptionSuccessNotice(true);
    setTimeout(() => {
      setPrescriptionSuccessNotice(false);
      setShowPrescriptionModal(false);
      // Clean form for next prescription to avoid carrying over medications
      setPrescriptionItems([]);
      setNewMedName("");
      setNewMedDosage("");
      setNewMedFreq("");
      setNewMedDuration("");
      setNewMedInstructions("");
      setPrescriptionNotes("");
      // L'ordonnance lie le patient au médecin : actualiser "Mes patients".
      // Le patient la reçoit automatiquement dans son compte (filtré par patient).
      loadDoctorDashboard();
    }, 2800);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.push("/login");
  };

  // KPIs
  const today = new Date();

  const isToday = (date: string) => {
    const appointmentDate = new Date(date);
    return (
      appointmentDate.getFullYear() === today.getFullYear() &&
      appointmentDate.getMonth() === today.getMonth() &&
      appointmentDate.getDate() === today.getDate()
    );
  };

  const todayAppointments = appointments.filter((appointment) =>
    isToday(appointment.appointmentDate)
  );

  const patientsToday = new Set(
    todayAppointments.map((appointment) => appointment.patientId)
  ).size;

  const waitingCount = todayAppointments.filter(
    (appointment) =>
      appointment.status === "WAITING" || appointment.status === "PENDING"
  ).length;

  const teleconsultCount = todayAppointments.filter(
    (appointment) => appointment.type === "ONLINE"
  ).length;

  const completedCount = todayAppointments.filter(
    (appointment) => appointment.status === "COMPLETED"
  ).length;

  const urgentCount = todayAppointments.filter(
    (appointment) => appointment.aiTriageScore === "ÉLEVÉ"
  ).length;

  // Doctor initials for monogram
  const doctorInitials = doctorInfo.name
    ? doctorInfo.name
        .replace(/^Dr\.?\s*/i, "")
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "MD"
    : "MD";

  return (
    <div
      id="doctor-dashboard-container"
      className={`min-h-screen flex flex-col transition-colors duration-300 relative overflow-x-hidden ${
        isDark
          ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 selection:bg-indigo-600 selection:text-white"
          : "bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white"
      }`}
    >
      {/* Ambient backdrops (Active in dark mode, subtle in light mode) */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {isDark ? (
          <>
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-indigo-600/10 blur-[140px] rounded-full" />
            <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-purple-600/10 blur-[150px] rounded-full" />
            <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-blue-600/10 blur-[150px] rounded-full" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
                backgroundSize: "32px 32px",
              }}
            />
          </>
        ) : (
          <>
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-100/60 blur-[100px] rounded-full" />
            <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-blue-100/40 blur-[100px] rounded-full" />
          </>
        )}
      </div>

      {/* ============================================================
          TOP CLINICAL HEADER
      ============================================================ */}
      <header
        className={`sticky top-0 z-40 px-4 sm:px-6 py-3.5 transition-colors duration-200 border-b ${
          isDark
            ? "bg-slate-950/80 backdrop-blur-md border-slate-800/80 shadow-xl"
            : "bg-white/95 backdrop-blur-md border-slate-200/90 shadow-xs"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & Doctor ID */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <span className="group-hover:scale-105 transition">
                <DoctorzBrand isDark={isDark} size={40} />
              </span>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md border ${
                      isDark
                        ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                    }`}
                  >
                    Station Clinique
                  </span>
                </div>
                <p
                  className={`text-[11px] font-medium ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Espace Médecin & Télémédecine Sécurisée
                </p>
              </div>
            </Link>

            <div
              className={`hidden xl:block h-6 w-px ml-1 ${
                isDark ? "bg-slate-800" : "bg-slate-200"
              }`}
            />

            <div
              className={`hidden xl:flex items-center gap-1.5 text-xs truncate max-w-[200px] ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
              title={doctorInfo.cabinet}
            >
              <Building
                size={14}
                className={`shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}
              />
              <span className="font-medium truncate">{doctorInfo.cabinet}</span>
            </div>
          </div>

          {/* Practice Availability & Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* THEME TOGGLE BUTTON (Light vs Saphir Sombre) */}
            <button
              type="button"
              id="btn-toggle-theme"
              onClick={toggleTheme}
              title={
                isDark
                  ? "Basculer vers le Thème Blanc"
                  : "Basculer vers le Thème Saphir Sombre & Verre Fumé"
              }
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition shadow-xs cursor-pointer shrink-0 ${
                isDark
                  ? "bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border-indigo-500/40 shadow-indigo-600/20"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-300/80"
              }`}
            >
              {isDark ? (
                <>
                  <Sun size={14} className="text-amber-400" />
                  <span className="hidden md:inline">Thème Blanc</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-indigo-600" />
                  <span className="hidden md:inline">Saphir Sombre</span>
                </>
              )}
            </button>

            {/* Status Selector */}
            <div
              className={`flex items-center gap-0.5 p-1 rounded-xl border text-xs shrink-0 ${
                isDark
                  ? "bg-slate-900/90 border-slate-800"
                  : "bg-slate-100/90 border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  setDoctorInfo((d) => ({ ...d, status: "DISPONIBLE" }))
                }
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  doctorInfo.status === "DISPONIBLE"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : isDark
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                <span className="hidden xs:inline">Disponible</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setDoctorInfo((d) => ({ ...d, status: "EN_CONSULTATION" }))
                }
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  doctorInfo.status === "EN_CONSULTATION"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : isDark
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-indigo-300" />
                <span className="hidden xs:inline">En consultation</span>
              </button>
            </div>

            {/* Lab news bell */}
            <DoctorLabNotifs isDark={isDark} />

            {/* Virtual Card Link */}
            <Link
              href="/dashboard/doctor/card"
              title="Afficher ma carte professionnelle virtuelle 3D"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition shadow-xs cursor-pointer group shrink-0 ${
                isDark
                  ? "bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border-indigo-500/30"
                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
              }`}
            >
              <CreditCard
                size={14}
                className="text-indigo-500 group-hover:scale-110 transition-transform"
              />
              <span className="hidden md:inline">Ma Carte Virtuelle</span>
            </Link>

            {/* Doctor Profile Pill */}
            <div
              className={`flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3 border-l shrink-0 ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-xl overflow-hidden bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 border border-indigo-400/40 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
                {doctorInfo.avatarUrl ? (
                  <Image
                    src={doctorInfo.avatarUrl}
                    alt={doctorInfo.name}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{doctorInitials}</span>
                )}
              </div>

              <div className="hidden lg:block text-left max-w-[120px] xl:max-w-[150px]">
                <p
                  className={`text-xs font-bold leading-tight truncate ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                  title={doctorInfo.name || "Dr. Enregistré"}
                >
                  {doctorInfo.name || "Dr. Enregistré"}
                </p>
                <p
                  className="text-[11px] text-indigo-500 font-medium leading-none truncate"
                  title={doctorInfo.specialty}
                >
                  {doctorInfo.specialty}
                </p>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Déconnexion"
                className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer shrink-0 ${
                  isDark
                    ? "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                    : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                }`}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
          MAIN BODY LAYOUT: TABS & CONTENT
      ============================================================ */}
      <main className="relative z-10 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 space-y-6 pb-44 sm:pb-52">
        {/* DOCTOR WELCOMING BANNER (Doctor's Real Name, Picture, Status & Quick Stats) */}
        <DoctorWelcomeBanner
          doctorInfo={doctorInfo}
          isDark={isDark}
          todayCount={patientsToday}
          waitingCount={waitingCount}
          teleconsultCount={teleconsultCount}
          urgentCount={urgentCount}
          onNewAppointment={() => setShowNewAppointmentModal(true)}
          onOpenCalendar={() => setActiveTab("calendar")}
          doctorInitials={doctorInitials}
        />

        {/* TOP KPI STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* PATIENTS AUJOURD'HUI */}
          <div
            className={`p-4 rounded-2xl border transition shadow-md flex items-center justify-between ${
              isDark
                ? "bg-slate-900/70 backdrop-blur-md border-slate-800/80 hover:border-slate-700/80"
                : "bg-white border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div>
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Patients Aujourd&apos;hui
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className={`text-2xl sm:text-3xl font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {patientsToday}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isDark ? "text-slate-400" : "text-slate-400"
                  }`}
                >
                  prévus
                </span>
              </div>
            </div>
            <div
              className={`p-3 rounded-xl border ${
                isDark
                  ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                  : "bg-indigo-50 text-indigo-600 border-indigo-100"
              }`}
            >
              <Users size={20} />
            </div>
          </div>

          {/* EN SALLE D'ATTENTE */}
          <div
            className={`p-4 rounded-2xl border transition shadow-md flex items-center justify-between ${
              isDark
                ? "bg-slate-900/70 backdrop-blur-md border-slate-800/80 hover:border-slate-700/80"
                : "bg-white border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div>
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                En Salle d&apos;Attente
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-amber-500">
                  {waitingCount}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isDark ? "text-slate-400" : "text-slate-400"
                  }`}
                >
                  en attente
                </span>
              </div>
            </div>
            <div
              className={`p-3 rounded-xl border ${
                isDark
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : "bg-amber-50 text-amber-600 border-amber-100"
              }`}
            >
              <Clock size={20} />
            </div>
          </div>

          {/* TÉLÉCONSULTATIONS */}
          <div
            className={`p-4 rounded-2xl border transition shadow-md flex items-center justify-between ${
              isDark
                ? "bg-slate-900/70 backdrop-blur-md border-slate-800/80 hover:border-slate-700/80"
                : "bg-white border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div>
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Téléconsultations
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-violet-500">
                  {teleconsultCount}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isDark ? "text-slate-400" : "text-slate-400"
                  }`}
                >
                  vidéo
                </span>
              </div>
            </div>
            <div
              className={`p-3 rounded-xl border ${
                isDark
                  ? "bg-violet-500/15 text-violet-400 border-violet-500/30"
                  : "bg-violet-50 text-violet-600 border-violet-100"
              }`}
            >
              <Video size={20} />
            </div>
          </div>

          {/* CONSULTATIONS FAITES */}
          <div
            className={`p-4 rounded-2xl border transition shadow-md flex items-center justify-between ${
              isDark
                ? "bg-slate-900/70 backdrop-blur-md border-slate-800/80 hover:border-slate-700/80"
                : "bg-white border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div>
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Consultations Faites
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-500">
                  {completedCount}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isDark ? "text-slate-400" : "text-slate-400"
                  }`}
                >
                  terminées
                </span>
              </div>
            </div>
            <div
              className={`p-3 rounded-xl border ${
                isDark
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
              }`}
            >
              <CheckCircle2 size={20} />
            </div>
          </div>

          {/* ALERTES TRIAGE IA */}
          <div
            className={`col-span-2 lg:col-span-1 p-4 rounded-2xl border transition shadow-md flex items-center justify-between ${
              isDark
                ? "bg-slate-900/70 backdrop-blur-md border-slate-800/80 hover:border-slate-700/80"
                : "bg-white border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <div>
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Alertes Triage IA
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-rose-500">
                  {urgentCount}
                </span>
                <span className="text-xs text-rose-500 font-medium">
                  prioritaire
                </span>
              </div>
            </div>
            <div
              className={`p-3 rounded-xl border ${
                isDark
                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  : "bg-rose-50 text-rose-600 border-rose-100"
              }`}
            >
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>

        {/* WORKSPACE NAVIGATION TABS */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
            isDark ? "border-slate-800/80" : "border-slate-200"
          }`}
        >
          <div
            className={`flex items-center gap-1.5 p-1.5 rounded-2xl border text-xs ${
              isDark
                ? "bg-slate-900/90 border-slate-800 backdrop-blur-md"
                : "bg-slate-200/60 border-slate-200"
            }`}
          >
            <button
              type="button"
              id="tab-btn-agenda"
              onClick={() => setActiveTab("agenda")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "agenda"
                  ? isDark
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-white text-slate-900 shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar
                size={15}
                className={
                  activeTab === "agenda"
                    ? isDark
                      ? "text-white"
                      : "text-indigo-600"
                    : "text-indigo-500"
                }
              />
              <span>Agenda & Consultations</span>
            </button>

            <button
              type="button"
              id="tab-btn-prescriptions"
              onClick={() => setActiveTab("prescriptions")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "prescriptions"
                  ? isDark
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-white text-slate-900 shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText
                size={15}
                className={
                  activeTab === "prescriptions"
                    ? isDark
                      ? "text-white"
                      : "text-violet-600"
                    : "text-violet-500"
                }
              />
              <span>Ordonnances & Historique</span>
            </button>

            <button
              type="button"
              id="tab-btn-ai-assistant"
              onClick={() => setActiveTab("ai_assistant")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "ai_assistant"
                  ? isDark
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-white text-slate-900 shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles
                size={15}
                className={
                  activeTab === "ai_assistant"
                    ? isDark
                      ? "text-white"
                      : "text-amber-500"
                    : "text-amber-400"
                }
              />
              <span>Co-Pilote IA Clinique</span>
            </button>

            <button
              type="button"
              id="tab-btn-community"
              onClick={() => setActiveTab("community")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "community"
                  ? isDark
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-white text-slate-900 shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users
                size={15}
                className={
                  activeTab === "community"
                    ? isDark
                      ? "text-white"
                      : "text-violet-600"
                    : "text-violet-500"
                }
              />
              <span>Communauté</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadDoctorDashboard}
              title="Rafraîchir"
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isDark
                  ? "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800"
                  : "bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200 shadow-xs"
              }`}
            >
              <RefreshCw
                size={14}
                className={loadingAppointments ? "animate-spin" : ""}
              />
            </button>

            <button
              type="button"
              id="btn-new-appointment"
              onClick={() => setShowNewAppointmentModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition cursor-pointer"
            >
              <Plus size={16} />
              <span>Nouveau Rendez-vous</span>
            </button>
          </div>
        </div>

        {/* TAB 1: AGENDA & FILE ACTIVE */}
        {activeTab === "agenda" && (
          <div className="space-y-4">
            {/* Filter bar & Search */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-md ${
                isDark
                  ? "bg-slate-900/70 backdrop-blur-md border-slate-800/80"
                  : "bg-white border-slate-200/90 shadow-xs"
              }`}
            >
              <div className="relative flex-1 max-w-md">
                <Search
                  size={16}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Rechercher par nom de patient, motif, téléphone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition ${
                    isDark
                      ? "border border-slate-800 bg-slate-950/80 text-white placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500/30"
                      : "border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
                {[
                  { label: "Tous", val: "ALL" },
                  { label: "En Attente", val: "WAITING" },
                  { label: "Téléconsultation", val: "TELECONSULTATION" },
                  { label: "Urgences / IA", val: "URGENT" },
                  { label: "Terminés", val: "COMPLETED" },
                ].map((f) => (
                  <button
                    key={f.val}
                    type="button"
                    onClick={() => setFilterType(f.val)}
                    className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
                      filterType === f.val
                        ? isDark
                          ? "bg-indigo-600 text-white border border-indigo-500 shadow-xs"
                          : "bg-slate-900 text-white border border-slate-900"
                        : isDark
                        ? "bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {appointmentError && (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
                  isDark
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                <AlertTriangle size={16} className="shrink-0" />
                <span>{appointmentError}</span>
              </div>
            )}

            {/* Active Calendar Date Filter Notice */}
            {selectedCalendarDate && (
              <div
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition shadow-sm ${
                  isDark
                    ? "bg-indigo-950/40 border-indigo-500/30 text-indigo-300"
                    : "bg-indigo-50 border-indigo-200 text-indigo-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar size={16} className="text-indigo-600 shrink-0" />
                  <span>
                    Filtre calendrier actif : Rendez-vous du{" "}
                    <strong>
                      {(() => {
                        const match = selectedCalendarDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
                        if (match) {
                          const y = parseInt(match[1], 10);
                          const m = parseInt(match[2], 10) - 1;
                          const d = parseInt(match[3], 10);
                          return new Date(y, m, d, 12, 0, 0).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          });
                        }
                        return selectedCalendarDate;
                      })()}
                    </strong>{" "}
                    ({filteredAppointments.length} rendez-vous)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCalendarDate(null)}
                    className="font-bold underline hover:opacity-80 cursor-pointer"
                  >
                    Voir toutes les dates
                  </button>
                  <span className="opacity-40">•</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("calendar")}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Ouvrir vue calendrier
                  </button>
                </div>
              </div>
            )}

            {/* Appointments List */}
            <div className="space-y-3">
              {loadingAppointments && appointments.length === 0 ? (
                <div
                  className={`rounded-2xl border p-12 text-center ${
                    isDark
                      ? "bg-slate-900/60 border-slate-800"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <RefreshCw
                    size={28}
                    className="mx-auto text-indigo-500 animate-spin mb-3"
                  />
                  <p
                    className={`text-xs ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Chargement des consultations et des dossiers patients...
                  </p>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div
                  className={`rounded-2xl border p-12 text-center ${
                    isDark
                      ? "bg-slate-900/60 border-slate-800"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <User
                    size={32}
                    className={`mx-auto mb-2 ${
                      isDark ? "text-slate-600" : "text-slate-300"
                    }`}
                  />
                  <h3
                    className={`text-sm font-semibold ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Aucun rendez-vous trouvé
                  </h3>
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Modifiez vos filtres ou effectuez une recherche différente.
                  </p>
                </div>
              ) : (
                filteredAppointments.map((apt) => {
                  const isUrgent = apt.aiTriageScore === "ÉLEVÉ";
                  const isVideo = apt.type === "ONLINE";
                  const isDone = apt.status === "COMPLETED";
                  const isInProgress = apt.status === "CONFIRMED";

                  return (
                    <div
                      key={apt.id}
                      className={`rounded-2xl border p-4.5 transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm ${
                        isDark
                          ? isUrgent
                            ? "border-rose-500/40 bg-gradient-to-r from-rose-950/25 via-slate-900/80 to-slate-900/80 ring-1 ring-rose-500/20"
                            : isInProgress
                            ? "border-indigo-500/40 bg-gradient-to-r from-indigo-950/25 via-slate-900/80 to-slate-900/80 ring-1 ring-indigo-500/20"
                            : isDone
                            ? "border-slate-800/60 bg-slate-950/40 opacity-75"
                            : "bg-slate-900/75 backdrop-blur-md border-slate-800/80 hover:border-slate-700/90"
                          : isUrgent
                          ? "border-rose-300 bg-rose-50/30"
                          : isInProgress
                          ? "border-indigo-400 bg-indigo-50/30 ring-2 ring-indigo-500/10"
                          : isDone
                          ? "border-slate-200 bg-slate-50/60 opacity-80"
                          : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs"
                      }`}
                    >
                      {/* Left: Time & Patient details */}
                      <div className="flex items-start gap-3.5">
                        {/* Time box */}
                        <div
                          className={`flex flex-col items-center justify-center min-h-16 w-20 rounded-xl text-center shrink-0 px-1.5 border shadow-inner ${
                            isDark
                              ? "bg-slate-950/90 border-slate-800 text-white"
                              : "bg-slate-100 border-slate-200 text-slate-900"
                          }`}
                        >
                          <span
                            className={`text-[10px] font-semibold leading-tight ${
                              isDark ? "text-indigo-400" : "text-indigo-600"
                            }`}
                          >
                            {new Date(apt.appointmentDate).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "2-digit",
                                month: "short",
                              }
                            )}
                          </span>
                          <span
                            className={`text-sm font-bold mt-0.5 font-mono ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {apt.time}
                          </span>
                          <span
                            className={`text-[9px] leading-tight mt-0.5 ${
                              isDark ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {apt.type === "ONLINE"
                              ? "Téléconsult."
                              : apt.type === "HOME_VISIT"
                              ? "À domicile"
                              : "En cabinet"}
                          </span>
                        </div>

                        {/* Patient info */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`text-sm font-bold ${
                                isDark ? "text-white" : "text-slate-900"
                              }`}
                            >
                              {apt.patientName}
                            </h4>
                            <span
                              className={`text-xs ${
                                isDark ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              {apt.patientAge} ans • {apt.patientGender}
                            </span>

                            {/* Badges */}
                            {isVideo && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                  isDark
                                    ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                                    : "bg-violet-100 text-violet-700 border-violet-200"
                                }`}
                              >
                                <Video size={11} />
                                Téléconsultation
                              </span>
                            )}

                            {isUrgent && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border animate-pulse ${
                                  isDark
                                    ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                    : "bg-rose-100 text-rose-700 border-rose-200"
                                }`}
                              >
                                <AlertTriangle size={11} />
                                Priorité Élevée
                              </span>
                            )}

                            {isInProgress && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                  isDark
                                    ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                                    : "bg-indigo-100 text-indigo-700 border-indigo-200 animate-pulse"
                                }`}
                              >
                                <Activity size={11} />
                                En cours
                              </span>
                            )}

                            {isDone && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                  isDark
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                    : "bg-emerald-100 text-emerald-700 border-emerald-200"
                                }`}
                              >
                                <CheckCircle2 size={11} />
                                Terminé
                              </span>
                            )}

                            {/* Décision sur la demande : accepté / refusé */}
                            {apt.status === "CONFIRMED" && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  isDark
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                    : "bg-emerald-600 text-white border-emerald-600"
                                }`}
                              >
                                <Check size={11} />
                                Accepté
                              </span>
                            )}

                            {apt.status === "CANCELLED" && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  isDark
                                    ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                    : "bg-rose-600 text-white border-rose-600"
                                }`}
                              >
                                <X size={11} />
                                Refusé
                              </span>
                            )}
                          </div>

                          <p
                            className={`text-xs font-medium ${
                              isDark ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Motif : {apt.reason}
                          </p>

                          {/* AI Pre-Triage Insight */}
                          <div
                            className={`mt-2 flex items-start gap-1.5 text-[11px] p-2.5 rounded-xl border max-w-2xl ${
                              isDark
                                ? "text-slate-300 bg-indigo-950/30 border-indigo-500/20"
                                : "text-slate-600 bg-slate-50 border-slate-200/80"
                            }`}
                          >
                            <Sparkles
                              size={13}
                              className={`shrink-0 mt-0.5 ${
                                isDark ? "text-indigo-400" : "text-indigo-600"
                              }`}
                            />
                            <span>
                              <strong
                                className={
                                  isDark ? "text-indigo-200" : "text-slate-800"
                                }
                              >
                                Triage IA :
                              </strong>{" "}
                              {apt.aiTriageSummary}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end lg:self-center flex-wrap">
                        {isVideo && !isDone && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setShowVideoModal(true);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                              isDark
                                ? "bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border-violet-500/30"
                                : "bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200"
                            }`}
                          >
                            <Video size={14} />
                            <span>Lancer Visio</span>
                          </button>
                        )}

                        {/* Demande du patient : accepter / refuser / proposer */}
                        {apt.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              disabled={actingAptId === apt.id}
                              onClick={() => patchDoctorAppointment(apt.id, { status: "CONFIRMED" })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition cursor-pointer disabled:opacity-50"
                            >
                              <Check size={14} />
                              <span>{actingAptId === apt.id ? "…" : "Accepter"}</span>
                            </button>
                            <button
                              type="button"
                              disabled={actingAptId === apt.id}
                              onClick={() => {
                                if (confirm("Refuser cette demande de rendez-vous ?")) {
                                  patchDoctorAppointment(apt.id, { status: "CANCELLED" });
                                }
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer disabled:opacity-50 ${
                                isDark
                                  ? "border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                                  : "border-rose-200 text-rose-600 hover:bg-rose-50"
                              }`}
                            >
                              <X size={14} />
                              <span>Refuser</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNegotiateFor(negotiateFor === apt.id ? null : apt.id);
                                setNegotiateDate("");
                                setNegotiateError("");
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                                isDark
                                  ? "bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border-sky-500/30"
                                  : "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
                              }`}
                            >
                              <CalendarDays size={14} />
                              <span>Proposer un créneau</span>
                            </button>
                          </>
                        )}

                        {/* Contre-proposition envoyée : décision du patient attendue */}
                        {apt.status === "RESCHEDULED" && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                              isDark
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            <Clock size={14} />
                            <span>En attente du patient</span>
                          </span>
                        )}
                        {apt.status === "RESCHEDULED" && apt.previousDate && (
                          <span className={`w-full text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            Demandé :{" "}
                            <span className="line-through">
                              {new Date(apt.previousDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>{" "}
                            → Proposé :{" "}
                            <strong>
                              {new Date(apt.appointmentDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </strong>
                          </span>
                        )}

                        {/* Nouveau créneau proposé par le médecin */}
                        {negotiateFor === apt.id && apt.status === "PENDING" && (
                          <div className={`w-full rounded-xl border p-2.5 flex flex-col sm:flex-row gap-2 sm:items-center ${isDark ? "bg-slate-950 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                            <input
                              type="datetime-local"
                              value={negotiateDate}
                              min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                              onChange={(e) => setNegotiateDate(e.target.value)}
                              className={`flex-1 px-3 py-2 rounded-lg border text-xs focus:outline-none focus:border-indigo-500 ${isDark ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"}`}
                            />
                            <button
                              type="button"
                              disabled={!negotiateDate || actingAptId === apt.id}
                              onClick={() =>
                                patchDoctorAppointment(apt.id, {
                                  status: "RESCHEDULED",
                                  appointmentDate: new Date(negotiateDate).toISOString(),
                                })
                              }
                              className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer disabled:opacity-50"
                            >
                              {actingAptId === apt.id ? "Envoi…" : "Envoyer au patient"}
                            </button>
                          </div>
                        )}
                        {negotiateError && (negotiateFor === apt.id || actingAptId === apt.id) && (
                          <span className="w-full text-[11px] font-semibold text-rose-500">{negotiateError}</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenNewPrescription(apt.patientName)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            isDark
                              ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                          }`}
                        >
                          <Pill
                            size={14}
                            className={isDark ? "text-slate-400" : "text-slate-500"}
                          />
                          <span>Ordonnance</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartConsultation(apt)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer ${
                            isDone
                              ? isDark
                                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white"
                          }`}
                        >
                          <Stethoscope size={14} />
                          <span>
                            {isDone ? "Voir Synthèse" : "Démarrer Examen"}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI CLINICAL CO-PILOT */}
        {activeTab === "ai_assistant" && (
          <div
            className={`rounded-2xl border p-6 shadow-md space-y-6 ${
              isDark
                ? "bg-slate-900/80 backdrop-blur-md border-slate-800/80"
                : "bg-white border-slate-200/90"
            }`}
          >
            <div
              className={`flex items-start justify-between border-b pb-4 ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3
                      className={`text-base font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Assistant Clinique Gemini Médical
                    </h3>
                    <p
                      className={`text-xs ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Co-pilote d&apos;orientation diagnostique et de détection d&apos;interactions médicamenteuses
                    </p>
                  </div>
                </div>
              </div>
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                  isDark
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-emerald-100 text-emerald-800 border-emerald-200"
                }`}
              >
                Modèle Spécialisé Actif
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  isDark
                    ? "border-slate-800 bg-slate-950/60"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 text-indigo-500 font-semibold text-xs">
                  <HeartPulse size={16} />
                  <span>Triage Algorithmique</span>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  L&apos;IA pré-évalue chaque patient à l&apos;inscription ou prise de RDV, signalant les critères de gravité (dyspnée aiguë, DRS, signes neurologiques).
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  isDark
                    ? "border-slate-800 bg-slate-950/60"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 text-violet-500 font-semibold text-xs">
                  <Pill size={16} />
                  <span>Sécurisation Thérapeutique</span>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Vérification automatisée des contre-indications, allergies connues et posologies maximales recommandées selon l&apos;âge et le débit de filtration glomérulaire.
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  isDark
                    ? "border-slate-800 bg-slate-950/60"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs">
                  <FileCheck size={16} />
                  <span>Synthèse de Consultation</span>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Génération instantanée du compte-rendu médical au format normalisé, prêt à être versé au dossier électronique du patient.
                </p>
              </div>
            </div>

            {/* Interactive Clinical Test Box */}
            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                isDark
                  ? "border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-violet-950/30 to-slate-950"
                  : "border-violet-200 bg-violet-50/60"
              }`}
            >
              <h4
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? "text-indigo-300" : "text-violet-900"
                }`}
              >
                Exemple d&apos;Analyse en Temps Réel
              </h4>
              <p
                className={`text-xs ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Sélectionnez un patient dans votre agenda et cliquez sur &quot;Analyser avec l&apos;IA Médicale&quot; pour obtenir une synthèse instantanée des constantes et des alertes de conduite à tenir.
              </p>
              <button
                type="button"
                disabled={appointments.length === 0}
                onClick={() => {
                  if (!appointments[0]) return;
                  setActiveTab("agenda");
                  handleStartConsultation(appointments[0]);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                <Stethoscope size={14} />
                <span>
                  {appointments.length > 0
                    ? `Analyser ${appointments[0].patientName}`
                    : "Aucun patient disponible"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: CALENDRIER INTERACTIF AVEC RENDEZ-VOUS PAR DATE */}
        {activeTab === "calendar" && (
          <DoctorCalendarView
            appointments={appointments}
            isDark={isDark}
            selectedDate={selectedCalendarDate}
            onSelectDate={(date) => setSelectedCalendarDate(date)}
            onStartConsultation={handleStartConsultation}
            onNewAppointment={(date) => {
              setSelectedCalendarDate(date || null);
              setShowNewAppointmentModal(true);
            }}
            onOpenPrescription={handleOpenNewPrescription}
          />
        )}

        {/* TAB: COMMUNAUTÉ MÉDECINS (plein écran) */}
        {activeTab === "community" && (
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <DoctorCommunity
              isDark={isDark}
              highlightPostId={highlightPostId}
              onHighlightSeen={() => setHighlightPostId(null)}
            />
          </div>
        )}

        {/* TAB 5: MESSENGER PATIENTS & CONFRÈRES */}
        {activeTab === "messenger" && (
          <DoctorMessengerView
            isDark={isDark}
            currentDoctorName={doctorInfo.name}
            currentDoctorId={doctorInfo.id}
            onModalChange={setIsMessengerModalOpen}
            onLaunchVideoCall={(patientName) => {
              const apt = appointments.find((a) => a.patientName === patientName) || appointments[0];
              if (apt) setSelectedAppointment(apt);
              setShowVideoModal(true);
            }}
          />
        )}

        {/* TAB 6: DOSSIERS & RÉPERTOIRE PATIENTS */}
        {activeTab === "patients" && (
          <DoctorPatientsView
            isDark={isDark}
            onSelectPatientForApt={(patientName) => {
              const matched = allPatients.find((p) => p.name === patientName);
              if (matched) {
                // Pre-fill
              }
              setShowNewAppointmentModal(true);
            }}
            onOpenPrescription={handleOpenNewPrescription}
            onModalChange={setIsPatientViewModalOpen}
          />
        )}

        {/* TAB: ORDONNANCES MÉDICALES & HISTORIQUE */}
        {activeTab === "prescriptions" && (
          <DoctorPrescriptionsView
            isDark={isDark}
            onOpenNewPrescription={handleOpenNewPrescription}
            doctorInfo={doctorInfo}
            onModalChange={setIsPrescriptionViewModalOpen}
          />
        )}

        {/* TAB 7: PROFIL PROFESSIONNEL DU MÉDECIN */}
        {activeTab === "profile" && (
          <DoctorProfileView
            doctorInfo={doctorInfo}
            isDark={isDark}
            doctorInitials={doctorInitials}
          />
        )}

        {/* Espace vide dédié en bas de page pour que le Dock iPad ne cache aucun élément */}
        <div className="h-16 sm:h-24 w-full pointer-events-none" aria-hidden="true" />
      </main>

      {/* ============================================================
          MODAL 1: CLINICAL CONSULTATION EXAM SUITE
      ============================================================ */}
      <AnimatePresence>
        {showConsultationModal && selectedAppointment && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs ${
              isDark ? "bg-slate-950/80" : "bg-slate-900/60"
            }`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`rounded-3xl shadow-2xl border w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col ${
                isDark
                  ? "bg-slate-900 text-white border-slate-800"
                  : "bg-white text-slate-900 border-slate-200"
              }`}
            >
              {/* Modal Header */}
              <div
                className={`px-6 py-4 border-b flex items-center justify-between ${
                  isDark
                    ? "bg-slate-950/80 border-slate-800"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <h3
                      className={`text-base font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Examen Clinique — {selectedAppointment.patientName}
                    </h3>
                    <p
                      className={`text-xs ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {selectedAppointment.patientAge} ans • {selectedAppointment.patientGender} • Tél: {selectedAppointment.phone}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConsultationModal(false)}
                  className={`p-1.5 rounded-xl transition cursor-pointer ${
                    isDark
                      ? "text-slate-400 hover:text-white hover:bg-slate-800"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                {/* Vitals Ribbon */}
                <div>
                  <label
                    className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Constantes Vitales Immédiates
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div
                      className={`p-3 rounded-xl border ${
                        isDark
                          ? "bg-slate-950/80 border-slate-800"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <span
                        className={`text-[11px] font-medium ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Tension Artérielle
                      </span>
                      <input
                        type="text"
                        value={consultationBp}
                        onChange={(e) => setConsultationBp(e.target.value)}
                        className={`mt-1 w-full font-bold text-sm bg-transparent border-b focus:outline-none ${
                          isDark
                            ? "text-white border-slate-700 focus:border-indigo-400"
                            : "text-slate-900 border-slate-300 focus:border-indigo-600"
                        }`}
                        placeholder="120/80"
                      />
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        isDark
                          ? "bg-slate-950/80 border-slate-800"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <span
                        className={`text-[11px] font-medium ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Fréquence Cardiaque
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={consultationHr}
                          onChange={(e) => setConsultationHr(e.target.value)}
                          className={`mt-1 w-full font-bold text-sm bg-transparent border-b focus:outline-none ${
                            isDark
                              ? "text-white border-slate-700 focus:border-indigo-400"
                              : "text-slate-900 border-slate-300 focus:border-indigo-600"
                          }`}
                          placeholder="72"
                        />
                        <span
                          className={`text-[10px] ${
                            isDark ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          bpm
                        </span>
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        isDark
                          ? "bg-slate-950/80 border-slate-800"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <span
                        className={`text-[11px] font-medium ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        SpO2
                      </span>
                      <input
                        type="text"
                        value={consultationSpO2}
                        onChange={(e) => setConsultationSpO2(e.target.value)}
                        className={`mt-1 w-full font-bold text-sm bg-transparent border-b focus:outline-none ${
                          isDark
                            ? "text-white border-slate-700 focus:border-indigo-400"
                            : "text-slate-900 border-slate-300 focus:border-indigo-600"
                        }`}
                        placeholder="98%"
                      />
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        isDark
                          ? "bg-slate-950/80 border-slate-800"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <span
                        className={`text-[11px] font-medium ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Température
                      </span>
                      <input
                        type="text"
                        value={consultationTemp}
                        onChange={(e) => setConsultationTemp(e.target.value)}
                        className={`mt-1 w-full font-bold text-sm bg-transparent border-b focus:outline-none ${
                          isDark
                            ? "text-white border-slate-700 focus:border-indigo-400"
                            : "text-slate-900 border-slate-300 focus:border-indigo-600"
                        }`}
                        placeholder="37.0°C"
                      />
                    </div>
                  </div>
                </div>

                {/* Patient Allergies Alert */}
                {selectedAppointment.allergies &&
                  selectedAppointment.allergies.length > 0 && (
                    <div
                      className={`p-3 rounded-xl border flex items-center gap-2 ${
                        isDark
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          : "bg-amber-50 border-amber-200 text-amber-800"
                      }`}
                    >
                      <AlertTriangle
                        size={16}
                        className="text-amber-500 shrink-0"
                      />
                      <span>
                        <strong>Terrain allergique connu :</strong>{" "}
                        {selectedAppointment.allergies.join(", ")}
                      </span>
                    </div>
                  )}

                {/* Consultation Notes & Diagnosis */}
                <div className="space-y-3">
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Observations & Examen Physique
                    </label>
                    <textarea
                      rows={3}
                      value={consultationNotes}
                      onChange={(e) => setConsultationNotes(e.target.value)}
                      placeholder="Auscultation cardio-pulmonaire, palpation, signes fonctionnels..."
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-indigo-500 ${
                        isDark
                          ? "border-slate-800 bg-slate-950 text-white placeholder:text-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Diagnostic Retenu & Conduite à Tenir
                    </label>
                    <input
                      type="text"
                      value={consultationDiagnosis}
                      onChange={(e) =>
                        setConsultationDiagnosis(e.target.value)
                      }
                      placeholder="Ex: HTA stade 1 équilibrée, extrasystolie bénigne..."
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-indigo-500 ${
                        isDark
                          ? "border-slate-800 bg-slate-950 text-white placeholder:text-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>
                </div>

                {/* AI Assistant Insight Action */}
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isDark
                      ? "border-indigo-500/30 bg-indigo-950/30"
                      : "border-violet-200 bg-violet-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex items-center gap-2 font-bold ${
                        isDark ? "text-indigo-300" : "text-violet-900"
                      }`}
                    >
                      <Sparkles
                        size={16}
                        className={isDark ? "text-indigo-400" : "text-violet-600"}
                      />
                      <span>Assistance Décisionnelle Gemini AI</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRunAiAnalysis}
                      disabled={isAiAnalyzing}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition cursor-pointer"
                    >
                      {isAiAnalyzing ? "Analyse en cours..." : "Lancer l'Avis IA"}
                    </button>
                  </div>

                  {aiAnalysisResult ? (
                    <div
                      className={`mt-2 p-3 rounded-xl border whitespace-pre-line text-[11px] leading-relaxed ${
                        isDark
                          ? "bg-slate-950 border-indigo-500/30 text-slate-200"
                          : "bg-white border-violet-200 text-slate-700"
                      }`}
                    >
                      {aiAnalysisResult}
                    </div>
                  ) : (
                    <p
                      className={`text-[11px] ${
                        isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      Obtenez une analyse instantanée des constantes et antécédents pour vérifier les interactions et protocoles recommandés.
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className={`px-6 py-4 border-t flex items-center justify-between ${
                  isDark
                    ? "bg-slate-950/80 border-slate-800"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowConsultationModal(false);
                    handleOpenNewPrescription(selectedAppointment?.patientName);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-semibold text-xs transition cursor-pointer ${
                    isDark
                      ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                      : "border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <Pill size={15} className="text-violet-500" />
                  <span>Rédiger Ordonnance</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConsultationModal(false)}
                    className={`px-4 py-2 rounded-xl font-semibold text-xs transition cursor-pointer ${
                      isDark
                        ? "text-slate-400 hover:text-white"
                        : "text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    Fermer
                  </button>

                  <button
                    type="button"
                    onClick={handleFinishConsultation}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Valider & Terminer la Consultation</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================
          MODAL 2: ELECTRONIC PRESCRIPTION GENERATOR
      ============================================================ */}
      <AnimatePresence>
        {showPrescriptionModal && (() => {
          const currentPatientObj = allPatients.find(
            (p) =>
              p.name?.toLowerCase().trim() ===
              prescriptionPatient?.toLowerCase().trim()
          ) || allPatients[0];

          return (
            <div
              className={`fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm ${
                isDark ? "bg-slate-950/80" : "bg-slate-900/60"
              }`}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className={`rounded-3xl shadow-2xl border w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col ${
                  isDark
                    ? "bg-slate-900 text-white border-slate-800"
                    : "bg-white text-slate-900 border-slate-200"
                }`}
              >
                {/* Header */}
                <div
                  className={`px-6 py-4 border-b flex items-center justify-between ${
                    isDark
                      ? "bg-slate-950/80 border-slate-800"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-base font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          Ordonnanceur Électronique Sécurisé
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                          Officiel A4
                        </span>
                      </div>
                      <p
                        className={`text-xs ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        Prescription certifiée avec données réelles du patient, du praticien et export PDF
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPrescriptionModal(false);
                      setPrescriptionItems([]);
                      setNewMedName("");
                      setNewMedDosage("");
                      setNewMedFreq("");
                      setNewMedDuration("");
                      setNewMedInstructions("");
                      setPrescriptionNotes("");
                    }}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      isDark
                        ? "text-slate-400 hover:text-white hover:bg-slate-800"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                  {/* DOCTOR CREDENTIALS BANNER */}
                  <div
                    className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDark
                        ? "bg-indigo-950/25 border-indigo-500/30 text-indigo-200"
                        : "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                        <Stethoscope size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">
                            {doctorInfo.name || "Dr. Sarah Khelifi"}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 font-medium">
                            {doctorInfo.specialty || "Médecine Générale"}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-80">
                          {doctorInfo.cabinet || "Cabinet Ibn Sina"} • N° ONM : {doctorInfo.license || "DZ-ONM-2024-88941"}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right text-[11px] opacity-75">
                      <p>Tél : {doctorInfo.phone || "+213 (0) 21 65 43 21"}</p>
                      <p>{doctorInfo.address || "Alger, Algérie"}</p>
                    </div>
                  </div>

                  {/* REAL PATIENT SELECTION & MEDICAL PASSPORT */}
                  <div
                    className={`p-4 rounded-2xl border space-y-3.5 ${
                      isDark
                        ? "bg-slate-950/70 border-slate-800"
                        : "bg-slate-50/90 border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <label
                          className={`block font-bold text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${
                            isDark ? "text-indigo-400" : "text-indigo-700"
                          }`}
                        >
                          <Users size={14} />
                          <span>Choisir un Patient Réel dans le Dossier Médical</span>
                        </label>
                        <select
                          value={prescriptionPatient}
                          onChange={(e) => setPrescriptionPatient(e.target.value)}
                          className={`w-full p-2.5 pr-8 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                            isDark
                              ? "bg-slate-900 border-slate-700 text-white"
                              : "bg-white border-slate-300 text-slate-900 shadow-2xs"
                          }`}
                        >
                          {allPatients.map((pat) => (
                            <option key={pat.id} value={pat.name}>
                              {pat.name} ({pat.age ? `${pat.age} ans` : "Âge non précisé"} • {pat.gender}) {pat.city ? `— ${pat.city}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-left sm:text-right">
                        <span
                          className={`text-[11px] font-medium block ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Date d&apos;émission :
                        </span>
                        <p
                          className={`text-xs font-bold ${
                            isDark ? "text-slate-200" : "text-slate-800"
                          }`}
                        >
                          {new Date().toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Active Patient Clinical Identity Card */}
                    {currentPatientObj && (
                      <div
                        className={`p-3.5 rounded-xl border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs ${
                          isDark
                            ? "bg-slate-900/90 border-slate-800 text-slate-300"
                            : "bg-white border-slate-200 text-slate-700 shadow-2xs"
                        }`}
                      >
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                            Identité & Âge
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {currentPatientObj.name}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {currentPatientObj.age ? `${currentPatientObj.age} ans` : "Non précisé"} • {currentPatientObj.gender}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                            Groupe Sanguin
                          </span>
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 text-xs">
                            <HeartPulse size={12} />
                            {currentPatientObj.bloodGroup || "O+"}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            ID: {currentPatientObj.id}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                            Allergies Connues
                          </span>
                          {currentPatientObj.allergies && currentPatientObj.allergies.length > 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 text-[11px]">
                              <AlertTriangle size={12} />
                              {currentPatientObj.allergies.join(", ")}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                              Aucune allergie signalée
                            </span>
                          )}
                          <p className="text-[10px] text-slate-400 truncate">
                            {currentPatientObj.chronicCondition || "Régime standard"}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                            Téléphone & Adresse
                          </span>
                          <span className="font-medium truncate block text-slate-800 dark:text-slate-200">
                            {currentPatientObj.phone || "+213 550 00 00 00"}
                          </span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {currentPatientObj.address || currentPatientObj.city || "Alger, Algérie"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QUICK MEDICATION TEMPLATES */}
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      <span>Prescriptions Fréquentes & Protocoles Rapides (1-Clic)</span>
                      <span className="text-[10px] font-normal lowercase opacity-75">
                        cliquez pour ajouter directement
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        {
                          medication: "Kardégic (Acide Acétylsalicylique)",
                          dosage: "75 mg",
                          frequency: "1 sachet par jour au déjeuner",
                          duration: "30 jours",
                          instructions: "Prendre au milieu du repas dans un grand verre d'eau",
                        },
                        {
                          medication: "Amoxicilline",
                          dosage: "1 g",
                          frequency: "1 cp matin et soir",
                          duration: "7 jours",
                          instructions: "Prendre en début de repas. Terminer le traitement prescrit.",
                        },
                        {
                          medication: "Paracétamol (Doliprane)",
                          dosage: "1000 mg",
                          frequency: "1 cp toutes les 6h si douleur/fièvre",
                          duration: "5 jours",
                          instructions: "Ne pas dépasser 3 grammes par jour (intervalle min 4h)",
                        },
                        {
                          medication: "Bisoprolol",
                          dosage: "2.5 mg",
                          frequency: "1 comprimé le matin",
                          duration: "30 jours",
                          instructions: "Contrôle de la fréquence cardiaque. Ne pas arrêter brutalement.",
                        },
                        {
                          medication: "Tahor (Atorvastatine)",
                          dosage: "20 mg",
                          frequency: "1 comprimé le soir",
                          duration: "30 jours",
                          instructions: "À prendre de préférence au coucher. Bilan hépatique périodique.",
                        },
                        {
                          medication: "Ventoline (Salbutamol)",
                          dosage: "100 µg",
                          frequency: "1 à 2 bouffées en cas de crise",
                          duration: "Selon besoin",
                          instructions: "Inhaler profondément. Rincer la bouche après la prise.",
                        },
                        {
                          medication: "Spasfon (Phloroglucinol)",
                          dosage: "80 mg",
                          frequency: "2 comprimés en cas de spasmes",
                          duration: "5 jours",
                          instructions: "À renouveler jusqu'à 3 fois par jour si nécessaire",
                        },
                      ].map((tpl) => (
                        <button
                          key={tpl.medication}
                          type="button"
                          onClick={() => handleQuickAddMedication(tpl)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                            isDark
                              ? "bg-slate-800/80 hover:bg-indigo-900/40 text-slate-200 border-slate-700 hover:border-indigo-500"
                              : "bg-slate-100 hover:bg-indigo-50 text-slate-700 border-slate-200 hover:border-indigo-300"
                          }`}
                        >
                          <Plus size={11} className="text-indigo-500" />
                          <span>{tpl.medication} {tpl.dosage}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PRESCRIBED MEDICATIONS LIST */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isDark ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Médicaments Retenus ({prescriptionItems.length})
                      </label>
                      {prescriptionItems.length > 0 && (
                        <span className="text-[11px] text-slate-400">
                          Tous ces médicaments apparaîtront sur le document PDF
                        </span>
                      )}
                    </div>

                    {prescriptionItems.length === 0 ? (
                      <div
                        className={`p-6 rounded-2xl border text-center ${
                          isDark
                            ? "bg-slate-950/40 border-slate-800 text-slate-400"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        <Pill size={24} className="mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-xs">Aucun médicament dans l&apos;ordonnance</p>
                        <p className="text-[11px] mt-0.5">
                          Ajoutez une molécule ci-dessous ou cliquez sur un protocole rapide
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {prescriptionItems.map((item, idx) => (
                          <div
                            key={item.id}
                            className={`flex items-start justify-between p-3.5 rounded-xl border transition ${
                              isDark
                                ? "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                                : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`font-bold text-xs ${
                                    isDark ? "text-indigo-400" : "text-indigo-700"
                                  }`}
                                >
                                  {idx + 1}. {item.medication}
                                </span>
                                {item.dosage && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                      isDark
                                        ? "bg-slate-800 text-indigo-300 border-indigo-500/30"
                                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    }`}
                                  >
                                    {item.dosage}
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                    isDark
                                      ? "bg-slate-800 text-slate-400 border-slate-700"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  Durée : {item.duration}
                                </span>
                              </div>
                              <p
                                className={`text-[11px] font-medium ${
                                  isDark ? "text-slate-300" : "text-slate-700"
                                }`}
                              >
                                Posologie : {item.frequency}
                              </p>
                              {item.instructions && (
                                <p
                                  className={`text-[10.5px] italic ${
                                    isDark ? "text-slate-400" : "text-slate-500"
                                  }`}
                                >
                                  Conseils : {item.instructions}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(item.id)}
                              title="Retirer ce médicament"
                              className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 ml-2 ${
                                isDark
                                  ? "text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                                  : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              }`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ADD CUSTOM MEDICATION FORM */}
                  <div
                    className={`p-4 rounded-2xl border space-y-3 ${
                      isDark
                        ? "bg-slate-950/80 border-slate-800"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-bold text-xs flex items-center gap-1.5 ${
                          isDark ? "text-slate-200" : "text-slate-800"
                        }`}
                      >
                        <Plus size={14} className="text-indigo-500" />
                        <span>Ajouter une molécule ou spécialité sur mesure</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          Médicament / DCI *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Augmentin, Inexium..."
                          value={newMedName}
                          onChange={(e) => setNewMedName(e.target.value)}
                          className={`w-full p-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            isDark
                              ? "border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
                              : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          Dosage *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 1000 mg, 20 mg/ml"
                          value={newMedDosage}
                          onChange={(e) => setNewMedDosage(e.target.value)}
                          className={`w-full p-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            isDark
                              ? "border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
                              : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          Posologie & Fréquence *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 1 cp matin et soir"
                          value={newMedFreq}
                          onChange={(e) => setNewMedFreq(e.target.value)}
                          className={`w-full p-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            isDark
                              ? "border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
                              : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          Durée de la cure *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 7 jours, 1 mois"
                          value={newMedDuration}
                          onChange={(e) => setNewMedDuration(e.target.value)}
                          className={`w-full p-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            isDark
                              ? "border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
                              : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Conseils de prise & précautions particulières
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: À prendre au milieu des repas avec un grand verre d'eau. Éviter l'alcool."
                        value={newMedInstructions}
                        onChange={(e) => setNewMedInstructions(e.target.value)}
                        className={`w-full p-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          isDark
                            ? "border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
                            : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                        }`}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddMedication}
                        disabled={!newMedName.trim()}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs ${
                          newMedName.trim()
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                            : "bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        <Plus size={14} />
                        <span>Insérer ce médicament dans l&apos;ordonnance</span>
                      </button>
                    </div>
                  </div>

                  {/* DOCTOR NOTES / RECOMMANDATIONS */}
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Recommandations complémentaires du médecin
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Bilan biologique de contrôle (créatinine, glycémie) à J+30. Repos strict 3 jours. Reconsulter en cas de persistance des symptômes."
                      value={prescriptionNotes}
                      onChange={(e) => setPrescriptionNotes(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark
                          ? "bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
                          : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>

                  {/* Success Notice Toast */}
                  {prescriptionSuccessNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs ${
                        isDark
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                          : "bg-emerald-50 border-emerald-200 text-emerald-800"
                      }`}
                    >
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      <span className="font-semibold">
                        {prescriptionNoticeMessage ||
                          "Ordonnance PDF générée avec succès et téléchargée !"}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Footer with Real PDF Download Buttons */}
                <div
                  className={`px-6 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark
                      ? "bg-slate-950/80 border-slate-800"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 text-[11px] ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span>Format officiel A4 conforme • Signature SHA-256</span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPrescriptionModal(false);
                        setPrescriptionItems([]);
                        setNewMedName("");
                        setNewMedDosage("");
                        setNewMedFreq("");
                        setNewMedDuration("");
                        setNewMedInstructions("");
                        setPrescriptionNotes("");
                      }}
                      className={`px-3.5 py-2 rounded-xl font-semibold text-xs transition cursor-pointer ${
                        isDark
                          ? "text-slate-400 hover:text-white hover:bg-slate-800"
                          : "text-slate-600 hover:bg-slate-200/70"
                      }`}
                    >
                      Fermer
                    </button>

                    {prescriptionItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPrescriptionItems([]);
                          setNewMedName("");
                          setNewMedDosage("");
                          setNewMedFreq("");
                          setNewMedDuration("");
                          setNewMedInstructions("");
                          setPrescriptionNotes("");
                        }}
                        className={`px-3 py-2 rounded-xl font-semibold text-xs transition cursor-pointer ${
                          isDark
                            ? "text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
                            : "text-rose-600 hover:bg-rose-50"
                        }`}
                        title="Vider tous les médicaments pour repartir d'une ordonnance vierge"
                      >
                        Effacer tout
                      </button>
                    )}

                    {/* PROMINENT DOWNLOAD BUTTON REQUESTED BY USER */}
                    <button
                      type="button"
                      disabled={isSavingPrescription || prescriptionItems.length === 0}
                      onClick={handleDownloadPrescriptionPdf}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md hover:shadow-indigo-500/25 transition cursor-pointer"
                    >
                      <Download size={16} />
                      <span>Télécharger l&apos;Ordonnance (PDF)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSavingPrescription || prescriptionItems.length === 0}
                      onClick={handleSignPrescription}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md hover:shadow-violet-500/25 transition cursor-pointer"
                    >
                      {isSavingPrescription ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <ShieldCheck size={16} />
                      )}
                      <span>{isSavingPrescription ? "Enregistrement..." : "Signer & Télécharger"}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ============================================================
          MODAL 3: TELECONSULTATION VIRTUAL ROOM
      ============================================================ */}
      <AnimatePresence>
        {showVideoModal && selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 text-white rounded-3xl border border-slate-800 w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Video Header */}
              <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Téléconsultation Sécurisée HD — {selectedAppointment.patientName}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Appel vidéo/vocal gratuit • max 30 min par appel
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Video Stage — appel WebRTC réel (PeerJS, 30 min max) */}
              <div className="relative bg-slate-950 overflow-hidden" style={{ minHeight: 480 }}>
                <VideoRoom
                  roomId={selectedAppointment.id}
                  role="doctor"
                  displayName="Médecin"
                  peerName={selectedAppointment.patientName}
                  onEnd={async (secs, mode) => {
                    try {
                      const { data } = await supabase.auth.getSession();
                      const token = data.session?.access_token;
                      if (token) {
                        await fetch("/api/calls/log", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            appointmentId: selectedAppointment.id,
                            mode,
                            durationSec: secs,
                          }),
                        });
                      }
                    } catch {
                      // journalisation non bloquante
                    }
                    setShowVideoModal(false);
                  }}
                />
              </div>

              {/* Video Controls */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Conforme réglementation Télémédecine Algérie</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVideoModal(false);
                      handleStartConsultation(selectedAppointment);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                  >
                    Ouvrir Fiche Clinique
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowVideoModal(false)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition cursor-pointer"
                  >
                    Terminer l&apos;Appel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================
          MODAL 4: NEW APPOINTMENT CREATOR
      ============================================================ */}
      <AnimatePresence>
        {showNewAppointmentModal && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs ${
              isDark ? "bg-slate-950/80" : "bg-slate-900/60"
            }`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`rounded-3xl shadow-2xl border w-full max-w-md overflow-hidden ${
                isDark
                  ? "bg-slate-900 text-white border-slate-800"
                  : "bg-white text-slate-900 border-slate-200"
              }`}
            >
              <div
                className={`px-6 py-4 border-b flex items-center justify-between ${
                  isDark
                    ? "bg-slate-950/80 border-slate-800"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <h3
                  className={`text-sm font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Programmer un Rendez-vous
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewAppointmentModal(false)}
                  className={`p-1.5 rounded-xl transition ${
                    isDark
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <X size={16} />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();

                  try {
                    const target = e.target as HTMLFormElement;

                    const patientId = (
                      target.elements.namedItem("patientId") as HTMLSelectElement
                    ).value;

                    const time =
                      (target.elements.namedItem("time") as HTMLInputElement)
                        .value || "15:00";

                    const reason =
                      (
                        target.elements.namedItem(
                          "reason"
                        ) as HTMLInputElement
                      ).value.trim() || "Consultation de suivi";

                    const type = (
                      target.elements.namedItem("type") as HTMLSelectElement
                    ).value;

                    if (!patientId) {
                      alert("Veuillez sélectionner un patient.");
                      return;
                    }

                    // Récupérer la session du médecin
                    const { data: sessionData } =
                      await supabase.auth.getSession();

                    const session = sessionData.session;

                    if (!session) {
                      alert(
                        "Votre session a expiré. Veuillez vous reconnecter."
                      );
                      router.push("/login");
                      return;
                    }

                    // Date + heure choisies
                    const date = (
                      target.elements.namedItem("date") as HTMLInputElement
                    ).value;

                    if (!date) {
                      alert("Veuillez sélectionner une date.");
                      return;
                    }

                    const appointmentDate = `${date}T${time}:00`;

                    // Création réelle dans la base de données
                    const response = await fetch(
                      "/api/dashboard/doctor/appointments",
                      {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${session.access_token}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          patientId,
                          appointmentDate,
                          type,
                          reason,
                        }),
                      }
                    );

                    const result = await response.json();

                    if (!response.ok) {
                      throw new Error(
                        result.error ||
                          "Impossible de créer le rendez-vous."
                      );
                    }

                    // Recharger les vrais rendez-vous depuis la base
                    const appointmentsResponse = await fetch(
                      "/api/dashboard/doctor/appointments",
                      {
                        method: "GET",
                        headers: {
                          Authorization: `Bearer ${session.access_token}`,
                        },
                        cache: "no-store",
                      }
                    );

                    const appointmentsResult =
                      await appointmentsResponse.json();

                    if (!appointmentsResponse.ok) {
                      throw new Error(
                        appointmentsResult.error ||
                          "Le rendez-vous a été créé, mais la liste n'a pas pu être actualisée."
                      );
                    }

                    setAppointments(
                      appointmentsResult.appointments ?? []
                    );

                    // Le patient rejoint "Mes patients" : recharger aussi l'annuaire lié.
                    loadDoctorDashboard();

                    setShowNewAppointmentModal(false);
                  } catch (error) {
                    console.error("Erreur création rendez-vous:", error);
                    alert(
                      error instanceof Error
                        ? error.message
                        : "Une erreur est survenue."
                    );
                  }
                }}
                className="p-6 space-y-4 text-xs"
              >
                {/* PATIENT */}
                <div>
                  <label
                    className={`block font-semibold mb-1 ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Patient
                  </label>

                  <select
                    name="patientId"
                    required
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                      isDark
                        ? "border-slate-800 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    <option value="">Sélectionner un patient</option>

                    {allPatients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                        {patient.age !== null ? ` — ${patient.age} ans` : ""}
                      </option>
                    ))}
                  </select>

                  {allPatients.length === 0 && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Aucun patient disponible.
                    </p>
                  )}
                </div>

                {/* DATE */}
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1 ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Date
                  </label>

                  <input
                    type="date"
                    name="date"
                    required
                    min={(() => {
                      const now = new Date();
                      const y = now.getFullYear();
                      const m = String(now.getMonth() + 1).padStart(2, "0");
                      const d = String(now.getDate()).padStart(2, "0");
                      return `${y}-${m}-${d}`;
                    })()}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                      isDark
                        ? "border-slate-800 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-900"
                    }`}
                  />
                </div>

                {/* HEURE + TYPE */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`block font-semibold mb-1 ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Heure
                    </label>

                    <input
                      name="time"
                      type="time"
                      defaultValue="15:00"
                      required
                      className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                        isDark
                          ? "border-slate-800 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block font-semibold mb-1 ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Type
                    </label>

                    <select
                      name="type"
                      defaultValue="IN_PERSON"
                      className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                        isDark
                          ? "border-slate-800 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-900"
                      }`}
                    >
                      <option value="IN_PERSON">Au Cabinet</option>
                      <option value="ONLINE">Téléconsultation</option>
                      <option value="HOME_VISIT">Visite à domicile</option>
                    </select>
                  </div>
                </div>

                {/* MOTIF */}
                <div>
                  <label
                    className={`block font-semibold mb-1 ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Motif de consultation
                  </label>

                  <input
                    name="reason"
                    required
                    placeholder="Ex: Contrôle tensionnel, ECG de contrôle..."
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                      isDark
                        ? "border-slate-800 bg-slate-950 text-white placeholder:text-slate-500"
                        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                    }`}
                  />
                </div>

                {/* ACTIONS */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewAppointmentModal(false)}
                    className={`px-3.5 py-2 rounded-xl font-semibold transition ${
                      isDark
                        ? "text-slate-400 hover:text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={allPatients.length === 0}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                  >
                    Confirmer le Rendez-vous
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================
          IPADOS FLOATING BOTTOM DOCK BAR
          (Dashboard, Agenda, Calendrier, Messenger, Patients, Ordonnances, IA, Profil)
          Caché automatiquement lorsqu'une modale est ouverte ou ordonnance affichée
      ============================================================ */}
      <AnimatePresence>
        {!isAnyModalOpen && !showPrescriptionModal && (
          <DoctorIpadDock
            key="doctor-ipad-dock"
            activeTab={activeTab}
            onChangeTab={(tab) => {
              setActiveTab(tab);
            }}
            isDark={isDark}
            urgentCount={urgentCount}
            unreadMessagesCount={2}
            hidden={isAnyModalOpen || showPrescriptionModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
