"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageCircle, BadgeCheck, FlaskConical } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DoctorzBrand from "@/components/brand/DoctorzBrand";

interface DocProfile {
  id: string;
  name: string;
  specialties: string[];
  verified: boolean;
  yearsExperience: number | null;
  followers: number;
  following: number;
  isFollowing: boolean;
  isSelf: boolean;
  posts: number;
  likes: number;
  recent: { id: string; kind: string; title: string | null; snippet: string; createdAt: string }[];
}

// Profil public d'un confrère : publications, Suivre, Message.
export default function DoctorPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = String((params as any)?.id || "");
  const [isDark, setIsDark] = useState(true);
  const [profile, setProfile] = useState<DocProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Session expirée, reconnectez-vous.");
      const res = await fetch(`/api/community/doctor/${encodeURIComponent(doctorId)}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Profil introuvable.");
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFollow = async () => {
    if (!profile || profile.isSelf) return;
    setActing(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/community/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ followedId: profile.id }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.success) {
        setProfile((p) =>
          p
            ? {
                ...p,
                isFollowing: !!d.following,
                followers: p.followers + (d.following ? 1 : -1),
              }
            : p
        );
      }
    } finally {
      setActing(false);
    }
  };

  // Message : discussion 1:1 (créée si besoin) puis messagerie ouverte dessus.
  const openMessage = async () => {
    if (!profile || profile.isSelf) return;
    setActing(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/doctor-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "get_or_create_colleague", doctorId: profile.id }),
      });
      const d = await res.json().catch(() => ({}));
      const convId = d?.thread?.id ? String(d.thread.id) : "";
      if (d.success && convId) {
        try {
          sessionStorage.setItem("doctor-open-tab", "messenger");
          sessionStorage.setItem("doctor-open-conv", convId);
        } catch {
          // ignore
        }
      }
      router.push("/dashboard/doctor");
    } finally {
      setActing(false);
    }
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
            Retour
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex py-24 items-center justify-center">
            <Loader2 size={30} className="animate-spin text-violet-500" />
          </div>
        ) : error || !profile ? (
          <div className={`p-10 text-center rounded-3xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <p className="font-bold">Profil indisponible</p>
            <p className="mt-1 text-xs text-slate-400">{error || "Médecin introuvable."}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-6 rounded-3xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-white text-xl font-black shrink-0">
                  {profile.name.replace(/^Dr\.\s*/, "").charAt(0) || "D"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-lg flex items-center gap-1.5 flex-wrap">
                    {profile.name}
                    {profile.verified && (
                      <span title="Praticien vérifié" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-sky-500/15 text-sky-500 border border-sky-500/30 text-[10px] font-black">
                        <BadgeCheck size={11} /> Vérifié
                      </span>
                    )}
                  </p>
                  {(profile.specialties || []).length > 0 && (
                    <p className="text-xs text-violet-500 font-semibold">{profile.specialties.join(" • ")}</p>
                  )}
                  {profile.yearsExperience != null && (
                    <p className="text-[11px] text-slate-400">{profile.yearsExperience} ans d'expérience</p>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                {[
                  { v: profile.posts, l: "Posts" },
                  { v: profile.likes, l: "J'aime" },
                  { v: profile.followers, l: "Suivis" },
                  { v: profile.following, l: "Suit" },
                ].map((s) => (
                  <div key={s.l} className={`p-2.5 rounded-2xl ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
                    <p className="text-lg font-black">{s.v}</p>
                    <p className="text-[10px] text-slate-400">{s.l}</p>
                  </div>
                ))}
              </div>
              {!profile.isSelf && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={toggleFollow}
                    disabled={acting}
                    className={`py-2.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-[0.98] disabled:opacity-50 ${profile.isFollowing ? (isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600") : "text-white bg-gradient-to-r from-emerald-500 to-teal-400"}`}
                  >
                    {profile.isFollowing ? "✓ Suivi" : "+ Suivre"}
                  </button>
                  <button
                    type="button"
                    onClick={openMessage}
                    disabled={acting}
                    className="py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-sky-500 to-blue-500 transition cursor-pointer active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle size={13} /> Message
                  </button>
                </div>
              )}
            </div>

            <div className={`p-5 rounded-3xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FlaskConical size={12} className="text-violet-500" /> Publications récentes
              </p>
              {profile.recent.length === 0 ? (
                <p className="mt-2 text-[11px] text-slate-400 italic">Aucune publication pour le moment.</p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {profile.recent.map((r) => (
                    <div key={r.id} className={`px-3 py-2 rounded-2xl border ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                      <p className="text-[11px] font-bold truncate">
                        {r.kind !== "POST" && <span className="mr-1.5 px-1.5 py-px rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-500 text-[9px]">{r.kind}</span>}
                        {r.title || r.snippet}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
