"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlaskConical,
  Search,
  Plus,
  X,
  Calendar,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Loader2,
  Tag,
  Building,
  Upload,
  Check,
} from "lucide-react";
import { usePatientTheme } from "@/components/patient/PatientThemeContext";
import { PButton, PIconButton } from "@/components/patient/buttons";
import { LAB_TEST_CATALOG, LabTestCatalogEntry } from "@/lib/lab-tests";

interface LabParameter {
  id: string;
  name: string;
  value: string;
  unit: string | null;
}

interface LabResult {
  id: string;
  testName: string;
  laboratoryName: string | null;
  testDate: string;
  status: string;
  reportUrl: string | null;
  notes: string | null;
  parameters: LabParameter[];
}

function todayInputValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import("@/lib/supabase");
  const { data } = await supabase.auth.getSession().catch(() => ({
    data: { session: null },
  }));
  const token = (data as any)?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function LaboratoryPage() {
  const { isDark } = usePatientTheme();

  const [results, setResults] = useState<LabResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ---- Add modal state ----
  const [showModal, setShowModal] = useState(false);
  const [formDate, setFormDate] = useState(todayInputValue());
  const [formLab, setFormLab] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [selectedTests, setSelectedTests] = useState<LabTestCatalogEntry[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchResults = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/dashboard/patient/laboratory", {
        cache: "no-store",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          setResults(data.results);
        }
      }
    } catch (err) {
      console.error("Error loading lab reports:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // ---- Search: matches title, lab name, or any test tag ----
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return results;
    return results.filter((r) => {
      if (r.testName.toLowerCase().includes(q)) return true;
      if (r.laboratoryName && r.laboratoryName.toLowerCase().includes(q)) return true;
      if (r.parameters.some((p) => p.name.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [results, searchQuery]);

  const toggleTest = (test: LabTestCatalogEntry) => {
    setSelectedTests((prev) =>
      prev.some((t) => t.name === test.name)
        ? prev.filter((t) => t.name !== test.name)
        : [...prev, test]
    );
  };

  const catalogFiltered = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return LAB_TEST_CATALOG;
    return LAB_TEST_CATALOG.map((cat) => ({
      ...cat,
      tests: cat.tests.filter((t) => t.name.toLowerCase().includes(q)),
    })).filter((cat) => cat.tests.length > 0);
  }, [catalogSearch]);

  const resetForm = () => {
    setFormDate(todayInputValue());
    setFormLab("");
    setFormTitle("");
    setFormNotes("");
    setSelectedTests([]);
    setCatalogSearch("");
    setFile(null);
    setFormError(null);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setFormError(null);
    if (selectedTests.length === 0 && !file) {
      setFormError("Select at least one analysis or attach the report file.");
      return;
    }
    setIsSaving(true);
    try {
      const headers = await getAuthHeaders();

      // 1. Upload file first (if any)
      let reportUrl: string | null = null;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/dashboard/patient/laboratory/upload", {
          method: "POST",
          headers,
          body: fd,
        });
        const upData = await up.json().catch(() => ({}));
        if (!up.ok || !upData.success) {
          throw new Error(upData.error || "File upload failed.");
        }
        reportUrl = upData.url;
      }

      // 2. Create the lab report with test tags
      const res = await fetch("/api/dashboard/patient/laboratory", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          testName: formTitle.trim() || undefined,
          laboratoryName: formLab.trim() || undefined,
          testDate: formDate,
          notes: formNotes.trim() || undefined,
          reportUrl,
          tests: selectedTests.map((t) => ({
            name: t.name,
            unit: t.unit,
            referenceMin: t.referenceMin,
            referenceMax: t.referenceMax,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to save the lab report.");
      }

      setShowModal(false);
      resetForm();
      fetchResults(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lab report?")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/dashboard/patient/laboratory?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setResults((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const isPdf = (url: string | null) => !!url && url.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`p-6 rounded-3xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
          isDark ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${isDark ? "bg-amber-500/15 border-amber-500/30 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-600"}`}>
            <FlaskConical size={24} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">My Lab Reports</h2>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {results.length} report{results.length > 1 ? "s" : ""} uploaded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search by test tag */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search glycémie, TSH..."
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer active:scale-[0.97]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <PIconButton
            title="Refresh"
            isDark={isDark}
            disabled={isRefreshing}
            onClick={() => fetchResults(true)}
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-500" : ""} />
          </PIconButton>

          <PButton
            variant="primary"
            isDark={isDark}
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={15} />
            <span>Add lab report</span>
          </PButton>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="animate-spin text-blue-500" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
          <FlaskConical size={32} className="mx-auto text-slate-400 opacity-50" />
          <h3 className="mt-3 text-base font-bold">No lab reports found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `No report matches "${searchQuery}". Try another test name like glycémie or TSH.`
              : "Upload your first analysis report (PDF or photo) using the button above."}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition cursor-pointer"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`p-5 rounded-3xl border shadow-xs transition flex flex-col justify-between gap-4 ${
                isDark ? "bg-slate-900/85 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{r.testName}</h3>
                    <p className={`mt-1 text-[11px] flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <Calendar size={11} />
                      <span>
                        {new Date(r.testDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      {r.laboratoryName && (
                        <span className="flex items-center gap-1">
                          • <Building size={11} /> {r.laboratoryName}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    title="Delete"
                    className={`p-1.5 rounded-lg transition cursor-pointer active:scale-[0.97] ${isDark ? "text-slate-500 hover:text-rose-400 hover:bg-rose-500/10" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Test tags */}
                {r.parameters.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.parameters.map((p) => (
                      <span
                        key={p.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          isDark ? "bg-blue-500/15 text-blue-300 border-blue-500/30" : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        <Tag size={10} />
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}

                {r.notes && (
                  <p className={`mt-2 text-[11px] italic ${isDark ? "text-slate-400" : "text-slate-500"}`}>{r.notes}</p>
                )}
              </div>

              {r.reportUrl && (
                <div className={`pt-3 border-t flex items-center gap-2 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border flex-1 truncate ${
                      isDark ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {isPdf(r.reportUrl) ? <FileText size={13} className="shrink-0 text-red-500" /> : <ImageIcon size={13} className="shrink-0 text-emerald-500" />}
                    <span className="truncate">{r.reportUrl.split("/").pop()}</span>
                  </span>
                  <a
                    href={r.reportUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="View"
                    className={`p-2 rounded-lg border transition ${isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"}`}
                  >
                    <Eye size={14} />
                  </a>
                  <a
                    href={r.reportUrl}
                    download
                    title="Download"
                    className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
                  >
                    <Download size={14} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================================================== */}
      {/* ADD MODAL */}
      {/* ================================================== */}
      {showModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) setShowModal(false);
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
                  <FlaskConical size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base">New lab report</h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Upload the file and tag the analyses it contains
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowModal(false)}
                className={`p-2 rounded-xl transition cursor-pointer active:scale-[0.97] ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-200 text-slate-600"}`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
              {/* Date + Lab + Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Analysis date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    max={todayInputValue()}
                    onChange={(e) => setFormDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                      isDark ? "bg-slate-950 border-slate-700 text-white focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Laboratory (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Laboratoire El Amel, Alger"
                    value={formLab}
                    onChange={(e) => setFormLab(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                      isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Report title (optional)
                </label>
                <input
                  type="text"
                  placeholder={`Bilan du ${new Date(formDate + "T12:00:00").toLocaleDateString("fr-FR")}`}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                    isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                  }`}
                />
              </div>

              {/* File upload */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Report file (PDF or image)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-4 rounded-2xl border border-dashed flex items-center justify-center gap-2 text-xs font-semibold transition cursor-pointer active:scale-[0.99] ${
                    file
                      ? isDark
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                        : "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : isDark
                      ? "border-slate-700 bg-slate-950/50 text-slate-300 hover:border-blue-500"
                      : "border-slate-300 bg-slate-50 text-slate-600 hover:border-blue-400"
                  }`}
                >
                  {file ? <Check size={15} /> : <Upload size={15} />}
                  <span className="truncate">
                    {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : "Choose PDF or photo (max 10 MB)"}
                  </span>
                  {file && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setFile(null);
                      }}
                      className="ml-1 p-1 rounded-md hover:bg-black/10"
                    >
                      <X size={13} />
                    </span>
                  )}
                </button>
              </div>

              {/* Test tags selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Analyses in this report ({selectedTests.length} selected)
                  </label>
                </div>

                {/* Selected chips */}
                {selectedTests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {selectedTests.map((t) => (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => toggleTest(t)}
                        title="Remove"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-blue-600 text-white hover:bg-blue-500 transition cursor-pointer active:scale-[0.97]"
                      >
                        <Check size={11} />
                        {t.name}
                        <X size={11} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Catalog search */}
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search test: glycémie, TSH, NFS..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none transition ${
                      isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                    }`}
                  />
                </div>

                <div className={`rounded-2xl border max-h-56 overflow-y-auto p-2 space-y-3 ${isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-slate-50/60"}`}>
                  {catalogFiltered.length === 0 ? (
                    <p className="p-3 text-center text-[11px] text-slate-400">No test matches your search.</p>
                  ) : (
                    catalogFiltered.map((cat) => (
                      <div key={cat.category}>
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {cat.category}
                        </p>
                        <div className="flex flex-wrap gap-1.5 px-1 pb-1">
                          {cat.tests.map((t) => {
                            const selected = selectedTests.some((s) => s.name === t.name);
                            return (
                              <button
                                key={t.name}
                                type="button"
                                onClick={() => toggleTest(t)}
                                title={t.unit ? `${t.unit}${t.referenceMin !== undefined ? ` (ref ${t.referenceMin}–${t.referenceMax})` : ""}` : t.name}
                                className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer active:scale-[0.97] ${
                                  selected
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : isDark
                                    ? "bg-slate-900 text-slate-300 border-slate-700 hover:border-blue-500"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
                                }`}
                              >
                                {t.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: fasting sample, morning..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition resize-none ${
                    isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                  }`}
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  {formError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t flex items-center justify-end gap-2.5 ${isDark ? "border-slate-800 bg-slate-950/50" : "border-slate-100 bg-slate-50"}`}>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-[0.97] ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-600"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold transition cursor-pointer active:scale-[0.97]"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>{isSaving ? "Saving..." : "Save report"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
