"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Phone,
  Calendar,
  FileText,
  AlertTriangle,
  HeartPulse,
  Mail,
  ShieldCheck,
  RefreshCw,
  MapPin,
  Eye,
  X,
  Database,
  Pill,
  UserCheck,
  Activity,
  Clock,
  Download,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { generatePrescriptionPDF } from "@/lib/prescriptionPdf";

export interface PatientPrescriptionItem {
  id?: string;
  medicationName: string;
  dosage: string;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
}

export interface PatientPrescription {
  id: string;
  prescriptionNumber: string;
  prescribedDate: string;
  doctorName?: string;
  doctorSpecialty?: string;
  status: string;
  notes?: string | null;
  items: PatientPrescriptionItem[];
}

export interface PatientRecord {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: string;
  chronicCondition?: string | null;
  allergies?: string[];
  lastVisit: string;
  totalVisits: number;
  currentMedications?: string | null;
  medicalHistory?: string | null;
  surgicalHistory?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  city?: string | null;
  wilaya?: string | null;
  address?: string | null;
  createdAt?: string;
  prescriptions?: PatientPrescription[];
}

interface DoctorPatientsViewProps {
  isDark: boolean;
  onSelectPatientForApt: (patientName: string) => void;
  onOpenPrescription: (patientName: string) => void;
  onModalChange?: (isOpen: boolean) => void;
}

export default function DoctorPatientsView({
  isDark,
  onSelectPatientForApt,
  onOpenPrescription,
  onModalChange,
}: DoctorPatientsViewProps) {
  const [patientList, setPatientList] = useState<PatientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "CHRONIC" | "VISITED">("ALL");
  const [selectedPatientModal, setSelectedPatientModal] = useState<PatientRecord | null>(null);
  const [selectedPrescriptionDetail, setSelectedPrescriptionDetail] = useState<PatientPrescription | null>(null);

  // Notify parent dashboard to hide dock when viewing patient modal or prescription detail
  useEffect(() => {
    onModalChange?.(Boolean(selectedPatientModal || selectedPrescriptionDetail));
  }, [selectedPatientModal, selectedPrescriptionDetail, onModalChange]);

  const fetchPatients = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // Per-doctor isolation: send session token so the API returns
      // ONLY patients linked to the logged-in doctor.
      const { supabase } = await import("@/lib/supabase");
      const { data: sessionData } = await supabase.auth.getSession().catch(() => ({
        data: { session: null },
      }));
      const token = (sessionData as any)?.session?.access_token;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/dashboard/doctor/patients", {
        cache: "no-store",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.patients)) {
          setPatientList(data.patients);
        }
      }
    } catch (err) {
      console.error("Error fetching real patients from DB:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = patientList.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.city && p.city.toLowerCase().includes(q)) ||
      (p.chronicCondition && p.chronicCondition.toLowerCase().includes(q)) ||
      (p.allergies && p.allergies.some((a) => a.toLowerCase().includes(q)));

    if (!matchesSearch) return false;
    if (filterType === "CHRONIC") return Boolean(p.chronicCondition);
    if (filterType === "VISITED") return p.totalVisits > 0;
    return true;
  });

  const chronicCount = patientList.filter((p) => Boolean(p.chronicCondition)).length;
  const visitedCount = patientList.filter((p) => p.totalVisits > 0).length;

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div
        className={`p-6 rounded-3xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
          isDark
            ? "bg-slate-900/80 backdrop-blur-md border-slate-800 text-white"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold">
                Annuaire & Dossiers Patients
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Database size={12} className="text-emerald-500 shrink-0" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Base de données PostgreSQL
              </span>
            </div>
            <p
              className={`text-xs ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Patientèle réelle issue de la base de données ({patientList.length} patients enregistrés)
            </p>
          </div>
        </div>

        {/* Filter, Search & Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${
              isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}
          >
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterType === "ALL"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tous ({patientList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("CHRONIC")}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterType === "CHRONIC"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ALD ({chronicCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("VISITED")}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterType === "VISITED"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Consultés ({visitedCount})
            </button>
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Rechercher nom, téléphone, ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none transition w-56 ${
                isDark
                  ? "bg-slate-950 border-slate-700 text-white focus:border-indigo-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600"
              }`}
            />
          </div>

          <button
            type="button"
            onClick={() => fetchPatients(true)}
            disabled={isRefreshing}
            title="Actualiser les patients depuis la base de données"
            className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            }`}
          >
            <RefreshCw
              size={14}
              className={`${isRefreshing ? "animate-spin text-indigo-500" : ""}`}
            />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className={`p-5 rounded-3xl border animate-pulse space-y-4 ${
                isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-slate-700/40" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-700/40 rounded-sm w-3/4" />
                  <div className="h-3 bg-slate-700/30 rounded-sm w-1/2" />
                </div>
              </div>
              <div className="h-12 bg-slate-700/20 rounded-xl" />
              <div className="h-8 bg-slate-700/20 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        /* Empty State */
        <div
          className={`p-12 text-center rounded-3xl border ${
            isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="h-14 w-14 rounded-full bg-slate-800/20 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Users size={28} />
          </div>
          <h3 className="text-base font-bold mb-1">Aucun patient trouvé</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            {searchQuery
              ? `Aucun patient ne correspond aux critères de recherche "${searchQuery}".`
              : "Aucun patient n'est actuellement inscrit dans la base de données."}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer hover:bg-indigo-500 transition"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        /* Patients Grid (Real Database Patients) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((pat) => (
            <div
              key={pat.id}
              onClick={() => setSelectedPatientModal(pat)}
              className={`p-5 rounded-3xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between space-y-4 cursor-pointer group ${
                isDark
                  ? "bg-slate-900/85 border-slate-800/90 hover:border-indigo-500/50"
                  : "bg-white border-slate-200 hover:border-indigo-300"
              }`}
            >
              {/* Top Row: Initials, Name, Gender, BloodGroup, Visits Badge */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-extrabold flex items-center justify-center text-sm uppercase">
                      {pat.name
                        .split(" ")
                        .filter(Boolean)
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("") || "PT"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3
                          className={`text-sm font-bold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {pat.name}
                        </h3>
                      </div>
                      <p
                        className={`text-[11px] ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {pat.age} ans • {pat.gender} • Groupe {pat.bloodGroup}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                      pat.totalVisits > 0
                        ? isDark
                          ? "bg-indigo-950/40 text-indigo-300 border-indigo-800/50"
                          : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : isDark
                        ? "bg-slate-800 text-slate-400 border-slate-700"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {pat.totalVisits} {pat.totalVisits > 1 ? "visites" : "visite"}
                  </span>
                </div>

                {/* Chronic conditions or medical tags from DB */}
                <div className="mt-3 space-y-1.5">
                  {pat.chronicCondition ? (
                    <div
                      className={`p-2 rounded-xl text-xs flex items-center gap-1.5 border ${
                        isDark
                          ? "bg-indigo-950/40 border-indigo-500/30 text-indigo-300"
                          : "bg-indigo-50 border-indigo-100 text-indigo-800"
                      }`}
                    >
                      <HeartPulse size={13} className="shrink-0 text-indigo-500" />
                      <span className="truncate font-medium">{pat.chronicCondition}</span>
                    </div>
                  ) : (
                    <div
                      className={`p-2 rounded-xl text-xs flex items-center gap-1.5 border ${
                        isDark
                          ? "bg-slate-950/50 border-slate-800 text-slate-400"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                      <span className="truncate">Aucune ALD déclarée</span>
                    </div>
                  )}

                  {/* Allergies tag from DB */}
                  {pat.allergies && pat.allergies.length > 0 && (
                    <div
                      className={`p-1.5 rounded-xl text-[11px] flex items-center gap-1.5 border ${
                        isDark
                          ? "bg-amber-950/30 border-amber-500/30 text-amber-300"
                          : "bg-amber-50 border-amber-200 text-amber-800"
                      }`}
                    >
                      <AlertTriangle size={12} className="shrink-0 text-amber-500" />
                      <span className="truncate">Allergie(s) : {pat.allergies.join(", ")}</span>
                    </div>
                  )}

                  {/* Current Medications if any */}
                  {pat.currentMedications && (
                    <div
                      className={`p-1.5 rounded-xl text-[11px] flex items-center gap-1.5 border ${
                        isDark
                          ? "bg-cyan-950/30 border-cyan-500/30 text-cyan-300"
                          : "bg-cyan-50 border-cyan-200 text-cyan-800"
                      }`}
                    >
                      <Pill size={12} className="shrink-0 text-cyan-500" />
                      <span className="truncate">Traitement : {pat.currentMedications}</span>
                    </div>
                  )}
                </div>

                {/* Contacts & Location from DB */}
                <div
                  className={`mt-3 pt-2.5 border-t space-y-1 text-xs ${
                    isDark ? "border-slate-800/80 text-slate-400" : "border-slate-100 text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className="opacity-70 shrink-0" />
                    <span>{pat.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail size={12} className="opacity-70 shrink-0" />
                    <span className="truncate">{pat.email}</span>
                  </div>
                  {pat.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="opacity-70 shrink-0 text-indigo-400" />
                      <span className="truncate">
                        {pat.city} {pat.wilaya && pat.wilaya !== pat.city ? `(${pat.wilaya})` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPatientModal(pat)}
                  title="Consulter le dossier médical complet"
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isDark
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                >
                  <Eye size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => onSelectPatientForApt(pat.name)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Calendar size={13} />
                  <span>Programmer RDV</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenPrescription(pat.name)}
                  title="Rédiger une ordonnance"
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isDark
                      ? "bg-slate-800 hover:bg-slate-700 text-violet-300 border-slate-700"
                      : "bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200"
                  }`}
                >
                  <FileText size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FICHE PATIENT & DOSSIER MÉDICAL COMPLET (DB DATA) */}
      {/* ======================================================== */}
      {selectedPatientModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPatientModal(null);
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div
            className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
              isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-5 border-b flex items-center justify-between ${
                isDark ? "border-slate-800 bg-slate-950/50" : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-base uppercase">
                  {selectedPatientModal.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("") || "PT"}
                </div>
                <div>
                  <h3 className="font-bold text-base">{selectedPatientModal.name}</h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Identifiant DB : {selectedPatientModal.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatientModal(null)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-200 text-slate-600"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Vital Identity Row */}
              <div className="grid grid-cols-3 gap-3">
                <div
                  className={`p-3 rounded-2xl border text-center ${
                    isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="text-[10px] text-slate-400 block font-medium">Âge</span>
                  <span className="text-sm font-bold">{selectedPatientModal.age} ans</span>
                </div>
                <div
                  className={`p-3 rounded-2xl border text-center ${
                    isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="text-[10px] text-slate-400 block font-medium">Genre</span>
                  <span className="text-sm font-bold">{selectedPatientModal.gender}</span>
                </div>
                <div
                  className={`p-3 rounded-2xl border text-center ${
                    isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="text-[10px] text-slate-400 block font-medium">Groupe Sanguin</span>
                  <span className="text-sm font-bold text-red-500">{selectedPatientModal.bloodGroup}</span>
                </div>
              </div>

              {/* Coordonnées */}
              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Coordonnées & Localisation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone size={14} className="text-indigo-400 shrink-0" />
                    <span>{selectedPatientModal.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail size={14} className="text-indigo-400 shrink-0" />
                    <span className="truncate">{selectedPatientModal.email}</span>
                  </div>
                  {selectedPatientModal.city && (
                    <div className="flex items-center gap-2 text-slate-300 sm:col-span-2">
                      <MapPin size={14} className="text-indigo-400 shrink-0" />
                      <span>
                        {selectedPatientModal.address ? `${selectedPatientModal.address}, ` : ""}
                        {selectedPatientModal.city}
                        {selectedPatientModal.wilaya ? ` (${selectedPatientModal.wilaya})` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dossier Clinique / Antécédents */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity size={14} className="text-indigo-400" />
                  Données Médicales & Pathologies
                </h4>

                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Affection Longue Durée (ALD) :</span>
                    <span className="font-semibold text-slate-200">
                      {selectedPatientModal.chronicCondition || "Aucune affection chronique déclarée"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Allergies connues :</span>
                    {selectedPatientModal.allergies && selectedPatientModal.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPatientModal.allergies.map((all, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold"
                          >
                            {all}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-200">Aucune allergie signalée</span>
                    )}
                  </div>

                  {selectedPatientModal.currentMedications && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Traitements en cours :</span>
                      <span className="font-semibold text-slate-200">
                        {selectedPatientModal.currentMedications}
                      </span>
                    </div>
                  )}

                  {selectedPatientModal.medicalHistory && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Antécédents médicaux :</span>
                      <span className="font-semibold text-slate-200">
                        {selectedPatientModal.medicalHistory}
                      </span>
                    </div>
                  )}

                  {selectedPatientModal.surgicalHistory && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Antécédents chirurgicaux :</span>
                      <span className="font-semibold text-slate-200">
                        {selectedPatientModal.surgicalHistory}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Historique des Ordonnances Rédigées (Date, Heure, Contenu cliquable) */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText size={14} className="text-violet-400" />
                    Historique des Ordonnances Médicales
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30">
                    {selectedPatientModal.prescriptions?.length || 0} ordonnance
                    {(selectedPatientModal.prescriptions?.length || 0) > 1 ? "s" : ""}
                  </span>
                </div>

                {selectedPatientModal.prescriptions && selectedPatientModal.prescriptions.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPatientModal.prescriptions.map((presc) => {
                      const pDate = new Date(presc.prescribedDate);
                      const dateFormatted = !isNaN(pDate.getTime())
                        ? pDate.toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Date non précisée";
                      const timeFormatted = !isNaN(pDate.getTime())
                        ? pDate.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "";

                      return (
                        <div
                          key={presc.id}
                          onClick={() => setSelectedPrescriptionDetail(presc)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                            isDark
                              ? "bg-slate-900/90 border-slate-800 hover:border-violet-500/60 hover:bg-slate-800/80"
                              : "bg-white border-slate-200 hover:border-violet-400 hover:bg-violet-50/40"
                          }`}
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-violet-500 dark:text-violet-400 text-xs">
                                {presc.prescriptionNumber}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                {presc.status || "ACTIVE"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar size={11} className="text-slate-400" />
                                {dateFormatted}
                              </span>
                              {timeFormatted && (
                                <span className="flex items-center gap-1">
                                  <Clock size={11} className="text-slate-400" />
                                  {timeFormatted}
                                </span>
                              )}
                              <span>•</span>
                              <span className="text-slate-300 font-medium truncate">
                                {presc.items?.length || 0} médicament{(presc.items?.length || 0) > 1 ? "s" : ""}
                              </span>
                            </div>
                            {presc.items && presc.items.length > 0 && (
                              <p className="text-[11px] text-slate-400 truncate max-w-sm">
                                {presc.items.map((it) => it.medicationName).join(", ")}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-violet-500 group-hover:translate-x-0.5 transition-transform shrink-0">
                            <span className="text-[11px] font-semibold hidden sm:inline">Voir</span>
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className={`p-4 rounded-xl border text-center space-y-2 ${
                      isDark ? "bg-slate-950/40 border-slate-800/80" : "bg-white border-slate-200"
                    }`}
                  >
                    <p className="text-slate-400 text-xs">
                      Aucune ordonnance rédigée pour ce patient pour le moment.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const patName = selectedPatientModal.name;
                        setSelectedPatientModal(null);
                        onOpenPrescription(patName);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs cursor-pointer transition shadow-xs"
                    >
                      <FileText size={12} />
                      <span>Rédiger la première ordonnance</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Contact d'urgence si disponible */}
              {(selectedPatientModal.emergencyContactName || selectedPatientModal.emergencyContactPhone) && (
                <div
                  className={`p-4 rounded-2xl border space-y-2 ${
                    isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <UserCheck size={14} className="text-emerald-400" />
                    Contact d'Urgence
                  </h4>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>
                      {selectedPatientModal.emergencyContactName || "Nom non spécifié"}
                      {selectedPatientModal.emergencyContactRelation
                        ? ` (${selectedPatientModal.emergencyContactRelation})`
                        : ""}
                    </span>
                    <span className="font-mono font-semibold text-indigo-400">
                      {selectedPatientModal.emergencyContactPhone || ""}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div
              className={`p-4 border-t flex items-center justify-end gap-2.5 ${
                isDark ? "border-slate-800 bg-slate-950/50" : "border-slate-100 bg-slate-50"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  const patName = selectedPatientModal.name;
                  setSelectedPatientModal(null);
                  onSelectPatientForApt(patName);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer transition shadow-xs"
              >
                <Calendar size={14} />
                <span>Programmer Rendez-vous</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const patName = selectedPatientModal.name;
                  setSelectedPatientModal(null);
                  onOpenPrescription(patName);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold cursor-pointer transition shadow-xs"
              >
                <FileText size={14} />
                <span>Rédiger Ordonnance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: AFFICHAGE DU CONTENU DE L'ORDONNANCE CLIQUÉE     */}
      {/* ======================================================== */}
      {selectedPrescriptionDetail && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPrescriptionDetail(null);
          }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm"
        >
          <div
            className={`rounded-3xl shadow-2xl border w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col ${
              isDark ? "bg-slate-900 text-white border-slate-800" : "bg-white text-slate-900 border-slate-200"
            }`}
          >
            {/* Header */}
            <div
              className={`px-5 py-4 border-b flex items-center justify-between ${
                isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-violet-600 text-white shadow-md">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">Contenu de l&apos;Ordonnance</h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-500 border border-violet-500/30">
                      {selectedPrescriptionDetail.prescriptionNumber}
                    </span>
                  </div>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Rédigée le{" "}
                    {new Date(selectedPrescriptionDetail.prescribedDate).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    à{" "}
                    {new Date(selectedPrescriptionDetail.prescribedDate).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPrescriptionDetail(null)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-200 text-slate-500"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Patient Banner */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient</span>
                  <span className="font-bold text-sm text-indigo-400">
                    {selectedPatientModal?.name || "Patient"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Praticien</span>
                  <span className="font-semibold text-slate-200">
                    {selectedPrescriptionDetail.doctorName || "Dr. Sarah Khelifi"}
                  </span>
                </div>
              </div>

              {/* Medications List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Pill size={14} className="text-violet-400" />
                    Médicaments prescrits ({selectedPrescriptionDetail.items.length})
                  </h4>
                  <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Vérifié & Signé
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedPrescriptionDetail.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border space-y-1.5 ${
                        isDark ? "bg-slate-950/70 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-md bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[11px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-200 text-sm">
                            {item.medicationName}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-400 border border-violet-500/30">
                          {item.dosage}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-dashed border-slate-800/60 text-slate-300">
                        <div>
                          <span className="text-slate-400">Posologie : </span>
                          <span className="font-semibold">{item.frequency || "Selon protocole standard"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Durée : </span>
                          <span className="font-semibold">{item.duration || "30 jours"}</span>
                        </div>
                      </div>

                      {item.instructions && (
                        <p className="text-[11px] italic text-slate-400 pt-0.5">
                          Instructions : {item.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedPrescriptionDetail.notes && (
                <div
                  className={`p-3 rounded-2xl border space-y-1 ${
                    isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Instructions & Recommandations Cliniques
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedPrescriptionDetail.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className={`p-4 border-t flex items-center justify-between gap-2 ${
                isDark ? "border-slate-800 bg-slate-950/60" : "border-slate-100 bg-slate-50"
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedPrescriptionDetail(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-200 text-slate-600"
                }`}
              >
                Retour au dossier
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!selectedPatientModal) return;
                  try {
                    generatePrescriptionPDF({
                      doctor: {
                        name: selectedPrescriptionDetail.doctorName || "Dr. Sarah Khelifi",
                        specialty: "Médecine Générale & Spécialités Médicales",
                        license: "DZ-ONM-2024-88941",
                        cabinet: "Cabinet Médical Ibn Sina — Alger",
                        phone: "+213 (0) 21 65 43 21",
                        email: "contact@clinique-ibnsina.dz",
                        address: "12 Rue Didouche Mourad, Alger Centre",
                        city: "Alger",
                      },
                      patient: {
                        id: selectedPatientModal.id,
                        name: selectedPatientModal.name,
                        age: selectedPatientModal.age,
                        gender: selectedPatientModal.gender,
                        phone: selectedPatientModal.phone,
                        email: selectedPatientModal.email,
                        bloodGroup: selectedPatientModal.bloodGroup,
                        allergies: selectedPatientModal.allergies || [],
                        city: selectedPatientModal.city || "Alger",
                        wilaya: selectedPatientModal.wilaya || "Alger",
                      },
                      items: selectedPrescriptionDetail.items.map((it) => ({
                        medication: it.medicationName,
                        dosage: it.dosage,
                        frequency: it.frequency || "Selon prescription",
                        duration: it.duration || "30 jours",
                        instructions: it.instructions || "",
                      })),
                      date: new Date(selectedPrescriptionDetail.prescribedDate).toLocaleDateString("fr-FR"),
                      prescriptionNumber: selectedPrescriptionDetail.prescriptionNumber,
                      notes: selectedPrescriptionDetail.notes || "",
                    });
                  } catch (e) {
                    console.error("Error generating PDF:", e);
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Download size={13} />
                <span>Télécharger PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
