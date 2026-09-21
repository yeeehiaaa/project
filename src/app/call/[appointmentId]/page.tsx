"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Video } from "lucide-react";
import { supabase } from "@/lib/supabase";
import VideoRoom from "@/components/call/VideoRoom";

interface Gate {
  role: "doctor" | "patient";
  appointment: {
    id: string;
    status: string;
    appointmentDate: string;
    doctorName: string;
    patientName: string;
  };
}

export default function CallPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = String((params as any)?.appointmentId || "");
  const [gate, setGate] = useState<Gate | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          router.replace("/login");
          return;
        }
        const res = await fetch(`/api/calls/${encodeURIComponent(appointmentId)}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Accès à l'appel impossible.");
        }
        setGate(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Accès impossible.");
      } finally {
        setLoading(false);
      }
    })();
  }, [appointmentId, router]);

  const logCall = useCallback(
    async (durationSec: number, mode: "video" | "voice") => {
      try {
        const token = await getToken();
        if (!token) return;
        await fetch("/api/calls/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ appointmentId, mode, durationSec }),
        });
      } catch {
        // journalisation non bloquante
      }
    },
    [appointmentId]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  if (error || !gate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-sm w-full rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
          <Video size={30} className="mx-auto text-slate-500" />
          <p className="mt-3 font-bold">Appel indisponible</p>
          <p className="mt-1 text-xs text-slate-400">{error || "Rendez-vous introuvable."}</p>
          <Link
            href="/dashboard/patient/appointments"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold transition"
          >
            <ArrowLeft size={14} /> Mes rendez-vous
          </Link>
        </div>
      </div>
    );
  }

  const isDoctor = gate.role === "doctor";
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Retour
          </button>
          <p className="text-[11px] text-slate-500">
            Téléconsultation • {new Date(gate.appointment.appointmentDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <VideoRoom
          roomId={gate.appointment.id}
          role={gate.role}
          displayName={isDoctor ? gate.appointment.doctorName : gate.appointment.patientName}
          peerName={isDoctor ? gate.appointment.patientName : gate.appointment.doctorName}
          onEnd={(secs, mode) => {
            logCall(secs, mode);
            router.back();
          }}
        />
      </div>
    </div>
  );
}
