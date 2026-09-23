"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, FlaskConical, MessageSquare, Stethoscope } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LabNotifProduct {
  id: string;
  name: string;
  dosage: string | null;
  price: number | null;
  labName: string;
}

interface LabNotifPost {
  id: string;
  kind: string;
  title: string | null;
  snippet: string;
  authorName: string;
}

interface LabNotif {
  id: string;
  read: boolean;
  createdAt: string;
  product?: LabNotifProduct;
  postId?: string;
  post?: LabNotifPost | null;
  teleExpertiseId?: string;
}

// Cloche "Nouveautés laboratoires" : un clic sur un médicament
// ouvre sa fiche sur une page dédiée (pas de modale sur le dashboard).
export default function DoctorLabNotifs({ isDark }: { isDark: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<LabNotif[]>([]);
  const [unread, setUnread] = useState(0);

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  };

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/labs/notifications", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setNotifs(Array.isArray(data.notifications) ? data.notifications : []);
        setUnread(Number(data.unread) || 0);
      }
    } catch {
      // silencieux : la cloche reste à zéro
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const markAllRead = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await fetch("/api/labs/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ all: true }),
      });
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      // ignore
    }
  };

  const openNotif = async (n: LabNotif) => {
    try {
      const token = await getToken();
      if (token && !n.read) {
        await fetch("/api/labs/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: n.id }),
        });
        setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        setUnread((u) => Math.max(0, u - 1));
      }
    } catch {
      // ignore
    }
    setOpen(false);
    // Demande d'avis → onglet Communauté, section Expertises.
    if (n.teleExpertiseId) {
      try {
        sessionStorage.setItem("doctor-community-section", "expertises");
      } catch {
        // ignore
      }
      window.dispatchEvent(new CustomEvent("doctor-community-open", { detail: {} }));
      return;
    }
    // Mention communauté → onglet Communauté + surlignage du post.
    if (n.postId) {
      window.dispatchEvent(
        new CustomEvent("doctor-community-open", { detail: { postId: n.postId } })
      );
      return;
    }
    if (n.product) {
      router.push(`/dashboard/doctor/products/${encodeURIComponent(n.product.id)}`);
    }
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        title="Nouveautés laboratoires"
        className={`relative p-2 rounded-xl transition cursor-pointer ${
          isDark
            ? "text-slate-300 hover:text-white hover:bg-white/10"
            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        }`}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 top-11 z-50 w-[340px] max-w-[90vw] rounded-2xl border shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? "border-slate-800" : "border-slate-100"}`}>
              <p className="text-xs font-bold flex items-center gap-1.5">
                <FlaskConical size={13} className="text-violet-500" />
                Nouveautés laboratoires
                {unread > 0 && <span className="text-rose-500">({unread})</span>}
              </p>
              {unread > 0 && (
                <button type="button" onClick={markAllRead} className="text-[11px] font-semibold text-sky-500 hover:underline cursor-pointer">
                  Tout marquer lu
                </button>
              )}
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {notifs.length === 0 ? (
                <p className="p-5 text-center text-[11px] text-slate-400">
                  Aucune nouveauté pour votre spécialité pour le moment.
                </p>
              ) : (
                notifs.map((n) =>
                  n.teleExpertiseId ? (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openNotif(n)}
                      className={`w-full text-left px-4 py-3 border-b transition cursor-pointer ${isDark ? "border-slate-800 hover:bg-slate-800/60" : "border-slate-100 hover:bg-slate-50"} ${!n.read ? (isDark ? "bg-emerald-500/5" : "bg-emerald-50/60") : ""}`}
                    >
                      <p className="text-xs font-bold flex items-center gap-1.5">
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />}
                        <Stethoscope size={11} className="text-emerald-500 shrink-0" />
                        <span className="truncate">Demande d'avis médical</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                        Un confrère sollicite votre expertise
                      </p>
                    </button>
                  ) : n.postId ? (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openNotif(n)}
                      className={`w-full text-left px-4 py-3 border-b transition cursor-pointer ${isDark ? "border-slate-800 hover:bg-slate-800/60" : "border-slate-100 hover:bg-slate-50"} ${!n.read ? (isDark ? "bg-sky-500/5" : "bg-sky-50/60") : ""}`}
                    >
                      <p className="text-xs font-bold flex items-center gap-1.5">
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />}
                        <MessageSquare size={11} className="text-sky-500 shrink-0" />
                        <span className="truncate">
                          {n.post?.authorName || "Un confrère"} vous a mentionné
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                        {n.post?.title || n.post?.snippet || "Voir la discussion"}
                      </p>
                    </button>
                  ) : n.product ? (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openNotif(n)}
                      className={`w-full text-left px-4 py-3 border-b transition cursor-pointer ${isDark ? "border-slate-800 hover:bg-slate-800/60" : "border-slate-100 hover:bg-slate-50"} ${!n.read ? (isDark ? "bg-violet-500/5" : "bg-violet-50/60") : ""}`}
                    >
                      <p className="text-xs font-bold flex items-center gap-1.5">
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />}
                        <span className="truncate">{n.product.name}</span>
                        {n.product.dosage && <span className="font-mono font-normal text-slate-400 shrink-0">{n.product.dosage}</span>}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                        {n.product.labName}
                        {n.product.price != null ? ` • ${Number(n.product.price)} DA` : ""}
                      </p>
                    </button>
                  ) : null
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
