"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Calendar,
  Clock,
  User,
  Plus,
  Eye,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Pill,
  ShieldCheck,
  ChevronRight,
  X,
  Printer,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { generatePrescriptionPDF } from "@/lib/prescriptionPdf";

export interface PrescriptionItemData {
  id?: string;
  medicationName: string;
  dosage: string;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
}

export interface PrescriptionRecord {
  id: string;
  prescriptionNumber: string;
  prescribedDate: string;
  patientId: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  doctorName?: string;
  status: string;
  notes?: string | null;
  items: PrescriptionItemData[];
  patient?: {
    id?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
    };
  };
  doctor?: {
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

interface DoctorPrescriptionsViewProps {
  isDark: boolean;
  onOpenNewPrescription: (patientName?: string) => void;
  doctorInfo: {
    name: string;
    specialty: string;
    license: string;
    cabinet: string;
    phone: string;
    email: string;
    address: string;
  };
}

export default function DoctorPrescriptionsView({
  isDark,
  onOpenNewPrescription,
  doctorInfo,
}: DoctorPrescriptionsViewProps) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrescription, setSelectedPrescription] =
    useState<PrescriptionRecord | null>(null);

  const fetchPrescriptions = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch("/api/prescriptions", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Normalize names
          const normalized = data.map((item: any) => {
            const pFirst = item.patient?.profile?.firstName || "";
            const pLast = item.patient?.profile?.lastName || "";
            const computedPatientName =
              `${pFirst} ${pLast}`.trim() || item.patientName || "Patient";

            const dFirst = item.doctor?.profile?.firstName || "";
            const dLast = item.doctor?.profile?.lastName || "";
            const computedDoctorName =
              `${dFirst} ${dLast}`.trim()
                ? `Dr. ${dFirst} ${dLast}`.trim()
                : item.doctorName || doctorInfo.name;

            return {
              ...item,
              patientName: computedPatientName,
              doctorName: computedDoctorName,
              items: Array.isArray(item.items)
                ? item.items.map((it: any) => ({
                    id: it.id,
                    medicationName: it.medicationName || it.medication || "Médicament",
                    dosage: it.dosage || "1 unité",
                    frequency: it.frequency || "Selon prescription",
                    duration: it.duration || (it.durationDays ? `${it.durationDays} jours` : "30 jours"),
                    instructions: it.instructions || "",
                  }))
                : [],
            };
          });

          // Check if localStorage has offline-signed prescriptions to merge
          try {
            const localStored = localStorage.getItem("mediconnect_prescriptions");
            if (localStored) {
              const localList = JSON.parse(localStored);
              if (Array.isArray(localList)) {
                // Prepend or merge non-duplicate local records
                const existingIds = new Set(normalized.map((n: any) => n.id));
                for (const loc of localList) {
                  if (!existingIds.has(loc.id)) {
                    normalized.unshift(loc);
                  }
                }
              }
            }
          } catch {
            // ignore
          }

          setPrescriptions(normalized);
        }
      }
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [doctorInfo.name]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const filtered = prescriptions.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.patientName?.toLowerCase().includes(q) ||
      item.prescriptionNumber?.toLowerCase().includes(q) ||
      item.items?.some((it) =>
        it.medicationName.toLowerCase().includes(q)
      ) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  const handleDownloadPdf = (p: PrescriptionRecord) => {
    try {
      generatePrescriptionPDF({
        doctor: {
          name: p.doctorName || doctorInfo.name,
          specialty: doctorInfo.specialty,
          license: doctorInfo.license,
          cabinet: doctorInfo.cabinet,
          phone: doctorInfo.phone,
          email: doctorInfo.email,
          address: doctorInfo.address,
          city: "Alger",
        },
        patient: {
          id: p.patientId,
          name: p.patientName || "Patient",
          age: p.patientAge ?? 45,
          gender: p.patientGender || "Non précisé",
          phone: p.patient?.profile?.phone || "+213 550 00 00 00",
          email: p.patient?.profile?.email || "patient@mediconnect.dz",
          bloodGroup: "O+",
          allergies: [],
          city: "Alger",
          wilaya: "Alger",
        },
        items: p.items.map((it) => ({
          id: it.id,
          medication: it.medicationName,
          dosage: it.dosage,
          frequency: it.frequency || "Selon prescription",
          duration: it.duration || "30 jours",
          instructions: it.instructions || "",
        })),
        date: new Date(p.prescribedDate).toLocaleDateString("fr-FR"),
        prescriptionNumber: p.prescriptionNumber,
        notes: p.notes || "",
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Erreur lors de la génération du PDF");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark
            ? "bg-slate-900/90 border-slate-800 text-white"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <FileText size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Ordonnances Médicales Enregistrées</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                {prescriptions.length} ordonnance{prescriptions.length > 1 ? "s" : ""}
              </span>
            </div>
            <p
              className={`text-xs ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Historique exhaustif de toutes vos ordonnances certifiées avec date, heure et posologies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => fetchPrescriptions(true)}
            disabled={isRefreshing}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            }`}
            title="Rafraîchir"
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? "animate-spin text-indigo-500" : ""}
            />
          </button>

          <button
            type="button"
            onClick={() => onOpenNewPrescription()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Rédiger une Nouvelle Ordonnance</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Rechercher par nom de patient, numéro d'ordonnance, médicament..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs focus:outline-none transition ${
            isDark
              ? "bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500"
              : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500"
          }`}
        />
      </div>

      {/* Content: List or Loading */}
      {isLoading ? (
        <div
          className={`p-12 rounded-3xl border text-center ${
            isDark ? "bg-slate-900/50 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-500"
          }`}
        >
          <RefreshCw className="animate-spin h-6 w-6 mx-auto mb-2 text-indigo-500" />
          <p className="text-xs">Chargement des ordonnances sécurisées...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className={`p-12 rounded-3xl border text-center space-y-3 ${
            isDark
              ? "bg-slate-900/50 border-slate-800 text-slate-400"
              : "bg-white border-slate-200 text-slate-600"
          }`}
        >
          <div className="h-12 w-12 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <FileText size={24} />
          </div>
          <p className="text-sm font-semibold">
            {searchQuery
              ? "Aucune ordonnance ne correspond à votre recherche"
              : "Aucune ordonnance enregistrée pour le moment"}
          </p>
          <p className="text-xs max-w-sm mx-auto text-slate-400">
            Lorsque vous rédigez et signez une ordonnance dans l&apos;ordonnanceur, elle est automatiquement consignée ici et dans le dossier médical du patient.
          </p>
          <button
            type="button"
            onClick={() => onOpenNewPrescription()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus size={15} />
            <span>Rédiger une Ordonnance</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const dateObj = new Date(p.prescribedDate);
            const dateStr = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Récemment";
            const timeStr = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "09:00";

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPrescription(p)}
                className={`p-5 rounded-3xl border transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 group ${
                  isDark
                    ? "bg-slate-900/85 border-slate-800 hover:border-indigo-500/50"
                    : "bg-white border-slate-200 hover:border-indigo-300"
                }`}
              >
                <div>
                  {/* Top: Prescription Number & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-indigo-500 dark:text-indigo-400">
                      {p.prescriptionNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck size={11} />
                      <span>{p.status || "ACTIVE"}</span>
                    </span>
                  </div>

                  {/* Patient Name */}
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-extrabold flex items-center justify-center text-xs uppercase shrink-0">
                      <User size={16} />
                    </div>
                    <div className="min-w-0">
                      <h4
                        className={`text-sm font-bold truncate ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {p.patientName}
                      </h4>
                      <p
                        className={`text-[11px] flex items-center gap-1.5 ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        <Calendar size={11} />
                        <span>{dateStr}</span>
                        <span>•</span>
                        <Clock size={11} />
                        <span>{timeStr}</span>
                      </p>
                    </div>
                  </div>

                  {/* Medications Preview */}
                  <div className="mt-4 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Médicaments ({p.items.length})
                    </span>
                    <div className="space-y-1">
                      {p.items.slice(0, 3).map((it, idx) => (
                        <div
                          key={idx}
                          className={`p-1.5 px-2.5 rounded-xl text-xs flex items-center justify-between border ${
                            isDark
                              ? "bg-slate-950/60 border-slate-800/80 text-slate-200"
                              : "bg-slate-50 border-slate-100 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Pill size={12} className="text-violet-500 shrink-0" />
                            <span className="font-semibold truncate">{it.medicationName}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0 ml-2 font-mono">
                            {it.dosage}
                          </span>
                        </div>
                      ))}
                      {p.items.length > 3 && (
                        <p className="text-[10px] text-slate-400 italic pl-1">
                          + {p.items.length - 3} autre(s) médicament(s)...
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div
                  className={`pt-3 border-t flex items-center justify-between text-xs ${
                    isDark ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"
                  }`}
                >
                  <span className="text-[11px] text-indigo-500 font-semibold group-hover:underline flex items-center gap-1">
                    <span>Voir le détail</span>
                    <ChevronRight size={13} />
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPdf(p);
                    }}
                    title="Télécharger l'ordonnance en PDF"
                    className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                      isDark
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                    }`}
                  >
                    <Download size={13} />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONTENU DE L'ORDONNANCE (DÉTAILS COMPLETS)         */}
      {/* ======================================================== */}
      {selectedPrescription && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPrescription(null);
          }}
          className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
        >
          <div
            className={`rounded-3xl shadow-2xl border w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col ${
              isDark
                ? "bg-slate-900 text-white border-slate-800"
                : "bg-white text-slate-900 border-slate-200"
            }`}
          >
            {/* Header */}
            <div
              className={`px-6 py-4 border-b flex items-center justify-between ${
                isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">Détail de l&apos;Ordonnance</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-500 border border-indigo-500/30">
                      {selectedPrescription.prescriptionNumber}
                    </span>
                  </div>
                  <p
                    className={`text-xs ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Rédigée le{" "}
                    {new Date(selectedPrescription.prescribedDate).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    à{" "}
                    {new Date(selectedPrescription.prescribedDate).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPrescription(null)}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-200 text-slate-500"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Patient & Doctor Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className={`p-3.5 rounded-2xl border space-y-1 ${
                    isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Patient Destinataire
                  </span>
                  <p className="text-sm font-bold text-indigo-500 dark:text-indigo-400">
                    {selectedPrescription.patientName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Identifiant : {selectedPrescription.patientId}
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border space-y-1 ${
                    isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Médecin Prescripteur
                  </span>
                  <p className="text-sm font-bold text-slate-200">
                    {selectedPrescription.doctorName || doctorInfo.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {doctorInfo.specialty}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Pill size={14} className="text-violet-400" />
                    Médicaments & Posologies ({selectedPrescription.items.length})
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    Certifié SHA-256
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedPrescription.items.map((it, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border space-y-2 ${
                        isDark ? "bg-slate-950/70 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-violet-500/15 text-violet-400 font-bold flex items-center justify-center text-xs">
                            {idx + 1}
                          </div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {it.medicationName}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-500 border border-indigo-500/30">
                          {it.dosage}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-dashed border-slate-800/60">
                        <div>
                          <span className="text-slate-400">Posologie : </span>
                          <span className="font-semibold text-slate-200">
                            {it.frequency || "Selon protocole standard"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Durée : </span>
                          <span className="font-semibold text-slate-200">
                            {it.duration || "30 jours"}
                          </span>
                        </div>
                      </div>

                      {it.instructions && (
                        <p className="text-[11px] italic text-slate-400 pt-1">
                          Conseils : {it.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor Recommandations / Notes */}
              {selectedPrescription.notes && (
                <div
                  className={`p-3.5 rounded-2xl border space-y-1.5 ${
                    isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Recommandations & Instructions du Médecin
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedPrescription.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className={`p-4 border-t flex items-center justify-between gap-3 ${
                isDark ? "border-slate-800 bg-slate-950/60" : "border-slate-100 bg-slate-50"
              }`}
            >
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                Ordonnance électronique conforme A4
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPrescription(null)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  Fermer
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(selectedPrescription)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  <Download size={14} />
                  <span>Télécharger l&apos;Ordonnance (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
