"use client";

import { useState, useRef, useEffect, useMemo, useCallback, Fragment } from "react";
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  CheckCheck,
  Phone,
  Video,
  FileText,
  Users,
  UserPlus,
  Plus,
  FlaskConical,
  Pill,
  ClipboardList,
  Stethoscope,
  X,
  Info,
  ShieldCheck,
  User,
  HeartPulse,
  Download,
  Check,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import {
  Conversation,
  DoctorContact,
  PatientContact,
  Message,
} from "@/types/messenger";
import { supabase } from "@/lib/supabase";
import {
  ALL_REGISTERED_DOCTORS,
  ALL_REGISTERED_PATIENTS,
  loadConversationsFromStorage,
  saveConversationsToStorage,
} from "@/lib/messenger-data";

let counterSeq = 10000;
function createDeterministicId(prefix: string): string {
  counterSeq += 1;
  // Globally unique across doctors and browsers so the server reuses the SAME
  // id for a message. Without this, the 5s poll merges the server copy as a
  // "new" message and the sender sees everything twice.
  return `${prefix}-${Date.now().toString(36)}-${counterSeq}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function getFormattedTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Pièce jointe issue de la messagerie directe DB (fichier ou élément
// médical partagé par le patient). Rendu distinct des pièces legacy.
function DbAttachmentView({ att, isMe, isDark }: { att: any; isMe: boolean; isDark: boolean }) {
  if (!att || (att.type !== "file" && att.type !== "share")) return null;

  const box = isMe
    ? "bg-white/10 border-white/20 text-white"
    : isDark
      ? "bg-slate-900 border-slate-700 text-slate-200"
      : "bg-white border-slate-200 text-slate-700";

  if (att.type === "file") {
    const isImage = String(att.mime || "").startsWith("image/");
    if (isImage && att.url) {
      return (
        <div className="mb-2 overflow-hidden rounded-xl">
          <a href={att.url} target="_blank" rel="noreferrer">
            <img src={att.url} alt={att.name || "image"} className="max-w-full max-h-56 object-cover" />
          </a>
          <div className={`flex items-center justify-between gap-2 px-2 py-1.5 text-[10px] border border-t-0 rounded-b-xl ${box}`}>
            <span className="truncate font-medium">{att.name}</span>
            <a href={att.url} download title="Télécharger" className="shrink-0 underline">
              <Download size={12} />
            </a>
          </div>
        </div>
      );
    }
    return (
      <div className={`mb-2 flex items-center gap-2 px-2.5 py-2 rounded-xl border text-[11px] font-semibold ${box}`}>
        <FileText size={15} className="shrink-0 text-red-500" />
        <span className="truncate flex-1">{att.name}</span>
        {att.url && (
          <a href={att.url} target="_blank" rel="noreferrer" title="Voir" className="shrink-0 underline">
            Voir
          </a>
        )}
      </div>
    );
  }

  const Icon = att.kind === "lab" ? FlaskConical : att.kind === "prescription" ? Pill : ClipboardList;
  return (
    <div className={`mb-2 rounded-xl border p-2.5 text-[11px] ${box}`}>
      <div className="flex items-center gap-1.5 font-bold">
        <Icon size={13} className="shrink-0 text-indigo-500" />
        <span className="truncate">{att.title}</span>
      </div>
      {att.subtitle && <p className="mt-0.5 opacity-75 truncate">{att.subtitle}</p>}
      {Array.isArray(att.lines) && att.lines.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 opacity-90">
          {att.lines.slice(0, 5).map((l: string, i: number) => (
            <li key={i} className="truncate">• {l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatPatientAllergies(allergies: any): string {
  if (!allergies) return "Aucune allergie connue";
  if (Array.isArray(allergies)) {
    const valid = allergies.filter(Boolean);
    return valid.length > 0 ? `Allergies : ${valid.join(", ")}` : "Aucune allergie connue";
  }
  if (typeof allergies === "string") {
    const trimmed = allergies.trim();
    if (!trimmed) return "Aucune allergie connue";
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return `Allergies : ${parsed.filter(Boolean).join(", ")}`;
        }
      } catch {
        // fall through
      }
    }
    return `Allergies : ${trimmed}`;
  }
  return "Aucune allergie connue";
}

// ============================================================
// MESSAGERIE DIRECTE PATIENT ↔ MÉDECIN (persistée en base)
// Les conversations DB ont des ids préfixés "db-" pour ne jamais
// entrer en collision avec les discussions locales/démo.
// ============================================================

async function getDoctorToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

function mapDirectConversation(c: any): Conversation {
  const other = c.otherParty || {};
  const patient: PatientContact = {
    id: other.id || "",
    name: other.name || "Patient",
    age: 0,
    gender: "",
    phone: "",
    email: "",
    bloodGroup: "",
    online: true,
    avatarUrl: other.avatarUrl || undefined,
  };
  const messages: Message[] = Array.isArray(c.messages)
    ? c.messages.map((m: any) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderName,
        senderRole: m.senderRole === "doctor" ? "doctor" : "patient",
        text: m.text,
        time: m.time,
        date: m.date,
        status: m.status === "read" ? "read" : "delivered",
        attachment: m.attachment || undefined,
      }))
    : [];
  const last = messages[messages.length - 1];
  return {
    id: `db-${c.id}`,
    type: "patient",
    title: c.title || patient.name,
    subtitle: c.subtitle || "",
    lastMessage: last ? last.text : c.lastMessage || "",
    time: last ? last.time : c.time || "",
    unread: !!c.unread,
    unreadCount: c.unreadCount || 0,
    status: "normal",
    online: true,
    patient,
    messages,
  };
}

// ============================================================
// THREADS CONFRÈRES + GROUPES (persistés en base via /api/doctor-threads)
// Les conversations threads ont des ids préfixés "th-" pour ne jamais
// entrer en collision avec les discussions patients "db-" ni locales.
// ============================================================

function mapDoctorThread(t: any): Conversation {
  const isGroup = t.type === "group";
  const messages: Message[] = Array.isArray(t.messages)
    ? t.messages.map((m: any) => ({
        id: String(m.id),
        senderId: String(m.senderId || ""),
        senderName: m.senderName || "",
        senderRole: m.senderId === "system" ? "system" : "colleague",
        text: m.text || "",
        time: m.time || "",
        date: m.date || "",
        status: "delivered" as const,
      }))
    : [];
  if (isGroup) {
    const g = t.group || {};
    const members: DoctorContact[] = Array.isArray(g.members)
      ? g.members.map((m: any) => ({
          id: m.id || "",
          name: m.name || "",
          specialty: m.specialty || "",
          hospital: m.hospital || "",
          city: m.city || "",
          phone: m.phone || "",
          email: m.email || "",
          licenseNumber: m.licenseNumber || "",
          online: true,
        }))
      : [];
    return {
      id: `th-${t.id}`,
      type: "group",
      title: t.title || g.name || "Groupe",
      subtitle: t.subtitle || "",
      lastMessage: t.lastMessage || "",
      time: t.time || "",
      unread: !!t.unread,
      unreadCount: t.unreadCount || 0,
      status: "normal",
      online: true,
      group: {
        id: g.id || t.id,
        name: g.name || t.title || "Groupe",
        description: g.description || "",
        specialty: g.specialty || "",
        createdDate: g.createdDate || "",
        createdBy: g.createdBy || "",
        members,
      },
      messages,
    };
  }
  return {
    id: `th-${t.id}`,
    type: "colleague",
    title: t.title || "Confrère",
    subtitle: t.subtitle || "",
    lastMessage: t.lastMessage || "",
    time: t.time || "",
    unread: !!t.unread,
    unreadCount: t.unreadCount || 0,
    status: "normal",
    online: true,
    doctor: {
      id: t.peerDoctorId || "",
      name: t.title || "Confrère",
      specialty: t.subtitle || "",
      hospital: "",
      city: "",
      phone: "",
      email: "",
      licenseNumber: "",
      online: true,
    },
    messages,
  };
}

interface DoctorMessengerViewProps {
  isDark: boolean;
  onLaunchVideoCall?: (patientName: string) => void;
  currentDoctorName?: string;
  currentDoctorId?: string;
  onModalChange?: (isOpen: boolean) => void;
}

export default function DoctorMessengerView({
  isDark,
  onLaunchVideoCall,
  currentDoctorName = "Dr. Sarah Khelifi",
  currentDoctorId,
  onModalChange,
}: DoctorMessengerViewProps) {
  // Resolve stable identity for the logged-in doctor (never a shared default).
  const [resolvedDoctorId, setResolvedDoctorId] = useState<string>(
    () => currentDoctorId || ""
  );

  useEffect(() => {
    if (currentDoctorId) {
      setResolvedDoctorId(currentDoctorId);
      return;
    }    // Fallback: match by display name in known doctors
    const match =
      ALL_REGISTERED_DOCTORS.find((d) => d.name === currentDoctorName) ||
      null;
    if (match) setResolvedDoctorId(match.id);
  }, [currentDoctorId, currentDoctorName]);

  const myDoctorId = resolvedDoctorId;

  // ------------------------------------------------------------
  // STATE MANAGEMENT & PERSISTENCE (per-doctor isolated)
  // ------------------------------------------------------------
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    return loadConversationsFromStorage(currentDoctorId || "");
  });

  // Reload isolated inbox when switching accounts (démarrage vide, cache local)
  useEffect(() => {
    setConversations(loadConversationsFromStorage(myDoctorId));
  }, [myDoctorId]);

  const [selectedConvId, setSelectedConvId] = useState<string>(() => {
    return conversations[0]?.id || "";
  });

  // Deep-link : ouvrir une discussion précise (depuis un profil confrère).
  useEffect(() => {
    try {
      const convId = sessionStorage.getItem("doctor-open-conv");
      if (convId) {
        setSelectedConvId(convId);
        sessionStorage.removeItem("doctor-open-conv");
      }
    } catch {
      // ignore
    }
    const handler = (e: Event) => {
      const convId = (e as CustomEvent).detail?.convId;
      if (convId) setSelectedConvId(String(convId));
    };
    window.addEventListener("doctor-messenger-open", handler);
    return () => window.removeEventListener("doctor-messenger-open", handler);
  }, []);

  const [activeFilter, setActiveFilter] = useState<
    "ALL" | "PATIENTS" | "COLLEAGUES" | "GROUPS"
  >("ALL");

  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");

  // Live Database state from Prisma
  const [dbDoctors, setDbDoctors] = useState<DoctorContact[]>(ALL_REGISTERED_DOCTORS);
  const [dbPatients, setDbPatients] = useState<PatientContact[]>(ALL_REGISTERED_PATIENTS);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [isDbSyncing, setIsDbSyncing] = useState<boolean>(false);
  const [dbSyncMessage, setDbSyncMessage] = useState<string>("");

  // Modals state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showNewDirectModal, setShowNewDirectModal] = useState(false);
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [newDirectTab, setNewDirectTab] = useState<"COLLEAGUES" | "PATIENTS">(
    "COLLEAGUES"
  );

  // Identité serveur pour les threads confrères/groupes (source de vérité
  // pour l'expéditeur + isMe quand l'id local diffère de l'id DB).
  const [dbThreadMyId, setDbThreadMyId] = useState<string>("");
  const [dbThreadMyName, setDbThreadMyName] = useState<string>("");

  // Threads confrères + groupes persistés en base via /api/doctor-threads.
  // Merge = upsert par id (le serveur fait foi ; on ne supprime jamais les
  // th- locaux absents de la réponse). Chaque thread ajouté/mis à jour
  // remonte en tête de liste (tri récent d'abord).
  const fetchDoctorThreads = useCallback(async () => {
    try {
      const token = await getDoctorToken();
      if (!token) return;
      const res = await fetch(`/api/doctor-threads`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.threads)) return;
      if (typeof data.myId === "string" && data.myId) setDbThreadMyId(data.myId);
      if (typeof data.myName === "string" && data.myName) setDbThreadMyName(data.myName);
      const mapped: Conversation[] = data.threads.map(mapDoctorThread);
      setConversations((prev) => {
        let next = [...prev];
        let changed = false;
        // Ordre inverse : le plus récent (premier côté serveur) finit en tête.
        for (const srv of [...mapped].reverse()) {
          const idx = next.findIndex((c) => c.id === srv.id);
          if (idx === -1) {
            next = [srv, ...next];
            changed = true;
          } else {
            // Union des messages : garde les optimistes locaux pas encore en base.
            const localOnly = (next[idx].messages || []).filter(
              (m) => !(srv.messages || []).some((sm: Message) => sm.id === m.id)
            );
            const merged: Conversation = {
              ...srv,
              messages: [...(srv.messages || []), ...localOnly],
              lastMessage: srv.lastMessage || next[idx].lastMessage,
              time: srv.time || next[idx].time,
            };
            if (JSON.stringify(merged) !== JSON.stringify(next[idx])) {
              next.splice(idx, 1);
              next = [merged, ...next];
              changed = true;
            }
          }
        }
        if (changed) {
          saveConversationsToStorage(next, myDoctorId);
          return next;
        }
        return prev;
      });
    } catch (err) {
      console.warn("Could not sync doctor threads:", err);
    }
  }, [myDoctorId]);

  useEffect(() => {
    fetchDoctorThreads();
    const interval = setInterval(fetchDoctorThreads, 5000);
    return () => clearInterval(interval);
  }, [fetchDoctorThreads]);

  // Annuaire réel (médecins + patients) depuis la base de données.
  // Les discussions confrères/groupes arrivent via /api/doctor-threads
  // (fetchDoctorThreads) ; /api/messages ne fournit plus que l'annuaire.
  const fetchDatabaseData = useCallback(async (_forceReset = false) => {
    setIsDbSyncing(true);
    try {
      const res = await fetch(`/api/messages?doctorId=${encodeURIComponent(myDoctorId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.doctors) && data.doctors.length > 0) {
            // Never list myself as a "confrère" to message
            setDbDoctors(data.doctors.filter((d: DoctorContact) => d.id !== myDoctorId));
            // Resolve my real id by matching name if prop was generic
            if (!currentDoctorId && currentDoctorName) {
              const me = (data.doctors as DoctorContact[]).find(
                (d) => d.name === currentDoctorName
              );
              if (me && me.id !== myDoctorId) setResolvedDoctorId(me.id);
            }
          }
          if (Array.isArray(data.patients) && data.patients.length > 0) {
            setDbPatients(data.patients);
          }
          setIsDbConnected(true);
          setDbSyncMessage(`Base de données synchronisée (${data.doctors?.length || 0} médecins, ${data.patients?.length || 0} patients)`);
          setTimeout(() => setDbSyncMessage(""), 4000);
        }
      }
    } catch (err) {
      console.warn("Could not sync with database /api/messages:", err);
      setIsDbConnected(false);
    } finally {
      setIsDbSyncing(false);
    }
  }, [myDoctorId, currentDoctorId, currentDoctorName]);

  useEffect(() => {
    fetchDatabaseData();
  }, [fetchDatabaseData]);

  // Messagerie directe patient ↔ médecin (base de données).
  // Chaque médecin ne voit QUE ses propres patients : le serveur filtre
  // par le compte connecté, aucune conversation d'un autre médecin n'apparaît.
  const fetchDirectConversations = useCallback(async () => {
    try {
      const token = await getDoctorToken();
      if (!token) return;
      const res = await fetch(`/api/direct-messages`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.conversations)) return;
      const mapped = data.conversations.map(mapDirectConversation);
      setConversations((prev) => {
        const ids = new Set(mapped.map((c: Conversation) => c.id));
        const kept = prev.filter((c) => !c.id.startsWith("db-") || ids.has(c.id));
        let changed = false;
        const next = kept.map((c) => {
          const fresh = mapped.find((m: Conversation) => m.id === c.id);
          if (fresh && JSON.stringify(fresh) !== JSON.stringify(c)) {
            changed = true;
            return fresh;
          }
          return c;
        });
        for (const m of mapped) {
          if (!next.some((c) => c.id === m.id)) {
            next.unshift(m);
            changed = true;
          }
        }
        if (changed) {
          saveConversationsToStorage(next, myDoctorId);
          return next;
        }
        return prev;
      });
    } catch (err) {
      console.warn("Could not sync direct patient messages:", err);
    }
  }, [myDoctorId]);

  useEffect(() => {
    fetchDirectConversations();
    const interval = setInterval(fetchDirectConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchDirectConversations]);

  // Marquer comme lus côté serveur quand j'ouvre une discussion DB.
  const markDirectRead = useCallback(async (convId: string) => {
    try {
      const token = await getDoctorToken();
      if (!token) return;
      await fetch(`/api/direct-messages`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId: convId.replace(/^db-/, "") }),
      });
    } catch {
      // silencieux
    }
  }, []);

  // Marquer un thread confrère/groupe comme lu côté serveur.
  const markThreadRead = useCallback(async (convId: string) => {
    try {
      const token = await getDoctorToken();
      if (!token) return;
      await fetch(`/api/doctor-threads`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ threadId: convId.replace(/^th-/, "") }),
      });
    } catch {
      // silencieux
    }
  }, []);
  // Reconcile placeholder ids with the real directory ids. Without this,
  // messages addressed to a placeholder id never reach the real account,
  // and old messages don't align with the logged-in doctor.
  // Also removes adjacent exact duplicates left by the old double-id bug.
  useEffect(() => {
    if (dbDoctors.length === 0) return;
    setConversations((prev) => {
      const doctorByName = new Map(
        dbDoctors.map((d) => [d.name.trim().toLowerCase(), d])
      );
      const patientByName = new Map(
        dbPatients.map((p) => [p.name.trim().toLowerCase(), p])
      );
      let changed = false;
      const next = prev.map((c) => {
        let updated = c;
        if (c.type === "colleague" && c.doctor) {
          const real = doctorByName.get(c.doctor.name.trim().toLowerCase());
          if (real && real.id !== c.doctor.id) {
            updated = {
              ...updated,
              doctor: real,
              title: real.name,
              subtitle: `${real.specialty} • ${real.hospital}`,
            };
            changed = true;
          }
        }
        if (c.type === "patient" && c.patient) {
          const real = patientByName.get(c.patient.name.trim().toLowerCase());
          if (real && real.id !== c.patient.id) {
            updated = { ...updated, patient: real, title: real.name };
            changed = true;
          }
        }
        const remapped = updated.messages.map((m) => {
          if (m.senderRole === "system") return m;
          const realDoc = doctorByName.get(m.senderName.trim().toLowerCase());
          if (realDoc && m.senderId !== realDoc.id) {
            changed = true;
            return { ...m, senderId: realDoc.id };
          }
          if (!realDoc) {
            const realPat = patientByName.get(m.senderName.trim().toLowerCase());
            if (realPat && m.senderId !== realPat.id) {
              changed = true;
              return { ...m, senderId: realPat.id };
            }
          }
          return m;
        });
        // Drop adjacent exact duplicates (same sender + same text + same date):
        // leftovers from the period when server copies had different ids.
        const deduped = remapped.filter((m, i) => {
          if (i === 0) return true;
          const p = remapped[i - 1];
          if (
            p.senderId === m.senderId &&
            p.text === m.text &&
            p.date === m.date &&
            p.senderRole !== "system"
          ) {
            changed = true;
            return false;
          }
          return true;
        });
        if (deduped.length !== updated.messages.length) {
          updated = { ...updated, messages: deduped };
        }
        return updated;
      });
      if (changed) {
        saveConversationsToStorage(next, myDoctorId);
        return next;
      }
      return prev;
    });
  }, [dbDoctors, dbPatients, myDoctorId]);

  // New Group Form State
  const [groupName, setGroupName] = useState("");
  const [groupSpecialty, setGroupSpecialty] = useState("Cardiologie Pluridisciplinaire");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);

  // Add Member to Existing Group Form
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [doctorToAddId, setDoctorToAddId] = useState<string>("");

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  // Mémorise la dernière position vue : on ne redescend que si on change
  // de discussion ou si un NOUVEAU message arrive pendant qu'on est en bas.
  const lastSeenRef = useRef<{ convId: string; lastId: string }>({
    convId: "",
    lastId: "",
  });

  // Notify parent dashboard if any messenger modal is open (so the dock can hide)
  const isAnyModalActive = Boolean(
    showCreateGroupModal ||
    showNewDirectModal ||
    showGroupDetailsModal ||
    showAddMemberModal
  );

  useEffect(() => {
    onModalChange?.(isAnyModalActive);
    return () => {
      onModalChange?.(false);
    };
  }, [isAnyModalActive, onModalChange]);

  // Save to localStorage on changes (per-doctor key)
  useEffect(() => {
    saveConversationsToStorage(conversations, myDoctorId);
  }, [conversations, myDoctorId]);

  // Keep selected conversation valid when switching accounts (empty inbox supported)
  useEffect(() => {
    if (!conversations.some((c) => c.id === selectedConvId)) {
      setSelectedConvId(conversations[0]?.id || "");
    }
  }, [conversations, selectedConvId]);

  // Scroll intelligent DANS le conteneur (jamais la page) : vers le bas
  // seulement si on change de discussion ou si un nouveau message arrive
  // pendant qu'on est déjà en bas. Lire l'historique ne fait plus sauter.
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const conv = conversations.find((c) => c.id === selectedConvId);
    const msgs = conv?.messages || [];
    const lastId = msgs.length ? msgs[msgs.length - 1].id : "";
    const prev = lastSeenRef.current;
    const convChanged = prev.convId !== selectedConvId;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (convChanged || (lastId && lastId !== prev.lastId && nearBottom)) {
      el.scrollTop = el.scrollHeight;
    }
    lastSeenRef.current = { convId: selectedConvId, lastId };
  }, [selectedConvId, conversations]);

  // Active conversation object
  const activeConv = useMemo(() => {
    return (
      conversations.find((c) => c.id === selectedConvId) ||
      conversations[0] ||
      null
    );
  }, [conversations, selectedConvId]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Type filter
      if (activeFilter === "PATIENTS" && c.type !== "patient") return false;
      if (activeFilter === "COLLEAGUES" && c.type !== "colleague") return false;
      if (activeFilter === "GROUPS" && c.type !== "group") return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTitle = c.title.toLowerCase().includes(q);
      const inSubtitle = c.subtitle.toLowerCase().includes(q);
      const inLastMsg = c.lastMessage.toLowerCase().includes(q);
      const inDocSpecialty = c.doctor?.specialty.toLowerCase().includes(q);
      const inPatCondition = c.patient?.chronicCondition?.toLowerCase().includes(q);

      return inTitle || inSubtitle || inLastMsg || inDocSpecialty || inPatCondition;
    });
  }, [conversations, activeFilter, searchQuery]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: conversations.length,
      patients: conversations.filter((c) => c.type === "patient").length,
      colleagues: conversations.filter((c) => c.type === "colleague").length,
      groups: conversations.filter((c) => c.type === "group").length,
    };
  }, [conversations]);

  // ------------------------------------------------------------
  // ACTIONS: SEND MESSAGE
  // ------------------------------------------------------------
  const handleSendMessage = useCallback((textToSend?: string, customAttachment?: Message["attachment"]) => {
    const rawText = (textToSend || inputText).trim();
    if (!activeConv) return;
    const isThread = activeConv.id.startsWith("th-");
    const isDirect = activeConv.id.startsWith("db-");
    // Les threads sont texte seul : la pièce jointe devient un suffixe.
    const fileSuffix = customAttachment ? ` [Fichier : ${customAttachment.name}]` : "";
    const text = isThread ? `${rawText}${fileSuffix}`.trim() : rawText;
    if (!text && !customAttachment) return;

    const timeStr = getFormattedTime();

    const newMsg: Message = {
      id: createDeterministicId("msg"),
      senderId: isThread && dbThreadMyId ? dbThreadMyId : myDoctorId,
      senderName: isThread && dbThreadMyName ? dbThreadMyName : currentDoctorName,
      senderRole: isThread ? "colleague" : "doctor",
      senderSpecialty: "Cardiologue",
      text: text || (customAttachment ? `Document partagé : ${customAttachment.name}` : ""),
      time: timeStr,
      date: "Aujourd'hui",
      status: "sent",
      attachment: isThread ? undefined : customAttachment,
    };

    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === activeConv.id);
      if (idx === -1) return prev;
      const updated = {
        ...prev[idx],
        lastMessage: newMsg.text,
        time: timeStr,
        unread: false,
        messages: [...prev[idx].messages, newMsg],
      };
      // Flux patient DB : comportement historique conservé (mise à jour sur place).
      // Threads + autres : la discussion remonte en tête (récent d'abord).
      let next: Conversation[];
      if (isDirect) {
        next = prev.map((c) => (c.id === activeConv.id ? updated : c));
      } else {
        next = [...prev];
        next.splice(idx, 1);
        next.unshift(updated);
      }
      saveConversationsToStorage(next, myDoctorId);
      return next;
    });

    // Threads confrères/groupes : persistés via /api/doctor-threads uniquement
    // (jamais /api/messages ni shared-inbox). Le serveur diffuse aux membres.
    if (isThread) {
      getDoctorToken().then((token) => {
        if (!token) return;
        fetch("/api/doctor-threads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "send",
            threadId: activeConv.id.replace(/^th-/, ""),
            text: newMsg.text,
            clientMessageId: newMsg.id,
          }),
        })
          .then(() => fetchDoctorThreads())
          .catch((err) => console.warn("Thread message persist error:", err));
      });

      setInputText("");
      setShowAttachModal(false);
      return;
    }

    // Persist to database in background (conversations locales résiduelles
    // uniquement : les "th-" passent par /api/doctor-threads ci-dessus).
    // EXCEPTION : les discussions patient "db-" vont dans la messagerie
    // directe persistée en base (patient X ↔ médecin Y uniquement).
    if (activeConv.id.startsWith("db-")) {
      const realId = activeConv.id.replace(/^db-/, "");
      getDoctorToken().then((token) => {
        if (!token) return;
        fetch("/api/direct-messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "send",
            conversationId: realId,
            clientMessageId: newMsg.id,
            text: newMsg.text,
          }),
        })
          .then(() => fetchDirectConversations())
          .catch((err) => console.warn("Direct message persist error:", err));
      });

      setInputText("");
      setShowAttachModal(false);
      return;
    }

    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_message",
        payload: {
          conversationId: activeConv.id,
          clientMessageId: newMsg.id,
          text: newMsg.text,
          senderId: newMsg.senderId,
          senderName: newMsg.senderName,
          senderRole: newMsg.senderRole,
          senderSpecialty: newMsg.senderSpecialty,
          attachment: newMsg.attachment,
          fromDoctorId: myDoctorId,
          recipientDoctorId: activeConv.type === "colleague" ? activeConv.doctor?.id : undefined,
          groupMemberIds: activeConv.type === "group" ? activeConv.group?.members.map((m) => m.id) : undefined,
          conversationType: activeConv.type,
          convTitle: activeConv.title,
          convSubtitle: activeConv.subtitle,
          peerDoctor: activeConv.type === "colleague" ? activeConv.doctor : undefined,
          groupInfo: activeConv.type === "group" ? activeConv.group : undefined,
          patientInfo: activeConv.type === "patient" ? activeConv.patient : undefined,
        },
      }),
    }).catch((err) => console.warn("Background API persist error:", err));

    setInputText("");
    setShowAttachModal(false);
  }, [activeConv, currentDoctorName, myDoctorId, inputText, fetchDirectConversations, fetchDoctorThreads, dbThreadMyId, dbThreadMyName]);

  // ------------------------------------------------------------
  // ACTION: CREATE A MEDICAL DOCTOR GROUP
  // ------------------------------------------------------------
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      const token = await getDoctorToken();
      if (!token) {
        alert("Session expirée : reconnectez-vous pour créer un groupe.");
        return;
      }
      const res = await fetch("/api/doctor-threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "create_group",
          name: groupName.trim(),
          specialty: groupSpecialty,
          description: groupDescription.trim(),
          memberIds: selectedDoctorIds,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || !data.thread) {
        alert(data?.error || "Impossible de créer le groupe.");
        return;
      }
      if (typeof data.myId === "string" && data.myId) setDbThreadMyId(data.myId);
      if (typeof data.myName === "string" && data.myName) setDbThreadMyName(data.myName);
      const mapped = mapDoctorThread(data.thread);
      // Le serveur diffuse le groupe aux membres (ils le reçoivent au poll).
      setConversations((prev) => {
        const next = [mapped, ...prev.filter((c) => c.id !== mapped.id)];
        saveConversationsToStorage(next, myDoctorId);
        return next;
      });
      setSelectedConvId(mapped.id);
      setShowCreateGroupModal(false);

      // Reset modal form
      setGroupName("");
      setGroupDescription("");
      setSelectedDoctorIds([]);
    } catch {
      alert("Impossible de créer le groupe.");
    }
  };

  // ------------------------------------------------------------
  // ACTION: ADD MEMBER TO EXISTING GROUP
  // ------------------------------------------------------------
  const handleAddMemberToGroup = async () => {
    if (!activeConv || activeConv.type !== "group" || !activeConv.group) return;
    if (!doctorToAddId) return;

    // Check if already in group
    if (activeConv.group.members.some((m) => m.id === doctorToAddId)) {
      setShowAddMemberModal(false);
      return;
    }

    // Thread DB : ajout côté serveur, la discussion est remplacée par la
    // version fraîche renvoyée par l'API.
    if (activeConv.id.startsWith("th-")) {
      try {
        const token = await getDoctorToken();
        if (!token) {
          alert("Session expirée : reconnectez-vous pour inviter un confrère.");
          return;
        }
        const res = await fetch("/api/doctor-threads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "add_member",
            threadId: activeConv.id.replace(/^th-/, ""),
            doctorId: doctorToAddId,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success || !data.thread) {
          alert(data?.error || "Impossible d'ajouter ce confrère au groupe.");
          return;
        }
        const mapped = mapDoctorThread(data.thread);
        setConversations((prev) => {
          const next = prev.map((c) => (c.id === mapped.id ? mapped : c));
          saveConversationsToStorage(next, myDoctorId);
          return next;
        });
      } catch {
        alert("Impossible d'ajouter ce confrère au groupe.");
      }
      setDoctorToAddId("");
      setShowAddMemberModal(false);
      return;
    }

    const docToAdd =
      dbDoctors.find((d) => d.id === doctorToAddId) ||
      ALL_REGISTERED_DOCTORS.find((d) => d.id === doctorToAddId);
    if (!docToAdd) return;

    const timeStr = getFormattedTime();

    const updatedMembers = [
      ...activeConv.group.members,
      { ...docToAdd, roleInGroup: "member" as const },
    ];

    const systemMsg: Message = {
      id: createDeterministicId("sys"),
      senderId: "system",
      senderName: "Base de Données DOCTORZ Co.",
      senderRole: "system",
      text: `Le ${docToAdd.name} (${docToAdd.specialty}) a été ajouté au groupe médical par le ${currentDoctorName}.`,
      time: timeStr,
      date: "Aujourd'hui",
      status: "read",
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id && c.group) {
          return {
            ...c,
            subtitle: `${updatedMembers.length} médecins • ${c.group.specialty}`,
            group: {
              ...c.group,
              members: updatedMembers,
            },
            messages: [...c.messages, systemMsg],
          };
        }
        return c;
      })
    );

    setDoctorToAddId("");
    setShowAddMemberModal(false);
  };

  // ------------------------------------------------------------
  // ACTION: START NEW DIRECT CONVERSATION
  // ------------------------------------------------------------
  const handleStartColleagueChat = async (doctor: DoctorContact) => {
    // Thread 1:1 persisté en base : get_or_create côté serveur.
    // Plus aucune discussion confrère locale factice.
    try {
      const token = await getDoctorToken();
      if (!token) {
        alert("Session expirée : reconnectez-vous pour démarrer une discussion.");
        return;
      }
      const res = await fetch("/api/doctor-threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "get_or_create_colleague", doctorId: doctor.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || !data.thread) {
        alert(data?.error || "Impossible de démarrer la discussion.");
        return;
      }
      if (typeof data.myId === "string" && data.myId) setDbThreadMyId(data.myId);
      if (typeof data.myName === "string" && data.myName) setDbThreadMyName(data.myName);
      const mapped = mapDoctorThread(data.thread);
      setConversations((prev) => {
        const next = [mapped, ...prev.filter((c) => c.id !== mapped.id)];
        saveConversationsToStorage(next, myDoctorId);
        return next;
      });
      setSelectedConvId(mapped.id);
      setShowNewDirectModal(false);
    } catch {
      alert("Impossible de démarrer la discussion.");
    }
  };

  const handleStartPatientChat = async (patient: PatientContact) => {
    // Check if conversation already exists (by id OR by name)
    const existing = conversations.find(
      (c) =>
        c.type === "patient" &&
        (c.patient?.id === patient.id ||
          (patient.name && c.patient?.name === patient.name))
    );
    if (existing) {
      setSelectedConvId(existing.id);
      setShowNewDirectModal(false);
      return;
    }

    // Discussion DB réelle si le patient existe en base : la conversation
    // patient X ↔ médecin Y est créée côté serveur (persistée, privée).
    try {
      const token = await getDoctorToken();
      if (token) {
        const res = await fetch("/api/direct-messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "get_or_create",
            patientId: patient.id,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.conversation) {
            const mapped = mapDirectConversation(data.conversation);
            setConversations((prev) =>
              prev.some((c) => c.id === mapped.id) ? prev : [mapped, ...prev]
            );
            setSelectedConvId(mapped.id);
            setShowNewDirectModal(false);
            return;
          }
        }
      }
    } catch {
      // repli local ci-dessous (patient démo sans compte DB)
    }

    const timeStr = getFormattedTime();
    const newConvId = createDeterministicId(`conv-pat-${patient.id}`);

    const newConv: Conversation = {
      id: newConvId,
      type: "patient",
      title: patient.name,
      subtitle: `${patient.age} ans • ${patient.chronicCondition || "Suivi de santé standard"}`,
      lastMessage: `Canal de messagerie patient ouvert avec ${patient.name}.`,
      time: timeStr,
      unread: false,
      unreadCount: 0,
      status: "normal",
      online: patient.online,
      patient,
      messages: [
        {
          id: createDeterministicId("msg-pat-init"),
          senderId: "system",
          senderName: "DOCTORZ Co. Securitas",
          senderRole: "system",
          text: `Messagerie patient sécurisée active. Les ordonnances, bilans et conseils médicaux partagés ici sont protégés par le secret professionnel.`,
          time: timeStr,
          date: "Aujourd'hui",
          status: "read",
        },
      ],
    };

    setConversations((prev) => [newConv, ...prev]);
    setSelectedConvId(newConvId);
    setShowNewDirectModal(false);
  };

  return (
    <div
      className={`rounded-3xl border shadow-xl overflow-hidden transition-colors flex flex-col md:flex-row h-[740px] ${
        isDark
          ? "bg-slate-900 border-slate-800 text-white"
          : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      {/* ======================================================== */}
      {/* SIDEBAR: CONVERSATION LIST & GROUP CREATION */}
      {/* ======================================================== */}
      <div
        className={`w-full md:w-84 lg:w-96 border-b md:border-b-0 md:border-r flex flex-col ${
          isDark ? "border-slate-800 bg-slate-950/70" : "border-slate-200 bg-slate-50/80"
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <MessageSquare size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Messagerie Clinique</h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  Médecins • Patients • Staff RCP
                </p>
              </div>
            </div>

            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isDark
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              <ShieldCheck size={11} />
              HDS SSL
            </span>
          </div>

          {/* Real Database Connection Indicator & Sync */}
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-2xl border text-xs transition ${
              isDark
                ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300"
                : "bg-emerald-50/90 border-emerald-200 text-emerald-900"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isDbConnected ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isDbConnected ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                ></span>
              </span>
              <div className="min-w-0">
                <p className="font-bold text-[11px] leading-tight truncate">
                  {isDbConnected ? "BDD Réelle Connectée" : "Mode Hors-ligne"}
                </p>
                <p className="text-[10px] opacity-80 truncate">
                  {dbDoctors.length} Médecins • {dbPatients.length} Patients
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { fetchDatabaseData(true); fetchDoctorThreads(); }}
              disabled={isDbSyncing}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                isDark
                  ? "bg-slate-900/60 border-emerald-700/50 hover:bg-slate-800 text-emerald-300"
                  : "bg-white border-emerald-300 hover:bg-emerald-100/50 text-emerald-800 shadow-2xs"
              } ${isDbSyncing ? "opacity-60 cursor-not-allowed" : ""}`}
              title="Recharger et synchroniser depuis la base de données PostgreSQL / Prisma"
            >
              <RotateCcw size={11} className={isDbSyncing ? "animate-spin" : ""} />
              <span>{isDbSyncing ? "Sync..." : "Sync BDD"}</span>
            </button>
          </div>

          {dbSyncMessage && (
            <div className="p-2 rounded-xl text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 animate-in fade-in duration-200">
              <Check size={12} />
              <span>{dbSyncMessage}</span>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowCreateGroupModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Créer un groupe de discussion médicale avec d'autres confrères"
            >
              <Users size={14} />
              <span>Créer Groupe</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNewDirectModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Démarrer une discussion directe avec un médecin ou un patient"
            >
              <Plus size={14} />
              <span>Nouveau Message</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative pt-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Rechercher confrère, patient, groupe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none transition ${
                isDark
                  ? "bg-slate-900 border-slate-700 text-white focus:border-indigo-500"
                  : "bg-white border-slate-200 text-slate-900 focus:border-indigo-600 shadow-2xs"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Tabs Filter */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setActiveFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                activeFilter === "ALL"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              Tous ({counts.all})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("COLLEAGUES")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                activeFilter === "COLLEAGUES"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              <Stethoscope size={11} />
              <span>Médecins ({counts.colleagues})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("GROUPS")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                activeFilter === "GROUPS"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              <Users size={11} />
              <span>Groupes ({counts.groups})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("PATIENTS")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                activeFilter === "PATIENTS"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              <User size={11} />
              <span>Patients ({counts.patients})</span>
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <MessageSquare className="mx-auto text-slate-400 opacity-40" size={32} />
              <p className="text-xs text-slate-400 font-medium">
                Aucune conversation trouvée
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("ALL");
                  setSearchQuery("");
                }}
                className="text-[11px] text-indigo-500 hover:underline cursor-pointer font-semibold"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              const isGroup = conv.type === "group";
              const isColleague = conv.type === "colleague";
              const isPatient = conv.type === "patient";

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    setSelectedConvId(conv.id);
                    // Mark as read
                    setConversations((prev) =>
                      prev.map((c) =>
                        c.id === conv.id ? { ...c, unread: false, unreadCount: 0 } : c
                      )
                    );
                    // Discussion DB : marquer comme lus côté serveur aussi.
                    if (conv.id.startsWith("db-") && conv.unread) {
                      markDirectRead(conv.id);
                    }
                    // Thread confrère/groupe : marquer comme lu côté serveur.
                    if (conv.id.startsWith("th-") && conv.unread) {
                      markThreadRead(conv.id);
                    }
                  }}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition cursor-pointer relative ${
                    isSelected
                      ? isDark
                        ? "bg-indigo-600/20 border-l-4 border-indigo-500"
                        : "bg-indigo-50/90 border-l-4 border-indigo-600"
                      : isDark
                      ? "hover:bg-slate-900/60"
                      : "hover:bg-white"
                  }`}
                >
                  {/* Avatar with Status Indicator */}
                  <div className="relative shrink-0 mt-0.5">
                    {isGroup ? (
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        <Users size={18} />
                      </div>
                    ) : isColleague ? (
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {conv.title
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {conv.title
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                    )}

                    {conv.online && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
                        title="En ligne"
                      />
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4
                        className={`text-xs truncate ${conv.unread ? "font-black" : "font-bold"} ${
                          isSelected
                            ? isDark
                              ? "text-white"
                              : "text-indigo-950"
                            : isDark
                            ? "text-slate-200"
                            : "text-slate-900"
                        }`}
                      >
                        {conv.title}
                      </h4>
                      <span
                        className={`text-[10px] shrink-0 font-medium ${
                          conv.unread
                            ? "text-indigo-600 dark:text-indigo-400 font-bold"
                            : isDark
                            ? "text-slate-500"
                            : "text-slate-400"
                        }`}
                      >
                        {conv.time}
                      </span>
                    </div>

                    <p
                      className={`text-[11px] truncate mb-1.5 ${
                        conv.unread
                          ? isDark
                            ? "text-white font-bold"
                            : "text-slate-900 font-bold"
                          : isDark
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      {conv.lastMessage}
                    </p>

                    {/* Meta Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isGroup && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Users size={9} />
                          Groupe Médical
                        </span>
                      )}

                      {isColleague && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Stethoscope size={9} />
                          Confrère
                        </span>
                      )}

                      {isPatient && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center gap-1">
                          <User size={9} />
                          Patient
                        </span>
                      )}

                      {conv.status === "urgent" && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400">
                          Prioritaire
                        </span>
                      )}

                      {conv.unread && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-indigo-300 dark:ring-indigo-800" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer: stockage local */}
        <div
          className={`p-2.5 border-t text-center flex items-center justify-between text-[10px] ${
            isDark ? "border-slate-800 bg-slate-950/90 text-slate-400" : "border-slate-200 bg-slate-100/70 text-slate-500"
          }`}
        >
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-500" />
            Stockage médical local chiffré
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN CHAT AREA */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        {activeConv ? (
          <>
            {/* Top Chat Header */}
            <div
              className={`p-4 border-b flex items-center justify-between gap-3 ${
                isDark ? "border-slate-800 bg-slate-950/50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {activeConv.type === "group" ? (
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      <Users size={20} />
                    </div>
                  ) : activeConv.type === "colleague" ? (
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {activeConv.title
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {activeConv.title
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}

                  {activeConv.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold truncate">{activeConv.title}</h4>

                    {activeConv.type === "group" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        {activeConv.group?.members.length} Médecins
                      </span>
                    )}

                    {activeConv.type === "colleague" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                        Confrère Spécialiste
                      </span>
                    )}

                    {activeConv.type === "patient" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20 shrink-0">
                        Patient Cabinet
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-[11px] truncate ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {activeConv.subtitle}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Group specific action: view team members */}
                {activeConv.type === "group" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowAddMemberModal(true)}
                      title="Ajouter un médecin à ce groupe"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800 transition cursor-pointer"
                    >
                      <UserPlus size={14} />
                      <span className="hidden sm:inline">Inviter Confrère</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowGroupDetailsModal(true)}
                      title="Détails du groupe et membres"
                      className={`p-2 rounded-xl border transition cursor-pointer ${
                        isDark
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      }`}
                    >
                      <Info size={16} />
                    </button>
                  </>
                )}

                {/* Patient or Colleague actions */}
                {activeConv.type !== "group" && (
                  <>
                    <button
                      type="button"
                      onClick={() => onLaunchVideoCall?.(activeConv.title)}
                      title="Lancer une téléconsultation vidéo sécurisée"
                      className={`p-2 rounded-xl border transition cursor-pointer ${
                        isDark
                          ? "bg-slate-800 hover:bg-slate-700 text-violet-300 border-slate-700"
                          : "bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200"
                      }`}
                    >
                      <Video size={16} />
                    </button>

                    <button
                      type="button"
                      title="Appel Téléphonique sécurisé"
                      className={`p-2 rounded-xl border transition cursor-pointer ${
                        isDark
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      }`}
                    >
                      <Phone size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Message Thread : scroll interne uniquement */}
            <div ref={messagesContainerRef} className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4">
              {activeConv.messages.map((msg, idx) => {
                // Per-account ownership: only my own senderId counts as "me".
                // Previously `senderRole === "doctor"` treated every doctor's
                // messages as mine, mixing up accounts.
                const isMe = msg.senderId === myDoctorId || (dbThreadMyId !== "" && msg.senderId === dbThreadMyId);
                const isSystem = msg.senderRole === "system";
                // Séparateur de jour : début de conversation + changement de jour.
                const prevMsg = idx > 0 ? activeConv.messages[idx - 1] : null;
                const showDaySeparator = !prevMsg || prevMsg.date !== msg.date;

                if (isSystem) {
                  return (
                    <Fragment key={msg.id}>
                      {showDaySeparator && (
                        <div className="flex justify-center pt-1">
                          <span className={isDark ? "px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold" : "px-3 py-1 rounded-full bg-slate-200/70 text-slate-600 text-[10px] font-semibold"}>
                            {msg.date}
                          </span>
                        </div>
                      )}
                    <div className="flex justify-center my-2">
                      <div
                        className={`flex items-center gap-2 max-w-lg px-3 py-1.5 rounded-full text-[11px] font-medium border text-center ${
                          isDark
                            ? "bg-slate-950/80 border-slate-800 text-slate-400"
                            : "bg-slate-100 border-slate-200 text-slate-600"
                        }`}
                      >
                        <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                        <span>{msg.text}</span>
                      </div>
                    </div>
                    </Fragment>
                  );
                }

                return (
                  <Fragment key={msg.id}>
                    {showDaySeparator && (
                      <div className="flex justify-center pt-1">
                        <span className={isDark ? "px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold" : "px-3 py-1 rounded-full bg-slate-200/70 text-slate-600 text-[10px] font-semibold"}>
                          {msg.date}
                        </span>
                      </div>
                    )}
                  <div
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    {/* Nom de l'expéditeur au-dessus des messages reçus uniquement */}
                    {!isMe && (
                    <div className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] font-bold text-slate-600 dark:text-slate-300`}>
                      <span>{msg.senderName}</span>
                      {msg.senderSpecialty && (
                        <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {msg.senderSpecialty}
                        </span>
                      )}
                    </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] md:max-w-[75%] p-3.5 rounded-2xl text-xs space-y-2 shadow-xs ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-br-xs"
                          : isDark
                          ? "bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700"
                          : "bg-slate-100 text-slate-900 rounded-bl-xs border border-slate-200"
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                      {/* Pièce jointe DB (fichier ou partage patient) */}
                      {((msg.attachment as any)?.type === "file" ||
                        (msg.attachment as any)?.type === "share") && (
                        <DbAttachmentView
                          att={msg.attachment as any}
                          isMe={isMe}
                          isDark={isDark}
                        />
                      )}

                      {/* Attachment Box (legacy : jamais les pièces DB file/share) */}
                      {msg.attachment &&
                        (msg.attachment as any).type !== "file" &&
                        (msg.attachment as any).type !== "share" && (
                        <div
                          className={`p-2.5 rounded-xl flex items-center justify-between gap-3 text-[11px] font-semibold border ${
                            isMe
                              ? "bg-white/10 border-white/20 text-white"
                              : isDark
                              ? "bg-slate-900 border-slate-700 text-indigo-300"
                              : "bg-white border-slate-200 text-indigo-700 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText size={16} className="shrink-0" />
                            <div className="truncate">
                              <p className="truncate font-bold">{msg.attachment.name}</p>
                              {msg.attachment.size && (
                                <p className="text-[10px] opacity-75 font-normal">
                                  {msg.attachment.size} • Document Médical
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                `Téléchargement du document sécurisé : ${msg.attachment?.name}\nChiffrement de conformité HDS validé.`
                              )
                            }
                            className={`p-1.5 rounded-lg border transition cursor-pointer shrink-0 ${
                              isMe
                                ? "bg-white/20 hover:bg-white/30 text-white border-white/30"
                                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-slate-800 dark:text-indigo-300 dark:border-slate-700"
                            }`}
                            title="Télécharger / Ouvrir"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Date + heure + vu/envoyé sous le message */}
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1">
                      <span>{msg.date !== "Aujourd'hui" ? `${msg.date} • ` : ""}{msg.time}</span>
                      {isMe && (
                        msg.status === "read" ? (
                          <span className="flex items-center gap-0.5 font-semibold text-indigo-500">
                            Vu <CheckCheck size={12} />
                          </span>
                        ) : msg.status === "delivered" ? (
                          <CheckCheck size={12} />
                        ) : (
                          <Check size={12} />
                        )
                      )}
                    </div>
                  </div>
                  </Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Area */}
            <div
              className={`p-4 border-t flex items-center gap-2 ${
                isDark ? "border-slate-800 bg-slate-950/80" : "border-slate-200 bg-white"
              }`}
            >
              {/* Attachment Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAttachModal(!showAttachModal)}
                  title="Joindre un document clinique ou compte-rendu"
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    showAttachModal
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : isDark
                      ? "text-slate-400 hover:text-white border-slate-700 bg-slate-900"
                      : "text-slate-500 hover:text-slate-900 border-slate-200 bg-slate-100"
                  }`}
                >
                  <Paperclip size={16} />
                </button>

                {/* Attach Document Dropdown Menu */}
                {showAttachModal && (
                  <div
                    className={`absolute bottom-12 left-0 w-64 rounded-2xl border shadow-xl p-2 z-50 space-y-1 ${
                      isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Joindre un document médical
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleSendMessage("", {
                          id: createDeterministicId("att"),
                          name: "Compte_Rendu_Cardiologie_CHU.pdf",
                          type: "pdf",
                          size: "2.1 Mo",
                        })
                      }
                      className={`w-full p-2 rounded-xl text-left flex items-center gap-2.5 text-xs transition cursor-pointer ${
                        isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
                      }`}
                    >
                      <FileText size={15} className="text-indigo-500" />
                      <div>
                        <p className="font-bold">Compte-rendu médical</p>
                        <p className="text-[10px] text-slate-400">PDF certifié</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSendMessage("", {
                          id: createDeterministicId("att"),
                          name: "Trace_Electrocardiogramme_12D.pdf",
                          type: "pdf",
                          size: "1.4 Mo",
                        })
                      }
                      className={`w-full p-2 rounded-xl text-left flex items-center gap-2.5 text-xs transition cursor-pointer ${
                        isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
                      }`}
                    >
                      <HeartPulse size={15} className="text-rose-500" />
                      <div>
                        <p className="font-bold">Tracé ECG 12 dérivations</p>
                        <p className="text-[10px] text-slate-400">PDF haute résolution</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSendMessage("", {
                          id: createDeterministicId("att"),
                          name: "Bilan_Biologique_Complet_NFS_Iono.pdf",
                          type: "lab",
                          size: "680 Ko",
                        })
                      }
                      className={`w-full p-2 rounded-xl text-left flex items-center gap-2.5 text-xs transition cursor-pointer ${
                        isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
                      }`}
                    >
                      <Stethoscope size={15} className="text-emerald-500" />
                      <div>
                        <p className="font-bold">Bilan de laboratoire</p>
                        <p className="text-[10px] text-slate-400">NFS, Iono, Clairance</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Text Input */}
              <input
                type="text"
                placeholder={
                  activeConv.type === "group"
                    ? `Partager une observation avec le staff (${activeConv.group?.members.length} médecins)...`
                    : activeConv.type === "colleague"
                    ? `Écrire au ${activeConv.title}...`
                    : `Écrire à ${activeConv.title} (dossier patient)...`
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs border focus:outline-none transition ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-white focus:border-indigo-500"
                    : "bg-slate-100 border-slate-200 text-slate-900 focus:border-indigo-600"
                }`}
              />

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md transition cursor-pointer"
              >
                <Send size={14} />
                <span className="hidden sm:inline">Envoyer</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <MessageSquare size={48} className="text-slate-400 opacity-40" />
            <h4 className="font-bold text-sm">Sélectionnez une discussion</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Communiquez avec vos confrères spécialistes, participez aux staffs médicaux de
              groupe ou échangez avec vos patients.
            </p>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: CRÉER UN GROUPE DE MÉDECINS */}
      {/* ======================================================== */}
      {showCreateGroupModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateGroupModal(false);
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
              isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Modal Header */}
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Créer un Groupe de Médecins</h3>
                  <p className="text-[11px] text-slate-400">
                    Staff clinique, réunion de concertation (RCP) ou astreinte
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateGroup} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Group Name */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Nom du groupe médical <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Staff Cardiologie & Rythmologie CHU, RCP Oncologie..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none transition ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white focus:border-emerald-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600"
                  }`}
                />
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Discipline / Spécialité médicale
                </label>
                <select
                  value={groupSpecialty}
                  onChange={(e) => setGroupSpecialty(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none transition ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white focus:border-emerald-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600"
                  }`}
                >
                  <option value="Cardiologie Pluridisciplinaire">Cardiologie & Vasculaire</option>
                  <option value="Chirurgie Générale & Spécialisée">Chirurgie & Bloc Opératoire</option>
                  <option value="Urgences & Soins Intensifs">Urgences & Réanimation</option>
                  <option value="Médecine Interne & Endocrinologie">Médecine Interne & Diabétologie</option>
                  <option value="Pédiatrie & Néonatalogie">Pédiatrie & Néonatalogie</option>
                  <option value="Réunion de Concertation Pluridisciplinaire (RCP)">
                    Réunion de Concertation Pluridisciplinaire (RCP)
                  </option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Objectif / Note clinique
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex : Revue collégiale des indications chirurgicales, validation TAVI et coronarographies complexes."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none transition ${
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white focus:border-emerald-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600"
                  }`}
                />
              </div>

              {/* Colleague Multi-Select */}
              <div>
                <label className="block text-xs font-bold mb-1.5 flex items-center justify-between">
                  <span>Confrères à inviter dans le groupe</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">
                    {selectedDoctorIds.length} sélectionné(s)
                  </span>
                </label>

                <div className="space-y-2 max-h-52 overflow-y-auto border rounded-2xl p-2 divide-y divide-slate-100 dark:divide-slate-800">
                  {dbDoctors
                    .filter((d) => d.id !== myDoctorId && d.name !== currentDoctorName)
                    .map((doc) => {
                      const isSelected = selectedDoctorIds.includes(doc.id);
                      return (
                        <div
                          key={doc.id}
                          onClick={() => {
                            setSelectedDoctorIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== doc.id)
                                : [...prev, doc.id]
                            );
                          }}
                          className={`p-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                            isSelected
                              ? isDark
                                ? "bg-emerald-950/40 text-white"
                                : "bg-emerald-50 text-emerald-950"
                              : isDark
                              ? "hover:bg-slate-800/60"
                              : "hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              {doc.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold truncate">{doc.name}</p>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 font-mono">
                                  {doc.licenseNumber}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                {doc.specialty} • {doc.hospital} ({doc.city})
                              </p>
                            </div>
                          </div>

                          <div
                            className={`h-5 w-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                              isSelected
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : isDark
                                ? "border-slate-700 bg-slate-800"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check size={12} />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!groupName.trim() || selectedDoctorIds.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  <Users size={14} />
                  <span>Créer le Groupe Médical</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NOUVEAU MESSAGE DIRECT (DOCTOR OR PATIENT) */}
      {/* ======================================================== */}
      {showNewDirectModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewDirectModal(false);
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
              isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Nouveau Message Direct</h3>
                <p className="text-[11px] text-slate-400">
                  Sélectionnez un confrère médecin ou un patient à contacter
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewDirectModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sub-tabs: Confrères vs Patients */}
            <div className="p-3 border-b flex gap-2">
              <button
                type="button"
                onClick={() => setNewDirectTab("COLLEAGUES")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  newDirectTab === "COLLEAGUES"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : isDark
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <Stethoscope size={14} />
                <span>
                  Confrère Médecin (
                  {dbDoctors.filter((d) => d.id !== myDoctorId && d.name !== currentDoctorName).length}
                  )
                </span>
              </button>

              <button
                type="button"
                onClick={() => setNewDirectTab("PATIENTS")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  newDirectTab === "PATIENTS"
                    ? "bg-violet-600 text-white shadow-2xs"
                    : isDark
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <User size={14} />
                <span>Patients BDD ({dbPatients.length})</span>
              </button>
            </div>

            {/* List */}
            <div className="p-3 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-100 dark:divide-slate-800">
              {newDirectTab === "COLLEAGUES" ? (
                dbDoctors
                  .filter((d) => d.id !== myDoctorId && d.name !== currentDoctorName)
                  .map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleStartColleagueChat(doc)}
                      className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                        isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {doc.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold truncate">{doc.name}</p>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 font-mono">
                              {doc.licenseNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-semibold truncate">
                            {doc.specialty}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {doc.hospital} • {doc.city}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 shrink-0" />
                    </div>
                  ))
              ) : (
                dbPatients.map((pat) => (
                  <div
                    key={pat.id}
                    onClick={() => handleStartPatientChat(pat)}
                    className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                      isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {pat.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold truncate">{pat.name}</p>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-500/10 text-violet-500 font-semibold">
                            Dossier #{pat.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {pat.age} ans • Groupe {pat.bloodGroup} • {pat.chronicCondition}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          Tél : {pat.phone} • {formatPatientAllergies(pat.allergies)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DÉTAILS DU GROUPE MÉDICAL & MEMBRES */}
      {/* ======================================================== */}
      {showGroupDetailsModal && activeConv?.type === "group" && activeConv.group && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGroupDetailsModal(false);
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
              isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{activeConv.group.name}</h3>
                  <p className="text-[11px] text-emerald-500 font-semibold">
                    {activeConv.group.specialty}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupDetailsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Description :</p>
                <p className="font-semibold">{activeConv.group.description}</p>
                <p className="text-[10px] text-slate-400 pt-1">
                  Initié par : {activeConv.group.createdBy} • Date : {activeConv.group.createdDate}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Médecins Membres ({activeConv.group.members.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGroupDetailsModal(false);
                      setShowAddMemberModal(true);
                    }}
                    className="text-[11px] text-emerald-500 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus size={12} />
                    <span>+ Ajouter un confrère</span>
                  </button>
                </div>

                <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
                  {activeConv.group.members.map((member) => (
                    <div
                      key={member.id}
                      className="pt-2 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{member.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {member.specialty} • {member.hospital}
                          </p>
                        </div>
                      </div>

                      {member.roleInGroup === "admin" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Fondateur
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/15 text-slate-600 dark:text-slate-400">
                          Praticien
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: AJOUTER UN MEMBRE À UN GROUPE EXISTANT */}
      {/* ======================================================== */}
      {showAddMemberModal && activeConv?.type === "group" && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddMemberModal(false);
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-5 space-y-4 ${
              isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-emerald-500" />
                <h3 className="font-bold text-sm">Ajouter un confrère au groupe</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Sélectionnez un médecin enregistré à intégrer dans « {activeConv.title} ».
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {dbDoctors
                .filter((d) => !activeConv.group?.members.some((m) => m.id === d.id))
                .map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setDoctorToAddId(doc.id)}
                    className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                      doctorToAddId === doc.id
                        ? isDark
                          ? "bg-emerald-950/40 border border-emerald-500"
                          : "bg-emerald-50 border border-emerald-500"
                        : isDark
                        ? "hover:bg-slate-800"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold truncate">{doc.name}</p>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 font-mono">
                          {doc.licenseNumber}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {doc.specialty} • {doc.hospital}
                      </p>
                    </div>
                    {doctorToAddId === doc.id && <Check size={14} className="text-emerald-500" />}
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="px-3.5 py-1.5 rounded-xl border text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAddMemberToGroup}
                disabled={!doctorToAddId}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirmer l&apos;ajout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
