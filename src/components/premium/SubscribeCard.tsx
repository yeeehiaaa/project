"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Crown, Loader2, X, CreditCard } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Lang = "fr" | "en";

const T: Record<Lang, Record<string, string>> = {
  fr: {
    title: "Mon abonnement",
    monthly: "Mensuel",
    yearly: "Annuel -20%",
    free: "Free",
    current: "Votre compte actuel",
    included: "(inclus)",
    perMonth: "/mois",
    perYear: "/an",
    subscribe: "S'abonner",
    activeUntil: "Actif jusqu'au",
    cancel: "Résilier",
    cancelConfirm: "Résilier l'abonnement premium ?",
    testPay: "Paiement test",
    testHint: "Mode test (sans banque)",
    expiresAuto: "expire auto",
    pay: "Payer",
    testSuffix: "(test)",
    paying: "Paiement...",
    removeFile: "",
    sessionExpired: "Session expirée, reconnectez-vous.",
    startFail: "Impossible de démarrer.",
    payRefused: "Paiement refusé.",
  },
  en: {
    title: "My subscription",
    monthly: "Monthly",
    yearly: "Yearly -20%",
    free: "Free",
    current: "Your current plan",
    included: "(included)",
    perMonth: "/mo",
    perYear: "/yr",
    subscribe: "Subscribe",
    activeUntil: "Active until",
    cancel: "Cancel",
    cancelConfirm: "Cancel the premium subscription?",
    testPay: "Test payment",
    testHint: "Test mode (no bank)",
    expiresAuto: "auto expiry",
    pay: "Pay",
    testSuffix: "(test)",
    paying: "Paying...",
    removeFile: "",
    sessionExpired: "Session expired, please sign in again.",
    startFail: "Unable to start.",
    payRefused: "Payment declined.",
  },
};

interface SubState {
  premium: boolean;
  plan?: { monthly: number; yearly: number; free: string[]; premium: string[] };
  subscription?: { plan: string; status: string; cycle?: string; expiresAt?: string };
  quotas?: { videoRemaining: number };
}

// Carte Freemium : 2 colonnes (Free / Premium) + abonnement test
// CIB / EDAHABIA. Réutilisée dans les 4 profils.
export default function SubscribeCard({
  isDark,
  lang = "fr",
}: {
  isDark: boolean;
  lang?: Lang;
}) {
  const t = T[lang];
  const [sub, setSub] = useState<SubState | null>(null);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [payOpen, setPayOpen] = useState(false);
  const [provider, setProvider] = useState<"CIB" | "EDAHABIA">("CIB");
  const [pendingId, setPendingId] = useState("");
  const [amount, setAmount] = useState(0);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

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
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/subscriptions", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) setSub(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startSubscribe = async () => {
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error(t.sessionExpired);
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cycle }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || t.startFail);
      setPendingId(data.subscriptionId);
      setAmount(data.amount);
      setPayOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    }
  };

  const confirmPay = async () => {
    setPaying(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error(t.sessionExpired);
      const res = await fetch("/api/subscriptions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subscriptionId: pendingId, provider }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || t.payRefused);
      setPayOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.payRefused);
    } finally {
      setPaying(false);
    }
  };

  const cancelSub = async () => {
    if (!confirm(t.cancelConfirm)) return;
    try {
      const token = await getToken();
      if (!token) return;
      await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      load();
    } catch {
      // ignore
    }
  };

  const card = isDark ? "bg-slate-900/85 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900";

  if (loading || !sub?.plan) {
    return (
      <div className={`p-6 rounded-3xl border flex items-center justify-center ${card}`}>
        <Loader2 size={22} className="animate-spin text-amber-500" />
      </div>
    );
  }

  const price = cycle === "YEARLY" ? sub.plan.yearly : sub.plan.monthly;

  return (
    <div className={`p-6 rounded-3xl border shadow-md ${card}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Crown size={17} className="text-amber-500" />
          {t.title}
          {sub.premium ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-white">
              PREMIUM
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-500"}`}>
              FREE
            </span>
          )}
        </h3>
        <div className={`flex rounded-xl p-0.5 text-[11px] font-bold ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
          {(["MONTHLY", "YEARLY"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCycle(c)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${cycle === c ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-white" : "text-slate-400"}`}
            >
              {c === "MONTHLY" ? t.monthly : t.yearly}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-[11px] font-semibold text-rose-500">{error}</p>
      )}

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div className={`p-4 rounded-2xl border ${isDark ? "border-slate-700 bg-slate-950/50" : "border-slate-200 bg-slate-50"}`}>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">{t.free}</p>
          <p className="mt-1 text-2xl font-black">0 DA</p>
          <ul className="mt-2 space-y-1.5 text-[11px]">
            {sub.plan.free.map((f) => (
              <li key={f} className="flex items-start gap-1.5">
                <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" /> {f}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] font-bold text-slate-400">{t.current}{!sub.premium ? "" : ` ${t.included}`}</p>
        </div>
        <div className="p-4 rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-500/10 to-transparent relative">
          <p className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
            <Crown size={12} /> Premium
          </p>
          <p className="mt-1 text-2xl font-black">
            {price.toLocaleString("fr-FR")} DA
            <span className="text-[11px] font-medium text-slate-400">{cycle === "YEARLY" ? t.perYear : t.perMonth}</span>
          </p>
          <ul className="mt-2 space-y-1.5 text-[11px]">
            {sub.plan.premium.map((f) => (
              <li key={f} className="flex items-start gap-1.5">
                <Check size={12} className="mt-0.5 shrink-0 text-amber-500" /> {f}
              </li>
            ))}
          </ul>
          {sub.premium ? (
            <div className="mt-3">
              <p className="text-[11px] text-slate-400">
                {t.activeUntil} {sub.subscription?.expiresAt ? new Date(sub.subscription.expiresAt).toLocaleDateString("fr-FR") : "—"}
              </p>
              <button
                type="button"
                onClick={cancelSub}
                className="mt-1.5 text-[11px] font-semibold text-rose-500 underline cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startSubscribe}
              className="mt-3 w-full py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 transition cursor-pointer active:scale-[0.98]"
            >
              {t.subscribe} — {price.toLocaleString("fr-FR")} DA
            </button>
          )}
        </div>
      </div>

      {payOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setPayOpen(false);
          }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className={`w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm flex items-center gap-1.5">
                  <CreditCard size={15} className="text-amber-500" /> {t.testPay}
                </h4>
                <button type="button" onClick={() => setPayOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer">
                  <X size={15} />
                </button>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {t.testHint} — {amount.toLocaleString("fr-FR")} DA • {t.expiresAuto}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(["CIB", "EDAHABIA"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={`py-2.5 rounded-xl text-xs font-black border transition cursor-pointer ${provider === p ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-transparent" : isDark ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"}`}
                  >
                    {p === "CIB" ? "💳 CIB" : "💳 EDAHABIA"}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <input defaultValue="4111 1111 1111 1111" className={`w-full px-3 py-2.5 rounded-xl border font-mono focus:outline-none focus:border-amber-400 ${isDark ? "bg-slate-950 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`} />
                <div className="grid grid-cols-2 gap-2">
                  <input defaultValue="12/28" className={`px-3 py-2.5 rounded-xl border font-mono focus:outline-none focus:border-amber-400 ${isDark ? "bg-slate-950 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`} />
                  <input defaultValue="123" className={`px-3 py-2.5 rounded-xl border font-mono focus:outline-none focus:border-amber-400 ${isDark ? "bg-slate-950 border-slate-700 text-white" : "bg-slate-50 border-slate-200"}`} />
                </div>
              </div>
              {error && <p className="mt-2 text-[11px] font-semibold text-rose-500">{error}</p>}
              <button
                type="button"
                onClick={confirmPay}
                disabled={paying}
                className="mt-3 w-full py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 transition cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {paying ? t.paying : `${t.pay} ${amount.toLocaleString("fr-FR")} DA ${t.testSuffix}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
