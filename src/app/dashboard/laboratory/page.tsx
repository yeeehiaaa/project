"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FlaskConical,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Check,
  X,
  LogOut,
  Store,
  Eye,
  MousePointerClick,
  Search,
  FileText,
  Loader2,
  Crown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import DoctorzBrand from "@/components/brand/DoctorzBrand";
import { PButton, PIconButton } from "@/components/patient/buttons";
import SubscribeCard from "@/components/premium/SubscribeCard";

interface Facility {
  id: string;
  name: string;
  city: string | null;
  wilaya: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
}

interface LabProduct {
  id: string;
  name: string;
  dci: string | null;
  dosage: string | null;
  forme: string | null;
  indications: string | null;
  price: number | null;
  description: string | null;
  docUrl: string | null;
  docName: string | null;
  specialtyIds: string[];
  status: string;
  views: number;
  clicks: number;
  createdAt: string;
}

interface Specialty {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  id: "",
  name: "",
  dci: "",
  dosage: "",
  forme: "",
  indications: "",
  price: "",
  description: "",
  docUrl: "",
  docName: "",
  specialtyIds: [] as string[],
};

export default function LaboratoryDashboard() {
  const router = useRouter();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<"products" | "stats" | "premium">("products");

  const [products, setProducts] = useState<LabProduct[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Setup form
  const [fName, setFName] = useState("");
  const [fCity, setFCity] = useState("");
  const [fWilaya, setFWilaya] = useState("");
  const [fAddress, setFAddress] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fWebsite, setFWebsite] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [savingFacility, setSavingFacility] = useState(false);

  // Product form
  const [form, setForm] = useState(EMPTY_FORM);
  const [savingProduct, setSavingProduct] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  };

  const set = (k: keyof typeof EMPTY_FORM, v: string | string[]) =>
    setForm((p) => ({ ...p, [k]: v }) as typeof EMPTY_FORM);

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
      const fRes = await fetch("/api/labs/facility", { cache: "no-store", headers });
      if (fRes.status === 401) {
        router.replace("/login");
        return;
      }
      const fData = await fRes.json().catch(() => ({}));
      const fac = fData.success ? fData.facility : null;
      setFacility(fac);
      if (fac) {
        const pRes = await fetch("/api/labs/products", { cache: "no-store", headers });
        const pData = await pRes.json().catch(() => ({}));
        if (pData.success && Array.isArray(pData.products)) setProducts(pData.products);
        if (Array.isArray(pData.specialties)) setSpecialties(pData.specialties);
      } else {
        const sRes = await fetch("/api/labs/specialties", { cache: "no-store" });
        const sData = await sRes.json().catch(() => ({}));
        if (Array.isArray(sData.specialties)) setSpecialties(sData.specialties);
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
      const res = await fetch("/api/labs/facility", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: fName.trim(),
          city: fCity.trim(),
          wilaya: fWilaya.trim(),
          address: fAddress.trim(),
          phone: fPhone.trim(),
          website: fWebsite.trim(),
          description: fDesc.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Création impossible.");
      setFacility(data.facility);
      loadAll();
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

  const handleDocFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !/^image\//.test(f.type)) {
      setError("Document : PDF ou image uniquement.");
      return;
    }
    if (f.size > 6 * 1024 * 1024) {
      setError("Document trop lourd (max 6 Mo).");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const rd = new FileReader();
      rd.onload = () => resolve(String(rd.result || ""));
      rd.onerror = () => reject(new Error("Lecture impossible."));
      rd.readAsDataURL(f);
    });
    setForm((p) => ({ ...p, docUrl: dataUrl, docName: f.name }));
  };

  const startEdit = (p: LabProduct) => {
    setForm({
      id: p.id,
      name: p.name,
      dci: p.dci || "",
      dosage: p.dosage || "",
      forme: p.forme || "",
      indications: p.indications || "",
      price: p.price != null ? String(p.price) : "",
      description: p.description || "",
      docUrl: p.docUrl || "",
      docName: p.docName || "",
      specialtyIds: p.specialtyIds || [],
    });
    setShowForm(true);
  };

  const handleSaveProduct = async (publish: boolean) => {
    if (!form.name.trim()) {
      setError("Le nom du médicament est requis.");
      return;
    }
    setSavingProduct(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      const payload: any = {
        name: form.name.trim(),
        dci: form.dci.trim() || undefined,
        dosage: form.dosage.trim() || undefined,
        forme: form.forme.trim() || undefined,
        indications: form.indications.trim() || undefined,
        price: form.price.trim() === "" ? null : Number(form.price),
        description: form.description.trim() || undefined,
        docUrl: form.docUrl || undefined,
        docName: form.docName.trim() || undefined,
        specialtyIds: form.specialtyIds,
        status: publish ? "PUBLISHED" : "DRAFT",
      };
      let res: Response;
      if (form.id) {
        res = await fetch("/api/labs/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: form.id, ...payload }),
        });
      } else {
        res = await fetch("/api/labs/products", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(
          data.error === "PAYWALL" && data.message
            ? `${data.message} (voir l'onglet Premium)`
            : data.error || "Enregistrement impossible."
        );
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSavingProduct(false);
    }
  };

  const togglePublish = async (p: LabProduct) => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/labs/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: p.id,
          status: p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.product) {
        setProducts((prev) => prev.map((x) => (x.id === p.id ? data.product : x)));
      } else if (!res.ok) {
        setError(data.error || "Action impossible.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Retirer ce médicament du catalogue ?")) return;
    try {
      const token = await getToken();
      if (!token) return;
      await fetch(`/api/labs/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSpec = (id: string) => {
    setForm((p) => ({
      ...p,
      specialtyIds: p.specialtyIds.includes(id)
        ? p.specialtyIds.filter((x) => x !== id)
        : [...p.specialtyIds, id],
    }));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.push("/login");
  };

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.dci || "").toLowerCase().includes(q)
    );
  });

  const totalViews = products.reduce((n, p) => n + (Number(p.views) || 0), 0);
  const totalClicks = products.reduce((n, p) => n + (Number(p.clicks) || 0), 0);
  const publishedCount = products.filter((p) => p.status === "PUBLISHED").length;

  const specName = (id: string) =>
    specialties.find((s) => s.id === id)?.name || "Spécialité";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-violet-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Link href="/dashboard/laboratory" className="shrink-0">
            <DoctorzBrand isDark={false} size={40} />
          </Link>
          <div className="flex items-center gap-2">
            {facility && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold max-w-[220px] truncate">
                <FlaskConical size={14} className="shrink-0" />
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
          <div className="max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-violet-600 text-white">
                <FlaskConical size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold">Configurer mon laboratoire</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ces informations seront visibles par les médecins et pharmacies.
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
                  Nom du laboratoire *
                </label>
                <input
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="Ex : Biopharm, Taphco..."
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-400 mb-1.5">Ville</label>
                  <input value={fCity} onChange={(e) => setFCity(e.target.value)} placeholder="Alger" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-400 mb-1.5">Wilaya</label>
                  <input value={fWilaya} onChange={(e) => setFWilaya(e.target.value)} placeholder="Alger" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-400 mb-1.5">Adresse</label>
                <input value={fAddress} onChange={(e) => setFAddress(e.target.value)} placeholder="Zone industrielle..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-400 mb-1.5">Téléphone</label>
                  <input value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="+213 ..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-400 mb-1.5">Site web</label>
                  <input value={fWebsite} onChange={(e) => setFWebsite(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500" />
                </div>
              </div>
              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-400 mb-1.5">Présentation</label>
                <textarea rows={2} value={fDesc} onChange={(e) => setFDesc(e.target.value)} placeholder="Présentation du laboratoire..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500 resize-none" />
              </div>
              <PButton variant="primary" isDark={false} type="submit" className="w-full !py-3" disabled={savingFacility}>
                {savingFacility ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                <span>{savingFacility ? "Enregistrement..." : "Enregistrer mon laboratoire"}</span>
              </PButton>
            </form>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <PButton variant={tab === "products" ? "primary" : "secondary"} isDark={false} onClick={() => setTab("products")}>
                <Store size={15} />
                <span>Catalogue ({products.length})</span>
              </PButton>
              <PButton variant={tab === "stats" ? "primary" : "secondary"} isDark={false} onClick={() => setTab("stats")}>
                <Eye size={15} />
                <span>Portée ({totalViews} vues)</span>
              </PButton>
              <PButton variant={tab === "premium" ? "primary" : "secondary"} isDark={false} onClick={() => setTab("premium")}>
                <Crown size={15} />
                <span>Premium</span>
              </PButton>
              <span className="flex-1" />
              <PIconButton title="Actualiser" isDark={false} disabled={refreshing} onClick={refreshData}>
                <RefreshCw size={15} className={refreshing ? "animate-spin text-violet-500" : ""} />
              </PIconButton>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {tab === "products" && (
              <div className="space-y-4">
                {!showForm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setForm(EMPTY_FORM);
                      setShowForm(true);
                    }}
                    className="w-full p-5 rounded-3xl border-2 border-dashed border-violet-300 bg-violet-50/50 hover:bg-violet-50 text-violet-700 text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Plus size={16} /> Ajouter un médicament au catalogue
                  </button>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-bold mb-3">
                      {form.id ? "Modifier le médicament" : "Nouveau médicament"}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                      <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Médicament *" required className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500" />
                      <input value={form.dci} onChange={(e) => set("dci", e.target.value)} placeholder="DCI" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500" />
                      <input value={form.dosage} onChange={(e) => set("dosage", e.target.value)} placeholder="Dosage" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500" />
                      <input value={form.forme} onChange={(e) => set("forme", e.target.value)} placeholder="Forme (cp, sirop...)" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500" />
                      <input value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="Prix (DA)" inputMode="decimal" className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500" />
                      <input value={form.indications} onChange={(e) => set("indications", e.target.value)} placeholder="Indications" className="col-span-2 md:col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500" />
                      <textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Description..." className="col-span-2 md:col-span-4 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-violet-500 resize-none" />
                    </div>

                    <div className="mt-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Destiné à (vide = toutes spécialités)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {specialties.map((s) => {
                          const on = form.specialtyIds.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleSpec(s.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${on ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-500 border-slate-200 hover:border-violet-300"}`}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                        {specialties.length === 0 && (
                          <p className="text-[11px] text-slate-400 italic">Aucune spécialité enregistrée — le produit ira à tous les médecins.</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Document officiel RCP / notice (PDF, optionnel)
                      </p>
                      <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition">
                        <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => handleDocFile(e.target.files?.[0])} />
                        <FileText size={13} />
                        {form.docName ? `📎 ${form.docName}` : "Joindre le PDF officiel"}
                      </label>
                    </div>

                    <div className="mt-3 flex gap-2 flex-wrap">
                      <PButton variant="primary" isDark={false} disabled={savingProduct} onClick={() => handleSaveProduct(true)}>
                        {savingProduct ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        <span>{savingProduct ? "..." : "Publier (notifie les médecins)"}</span>
                      </PButton>
                      <PButton variant="secondary" isDark={false} disabled={savingProduct} onClick={() => handleSaveProduct(false)}>
                        <span>{savingProduct ? "..." : "Brouillon"}</span>
                      </PButton>
                      <button
                        type="button"
                        onClick={() => {
                          setForm(EMPTY_FORM);
                          setShowForm(false);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher dans mon catalogue..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                {filtered.length === 0 ? (
                  <div className="p-10 text-center rounded-3xl border border-slate-200 bg-white">
                    <FlaskConical size={30} className="mx-auto text-slate-300" />
                    <p className="mt-2 text-sm font-bold text-slate-700">Catalogue vide</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Ajoutez vos médicaments ci-dessus : en un clic, tous les médecins ciblés sont notifiés.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map((p) => (
                      <div key={p.id} className="p-4 rounded-2xl border border-slate-200 bg-white">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">
                              {p.name}
                              {p.dosage ? <span className="ml-1.5 font-mono text-[11px] text-slate-400">{p.dosage}</span> : null}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                              {p.dci || "DCI non renseignée"}
                              {p.price != null ? ` • ${Number(p.price)} DA` : ""}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-[11px]">
                              <span className={`px-2 py-0.5 rounded-full font-bold border ${p.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                {p.status === "PUBLISHED" ? "Publié" : "Brouillon"}
                              </span>
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <Eye size={11} /> {p.views}
                              </span>
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <MousePointerClick size={11} /> {p.clicks}
                              </span>
                              {(p.specialtyIds || []).length > 0 && (
                                <span className="text-slate-400 truncate">
                                  → {(p.specialtyIds || []).map(specName).join(", ")}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button type="button" onClick={() => togglePublish(p)} title={p.status === "PUBLISHED" ? "Dépublier" : "Publier"} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer active:scale-95 ${p.status === "PUBLISHED" ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-violet-600 text-white hover:bg-violet-500"}`}>
                              {p.status === "PUBLISHED" ? "Masquer" : "Publier"}
                            </button>
                            <button type="button" onClick={() => startEdit(p)} title="Modifier" className="p-2 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition cursor-pointer active:scale-95">
                              <Pencil size={13} />
                            </button>
                            <button type="button" onClick={() => deleteProduct(p.id)} title="Supprimer" className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer active:scale-95">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "stats" && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white text-center">
                    <p className="text-2xl font-black text-violet-600">{publishedCount}</p>
                    <p className="text-[11px] text-slate-500 font-semibold">Produits publiés</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white text-center">
                    <p className="text-2xl font-black text-blue-600">{totalViews}</p>
                    <p className="text-[11px] text-slate-500 font-semibold">Fiches vues</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white text-center">
                    <p className="text-2xl font-black text-emerald-600">{totalClicks}</p>
                    <p className="text-[11px] text-slate-500 font-semibold">Documents ouverts</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <h2 className="text-sm font-bold mb-3">Portée par produit</h2>
                  {products.length === 0 ? (
                    <p className="text-xs text-slate-400">Aucun produit pour le moment.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {[...products].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0)).map((p) => {
                        const max = Math.max(1, ...products.map((x) => Number(x.views) || 0));
                        return (
                          <div key={p.id}>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="font-bold truncate">{p.name}</span>
                              <span className="text-slate-400 shrink-0 ml-2">{p.views} vues • {p.clicks} docs</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400" style={{ width: `${Math.round(((Number(p.views) || 0) / max) * 100)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "premium" && (
              <SubscribeCard isDark={false} />
            )}
          </>
        )}
      </main>

      <footer className="py-6 text-center text-[11px] text-slate-400">
        DOCTORZ Co. • Espace Laboratoire
      </footer>
    </div>
  );
}
