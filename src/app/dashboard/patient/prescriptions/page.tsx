"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pill,
  Search,
  X,
  RefreshCw,
  Loader2,
  Calendar,
  Clock,
  FileText,
  Download,
  ShieldCheck,
  Stethoscope,
  Store,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePatientTheme } from "@/components/patient/PatientThemeContext";
import { PButton, PIconButton } from "@/components/patient/buttons";
import { generatePrescriptionPDF } from "@/lib/prescriptionPdf";

interface PrescriptionItem {
  id: string;
  medicationName: string;
  dosage: string | null;
  frequency: string | null;
  route: string | null;
  durationDays: number | null;
  quantity: number | null;
  instructions: string | null;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  prescribedDate: string;
  status: string;
  notes: string | null;
  doctor: {
    id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  };
  items: PrescriptionItem[];
}

function statusClasses(status: string, isDark: boolean): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "COMPLETED":
      return isDark
        ? "bg-slate-800 text-slate-300 border-slate-700"
        : "bg-slate-100 text-slate-600 border-slate-200";
    case "EXPIRED":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "CANCELLED":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    default:
      return isDark
        ? "bg-slate-800 text-slate-300 border-slate-700"
        : "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function calcAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

export default function PrescriptionsPage() {
  const { isDark } = usePatientTheme();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Prescription | null>(null);

  const fetchPrescriptions = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession().catch(() => ({
        data: { session: null },
      }));
      const token = (sessionData as any)?.session?.access_token;
      if (!token) return;
      const res = await fetch("/api/dashboard/patient/profile", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.prescriptions)) {
          setPrescriptions(data.prescriptions);
        }
        if (data.patient) setPatientInfo(data.patient);
        if (data.profile) setProfileInfo(data.profile);
      }
    } catch (err) {
      console.error("Error loading prescriptions:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return prescriptions;
    return prescriptions.filter((p) => {
      if (p.prescriptionNumber.toLowerCase().includes(q)) return true;
      const docName = `dr ${p.doctor?.profile?.firstName || ""} ${p.doctor?.profile?.lastName || ""}`.toLowerCase();
      if (docName.includes(q)) return true;
      return p.items.some((it) =>
        (it.medicationName || "").toLowerCase().includes(q)
      );
    });
  }, [prescriptions, searchQuery]);

  const doctorNameOf = (p: Prescription) =>
    `Dr. ${p.doctor?.profile?.firstName || ""} ${p.doctor?.profile?.lastName || ""}`.trim();

  const handleDownloadPdf = (p: Prescription) => {
    try {
      const allergiesRaw: string = patientInfo?.allergies || "";
      generatePrescriptionPDF({
        doctor: {
          name: doctorNameOf(p) || "Médecin",
          specialty: "Médecine",
          license: "—",
          cabinet: "DOCTORZ Co.",
          city: profileInfo?.city || profileInfo?.wilaya || "Alger",
        },
        patient: {
          id: patientInfo?.id,
          name:
            `${profileInfo?.firstName || ""} ${profileInfo?.lastName || ""}`.trim() ||
            "Patient",
          age: calcAge(profileInfo?.birthDate),
          gender: profileInfo?.gender || null,
          phone: profileInfo?.phone || null,
          email: profileInfo?.email || null,
          bloodGroup: patientInfo?.bloodType || null,
          allergies: allergiesRaw
            .split(",")
            .map((a: string) => a.trim())
            .filter(Boolean),
          city: profileInfo?.city || null,
          wilaya: profileInfo?.wilaya || null,
        },
        items: p.items.map((it) => ({
          id: it.id,
          medication: it.medicationName,
          dosage: it.dosage || "—",
          frequency: it.frequency || "Selon prescription",
          duration: it.durationDays ? `${it.durationDays} jours` : "—",
          instructions: it.instructions || "",
        })),
        date: new Date(p.prescribedDate).toLocaleDateString("fr-FR"),
        prescriptionNumber: p.prescriptionNumber,
        notes: p.notes || "",
      });
    } catch (err) {
      console.error("PDF error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`p-6 rounded-3xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
          isDark ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${isDark ? "bg-blue-500/15 border-blue-500/30 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-600"}`}>
            <Pill size={24} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">My Prescriptions</h2>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {prescriptions.length} prescription{prescriptions.length > 1 ? "s" : ""} from your doctors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search medication, doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 pr-8 py-2 rounded-xl text-xs border focus:outline-none transition w-56 ${
                isDark
                  ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <PIconButton title="Refresh" isDark={isDark} disabled={isRefreshing} onClick={() => fetchPrescriptions(true)}>
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-500" : ""} />
          </PIconButton>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="animate-spin text-blue-500" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
          <Pill size={32} className="mx-auto text-slate-400 opacity-50" />
          <h3 className="mt-3 text-base font-bold">No prescriptions found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `No prescription matches "${searchQuery}".`
              : "When your doctor writes a prescription for you, it will appear here automatically."}
          </p>
          {searchQuery && (
            <PButton variant="primary" isDark={isDark} className="mt-4" onClick={() => setSearchQuery("")}>
              Clear search
            </PButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const d = new Date(p.prescribedDate);
            return (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                className={`p-5 rounded-3xl border shadow-xs transition hover:shadow-md cursor-pointer flex flex-col justify-between gap-4 ${
                  isDark ? "bg-slate-900/85 border-slate-800 hover:border-blue-500/50" : "bg-white border-slate-200 hover:border-blue-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-blue-500 dark:text-blue-400">
                      {p.prescriptionNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${statusClasses(p.status, isDark)}`}>
                      <ShieldCheck size={11} />
                      {p.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-2xl bg-blue-600/15 border border-blue-500/20 text-blue-600 dark:text-blue-300 font-extrabold flex items-center justify-center text-xs uppercase shrink-0">
                      <Stethoscope size={16} />
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                        {doctorNameOf(p)}
                      </h4>
                      <p className={`text-[11px] flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        <Calendar size={11} />
                        <span>
                          {!isNaN(d.getTime())
                            ? d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </span>
                        <span>•</span>
                        <Clock size={11} />
                        <span>
                          {!isNaN(d.getTime())
                            ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                            : ""}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Medications ({p.items.length})
                    </span>
                    {p.items.slice(0, 3).map((it) => (
                      <div
                        key={it.id}
                        className={`p-1.5 px-2.5 rounded-xl text-xs flex items-center justify-between border ${
                          isDark ? "bg-slate-950/60 border-slate-800/80 text-slate-200" : "bg-slate-50 border-slate-100 text-slate-700"
                        }`}
                      >
                        <span className="font-semibold truncate">{it.medicationName}</span>
                        <span className="text-[11px] text-slate-400 shrink-0 ml-2 font-mono">
                          {it.dosage || ""}
                        </span>
                      </div>
                    ))}
                    {p.items.length > 3 && (
                      <p className="text-[10px] text-slate-400 italic pl-1">
                        + {p.items.length - 3} more...
                      </p>
                    )}
                  </div>
                </div>

                <div className={`pt-3 border-t flex items-center justify-between text-xs ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                  <span className="text-[11px] text-blue-500 font-semibold flex items-center gap-1">
                    <FileText size={13} />
                    View details
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPdf(p);
                    }}
                    title="Download PDF"
                    className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold active:scale-95 ${
                      isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
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

      {/* Detail modal */}
      {selected && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
        >
          <div
            className={`rounded-3xl shadow-2xl border w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col ${
              isDark ? "bg-slate-900 text-white border-slate-800" : "bg-white text-slate-900 border-slate-200"
            }`}
          >
            <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-600 text-white">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">Prescription</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
                      {selected.prescriptionNumber}
                    </span>
                  </div>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {doctorNameOf(selected)} •{" "}
                    {new Date(selected.prescribedDate).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className={`p-2 rounded-xl transition cursor-pointer active:scale-95 ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-200 text-slate-500"}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Medications ({selected.items.length})
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClasses(selected.status, isDark)}`}>
                  {selected.status}
                </span>
              </div>

              <div className="space-y-2">
                {selected.items.map((it, idx) => (
                  <div
                    key={it.id}
                    className={`p-3.5 rounded-2xl border space-y-2 ${isDark ? "bg-slate-950/70 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-blue-500/15 text-blue-500 font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </div>
                        <span className="font-bold text-sm">{it.medicationName}</span>
                      </div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-500 border border-blue-500/30">
                        {it.dosage || "—"}
                      </span>
                    </div>
                    <a
                      href={`/dashboard/patient?tab=pharmacies&q=${encodeURIComponent(it.medicationName)}`}
                      onClick={() => setSelected(null)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 hover:underline"
                    >
                      <Store size={12} />
                      Trouver en pharmacie
                    </a>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-dashed border-slate-800/60">
                      <div>
                        <span className="text-slate-400">Frequency: </span>
                        <span className="font-semibold">{it.frequency || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Duration: </span>
                        <span className="font-semibold">
                          {it.durationDays ? `${it.durationDays} days` : "—"}
                        </span>
                      </div>
                    </div>
                    {it.instructions && (
                      <p className="text-[11px] italic text-slate-400 pt-1">{it.instructions}</p>
                    )}
                  </div>
                ))}
              </div>

              {selected.notes && (
                <div className={`p-3.5 rounded-2xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                    Doctor notes
                  </span>
                  <p className="text-xs leading-relaxed">{selected.notes}</p>
                </div>
              )}
            </div>

            <div className={`p-4 border-t flex items-center justify-between gap-3 ${isDark ? "border-slate-800 bg-slate-950/60" : "border-slate-100 bg-slate-50"}`}>
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                Signed electronic prescription
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95 ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-600"}`}
                >
                  Close
                </button>
                <PButton variant="primary" isDark={isDark} onClick={() => handleDownloadPdf(selected)}>
                  <Download size={14} />
                  <span>Download PDF</span>
                </PButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
