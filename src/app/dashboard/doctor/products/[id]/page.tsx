"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, FileText, X, FlaskConical } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DoctorzBrand from "@/components/brand/DoctorzBrand";

interface ProductDetail {
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
  labName: string;
  labCity: string;
  labWilaya: string;
  labPhone: string;
  labWebsite: string;
  targetNames: string[];
  createdAt: string;
}

export default function DoctorProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = String((params as any)?.id || "");
  const [isDark, setIsDark] = useState(false);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [docView, setDocView] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mediconnect_doctor_theme");
      setIsDark(saved ? saved === "dark" : true);
    } catch {
      setIsDark(true);
    }
  }, []);

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  };

  const track = useCallback(
    async (kind: "view" | "click") => {
      try {
        const token = await getToken();
        if (!token) return;
        await fetch("/api/labs/track", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId, kind }),
        });
      } catch {
        // ignore
      }
    },
    [productId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Session expirée, reconnectez-vous.");
      const res = await fetch(`/api/labs/product/${encodeURIComponent(productId)}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.product) {
        throw new Error(data.error || "Fiche introuvable.");
      }
      setProduct(data.product);
      track("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [productId, track]);

  useEffect(() => {
    load();
  }, [load]);

  const openDoc = async () => {
    if (!product?.docUrl) return;
    try {
      const blob = await (await fetch(product.docUrl)).blob();
      setDocView({ url: URL.createObjectURL(blob), name: product.docName || "document.pdf" });
      track("click");
    } catch {
      setError("Impossible d'ouvrir le document.");
    }
  };

  const closeDoc = () => {
    if (docView && docView.url.startsWith("blob:")) {
      try { URL.revokeObjectURL(docView.url); } catch { /* ignore */ }
    }
    setDocView(null);
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <header className={`sticky top-0 z-40 px-4 sm:px-6 py-3.5 border-b backdrop-blur-md ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-white/95 border-slate-200"}`}>
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link href="/dashboard/doctor" className="shrink-0">
            <DoctorzBrand isDark={isDark} size={36} />
          </Link>
          <button
            type="button"
            onClick={() => router.push("/dashboard/doctor")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-95 ${
              isDark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ArrowLeft size={14} />
            Retour au tableau de bord
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex py-24 items-center justify-center">
            <Loader2 size={30} className="animate-spin text-violet-500" />
          </div>
        ) : error || !product ? (
          <div className={`p-10 text-center rounded-3xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <FlaskConical size={30} className="mx-auto text-slate-400" />
            <p className="mt-3 font-bold">Fiche indisponible</p>
            <p className="mt-1 text-xs text-slate-400">{error || "Produit introuvable."}</p>
            <div className="mt-4 flex gap-2 justify-center">
              <button
                type="button"
                onClick={load}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 transition cursor-pointer"
              >
                Réessayer
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/doctor")}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-500/10 transition cursor-pointer"
              >
                Retour
              </button>
            </div>
          </div>
        ) : (
          <div className={`rounded-3xl border shadow-sm overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className={`p-6 border-b ${isDark ? "border-slate-800 bg-violet-500/5" : "border-slate-100 bg-violet-50/60"}`}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-violet-500 flex items-center gap-1.5">
                <FlaskConical size={12} /> Nouveauté laboratoire • {product.labName}
              </p>
              <h1 className="mt-1 text-2xl font-black">{product.name}</h1>
              {product.dci && <p className="mt-0.5 text-sm text-slate-400">DCI : {product.dci}</p>}
              {product.price != null && (
                <p className="mt-3 inline-block px-4 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black text-lg">
                  {Number(product.price)} DA
                </p>
              )}
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex flex-wrap gap-1.5">
                {product.dosage && <span className="px-2.5 py-1 rounded-lg bg-slate-500/10 border border-slate-500/20 font-mono text-xs">{product.dosage}</span>}
                {product.forme && <span className="px-2.5 py-1 rounded-lg bg-slate-500/10 border border-slate-500/20 text-xs">{product.forme}</span>}
                {(product.targetNames || []).map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-300 text-xs font-semibold">{t}</span>
                ))}
              </div>
              {product.indications && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Indications</p>
                  <p className="mt-1">{product.indications}</p>
                </div>
              )}
              {product.description && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Présentation</p>
                  <p className="mt-1 text-slate-400">{product.description}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Laboratoire</p>
                <p className="mt-1 font-semibold">
                  {product.labName}
                  {[product.labCity, product.labWilaya].filter(Boolean).join(", ") ? ` • ${[product.labCity, product.labWilaya].filter(Boolean).join(", ")}` : ""}
                </p>
                {(product.labPhone || product.labWebsite) && (
                  <p className="text-slate-400 text-xs mt-0.5">
                    {product.labPhone ? `☎ ${product.labPhone}` : ""}{product.labPhone && product.labWebsite ? " • " : ""}{product.labWebsite || ""}
                  </p>
                )}
              </div>
              {product.docUrl && (
                <button
                  type="button"
                  onClick={openDoc}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition cursor-pointer active:scale-[0.98]"
                >
                  <FileText size={16} /> 📄 Document officiel (RCP / notice)
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {docView && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDoc();
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <p className="text-xs font-bold truncate">📄 {docView.name}</p>
              <button type="button" onClick={closeDoc} className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <iframe src={docView.url} title={docView.name} className="w-full h-[75vh] bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}
