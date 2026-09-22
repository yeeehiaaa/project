"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Check,
  X,
  LogOut,
  Store,
  Inbox,
  Clock,
  Loader2,
  Search,
  FlaskConical,
  Crown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import DoctorzBrand from "@/components/brand/DoctorzBrand";
import { PButton, PIconButton } from "@/components/patient/buttons";
import SubscribeCard from "@/components/premium/SubscribeCard";
import { buildPrescriptionDoc } from "@/lib/prescriptionPdf";

interface Facility {
  id: string;
  name: string;
  city: string | null;
  wilaya: string | null;
  address: string | null;
  phone: string | null;
  emergencyService: boolean;
}

interface StockItem {
  id: string;
  medicationName: string;
  dosage: string | null;
  quantity: number;
  lowThreshold: number;
  price: number | null;
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
  patientName: string;
  patientPhone: string;
}

interface LabNews {
  id: string;
  name: string;
  dci: string | null;
  dosage: string | null;
  forme: string | null;
  price: number | null;
  labName: string;
  labCity: string;
  targetNames: string[];
  hasDoc: boolean;
  createdAt: string;
}

function statusOf(qty: number, threshold: number): "OK" | "LOW" | "OUT" {
  if (qty <= 0) return "OUT";
  if (qty <= Math.max(threshold, 0)) return "LOW";
  return "OK";
}

export default function PharmacyDashboard() {
  const router = useRouter();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<"stock" | "requests" | "news" | "premium">("stock");

  const [news, setNews] = useState<LabNews[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  const [items, setItems] = useState<StockItem[]>([]);
  const [requests, setRequests] = useState<StockReq[]>([]);
  const [search, setSearch] = useState("");
  const [reqSearch, setReqSearch] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  // Visionneuse ordonnance : affichée dans la page (les liens data:
  // directs ouvrent une page blanche sous Chrome).
  const [rxView, setRxView] = useState<{ url: string; name: string; kind: "image" | "pdf" } | null>(null);
  const openRx = async (fileUrl: string, fileName: string) => {
    try {
      if (fileUrl.startsWith("data:image/") || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(fileUrl)) {
        setRxView({ url: fileUrl, name: fileName, kind: "image" });
      } else {
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
  // Ordonnance plateforme → vrai formulaire PDF officiel (même mise en page
  // que côté patient), affiché dans la visionneuse.
  const openRxPdf = (r: StockReq) => {
    const rx = r.prescription;
    if (!rx) return;
    try {
      const doc = buildPrescriptionDoc({
        doctor: {
          name: rx.doctorName ? `Dr. ${rx.doctorName}` : "Médecin",
          specialty: "Médecine",
          license: "—",
          cabinet: "DOCTORZ Co.",
        },
        patient: { name: r.patientName || "Patient", phone: r.patientPhone || null },
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

  // Setup form
  const [fName, setFName] = useState("");
  const [fCity, setFCity] = useState("");
  const [fWilaya, setFWilaya] = useState("");
  const [fAddress, setFAddress] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [savingFacility, setSavingFacility] = useState(false);

  // Add stock form
  const [mName, setMName] = useState("");
  const [mDosage, setMDosage] = useState("");
  const [mQty, setMQty] = useState("10");
  const [mPrice, setMPrice] = useState("");
  const [savingStock, setSavingStock] = useState(false);

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    setAuthError("");
    try {
      const token = await getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      const fRes = await fetch("/api/pharmacies/facility", {
        cache: "no-store",
        headers,
      });
      if (fRes.status === 401) {
        router.replace("/login");
        return;
      }
      const fData = await fRes.json().catch(() => ({}));
      const fac = fData.success ? fData.facility : null;
      setFacility(fac);

      if (fac) {
        setNewsLoading(true);
        const [sRes, rRes, nRes] = await Promise.all([
          fetch("/api/pharmacies/stock", { cache: "no-store", headers }),
          fetch("/api/pharmacies/requests?role=pharmacist", {
            cache: "no-store",
            headers,
          }),
          fetch("/api/labs/feed?role=pharmacy", {
            cache: "no-store",
            headers,
          }),
        ]);
        const sData = await sRes.json().catch(() => ({}));
        const rData = await rRes.json().catch(() => ({}));
        const nData = await nRes.json().catch(() => ({}));
        if (sData.success && Array.isArray(sData.items)) setItems(sData.items);
        if (rData.success && Array.isArray(rData.requests))
          setRequests(rData.requests);
        if (nData.success && Array.isArray(nData.products)) setNews(nData.products);
        setNewsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setAuthError("Impossible de charger le tableau de bord.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) return;
    setSavingFacility(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/pharmacies/facility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: fName.trim(),
          city: fCity.trim(),
          wilaya: fWilaya.trim(),
          address: fAddress.trim(),
          phone: fPhone.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Création impossible.");
      }
      setFacility(data.facility);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible.");
    } finally {
      setSavingFacility(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  // Nouveauté labo → pré-remplit le formulaire de stock.
  const stockFromNews = (n: LabNews) => {
    setMName(n.name);
    setMDosage(n.dosage || "");
    setMPrice(n.price != null ? String(n.price) : "");
    setTab("stock");
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // ignore
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim()) return;
    setSavingStock(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/pharmacies/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          medicationName: mName.trim(),
          dosage: mDosage.trim(),
          quantity: parseInt(mQty, 10) || 0,
          price: mPrice.trim() === "" ? undefined : Number(mPrice),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Ajout impossible.");
      }
      setMName("");
      setMDosage("");
      setMQty("10");
      setMPrice("");
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ajout impossible.");
    } finally {
      setSavingStock(false);
    }
  };

  const adjustQty = async (item: StockItem, delta: number) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/pharmacies/stock", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: item.id,
          quantity: Math.max(0, (Number(item.quantity) || 0) + delta),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.item) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? data.item : it))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Retirer ce médicament du stock ?")) return;
    try {
      const token = await getToken();
      if (!token) return;
      await fetch(`/api/pharmacies/stock?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const setRequestStatus = async (id: string, status: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/pharmacies/requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status, asRole: "pharmacist" }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.request) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? data.request : r))
        );
        if (status === "COMPLETED") refreshData();
      } else if (!res.ok) {
        setError(data.error || "Action impossible.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.push("/login");
  };

  const filteredItems = items.filter((it) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      it.medicationName.toLowerCase().includes(q) ||
      (it.dosage || "").toLowerCase().includes(q)
    );
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const visibleRequests = requests.filter((r) => {
    const q = reqSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (r.patientName || "").toLowerCase().includes(q) ||
      (r.pickupCode || "").toLowerCase().includes(q) ||
      (r.medicationName || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Link href="/dashboard/pharmacy" className="shrink-0">
            <DoctorzBrand isDark={false} size={40} />
          </Link>
          <div className="flex items-center gap-2">
            {facility && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold max-w-[220px] truncate">
                <Store size={14} className="shrink-0" />
                {facility.name}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              title="Déconnexion"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {authError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {authError}
          </div>
        )}

        {!facility ? (
          /* ---- SETUP : créer ma pharmacie ---- */
          <div className="max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-600 text-white">
                <Store size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold">Configurer ma pharmacie</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ces informations seront visibles par les patients qui cherchent des médicaments.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveFacility} className="mt-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-400 mb-1.5">
                  Nom de la pharmacie *
                </label>
                <input
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="Ex : Pharmacie El Amel"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-400 mb-1.5">
                    Ville
                  </label>
                  <input
                    value={fCity}
                    onChange={(e) => setFCity(e.target.value)}
                    placeholder="Alger"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-400 mb-1.5">
                    Wilaya
                  </label>
                  <input
                    value={fWilaya}
                    onChange={(e) => setFWilaya(e.target.value)}
                    placeholder="Alger"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-400 mb-1.5">
                  Adresse
                </label>
                <input
                  value={fAddress}
                  onChange={(e) => setFAddress(e.target.value)}
                  placeholder="Rue, commune..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-400 mb-1.5">
                  Téléphone
                </label>
                <input
                  value={fPhone}
                  onChange={(e) => setFPhone(e.target.value)}
                  placeholder="+213 ..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500"
                />
              </div>
              <PButton
                variant="primary"
                isDark={false}
                type="submit"
                className="w-full !py-3"
                disabled={savingFacility}
              >
                {savingFacility ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Check size={15} />
                )}
                <span>{savingFacility ? "Enregistrement..." : "Enregistrer ma pharmacie"}</span>
              </PButton>
            </form>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              <PButton
                variant={tab === "stock" ? "primary" : "secondary"}
                isDark={false}
                onClick={() => setTab("stock")}
              >
                <Package size={15} />
                <span>Stock ({items.length})</span>
              </PButton>
              <PButton
                variant={tab === "requests" ? "primary" : "secondary"}
                isDark={false}
                onClick={() => setTab("requests")}
              >
                <Inbox size={15} />
                <span>
                  Demandes
                  {pendingCount > 0 ? ` (${pendingCount})` : ""}
                </span>
              </PButton>
              <PButton
                variant={tab === "news" ? "primary" : "secondary"}
                isDark={false}
                onClick={() => setTab("news")}
              >
                <FlaskConical size={15} />
                <span>
                  Nouveautés labos
                  {news.length > 0 ? ` (${news.length})` : ""}
                </span>
              </PButton>
              <PButton
                variant={tab === "premium" ? "primary" : "secondary"}
                isDark={false}
                onClick={() => setTab("premium")}
              >
                <Crown size={15} />
                <span>Premium</span>
              </PButton>
              <span className="flex-1" />
              <PIconButton title="Actualiser" isDark={false} disabled={refreshing} onClick={refreshData}>
                <RefreshCw size={15} className={refreshing ? "animate-spin text-blue-500" : ""} />
              </PIconButton>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {tab === "stock" && (
              <div className="space-y-4">
                {/* Add form */}
                <form
                  onSubmit={handleAddStock}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h2 className="text-sm font-bold mb-3">
                    Ajouter / réassortir un médicament
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
                    <input
                      value={mName}
                      onChange={(e) => setMName(e.target.value)}
                      placeholder="Médicament *"
                      required
                      className="col-span-2 md:col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      value={mDosage}
                      onChange={(e) => setMDosage(e.target.value)}
                      placeholder="Dosage"
                      className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      value={mQty}
                      onChange={(e) => setMQty(e.target.value)}
                      placeholder="Qté"
                      inputMode="numeric"
                      className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      value={mPrice}
                      onChange={(e) => setMPrice(e.target.value)}
                      placeholder="Prix (DA)"
                      inputMode="decimal"
                      className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <PButton
                    variant="primary"
                    isDark={false}
                    type="submit"
                    className="mt-3"
                    disabled={savingStock}
                  >
                    {savingStock ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Plus size={15} />
                    )}
                    <span>{savingStock ? "Ajout..." : "Ajouter au stock"}</span>
                  </PButton>
                </form>

                {/* Search + list */}
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher dans mon stock..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                {filteredItems.length === 0 ? (
                  <div className="p-10 text-center rounded-3xl border border-slate-200 bg-white">
                    <Package size={30} className="mx-auto text-slate-300" />
                    <p className="mt-2 text-sm font-bold text-slate-700">
                      Stock vide
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Ajoutez vos médicaments ci-dessus pour apparaître dans les recherches patients.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredItems.map((it) => {
                      const st = statusOf(
                        Number(it.quantity) || 0,
                        Number(it.lowThreshold) || 0
                      );
                      return (
                        <div
                          key={it.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">
                              {it.medicationName}
                              {it.dosage ? (
                                <span className="ml-1.5 font-mono text-[11px] text-slate-400">
                                  {it.dosage}
                                </span>
                              ) : null}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full font-bold border ${
                                  st === "OK"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : st === "LOW"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-slate-100 text-slate-500 border-slate-200"
                                }`}
                              >
                                {st === "OK"
                                  ? `${it.quantity} en stock`
                                  : st === "LOW"
                                    ? `${it.quantity} restants`
                                    : "Rupture"}
                              </span>
                              {it.price != null && (
                                <span className="ml-2 font-semibold">
                                  {Number(it.price)} DA
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => adjustQty(it, -1)}
                              title="-1"
                              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition cursor-pointer active:scale-95"
                            >
                              <Minus size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => adjustQty(it, 1)}
                              title="+1"
                              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition cursor-pointer active:scale-95"
                            >
                              <Plus size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteItem(it.id)}
                              title="Retirer"
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer active:scale-95"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === "requests" && (
              <div className="space-y-3">
                {/* Recherche : nom patient, code, médicament */}
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={reqSearch}
                    onChange={(e) => setReqSearch(e.target.value)}
                    placeholder="Rechercher : patient, code DZ-0000, médicament..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-400"
                  />
                  {reqSearch && (
                    <button
                      type="button"
                      onClick={() => setReqSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm leading-none cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {requests.length === 0 ? (
                  <div className="p-10 text-center rounded-3xl border border-slate-200 bg-white">
                    <Inbox size={30} className="mx-auto text-slate-300" />
                    <p className="mt-2 text-sm font-bold text-slate-700">
                      Aucune demande
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Les réservations des patients apparaîtront ici.
                    </p>
                  </div>
                ) : visibleRequests.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl border border-slate-200 bg-white">
                    <p className="text-xs font-semibold text-slate-500">
                      Aucune demande ne correspond à « {reqSearch.trim()} ».
                    </p>
                  </div>
                ) : (
                    visibleRequests.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">
                            {r.medicationName}
                            {r.dosage ? (
                              <span className="ml-1.5 font-mono text-[11px] text-slate-400">
                                {r.dosage}
                              </span>
                            ) : null}
                            {(r.quantity || 0) > 1 && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-600 text-[11px] font-black">
                                × {r.quantity}
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {r.patientName}
                            {r.patientPhone ? ` • ${r.patientPhone}` : ""}
                          </p>
                          <p className="mt-1 flex items-center gap-2 text-[11px]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold">
                              {r.pickupCode || "—"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold border ${
                                r.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : r.status === "CONFIRMED"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : r.status === "COMPLETED"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : r.status === "REFUSED"
                                        ? "bg-rose-50 text-rose-600 border-rose-200"
                                        : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}
                            >
                              {r.status === "PENDING"
                                ? "En attente"
                                : r.status === "CONFIRMED"
                                  ? "Acceptée • En cours"
                                  : r.status === "COMPLETED"
                                    ? "Terminée"
                                    : r.status === "REFUSED"
                                      ? "Refusée"
                                      : r.status}
                            </span>
                          </p>
                          {r.notes && (
                            <p className="mt-1 text-[11px] italic text-slate-400">
                              {r.notes}
                            </p>
                          )}
                          {(r.prescriptionFileUrl || r.prescription) && (
                            <div className="mt-1.5 px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[11px]">
                              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                Ordonnance jointe
                              </p>
                              {r.prescription && (
                                <p className="mt-1 font-semibold text-slate-700">
                                  N° {r.prescription.prescriptionNumber}
                                  {r.prescription.prescribedDate ? ` • ${new Date(r.prescription.prescribedDate).toLocaleDateString("fr-FR")}` : ""}
                                  {r.prescription.doctorName ? ` • Dr ${r.prescription.doctorName}` : ""}
                                </p>
                              )}
                              {r.prescription && Array.isArray(r.prescription.items) && r.prescription.items.length > 0 && (
                                <ul className="mt-1 space-y-0.5 text-slate-500">
                                  {r.prescription.items.slice(0, 6).map((it: any, i: number) => (
                                    <li key={i} className="truncate">
                                      • {it.medicationName}{it.dosage ? ` — ${it.dosage}` : ""}{it.frequency ? ` (${it.frequency})` : ""}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {r.prescriptionFileUrl && (
                                <button
                                  type="button"
                                  onClick={() => openRx(r.prescriptionFileUrl as string, r.prescriptionFileName || "ordonnance")}
                                  className="mt-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition cursor-pointer active:scale-95"
                                >
                                  👁 Voir le contenu{r.prescriptionFileName ? ` (${r.prescriptionFileName})` : ""}
                                </button>
                              )}
                              {r.prescription && (
                                <button
                                  type="button"
                                  onClick={() => openRxPdf(r)}
                                  className="mt-1.5 ml-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-blue-700 border border-blue-300 hover:bg-blue-50 transition cursor-pointer active:scale-95"
                                >
                                  📄 Ordonnance PDF
                                </button>
                              )}
                            </div>
                          )}
                          <p className="mt-1 text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(r.createdAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      {r.status === "PENDING" && (
                        <div className="mt-3 flex gap-2">
                          <PButton
                            variant="primary"
                            isDark={false}
                            onClick={() => setRequestStatus(r.id, "CONFIRMED")}
                          >
                            <Check size={14} />
                            <span>Accepter</span>
                          </PButton>
                          <PButton
                            variant="secondary"
                            isDark={false}
                            onClick={() => setRequestStatus(r.id, "REFUSED")}
                          >
                            <X size={14} />
                            <span>Refuser</span>
                          </PButton>
                        </div>
                      )}
                      {r.status === "CONFIRMED" && (
                        <div className="mt-3 flex gap-2">
                          <PButton
                            variant="primary"
                            isDark={false}
                            onClick={() => setRequestStatus(r.id, "COMPLETED")}
                          >
                            <Check size={14} />
                            <span>Validé — vente faite</span>
                          </PButton>
                        </div>
                      )}
                    </div>
                  )))}
              </div>
            )}

            {tab === "news" && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-violet-200 bg-violet-50/60 text-[11px] text-violet-700 font-medium">
                  Nouveautés publiées par les laboratoires — ajoutez-les à votre stock en un clic.
                </div>
                {newsLoading ? (
                  <div className="flex py-10 items-center justify-center">
                    <Loader2 className="animate-spin text-violet-500" size={24} />
                  </div>
                ) : news.length === 0 ? (
                  <div className="p-10 text-center rounded-3xl border border-slate-200 bg-white">
                    <FlaskConical size={30} className="mx-auto text-slate-300" />
                    <p className="mt-2 text-sm font-bold text-slate-700">Aucune nouveauté</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Les médicaments publiés par les laboratoires apparaîtront ici.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {news.map((n) => (
                      <div key={n.id} className="p-4 rounded-2xl border border-violet-200 bg-white">
                        <p className="text-sm font-bold truncate">
                          {n.name}
                          {n.dosage ? (
                            <span className="ml-1.5 font-mono text-[11px] text-slate-400">{n.dosage}</span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                          {n.dci || "DCI non renseignée"}
                          {n.forme ? ` • ${n.forme}` : ""}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-violet-700">{n.labName}</span>
                          {n.labCity ? ` • ${n.labCity}` : ""}
                          {n.price != null ? (
                            <span className="ml-1.5 font-black text-emerald-600">{Number(n.price)} DA</span>
                          ) : null}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          {(n.targetNames || []).slice(0, 3).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded-md bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold">
                              {t}
                            </span>
                          ))}
                          {n.hasDoc && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold">
                              📄 Doc officiel
                            </span>
                          )}
                        </div>
                        <PButton
                          variant="primary"
                          isDark={false}
                          className="mt-3"
                          onClick={() => stockFromNews(n)}
                        >
                          <Plus size={14} />
                          <span>Ajouter à mon stock</span>
                        </PButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {tab === "premium" && (
              <SubscribeCard isDark={false} />
            )}
          </>
        )}
      </main>

      {/* Visionneuse ordonnance */}
      {rxView && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRx();
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-slate-900">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-2">
              <p className="text-xs font-bold truncate">📄 {rxView.name}</p>
              <button
                type="button"
                onClick={closeRx}
                className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto bg-slate-100 flex items-center justify-center">
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

      <footer className="py-6 text-center text-[11px] text-slate-400">
        DOCTORZ Co. • Espace Pharmacie
      </footer>
    </div>
  );
}
