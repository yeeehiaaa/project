"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from "lucide-react";

// Durée max d'un appel médecin-patient (minutes). Illimité en nombre d'appels/jour.
export const CALL_MAX_MINUTES = 30;

interface VideoRoomProps {
  roomId: string;
  role: "doctor" | "patient";
  displayName: string;
  peerName: string;
  onEnd: (durationSec: number, mode: "video" | "voice") => void;
}

type Phase = "choose" | "joining" | "waiting" | "live" | "ended";
type Mode = "video" | "voice";

function fmt(sec: number): string {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.floor(Math.max(0, sec) % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function VideoRoom({ roomId, role, displayName, peerName, onEnd }: VideoRoomProps) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [mode, setMode] = useState<Mode>("video");
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [remaining, setRemaining] = useState(CALL_MAX_MINUTES * 60);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const connRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const endedRef = useRef(false);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try { callRef.current?.close(); } catch { /* ignore */ }
    try { connRef.current?.close(); } catch { /* ignore */ }
    try { peerRef.current?.destroy(); } catch { /* ignore */ }
    streamRef.current?.getTracks().forEach((t) => {
      try { t.stop(); } catch { /* ignore */ }
    });
    streamRef.current = null;
  }, []);

  const finish = useCallback(
    (notify: boolean) => {
      if (endedRef.current) return;
      endedRef.current = true;
      const secs = startRef.current
        ? Math.round((Date.now() - startRef.current) / 1000)
        : 0;
      if (notify) {
        try { connRef.current?.send({ type: "end" }); } catch { /* ignore */ }
      }
      cleanup();
      setDuration(secs);
      setPhase("ended");
    },
    [cleanup]
  );

  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Compte à rebours : démarre à la connexion, coupe à 0.
  const startTimer = useCallback(() => {
    startRef.current = Date.now();
    const total = CALL_MAX_MINUTES * 60;
    setRemaining(total);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const left = total - elapsed;
      setRemaining(left);
      if (left <= 0) finishRef.current(true);
    }, 1000);
  }, []);

  const attachRemote = useCallback((stream: MediaStream) => {
    const vTracks = stream.getVideoTracks();
    setHasRemoteVideo(vTracks.length > 0 && vTracks.some((t) => t.enabled));
    const el = remoteVideoRef.current;
    if (el) {
      el.srcObject = stream;
      el.play().catch(() => { /* autoplay bloqué : l'utilisateur cliquera */ });
    }
    setPhase((p) => (p === "live" ? p : "live"));
    if (!startRef.current) startTimer();
  }, [startTimer]);

  const start = useCallback(
    async (m: Mode) => {
      setMode(m);
      setError("");
      setPhase("joining");
      try {
        const { Peer } = await import("peerjs");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: m === "video",
        });
        streamRef.current = stream;
        if (localVideoRef.current && m === "video") {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        const hostId = `dz-call-${roomId}`;
        const myId =
          role === "doctor" ? hostId : `${hostId}-p${Math.random().toString(36).slice(2, 8)}`;
        const peer = new Peer(myId, {
          debug: 0,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
              {
                urls: "turn:openrelay.metered.ca:80",
                username: "openrelayproject",
                credential: "openrelayproject",
              },
              {
                urls: "turn:openrelay.metered.ca:443",
                username: "openrelayproject",
                credential: "openrelayproject",
              },
            ],
          },
        });
        peerRef.current = peer;

        peer.on("error", (err: any) => {
          const type = String(err?.type || "");
          if (type === "unavailable-id") {
            setError("Une session est déjà ouverte pour ce rendez-vous.");
            setPhase("choose");
          } else if (type === "peer-unavailable") {
            // Médecin pas encore en ligne : on réessaie (patient).
            setPhase("waiting");
          } else if (!endedRef.current && phase !== "live") {
            setError("Connexion impossible. Vérifiez le réseau puis réessayez.");
            setPhase("choose");
          }
        });

        if (role === "doctor") {
          // Hôte : décroche les appels entrants du patient.
          peer.on("call", (call: any) => {
            callRef.current = call;
            call.answer(streamRef.current || undefined);
            call.on("stream", (remote: MediaStream) => attachRemote(remote));
            setPhase("live");
          });
          peer.on("connection", (conn: any) => {
            connRef.current = conn;
            conn.on("data", (d: any) => {
              if (d?.type === "end") finishRef.current(false);
            });
          });
          peer.on("open", () => setPhase("waiting"));
        } else {
          // Patient : appelle l'hôte (médecin), réessaie jusqu'à sa présence.
          const attempt = () => {
            if (endedRef.current || !peerRef.current || peer.destroyed) return;
            try {
              const conn = peer.connect(hostId, { reliable: true });
              connRef.current = conn;
              conn.on("open", () => {
                const call = peer.call(hostId, streamRef.current || undefined as any);
                if (!call) {
                  setPhase("waiting");
                  setTimeout(attempt, 4000);
                  return;
                }
                callRef.current = call;
                call.on("stream", (remote: MediaStream) => attachRemote(remote));
                setPhase("live");
              });
              conn.on("data", (d: any) => {
                if (d?.type === "end") finishRef.current(false);
              });
              conn.on("error", () => setTimeout(attempt, 4000));
            } catch {
              setTimeout(attempt, 4000);
            }
          };
          peer.on("open", () => {
            setPhase("waiting");
            attempt();
          });
        }
      } catch (e) {
        console.error("call start failed:", e);
        setError(
          "Caméra/micro inaccessibles. Autorisez l'accès puis réessayez (connexion HTTPS ou localhost requise)."
        );
        setPhase("choose");
      }
    },
    [roomId, role, attachRemote]
  );

  // Nettoyage à la fermeture.
  useEffect(() => {
    return () => {
      endedRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  // Heartbeat : si l'onglet se ferme en plein appel, on journalise quand même.
  useEffect(() => {
    const h = () => {
      if (startRef.current && !endedRef.current) {
        const secs = Math.round((Date.now() - startRef.current) / 1000);
        try {
          const blob = new Blob(
            [JSON.stringify({ appointmentId: roomId, mode, durationSec: secs })],
            { type: "application/json" }
          );
          navigator.sendBeacon("/api/calls/log", blob);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [roomId, mode]);

  const toggleMute = () => {
    const t = streamRef.current?.getAudioTracks()[0];
    if (t) {
      t.enabled = !t.enabled;
      setMuted(!t.enabled);
    }
  };
  const toggleCam = () => {
    const t = streamRef.current?.getVideoTracks()[0];
    if (t) {
      t.enabled = !t.enabled;
      setCamOff(!t.enabled);
    }
  };

  const lowTime = remaining <= 5 * 60;

  return (
    <div className="flex flex-col h-full min-h-[480px] bg-slate-950 text-white rounded-2xl overflow-hidden">
      {phase === "choose" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl font-bold text-indigo-300">
            {peerName.charAt(0) || "?"}
          </div>
          <div>
            <p className="font-bold text-lg">{peerName}</p>
            <p className="text-xs text-slate-400 mt-1">
              Appel {mode === "video" ? "vidéo" : "vocal"} • max {CALL_MAX_MINUTES} min par appel • illimité par jour
            </p>
          </div>
          {error && (
            <p className="text-xs font-semibold text-rose-400 max-w-sm">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => start("video")}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition cursor-pointer active:scale-95"
            >
              📹 Appel vidéo
            </button>
            <button
              type="button"
              onClick={() => start("voice")}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold transition cursor-pointer active:scale-95"
            >
              📞 Appel vocal
            </button>
          </div>
        </div>
      )}

      {(phase === "joining" || phase === "waiting") && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <Loader2 size={28} className="animate-spin text-indigo-400" />
          <p className="text-sm font-semibold">
            {phase === "joining" ? "Accès caméra/micro..." : `En attente de ${peerName}...`}
          </p>
          <p className="text-[11px] text-slate-500">Gardez cet onglet ouvert.</p>
          <button
            type="button"
            onClick={() => {
              cleanup();
              setPhase("choose");
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Annuler
          </button>
        </div>
      )}

      {phase === "live" && (
        <>
          <div className="px-4 py-2.5 flex items-center justify-between bg-slate-900 border-b border-slate-800">
            <p className="text-xs font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {peerName} • {mode === "video" ? "Vidéo" : "Vocal"}
            </p>
            <p className={`font-mono text-sm font-bold px-2.5 py-1 rounded-lg ${lowTime ? "bg-rose-600/20 text-rose-300" : "bg-slate-800 text-slate-200"}`}>
              {fmt(remaining)}
            </p>
          </div>

          {lowTime && (
            <p className="px-4 py-1.5 text-[11px] font-semibold text-amber-300 bg-amber-500/10 text-center">
              Fin d'appel dans {fmt(remaining)} — concluez la consultation.
            </p>
          )}

          <div className="flex-1 relative bg-black min-h-[320px] flex items-center justify-center">
            {mode === "video" && hasRemoteVideo ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="h-20 w-20 rounded-2xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-2xl font-bold animate-pulse">
                  {peerName.charAt(0) || "?"}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {mode === "voice" ? "Appel vocal en cours" : "Caméra du correspondant coupée"}
                </p>
              </div>
            )}
            {mode === "video" && !camOff && (
              <video
                ref={localVideoRef}
                autoPlay playsInline muted
                className="absolute bottom-3 right-3 w-32 h-24 rounded-xl bg-slate-800 border border-slate-700 object-cover"
              />
            )}
            <div className="absolute bottom-3 left-3 text-[10px] bg-black/60 px-2 py-1 rounded-lg font-medium">
              Vous ({displayName})
            </div>
          </div>

          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={toggleMute}
              title={muted ? "Réactiver le micro" : "Couper le micro"}
              className={`p-3 rounded-full transition cursor-pointer ${muted ? "bg-rose-600" : "bg-slate-700 hover:bg-slate-600"}`}
            >
              {muted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            {mode === "video" && (
              <button
                type="button"
                onClick={toggleCam}
                title={camOff ? "Réactiver la caméra" : "Couper la caméra"}
                className={`p-3 rounded-full transition cursor-pointer ${camOff ? "bg-rose-600" : "bg-slate-700 hover:bg-slate-600"}`}
              >
                {camOff ? <VideoOff size={18} /> : <Video size={18} />}
              </button>
            )}
            <button
              type="button"
              onClick={() => finish(true)}
              title="Raccrocher"
              className="px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-500 font-semibold text-sm transition cursor-pointer active:scale-95"
            >
              <PhoneOff size={18} />
            </button>
          </div>
        </>
      )}

      {phase === "ended" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="h-14 w-14 rounded-full bg-slate-800 flex items-center justify-center">
            <PhoneOff size={22} className="text-slate-400" />
          </div>
          <p className="font-bold">Appel terminé</p>
          <p className="text-xs text-slate-400">
            Durée : {fmt(duration)} • {mode === "video" ? "vidéo" : "vocal"}
          </p>
          <button
            type="button"
            onClick={() => onEndRef.current(duration, mode)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
