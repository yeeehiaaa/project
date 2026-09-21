"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Syringe,
  Search,
  Plus,
  Trash2,
  Check,
  Loader2,
  BellRing,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePatientTheme } from "@/components/patient/PatientThemeContext";
import { PButton } from "@/components/patient/buttons";

interface Vaccination {
  id: string;
  vaccineName: string;
  dose: string | null;
  vaccinationDate: string;
  nextDueDate: string | null;
  provider: string | null;
  batchNumber: string | null;
  notes: string | null;
}

type DueState = "OVERDUE" | "SOON" | "OK" | "NONE";

function dueStateOf(nextDue: string | null): DueState {
  if (!nextDue) return "NONE";
  const diffDays =
    (new Date(nextDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "OVERDUE";
  if (diffDays <= 30) return "SOON";
  return "OK";
}

function duePill(s: DueState, isDark: boolean): string {
  switch (s) {
    case "OVERDUE":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    case "SOON":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "OK":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    default:
      return isDark
        ? "bg-slate-800 text-slate-400 border-slate-700"
        : "bg-slate-100 text-slate-500 border-slate-200";
  }
}

function dueLabel(s: DueState): string {
  switch (s) {
    case "OVERDUE":
      return "Rappel en retard";
    case "SOON":
      return "Rappel proche";
    case "OK":
      return "À jour";
    default:
      return "Sans rappel";
  }
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function VaccinationsPage() {
  const { isDark } = usePatientTheme();
  const [items, setItems] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  // Formulaire d'ajout
  const [showForm, setShowForm] = useState(false);
  const [fName, setFName] = useState("");
  const [fDate, setFDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fDose, setFDose] = useState("");
  const [fNext, setFNext] = useState("");
  const [fProvider, setFProvider] = useState("");
  const [fBatch, setFBatch] = useState("");
  const [fNotes, setFNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/patient/vaccinations", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Chargement impossible.");
      }
      setItems(Array.isArray(data.vaccinations) ? data.vaccinations : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (v) =>
        v.vaccineName.toLowerCase().includes(q) ||
        (v.provider || "").toLowerCase().includes(q) ||
        (v.batchNumber || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const overdueCount = useMemo(
    () => items.filter((v) => dueStateOf(v.nextDueDate) === "OVERDUE").length,
    [items]
  );
  const soonCount = useMemo(
    () => items.filter((v) => dueStateOf(v.nextDueDate) === "SOON").length,
    [items]
  );

  const resetForm = () => {
    setFName("");
    setFDate(new Date().toISOString().slice(0, 10));
    setFDose("");
    setFNext("");
    setFProvider("");
    setFBatch("");
    setFNotes("");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Session expirée, reconnectez-vous.");
      const res = await fetch("/api/patient/vaccinations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vaccineName: fName.trim(),
          vaccinationDate: fDate,
          dose: fDose.trim() || undefined,
          nextDueDate: fNext || undefined,
          provider: fProvider.trim() || undefined,
          batchNumber: fBatch.trim() || undefined,
          notes: fNotes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Ajout impossible.");
      }
      setShowForm(false);
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ajout impossible.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Retirer ce vaccin du carnet ?")) return;
    try {
      const token = await getToken();
      if (!token) return;
      await fetch(`/api/patient/vaccinations?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const inputCls = `w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-blue-500 ${
    isDark
      ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
  }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`p-6 rounded-3xl border shadow-md transition-colors ${
          isDark ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${isDark ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
              <Syringe size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Carnet de vaccinations</h2>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {items.length} vaccin{items.length > 1 ? "s" : ""} enregistré{items.length > 1 ? "s" : ""}
                {overdueCount > 0 && (
                  <span className="ml-2 font-bold text-rose-500">
                    • {overdueCount} rappel{overdueCount > 1 ? "s" : ""} en retard
                  </span>
                )}
                {soonCount > 0 && (
                  <span className="ml-2 font-bold text-amber-500">
                    • {soonCount} rappel{soonCount > 1 ? "s" : ""} proche{soonCount > 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>
          </div>
          <PButton variant="primary" isDark={isDark} onClick={() => setShowForm(true)}>
            <Plus size={15} />
            <span>Ajouter un vaccin</span>
          </PButton>
        </div>

        {/* Recherche */}
        <div className="mt-4 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher : vaccin, centre, n° de lot..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-blue-500 ${
              isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
            }`}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="animate-spin text-emerald-500" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
          <Syringe size={32} className="mx-auto text-slate-400 opacity-50" />
          <h3 className="mt-3 text-base font-bold">
            {items.length === 0 ? "Carnet vide" : "Aucun résultat"}
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
            {items.length === 0
              ? "Ajoutez vos vaccins (nom, date, dose, rappel...) pour suivre votre calendrier vaccinal."
              : `Aucun vaccin ne correspond à « ${query.trim()} ».`}
          </p>
          {items.length === 0 && (
            <PButton variant="primary" isDark={isDark} className="mt-4" onClick={() => setShowForm(true)}>
              <Plus size={14} />
              <span>Ajouter mon premier vaccin</span>
            </PButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((v) => {
            const due = dueStateOf(v.nextDueDate);
            return (
              <div
                key={v.id}
                className={`p-5 rounded-3xl border shadow-xs flex flex-col gap-2 ${
                  isDark ? "bg-slate-900/85 border-slate-800" : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                      {v.vaccineName}
                      {v.dose ? <span className="ml-1.5 text-[11px] font-medium text-slate-400">• {v.dose}</span> : null}
                    </h3>
                    <p className={`mt-0.5 text-[11px] flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <CalendarDays size={11} className="shrink-0" />
                      Injecté le {fmtDate(v.vaccinationDate)}
                      {v.provider ? ` • ${v.provider}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(v.id)}
                    title="Retirer"
                    className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer active:scale-95"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${duePill(due, isDark)}`}>
                    {dueLabel(due)}
                  </span>
                  {v.nextDueDate && due !== "NONE" && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <BellRing size={11} />
                      Rappel : {fmtDate(v.nextDueDate)}
                    </span>
                  )}
                </div>

                {(v.batchNumber || v.notes) && (
                  <div className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {v.batchNumber && <p>Lot : <span className="font-mono">{v.batchNumber}</span></p>}
                    {v.notes && <p className="mt-0.5 italic">{v.notes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modale ajout */}
      {showForm && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className={`p-5 border-b ${isDark ? "border-slate-800 bg-slate-950/50" : "border-slate-100 bg-slate-50"}`}>
              <h3 className="font-bold text-base">Ajouter un vaccin</h3>
              <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Nom, date d'injection, dose et rappel
              </p>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nom du vaccin *
                </label>
                <input
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="Ex : BCG, DTC, Grippe, Hépatite B..."
                  required
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Date d'injection *
                  </label>
                  <input
                    type="date"
                    value={fDate}
                    onChange={(e) => setFDate(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Dose
                  </label>
                  <input
                    value={fDose}
                    onChange={(e) => setFDose(e.target.value)}
                    placeholder="Ex : 1ère dose, Rappel..."
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Prochain rappel (optionnel)
                </label>
                <input
                  type="date"
                  value={fNext}
                  onChange={(e) => setFNext(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Centre / Fournisseur
                  </label>
                  <input
                    value={fProvider}
                    onChange={(e) => setFProvider(e.target.value)}
                    placeholder="Ex : EPSP Alger..."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    N° de lot
                  </label>
                  <input
                    value={fBatch}
                    onChange={(e) => setFBatch(e.target.value)}
                    placeholder="Ex : L2026-..."
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Note (optionnel)
                </label>
                <textarea
                  rows={2}
                  value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)}
                  placeholder="Ex : réaction locale, à jeun..."
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95 ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-600"}`}
                >
                  Annuler
                </button>
                <PButton variant="primary" isDark={isDark} type="submit" disabled={saving || !fName.trim()}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{saving ? "..." : "Enregistrer"}</span>
                </PButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
