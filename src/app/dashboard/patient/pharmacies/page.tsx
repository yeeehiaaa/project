"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";import {
  Store,
  Search,
  X,
  MapPin,
  Phone,
  Clock,
  Bell,
  BellOff,
  Trash2,
  Check,
  Loader2,
  Navigation,
  Package,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePatientTheme } from "@/components/patient/PatientThemeContext";
import { PButton, PIconButton } from "@/components/patient/buttons";
import { buildPrescriptionDoc } from "@/lib/prescriptionPdf";

interface StockItem {
  id: string;
  medicationName: string;
  dosage: string;
  quantity: number;
  price: number | null;
  status: "OK" | "LOW" | "OUT";
}

interface PharmacyResult {
  id: string;
  name: string;
  address: string;
  city: string;
  wilaya: string;
  phone: string;
  emergencyService: boolean;
  items: StockItem[];
  hasStock: boolean;
}

interface StockReq {
  id: string;
  medicationName: string;
  dosage: string | null;
  quantity: number | null;
  status: string;
  pickupCode: string | null;
  prescriptionId: string | null;
  prescriptionFileUrl: string | null;
  prescriptionFileName: string | null;
  prescription: {
    prescriptionNumber: string;
    prescribedDate: string;
    status: string;
    notes: string;
    doctorName: string;
    items: { medicationName: string; dosage: string; frequency: string | null; quantity: number | null; durationDays: number | null; instructions: string | null }[];
  } | null;
  notes: string | null;
  createdAt: string;
  facilityName: string;
  facilityCity: string;
  facilityPhone: string;
}

interface PlatformRx {
  id: string;
  prescriptionNumber: string;
  prescribedDate: string;
  status: string;
}

interface StockAlert {
  id: string;
  medicationName: string;
  wilaya: string;
  city: string;
  available: boolean;
  count: number;
  where: { facilityName: string; city: string }[];
}

function statusPill(status: string): string {
  if (status === "OK")
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  if (status === "LOW")
    return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
  return "bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/30";
}

function statusLabel(status: string): string {
  if (status === "OK") return "Disponible";
  if (status === "LOW") return "Bientôt épuisé";
  return "Rupture";
}

function requestLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "En attente";
    case "CONFIRMED":
      return "Accepté • En cours";
    case "READY":
      return "Prêt au comptoir";
    case "COMPLETED":
      return "Terminé";
    case "REFUSED":
      return "Refusé";
    case "CANCELLED":
      return "Annulée";
    default:
      return status;
  }
}

function requestPill(status: string): string {
  switch (status) {
    case "CONFIRMED":
    case "READY":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "COMPLETED":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "REFUSED":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    case "PENDING":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    default:
      return "bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/30";
  }
}

function PharmaciesContent() {
  const { isDark } = usePatientTheme();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [tab, setTab] = useState<"search" | "requests" | "alerts">("search");
  const [query, setQuery] = useState(initialQ);
  const [city, setCity] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [results, setResults] = useState<PharmacyResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [requests, setRequests] = useState<StockReq[]>([]);
  const [platformRx, setPlatformRx] = useState<PlatformRx[]>([]);
  const [myName, setMyName] = useState("Patient");
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [error, setError] = useState("");

  // Réservation : un seul médicament + quantité + ordonnance optionnelle
  const [reserveFor, setReserveFor] = useState<PharmacyResult | null>(null);
  const [reserveMed, setReserveMed] = useState("");
  const [reserveQty, setReserveQty] = useState(1);
  const [reserveNotes, setReserveNotes] = useState("");
  const [rxChoice, setRxChoice] = useState("");
  const [rxFile, setRxFile] = useState<string | null>(null);
  const [rxFileName, setRxFileName] = useState("");
  // Visionneuse ordonnance : affichée dans la page (les liens data:
  // directs ouvrent une page blanche sous Chrome).
  const [rxView, setRxView] = useState<{ url: string; name: string; kind: "image" | "pdf" } | null>(null);
  const openRx = async (fileUrl: string, fileName: string) => {
    try {
      if (fileUrl.startsWith("data:image/") || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(fileUrl)) {
        setRxView({ url: fileUrl, name: fileName, kind: "image" });
      } else {
        // PDF (data: ou http) via blob : lisible dans un iframe.
        const blob = await (await fetch(fileUrl)).blob();
        setRxView({ url: URL.createObjectURL(blob), name: fileName, kind: "pdf" });
      }
    } catch {
      setError("Impossible d'ouvrir le fichier.");
    }
  };
  const closeRx = () => {
    if (rxView && rxView.kind === "pdf" && rxView.url.startsWith("blob:")) {
      try { URL.revokeObjectURL(rxView.url); } catch { /* ignore */ }
    }
    setRxView(null);
  };
  // Ordonnance plateforme → aperçu du vrai formulaire PDF officiel.
  const openRxPdf = (rx: NonNullable<StockReq["prescription"]>, patientName: string) => {
    try {
      const doc = buildPrescriptionDoc({
        doctor: {
          name: rx.doctorName ? `Dr. ${rx.doctorName}` : "Médecin",
          specialty: "Médecine",
          license: "—",
          cabinet: "DOCTORZ Co.",
        },
        patient: { name: patientName || "Patient" },
        items: (rx.items || []).map((it: any) => ({
          medication: it.medicationName,
          dosage: it.dosage || "—",
          frequency: it.frequency || "Selon prescription",
          duration: it.durationDays
            ? `${it.durationDays} jours`
            : it.quantity
              ? `${it.quantity} boîte(s)`
              : "—",
          instructions: it.instructions || "",
        })),
        date: rx.prescribedDate
          ? new Date(rx.prescribedDate).toLocaleDateString("fr-FR")
          : undefined,
        prescriptionNumber: rx.prescriptionNumber,
        notes: rx.notes || "",
      });
      const blob = doc.output("blob");
      setRxView({
        url: URL.createObjectURL(blob),
        name: `Ordonnance_${rx.prescriptionNumber}.pdf`,
        kind: "pdf",
      });
    } catch {
      setError("Impossible de générer le PDF.");
    }
  };
  const [reserving, setReserving] = useState(false);
  const [pickupOk, setPickupOk] = useState<string | null>(null);

  // Alerte
  const [alertMed, setAlertMed] = useState("");
  const [alertWilaya, setAlertWilaya] = useState("");
  const [addingAlert, setAddingAlert] = useState(false);

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  };

  const runSearch = useCallback(
    async (q = query, c = city, w = wilaya) => {
      setIsLoading(true);
      setError("");
      try {
        const token = await getToken();
        if (!token) return;
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (c.trim()) params.set("city", c.trim());
        if (w.trim()) params.set("wilaya", w.trim());
        const res = await fetch(`/api/pharmacies/search?${params.toString()}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Recherche impossible.");
        }
        setResults(Array.isArray(data.results) ? data.results : []);
        setHasSearched(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Recherche impossible.");
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const loadMine = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const [rRes, aRes, profRes] = await Promise.all([
        fetch("/api/pharmacies/requests", { cache: "no-store", headers }),
        fetch("/api/pharmacies/alerts", { cache: "no-store", headers }),
        fetch("/api/dashboard/patient/profile", { cache: "no-store", headers }),
      ]);
      const rData = await rRes.json().catch(() => ({}));
      const aData = await aRes.json().catch(() => ({}));
      if (rData.success && Array.isArray(rData.requests)) {
        setRequests(rData.requests);
      }
      if (aData.success && Array.isArray(aData.alerts)) {
        setAlerts(aData.alerts);
      }
      const prof = await profRes.json().catch(() => ({}));
      const rxList = Array.isArray(prof?.prescriptions) ? prof.prescriptions : [];
      const p = prof?.profile;
      if (p) {
        const n = `${p.firstName || ""} ${p.lastName || ""}`.trim();
        if (n) setMyName(n);
      }
      setPlatformRx(
        rxList.map((x: any) => ({
          id: String(x.id),
          prescriptionNumber: String(x.prescriptionNumber || String(x.id).slice(0, 8)),
          prescribedDate: String(x.prescribedDate || x.createdAt || ""),
          status: String(x.status || ""),
        }))
      );
    } catch (err) {
      console.warn("loadMine failed:", err);
    }
  }, []);

  useEffect(() => {
    loadMine();
    if (initialQ.trim()) {
      runSearch(initialQ, "", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRxFile = async (f: File | undefined) => {
    if (!f) return;
    if (!/^image\//.test(f.type) && f.type !== "application/pdf") {
      setError("Ordonnance : image ou PDF uniquement.");
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setError("Fichier trop lourd (max 4 Mo).");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const rd = new FileReader();
      rd.onload = () => resolve(String(rd.result || ""));
      rd.onerror = () => reject(new Error("Lecture impossible."));
      rd.readAsDataURL(f);
    });
    setRxFile(dataUrl);
    setRxFileName(f.name);
  };

  const handleReserve = async () => {
    if (!reserveFor || !reserveMed) return;
    const [medName, dosage] = reserveMed.split("||");
    const qty = Math.min(99, Math.max(1, Math.floor(Number(reserveQty) || 1)));
    setReserving(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Session expirée, reconnectez-vous.");
      }
      const res = await fetch("/api/pharmacies/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          facilityId: reserveFor.id,
          medicationName: medName,
          dosage: dosage || undefined,
          quantity: qty,
          prescriptionId: rxChoice || undefined,
          prescriptionFileUrl: rxFile || undefined,
          prescriptionFileName: rxFileName || undefined,
          notes: reserveNotes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Réservation impossible.");
      }
      setPickupOk(data.request?.pickupCode || "OK");
      setReserveFor(null);
      setReserveMed("");
      setReserveQty(1);
      setReserveNotes("");
      setRxChoice("");
      setRxFile(null);
      setRxFileName("");
      loadMine();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Réservation impossible.");
    } finally {
      setReserving(false);
    }
  };

  const cancelRequest = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/pharmacies/requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status: "CANCELLED" }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.request) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? data.request : r))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertMed.trim()) return;
    setAddingAlert(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/pharmacies/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          medicationName: alertMed.trim(),
          wilaya: alertWilaya.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Alerte impossible.");
      }
      setAlertMed("");
      setAlertWilaya("");
      loadMine();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Alerte impossible.");
    } finally {
      setAddingAlert(false);
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await fetch(`/api/pharmacies/alerts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const mapsUrl = (r: PharmacyResult) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `pharmacie ${r.name} ${r.address} ${r.city} ${r.wilaya}`
    )}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`p-6 rounded-3xl border shadow-md transition-colors ${
          isDark ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${isDark ? "bg-blue-500/15 border-blue-500/30 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-600"}`}>
            <Store size={24} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Pharmacies</h2>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Trouvez vos médicaments près de chez vous
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {(
            [
              { id: "search", label: "Rechercher" },
              { id: "requests", label: `Mes réservations${requests.filter((r) => r.status === "PENDING" || r.status === "CONFIRMED").length ? ` (${requests.filter((r) => r.status === "PENDING" || r.status === "CONFIRMED").length})` : ""}` },
              { id: "alerts", label: `Mes alertes${alerts.length ? ` (${alerts.length})` : ""}` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-[0.97] ${
                tab === t.id
                  ? "bg-gradient-to-r from-blue-700 to-sky-500 text-white"
                  : isDark
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {pickupOk && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs">
          <p className="font-bold flex items-center gap-1.5">
            <Check size={14} /> Réservation confirmée !
          </p>
          <p className="mt-1">
            Présentez ce code au comptoir :{" "}
            <span className="font-mono font-black text-base">{pickupOk}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setPickupOk(null);
              setTab("requests");
            }}
            className="mt-2 underline font-semibold cursor-pointer"
          >
            Voir mes réservations
          </button>
        </div>
      )}

      {tab === "search" && (
        <>
          {/* Search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(query, city, wilaya);
            }}
            className={`p-4 rounded-3xl border flex flex-col md:flex-row gap-2.5 ${
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Médicament : Ventoline, Doliprane..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-blue-500 ${
                  isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                }`}
              />
            </div>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville"
              className={`px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-blue-500 md:w-36 ${
                isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
              }`}
            />
            <input
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              placeholder="Wilaya"
              className={`px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-blue-500 md:w-36 ${
                isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
              }`}
            />
            <PButton variant="primary" isDark={isDark} type="submit" disabled={isLoading} className="!px-6">
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              <span>{isLoading ? "..." : "Chercher"}</span>
            </PButton>
          </form>

          {/* Results */}
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="animate-spin text-blue-500" size={28} />
            </div>
          ) : !hasSearched ? (
            <div className={`p-12 text-center rounded-3xl border ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
              <Store size={32} className="mx-auto text-slate-400 opacity-50" />
              <h3 className="mt-3 text-base font-bold">Trouvez votre médicament</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                Tapez un nom (ex : Ventoline, Doliprane, Augmentin...) et découvrez quelles pharmacies l'ont en stock près de chez vous.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
              <Package size={32} className="mx-auto text-slate-400 opacity-50" />
              <h3 className="mt-3 text-base font-bold">Aucune pharmacie trouvée</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                {query.trim()
                  ? `Aucun stock de « ${query.trim()} » pour le moment. Créez une alerte pour être notifié.`
                  : "Essayez une autre ville ou wilaya."}
              </p>
              {query.trim() && (
                <PButton
                  variant="secondary"
                  isDark={isDark}
                  className="mt-4"
                  onClick={() => {
                    setAlertMed(query.trim());
                    setAlertWilaya(wilaya.trim());
                    setTab("alerts");
                  }}
                >
                  <Bell size={14} />
                  <span>M'alerter quand disponible</span>
                </PButton>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {results.map((r) => (
                <div
                  key={r.id}
                  className={`p-5 rounded-3xl border shadow-xs flex flex-col gap-3 ${
                    isDark ? "bg-slate-900/85 border-slate-800" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                        {r.name}
                      </h3>
                      <p className={`mt-0.5 text-[11px] flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">
                          {[r.address, r.city, r.wilaya].filter(Boolean).join(", ") || "Adresse non renseignée"}
                        </span>
                      </p>
                      {r.phone && (
                        <a
                          href={`tel:${r.phone.replace(/[^+\d]/g, "")}`}
                          className="mt-0.5 text-[11px] flex items-center gap-1 text-blue-500 font-semibold"
                        >
                          <Phone size={11} /> {r.phone}
                        </a>
                      )}
                    </div>
                    {r.emergencyService && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-500 border border-red-500/30">
                        Garde
                      </span>
                    )}
                  </div>

                  {r.items.length > 0 ? (
                    <div className="space-y-1.5">
                      {r.items.slice(0, 4).map((it) => (
                        <div
                          key={it.id}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] ${
                            isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-100"
                          }`}
                        >
                          <span className="font-semibold truncate">
                            {it.medicationName}
                            {it.dosage ? <span className="ml-1 font-mono text-slate-400">{it.dosage}</span> : null}
                          </span>
                          <span className="flex items-center gap-1.5 shrink-0">
                            {it.price != null && (
                              <span className="font-bold">{it.price} DA</span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded-md font-bold border ${statusPill(it.status)}`}>
                              {statusLabel(it.status)}
                            </span>
                          </span>
                        </div>
                      ))}
                      {r.items.length > 4 && (
                        <p className="text-[10px] text-slate-400 italic pl-1">
                          + {r.items.length - 4} autre(s)...
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Catalogue non renseigné — appelez pour vérifier.
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <a
                      href={mapsUrl(r)}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-[0.97] ${
                        isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      }`}
                    >
                      <Navigation size={13} />
                      Itinéraire
                    </a>
                    <button
                      type="button"
                      disabled={!r.hasStock}
                      onClick={() => {
                        setReserveFor(r);
                        const first = r.items.find((i) => i.status !== "OUT") || r.items[0];
                        setReserveMed(first ? `${first.medicationName}||${first.dosage || ""}` : "");
                        setReserveQty(1);
                        setReserveNotes("");
                        setRxChoice("");
                        setRxFile(null);
                        setRxFileName("");
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-700 to-sky-500 hover:from-blue-600 hover:to-sky-400 transition cursor-pointer active:scale-[0.97] disabled:opacity-40"
                    >
                      <Check size={13} />
                      Réserver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "requests" && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
              <Clock size={30} className="mx-auto text-slate-400 opacity-50" />
              <h3 className="mt-3 text-base font-bold">Aucune réservation</h3>
              <p className="mt-1 text-xs text-slate-400">Vos réservations en pharmacie apparaîtront ici avec le code de retrait.</p>
            </div>
          ) : (
            requests.map((rq) => (
                <div
                  key={rq.id}
                  className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900/85 border-slate-800" : "bg-white border-slate-200"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                        {rq.medicationName}
                        {rq.dosage ? <span className="ml-1.5 font-mono text-[11px] text-slate-400">{rq.dosage}</span> : null}
                        {(rq.quantity || 0) > 1 && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-500 text-[11px] font-black">
                            × {rq.quantity}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {rq.facilityName}{rq.facilityCity ? ` • ${rq.facilityCity}` : ""}
                        {rq.facilityPhone ? ` • ${rq.facilityPhone}` : ""}
                      </p>
                      <p className="mt-1.5 flex items-center gap-2">
                        {rq.pickupCode && (
                          <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-500 border border-blue-500/30">
                            {rq.pickupCode}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${requestPill(rq.status)}`}>
                          {requestLabel(rq.status)}
                        </span>
                      </p>
                      {(rq.prescriptionFileUrl || rq.prescription) && (
                        <div className={`mt-1.5 px-2.5 py-2 rounded-xl border text-[11px] ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                          <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                            Ordonnance jointe
                          </p>
                          {rq.prescription && (
                            <p className="mt-1 font-semibold">
                              N° {rq.prescription.prescriptionNumber}
                              {rq.prescription.prescribedDate ? ` • ${new Date(rq.prescription.prescribedDate).toLocaleDateString("fr-FR")}` : ""}
                              {rq.prescription.doctorName ? ` • Dr ${rq.prescription.doctorName}` : ""}
                            </p>
                          )}
                          {rq.prescription && Array.isArray(rq.prescription.items) && rq.prescription.items.length > 0 && (
                            <ul className="mt-1 space-y-0.5 text-slate-400">
                              {rq.prescription.items.slice(0, 5).map((it: any, i: number) => (
                                <li key={i} className="truncate">
                                  • {it.medicationName}{it.dosage ? ` — ${it.dosage}` : ""}{it.frequency ? ` (${it.frequency})` : ""}
                                </li>
                              ))}
                            </ul>
                          )}
                          {rq.prescriptionFileUrl && (
                            <button
                              type="button"
                              onClick={() => openRx(rq.prescriptionFileUrl as string, rq.prescriptionFileName || "ordonnance")}
                              className="mt-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-gradient-to-r from-blue-700 to-sky-500 transition cursor-pointer active:scale-95"
                            >
                              👁 Voir le fichier{rq.prescriptionFileName ? ` (${rq.prescriptionFileName})` : ""}
                            </button>
                          )}
                          {rq.prescription && (
                            <button
                              type="button"
                              onClick={() => openRxPdf(rq.prescription as NonNullable<StockReq["prescription"]>, myName)}
                              className="mt-1.5 ml-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/30 transition cursor-pointer active:scale-95"
                            >
                              📄 Ordonnance PDF
                            </button>
                          )}
                        </div>
                      )}
                      {rq.status === "CONFIRMED" && (
                        <p className="mt-1 text-[11px] text-blue-500 font-medium">
                          Accepté par la pharmacie — présentez votre code au comptoir pour acheter.
                        </p>
                      )}
                      {rq.status === "COMPLETED" && (
                        <p className="mt-1 text-[11px] font-semibold text-emerald-500">
                          Vente terminée — merci de votre visite.
                        </p>
                      )}
                      {rq.status === "REFUSED" && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-500">
                          La pharmacie ne peut pas honorer cette demande (stock épuisé).
                        </p>
                      )}
                    </div>
                    {rq.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => cancelRequest(rq.id)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer active:scale-95 ${
                          isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
            ))
          )}
        </div>
      )}

      {tab === "alerts" && (
        <div className="space-y-3">
          <form
            onSubmit={handleAddAlert}
            className={`p-4 rounded-3xl border flex flex-col sm:flex-row gap-2.5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}
          >
            <input
              value={alertMed}
              onChange={(e) => setAlertMed(e.target.value)}
              placeholder="Médicament à surveiller..."
              className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-blue-500 ${
                isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
              }`}
            />
            <input
              value={alertWilaya}
              onChange={(e) => setAlertWilaya(e.target.value)}
              placeholder="Wilaya (optionnel)"
              className={`px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-blue-500 sm:w-40 ${
                isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
              }`}
            />
            <PButton variant="primary" isDark={isDark} type="submit" disabled={addingAlert}>
              <Bell size={14} />
              <span>{addingAlert ? "..." : "M'alerter"}</span>
            </PButton>
          </form>

          {alerts.length === 0 ? (
            <div className={`p-10 text-center rounded-3xl border ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
              <BellOff size={28} className="mx-auto text-slate-400 opacity-50" />
              <p className="mt-2 text-sm font-bold">Aucune alerte</p>
              <p className="text-xs text-slate-400 mt-1">On vous prévient ici dès que le médicament revient en stock.</p>
            </div>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${isDark ? "bg-slate-900/85 border-slate-800" : "bg-white border-slate-200"}`}
              >
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                    {a.medicationName}
                    {a.wilaya ? <span className="ml-1.5 text-[11px] font-medium text-slate-400">• {a.wilaya}</span> : null}
                  </p>
                  <p className="mt-1 text-[11px]">
                    {a.available ? (
                      <span className="font-bold text-emerald-500">
                        En stock ({a.count} pharmacie{a.count > 1 ? "s" : ""})
                        {a.where.slice(0, 2).map((w) => ` • ${w.facilityName}`).join("")}
                      </span>
                    ) : (
                      <span className="text-slate-400">Toujours en rupture — on surveille.</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteAlert(a.id)}
                  title="Supprimer l'alerte"
                  className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer active:scale-95"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modale réservation */}
      {reserveFor && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setReserveFor(null);
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className={`p-5 border-b ${isDark ? "border-slate-800 bg-slate-950/50" : "border-slate-100 bg-slate-50"}`}>
              <h3 className="font-bold text-base">Réserver à {reserveFor.name}</h3>
              <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {[reserveFor.address, reserveFor.city].filter(Boolean).join(", ")}
              </p>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Médicament
                </label>
                <select
                  value={reserveMed}
                  onChange={(e) => setReserveMed(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-blue-500 ${
                    isDark ? "bg-slate-950 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                >
                  {reserveFor.items.filter((i) => i.status !== "OUT").map((it) => (
                    <option key={it.id} value={`${it.medicationName}||${it.dosage || ""}`}>
                      {it.medicationName}{it.dosage ? ` — ${it.dosage}` : ""} ({it.quantity} dispo)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Quantité
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReserveQty((q) => Math.max(1, q - 1))}
                    className={`p-2.5 rounded-xl border transition cursor-pointer active:scale-95 ${isDark ? "bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                  >
                    −
                  </button>
                  <input
                    value={reserveQty}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setReserveQty(isNaN(v) ? 1 : Math.min(99, Math.max(1, v)));
                    }}
                    inputMode="numeric"
                    className={`w-16 text-center px-2 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-blue-500 ${
                      isDark ? "bg-slate-950 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setReserveQty((q) => Math.min(99, q + 1))}
                    className={`p-2.5 rounded-xl border transition cursor-pointer active:scale-95 ${isDark ? "bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                  >
                    +
                  </button>
                  <span className="text-[11px] text-slate-400">boîte(s)</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Ordonnance (optionnel)
                </label>
                {platformRx.length > 0 && (
                  <select
                    value={rxChoice}
                    onChange={(e) => setRxChoice(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-blue-500 ${
                      isDark ? "bg-slate-950 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    <option value="">Depuis mes ordonnances...</option>
                    {platformRx.map((rx) => (
                      <option key={rx.id} value={rx.id}>
                        {rx.prescriptionNumber} — {rx.prescribedDate ? new Date(rx.prescribedDate).toLocaleDateString("fr-FR") : ""} ({rx.status})
                      </option>
                    ))}
                  </select>
                )}
                <label
                  className={`mt-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed text-[11px] font-semibold cursor-pointer transition ${
                    isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleRxFile(e.target.files?.[0])}
                  />
                  {rxFileName ? `📎 ${rxFileName}` : "📤 Joindre image / PDF"}
                </label>
                {rxFileName && (
                  <button
                    type="button"
                    onClick={() => { setRxFile(null); setRxFileName(""); }}
                    className="mt-1 text-[11px] text-rose-500 underline cursor-pointer"
                  >
                    Retirer le fichier
                  </button>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Note (optionnel)
                </label>
                <textarea
                  rows={2}
                  value={reserveNotes}
                  onChange={(e) => setReserveNotes(e.target.value)}
                  placeholder="Ex : ordonnance du Dr X, passage demain matin..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-blue-500 resize-none ${
                    isDark ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                  }`}
                />
              </div>
            </div>
            <div className={`p-4 border-t flex items-center justify-end gap-2.5 ${isDark ? "border-slate-800 bg-slate-950/50" : "border-slate-100 bg-slate-50"}`}>
              <button
                type="button"
                onClick={() => setReserveFor(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95 ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-600"}`}
              >
                Annuler
              </button>
              <PButton variant="primary" isDark={isDark} disabled={reserving || !reserveMed} onClick={handleReserve}>
                {reserving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>{reserving ? "..." : "Confirmer"}</span>
              </PButton>
            </div>
          </div>
        </div>
      )}

      {/* Visionneuse ordonnance */}
      {rxView && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRx();
          }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <p className="text-xs font-bold truncate">📄 {rxView.name}</p>
              <button
                type="button"
                onClick={closeRx}
                className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
              {rxView.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={rxView.url} alt={rxView.name} className="max-w-full h-auto" />
              ) : (
                <iframe src={rxView.url} title={rxView.name} className="w-full h-[70vh] bg-white" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PharmaciesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="animate-spin text-blue-500" size={28} />
        </div>
      }
    >
      <PharmaciesContent />
    </Suspense>
  );
}
