"use client";

import { useEffect, useState, useRef, useCallback, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Search,
  ShieldCheck,
  Clock,
  Check,
  CheckCheck,
  Plus,
  RefreshCw,
  Stethoscope,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  FlaskConical,
  Pill,
  ClipboardList,
  Loader2,
  Eye,
  Download,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePatientTheme } from "@/components/patient/PatientThemeContext";
import { PButton } from "@/components/patient/buttons";

interface ChatAttachment {
  type: "file" | "share";
  url?: string;
  name?: string;
  mime?: string;
  kind?: string;
  refId?: string;
  title?: string;
  subtitle?: string;
  lines?: string[];
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "doctor" | "patient" | "system";
  senderSpecialty?: string;
  text: string;
  time: string;
  date: string;
  status: "sent" | "delivered" | "read";
  attachment?: ChatAttachment | null;
}

interface DoctorContact {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  city: string;
  avatar?: string;
  online?: boolean;
}

interface PatientConversation {
  id: string;
  type: "patient" | "colleague" | "group";
  title: string;
  subtitle: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  unreadCount?: number;
  doctor?: DoctorContact;
  messages: Message[];
}

function AttachmentView({ att, isMe, isDark }: { att: ChatAttachment; isMe: boolean; isDark: boolean }) {
  if (!att) return null;

  const box = isMe
    ? "bg-white/15 border-white/25 text-white"
    : isDark
      ? "bg-slate-900 border-slate-700 text-slate-200"
      : "bg-white border-slate-200 text-slate-700";

  if (att.type === "file") {
    const isImage = (att.mime || "").startsWith("image/");
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
          <>
            <a href={att.url} target="_blank" rel="noreferrer" title="Voir" className="shrink-0 underline">
              <Eye size={13} />
            </a>
            <a href={att.url} download title="Télécharger" className="shrink-0 underline">
              <Download size={13} />
            </a>
          </>
        )}
      </div>
    );
  }

  // Élément médical partagé (bilan / ordonnance / dossier)
  const Icon = att.kind === "lab" ? FlaskConical : att.kind === "prescription" ? Pill : ClipboardList;
  return (
    <div className={`mb-2 rounded-xl border p-2.5 text-[11px] ${box}`}>
      <div className="flex items-center gap-1.5 font-bold">
        <Icon size={13} className="shrink-0 text-blue-500" />
        <span className="truncate">{att.title}</span>
      </div>
      {att.subtitle && <p className="mt-0.5 opacity-75 truncate">{att.subtitle}</p>}
      {Array.isArray(att.lines) && att.lines.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 opacity-90">
          {att.lines.slice(0, 5).map((l, i) => (
            <li key={i} className="truncate">• {l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PatientMessagesPage() {  const { isDark } = usePatientTheme();
  const [conversations, setConversations] = useState<PatientConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  // Pièces jointes : menu +/-, upload de fichier, partage d'éléments du dossier.
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTab, setShareTab] = useState<"lab" | "prescription" | "record">("lab");
  const [shareData, setShareData] = useState<{ labs: any[]; prescriptions: any[]; records: any[] } | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fmtShort = (d: any): string => {
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "";
      return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "";
    }
  };
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [availableDoctors, setAvailableDoctors] = useState<DoctorContact[]>([]);
  const [currentPatientId, setCurrentPatientId] = useState("pat-1");
  const [currentPatientName, setCurrentPatientName] = useState("Karim Haddad");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // Réf du conteneur scrollable : on ne scrolle QUE lui (jamais la page),
  // et seulement si l'utilisateur est déjà en bas ou change de discussion.
  const messagesBoxRef = useRef<HTMLDivElement | null>(null);
  const lastSeenRef = useRef<{ convId: string; lastId: string }>({
    convId: "",
    lastId: "",
  });

  const getToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  };

  const mapServerConversation = (c: any): PatientConversation => ({
    id: c.id,
    type: "patient",
    title: c.title || "Médecin",
    subtitle: c.subtitle || "",
    lastMessage: c.lastMessage || "",
    time: c.time || "",
    unread: !!c.unread,
    unreadCount: c.unreadCount || 0,
    doctor: c.otherParty
      ? {
          id: c.otherParty.id,
          name: c.otherParty.name,
          specialty: c.otherParty.specialty || "",
          hospital: "",
          city: c.otherParty.city || "",
          avatar: c.otherParty.avatarUrl || undefined,
          online: true,
        }
      : undefined,
    messages: Array.isArray(c.messages)
      ? c.messages.map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.senderName,
          senderRole: m.senderRole === "doctor" ? "doctor" : "patient",
          senderSpecialty: undefined,
          text: m.text,
          time: m.time,
          date: m.date,
          status: m.status === "read" ? "read" : "delivered",
          attachment: m.attachment || null,
        }))
      : [],
  });

  // Identify patient
  useEffect(() => {
    const resolvePatient = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const res = await fetch("/api/auth/profile");
          if (res.ok) {
            const prof = await res.json();
            if (prof.profile) {
              const fullName = `${prof.profile.firstName || ""} ${prof.profile.lastName || ""}`.trim();
              if (fullName) setCurrentPatientName(fullName);
              if (prof.profile.id) setCurrentPatientId(prof.profile.id);
            }
          }
        }
      } catch (err) {
        console.warn("Could not resolve patient profile:", err);
      }
    };
    resolvePatient();
  }, []);

  // Fetch conversations (persistées en base, strictement les miennes)
  const fetchMessages = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/direct-messages`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLoadError(null);
        if (data.success && Array.isArray(data.conversations)) {
          if (data.myName) setCurrentPatientName(data.myName);
          const mapped = data.conversations.map(mapServerConversation);
          setConversations(mapped);
          setSelectedConvId((prev) => {
            if (prev && mapped.some((c: PatientConversation) => c.id === prev)) {
              return prev;
            }
            return mapped[0]?.id || "";
          });
        }
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.code === "db_not_ready") {
          setLoadError(data.error);
        }
      }
    } catch (err) {
      console.warn("Error fetching patient messages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Marquer comme lus les messages du médecin quand j'ouvre la discussion
  useEffect(() => {
    if (!selectedConvId) return;
    const conv = conversations.find((c) => c.id === selectedConvId);
    if (!conv || !conv.unread) return;
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        await fetch(`/api/direct-messages`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ conversationId: selectedConvId }),
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConvId
              ? { ...c, unread: false, unreadCount: 0 }
              : c
          )
        );
      } catch {
        // silencieux
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConvId]);

  // Scroll intelligent : vers le bas seulement si on change de discussion,
  // ou si un NOUVEAU message arrive pendant qu'on est déjà en bas.
  // Lire l'historique en haut ne fait plus jamais sauter vers le bas.
  useEffect(() => {
    const el = messagesBoxRef.current;
    if (!el) return;
    const conv =
      conversations.find((c) => c.id === selectedConvId) || conversations[0];
    if (!conv) return;
    const msgs = conv.messages || [];
    const lastId = msgs.length ? msgs[msgs.length - 1].id : "";
    const prev = lastSeenRef.current;
    const convChanged = prev.convId !== conv.id;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (convChanged || (lastId && lastId !== prev.lastId && nearBottom)) {
      el.scrollTop = el.scrollHeight;
    }
    lastSeenRef.current = { convId: conv.id, lastId };
  }, [selectedConvId, conversations]);

  // Liste des médecins pour le modal "Contacter un Médecin"
  const fetchDoctorsList = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`/api/patient/doctors`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.doctors)) {
          setAvailableDoctors(
            data.doctors.map((d: any) => ({
              id: d.id,
              name: d.name,
              specialty: d.specialty || "",
              hospital: "",
              city: (d.location || "").split(",")[0] || "",
              avatar: undefined,
              online: true,
            }))
          );
        }
      }
    } catch (err) {
      console.warn("Error fetching doctors:", err);
    }
  }, []);

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  // Send message (texte seul ou avec pièce jointe)
  const handleSendMessage = async (e?: React.FormEvent, attachment?: ChatAttachment | null, textOverride?: string) => {
    if (e) e.preventDefault();
    const text = (textOverride ?? inputText).trim();
    if (!text || !activeConv || sending) return;

    setSending(true);
    setSendError(null);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const tempMsg: Message = {
      id: `msg-pat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: currentPatientId,
      senderName: currentPatientName,
      senderRole: "patient",
      text,
      time: timeStr,
      date: "Aujourd'hui",
      status: "sent",
      attachment: attachment || undefined,
    };

    // Optimistic UI update
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            lastMessage: text,
            time: timeStr,
            messages: [...c.messages, tempMsg],
          };
        }
        return c;
      })
    );
    setInputText("");

    try {
      const token = await getToken();
      if (!token) {
        setSending(false);
        return;
      }
      const res = await fetch("/api/direct-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "send",
          conversationId: activeConv.id,
          clientMessageId: tempMsg.id,
          text,
          attachment: attachment || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Envoi impossible.");
      }
      // Refresh to ensure server sync
      fetchMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
      setSendError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  };

  // Upload d'un fichier PDF/image puis envoi dans la discussion.
  const handleFilePicked = async (file: File) => {
    if (!activeConv || uploading) return;
    setShowAttachMenu(false);
    setUploading(true);
    setSendError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Non authentifié.");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("conversationId", activeConv.id);
      const up = await fetch("/api/direct-messages/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const upData = await up.json().catch(() => ({}));
      if (!up.ok || !upData.success) {
        throw new Error(upData.error || "Upload impossible.");
      }
      await handleSendMessage(undefined, {
        type: "file",
        url: upData.url,
        name: upData.name,
        mime: upData.mime,
      }, upData.name || "Fichier partagé");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Upload impossible.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Charger mes bilans / ordonnances / dossier pour le partage.
  const fetchShareItems = async () => {
    setShareLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/dashboard/patient/profile", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setShareData({
          labs: Array.isArray(data.laboratoryResults) ? data.laboratoryResults : [],
          prescriptions: Array.isArray(data.prescriptions) ? data.prescriptions : [],
          records: Array.isArray(data.medicalRecords) ? data.medicalRecords : [],
        });
      }
    } catch (err) {
      console.warn("Error loading share items:", err);
    } finally {
      setShareLoading(false);
    }
  };

  const openShareModal = (tab: "lab" | "prescription" | "record") => {
    setShareTab(tab);
    setShowAttachMenu(false);
    setShowShareModal(true);
    if (!shareData) fetchShareItems();
  };

  // Partager un élément de mon dossier dans la discussion.
  const handleShareItem = async (kind: "lab" | "prescription" | "record", item: any) => {
    if (!activeConv) return;
    let text = "";
    let attachment: ChatAttachment | null = null;
    if (kind === "lab") {
      const date = fmtShort(item.testDate);
      text = `Bilan partagé : ${item.testName || "analyse"}${date ? ` du ${date}` : ""}`;
      attachment = {
        type: "share",
        kind: "lab",
        refId: item.id,
        title: item.testName || "Bilan d'analyse",
        subtitle: `${item.laboratoryName || "Laboratoire"}${date ? ` • ${date}` : ""}`,
        lines: Array.isArray(item.parameters)
          ? item.parameters.map((p: any) => p.name).filter(Boolean)
          : [],
      };
    } else if (kind === "prescription") {
      const date = fmtShort(item.prescribedDate);
      text = `Ordonnance partagée : ${item.prescriptionNumber || ""}`.trim();
      attachment = {
        type: "share",
        kind: "prescription",
        refId: item.id,
        title: `Ordonnance ${item.prescriptionNumber || ""}`.trim(),
        subtitle: `${item.doctor ? `Dr. ${item.doctor.profile?.firstName || ""} ${item.doctor.profile?.lastName || ""}`.trim() : ""}${date ? ` • ${date}` : ""}`.replace(/^ • /, ""),
        lines: Array.isArray(item.items)
          ? item.items.map((it: any) => `${it.medicationName || ""} ${it.dosage || ""}`.trim()).filter(Boolean)
          : [],
      };
    } else {
      const date = fmtShort(item.recordDate);
      text = `Dossier partagé : ${item.title || "consultation"}`;
      attachment = {
        type: "share",
        kind: "record",
        refId: item.id,
        title: item.title || "Dossier médical",
        subtitle: date || "",
        lines: [item.diagnosis, item.symptoms].filter(Boolean).map((s: string) => String(s)),
      };
    }
    setShowShareModal(false);
    await handleSendMessage(undefined, attachment, text);
  };

  // Start new chat with doctor (conversation privée patient ↔ médecin en base)
  const handleStartDoctorChat = async (doctor: DoctorContact) => {
    const existing = conversations.find(
      (c) => c.doctor?.id === doctor.id
    );
    if (existing) {
      setSelectedConvId(existing.id);
      setShowNewChatModal(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/direct-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "get_or_create",
          doctorId: doctor.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.conversation) {
          const mapped = mapServerConversation(data.conversation);
          setConversations((prev) =>
            prev.some((c) => c.id === mapped.id) ? prev : [mapped, ...prev]
          );
          setSelectedConvId(mapped.id);
          setShowNewChatModal(false);
        } else if (data.code === "db_not_ready" && data.error) {
          setLoadError(data.error);
          return;
        }
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.code === "db_not_ready" && data.error) {
          setLoadError(data.error);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to initiate conversation:", err);
    } finally {
      setShowNewChatModal(false);
      fetchMessages();
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={isDark ? "text-2xl font-bold tracking-tight text-white" : "text-2xl font-bold tracking-tight text-slate-900"}>
              Messagerie Médicale
            </h1>
            <span className={isDark ? "flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30" : "flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200"}>
              <ShieldCheck size={13} />
              Secret Médical Protégé
            </span>
          </div>
          <p className={isDark ? "text-sm text-slate-400 mt-1" : "text-sm text-slate-500 mt-1"}>
            Échangez directement et en toute confidentialité avec vos médecins traitants
          </p>
        </div>

        <PButton
          variant="primary"
          isDark={isDark}
          onClick={() => {
            setShowNewChatModal(true);
            fetchDoctorsList();
          }}
        >
          <Plus size={18} />
          Contacter un Médecin
        </PButton>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-800">
          <span className="font-bold">Messagerie indisponible : </span>
          {loadError}
        </div>
      )}

      {/* Main chat interface : hauteur fixe, scroll INTERNE uniquement.
          La page ne doit jamais défiler quand on lit les messages. */}
      <div className={isDark ? "grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xs lg:h-[calc(100vh-260px)] lg:min-h-[620px] overflow-hidden" : "grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-200 shadow-xs lg:h-[calc(100vh-260px)] lg:min-h-[620px] overflow-hidden"}>
        {/* Left Sidebar: Conversations List */}
        <div className={isDark ? "lg:col-span-4 border-r border-slate-800 flex flex-col h-full min-h-0" : "lg:col-span-4 border-r border-slate-100 flex flex-col h-full min-h-0"}>
          {/* Search bar */}
          <div className={isDark ? "p-4 border-b border-slate-800" : "p-4 border-b border-slate-100"}>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une discussion..."
                className={isDark ? "w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" : "w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"}
              />
            </div>
          </div>

          {/* Conversations scroll area */}
          <div className={isDark ? "flex-1 overflow-y-auto divide-y divide-slate-800 min-h-0 max-h-[40vh] lg:max-h-none" : "flex-1 overflow-y-auto divide-y divide-slate-50 min-h-0 max-h-[40vh] lg:max-h-none"}>
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-sky-500" />
                Chargement des discussions...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <MessageCircle size={28} className="mx-auto mb-2 text-slate-300" />
                Aucune discussion active. Cliquez sur « Contacter un Médecin » pour démarrer.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-4 transition flex items-start gap-3 cursor-pointer active:scale-[0.99] ${
                      isSelected
                        ? (isDark ? "bg-sky-500/15 border-l-4 border-sky-500" : "bg-sky-50/70 border-l-4 border-sky-600")
                        : (isDark ? "hover:bg-slate-800" : "hover:bg-slate-50/80")
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {conv.title
                          .replace(/^Dr\.\s*/i, "")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={isDark ? "text-xs font-bold text-white truncate" : "text-xs font-bold text-slate-900 truncate"}>
                          {conv.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {conv.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-sky-600 font-medium truncate mt-0.5">
                        {conv.subtitle}
                      </p>
                      <p className={isDark ? "text-xs text-slate-400 truncate mt-1" : "text-xs text-slate-500 truncate mt-1"}>
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Conversation Messages */}
        <div className={isDark ? "lg:col-span-8 flex flex-col h-full min-h-0 bg-slate-950/60" : "lg:col-span-8 flex flex-col h-full min-h-0 bg-slate-50/30"}>
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className={isDark ? "p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between" : "p-4 border-b border-slate-100 bg-white flex items-center justify-between"}>
                <div className="flex items-center gap-3">
                  <div className={isDark ? "w-10 h-10 rounded-full bg-sky-500/15 text-sky-300 flex items-center justify-center font-bold text-sm" : "w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm"}>
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <h3 className={isDark ? "text-sm font-bold text-white" : "text-sm font-bold text-slate-900"}>
                      {activeConv.title}
                    </h3>
                    <p className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
                      {activeConv.subtitle} • Praticien Référent
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={isDark ? "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium" : "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium"}>
                    <Clock size={12} />
                    Réponse sous 24h
                  </span>
                </div>
              </div>

          {/* Messages Body : scroll interne, hauteur contrainte.
                  La page reste fixe, seuls les messages défilent. */}
              <div ref={messagesBoxRef} className="min-h-[320px] max-h-[62vh] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto p-6 space-y-4">
                {activeConv.messages.map((msg, idx) => {
                  const isMe = msg.senderRole === "patient";
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
                        <div
                          className={isDark ? "mx-auto max-w-md text-center py-2 px-4 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-400 leading-relaxed" : "mx-auto max-w-md text-center py-2 px-4 rounded-xl bg-slate-100/80 border border-slate-200/60 text-[11px] text-slate-500 leading-relaxed"}
                        >
                          <ShieldCheck size={14} className="inline mr-1 text-emerald-600" />
                          {msg.text}
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
                      {/* Nom de l'expéditeur au-dessus : seulement le médecin.
                          (Pas de nom au-dessus de mes propres messages.) */}
                      {!isMe && (
                      <div
                        className={`mb-1 px-1 text-[11px] font-bold ${
                          isDark
                            ? "text-sky-300 flex items-center gap-1"
                            : "text-sky-700 flex items-center gap-1"
                        }`}
                      >
                        <Stethoscope size={12} />
                        {msg.senderName}
                      </div>
                      )}
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                          isMe
                            ? "bg-sky-600 text-white rounded-br-xs"
                            : (isDark ? "bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-xs" : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs")
                        }`}
                      >
                        {msg.attachment && (
                          <AttachmentView att={msg.attachment} isMe={isMe} isDark={isDark} />
                        )}
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      {/* Date + heure + vu/envoyé sous le message */}
                      <div
                        className={`mt-1 flex items-center gap-1 px-1 text-[10px] ${
                          isMe ? "text-sky-200 justify-end" : "text-slate-400"
                        }`}
                      >
                        <span>{msg.date !== "Aujourd'hui" ? `${msg.date} • ` : ""}{msg.time}</span>
                        {isMe && (
                          msg.status === "read" ? (
                            <span className="flex items-center gap-0.5 font-semibold text-sky-500">
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

              {/* Chat Input Bar */}
              {sendError && (
                <div className="px-4 pt-3 text-[11px] font-medium text-rose-600">
                  {sendError}
                </div>
              )}
              <form
                onSubmit={handleSendMessage}
                className={isDark ? "relative p-4 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2" : "relative p-4 bg-white border-t border-slate-100 flex items-center gap-2"}
              >
                {/* Bouton pièce jointe */}
                <button
                  type="button"
                  onClick={() => setShowAttachMenu((v) => !v)}
                  title="Joindre : fichier, bilan, ordonnance, dossier"
                  className={isDark ? "p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:border-sky-500 transition cursor-pointer active:scale-[0.97] shrink-0" : "p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-sky-400 transition cursor-pointer active:scale-[0.97] shrink-0"}
                >
                  <Paperclip size={16} />
                </button>

                {/* Menu + : fichier / bilan / ordonnance / dossier */}
                {showAttachMenu && (
                  <div className={isDark ? "absolute left-4 bottom-[74px] z-30 w-64 rounded-2xl border border-slate-700 bg-slate-900 shadow-xl p-2 space-y-1" : "absolute left-4 bottom-[74px] z-30 w-64 rounded-2xl border border-slate-200 bg-white shadow-xl p-2 space-y-1"}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={isDark ? "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 transition cursor-pointer active:scale-[0.98] text-left" : "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer active:scale-[0.98] text-left"}
                    >
                      <FileText size={15} className="text-red-500 shrink-0" />
                      Fichier PDF / Image
                    </button>
                    <button
                      type="button"
                      onClick={() => openShareModal("lab")}
                      className={isDark ? "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 transition cursor-pointer active:scale-[0.98] text-left" : "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer active:scale-[0.98] text-left"}
                    >
                      <FlaskConical size={15} className="text-amber-500 shrink-0" />
                      Bilan d'analyse
                    </button>
                    <button
                      type="button"
                      onClick={() => openShareModal("prescription")}
                      className={isDark ? "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 transition cursor-pointer active:scale-[0.98] text-left" : "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer active:scale-[0.98] text-left"}
                    >
                      <Pill size={15} className="text-blue-500 shrink-0" />
                      Ordonnance
                    </button>
                    <button
                      type="button"
                      onClick={() => openShareModal("record")}
                      className={isDark ? "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 transition cursor-pointer active:scale-[0.98] text-left" : "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer active:scale-[0.98] text-left"}
                    >
                      <ClipboardList size={15} className="text-emerald-500 shrink-0" />
                      Dossier médical
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFilePicked(f);
                  }}
                />
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Écrivez un message à votre médecin..."
                  className={isDark ? "flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" : "flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending || uploading}
                  className="p-3 rounded-xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 transition cursor-pointer active:scale-[0.97] shrink-0"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageCircle size={48} className="text-slate-300 mb-3" />
              <h3 className={isDark ? "text-sm font-semibold text-slate-200" : "text-sm font-semibold text-slate-700"}>
                Sélectionnez une discussion
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Choisissez un médecin dans la liste de gauche ou lancez un nouvel échange.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Start New Chat with a Doctor */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={isDark ? "bg-slate-900/80 rounded-2xl shadow-xl border border-slate-800 max-w-lg w-full overflow-hidden" : "bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden"}
            >
              <div className={isDark ? "p-5 border-b border-slate-800 flex items-center justify-between" : "p-5 border-b border-slate-100 flex items-center justify-between"}>
                <div>
                  <h3 className={isDark ? "text-base font-bold text-white" : "text-base font-bold text-slate-900"}>
                    Contacter un Praticien
                  </h3>
                  <p className={isDark ? "text-xs text-slate-400 mt-0.5" : "text-xs text-slate-500 mt-0.5"}>
                    Sélectionnez un médecin pour initier une consultation par message
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className={isDark ? "text-slate-400 hover:text-slate-300 p-1.5 rounded-lg transition cursor-pointer active:scale-[0.97]" : "text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition cursor-pointer active:scale-[0.97]"}
                >
                  ✕
                </button>
              </div>

              <div className={isDark ? "px-4 pt-4" : "px-4 pt-4"}>
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    placeholder="Rechercher nom, spécialité, ville..."
                    className={isDark ? "w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" : "w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}
                  />
                  {doctorSearch && (
                    <button
                      type="button"
                      onClick={() => setDoctorSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm leading-none transition cursor-pointer active:scale-[0.97]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                {availableDoctors.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">
                    Aucun médecin disponible pour le moment.
                  </p>
                ) : (
                  availableDoctors
                    .filter((doc) => {
                      const q = doctorSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        doc.name.toLowerCase().includes(q) ||
                        (doc.specialty || "").toLowerCase().includes(q) ||
                        (doc.city || "").toLowerCase().includes(q) ||
                        (doc.hospital || "").toLowerCase().includes(q)
                      );
                    })
                    .map((doc) => (
                    <div
                      key={doc.id}
                      className={isDark ? "p-3.5 rounded-xl border border-slate-700 hover:border-sky-500 hover:bg-sky-500/10 transition flex items-center justify-between gap-3" : "p-3.5 rounded-xl border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/40 transition flex items-center justify-between gap-3"}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={isDark ? "w-10 h-10 rounded-full bg-sky-500/15 text-sky-300 flex items-center justify-center font-bold text-xs shrink-0" : "w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0"}>
                          {doc.name.replace(/^Dr\.\s*/i, "").charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className={isDark ? "text-xs font-bold text-white truncate" : "text-xs font-bold text-slate-900 truncate"}>
                            {doc.name}
                          </h4>
                          <p className="text-[11px] text-sky-600 font-medium truncate">
                            {doc.specialty}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {doc.hospital} • {doc.city}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartDoctorChat(doc)}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition cursor-pointer active:scale-[0.97]"
                      >
                        Contacter
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: partager un élément de mon dossier médical */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowShareModal(false);
          }}
        >
          <div className={isDark ? "bg-slate-900/95 rounded-2xl shadow-xl border border-slate-800 max-w-lg w-full overflow-hidden" : "bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden"}>
            <div className={isDark ? "p-5 border-b border-slate-800 flex items-center justify-between" : "p-5 border-b border-slate-100 flex items-center justify-between"}>
              <div>
                <h3 className={isDark ? "text-base font-bold text-white" : "text-base font-bold text-slate-900"}>
                  Partager depuis mon dossier
                </h3>
                <p className={isDark ? "text-xs text-slate-400 mt-0.5" : "text-xs text-slate-500 mt-0.5"}>
                  Cliquez sur un élément pour l'envoyer au médecin
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition cursor-pointer active:scale-[0.97]"
              >
                <X size={18} />
              </button>
            </div>

            <div className={isDark ? "flex gap-1 p-3 border-b border-slate-800" : "flex gap-1 p-3 border-b border-slate-100"}>
              {([
                { id: "lab", label: "Bilans", icon: FlaskConical },
                { id: "prescription", label: "Ordonnances", icon: Pill },
                { id: "record", label: "Dossier", icon: ClipboardList },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setShareTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-[0.97] ${
                    shareTab === t.id
                      ? "bg-sky-600 text-white hover:bg-sky-500"
                      : isDark
                        ? "text-slate-400 hover:bg-slate-800"
                        : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4 max-h-[380px] overflow-y-auto space-y-2">
              {shareLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2 text-sky-500" />
                  Chargement de votre dossier...
                </div>
              ) : shareTab === "lab" ? (
                (shareData?.labs || []).length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">Aucun bilan dans votre dossier.</p>
                ) : (
                  shareData!.labs.map((item: any) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleShareItem("lab", item)}
                      className={isDark ? "w-full text-left p-3 rounded-xl border border-slate-700 hover:border-sky-500 hover:bg-sky-500/10 transition cursor-pointer active:scale-[0.99]" : "w-full text-left p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition cursor-pointer active:scale-[0.99]"}
                    >
                      <p className={isDark ? "text-xs font-bold text-white" : "text-xs font-bold text-slate-900"}>{item.testName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.laboratoryName || "Laboratoire"}{item.testDate ? ` • ${fmtShort(item.testDate)}` : ""}
                        {Array.isArray(item.parameters) && item.parameters.length > 0 ? ` • ${item.parameters.length} analyses` : ""}
                      </p>
                    </button>
                  ))
                )
              ) : shareTab === "prescription" ? (
                (shareData?.prescriptions || []).length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">Aucune ordonnance dans votre dossier.</p>
                ) : (
                  shareData!.prescriptions.map((item: any) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleShareItem("prescription", item)}
                      className={isDark ? "w-full text-left p-3 rounded-xl border border-slate-700 hover:border-sky-500 hover:bg-sky-500/10 transition cursor-pointer active:scale-[0.99]" : "w-full text-left p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition cursor-pointer active:scale-[0.99]"}
                    >
                      <p className={isDark ? "text-xs font-bold text-white" : "text-xs font-bold text-slate-900"}>Ordonnance {item.prescriptionNumber}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {fmtShort(item.prescribedDate)}
                        {Array.isArray(item.items) && item.items.length > 0 ? ` • ${item.items.length} médicament(s)` : ""}
                      </p>
                    </button>
                  ))
                )
              ) : (shareData?.records || []).length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">Aucun dossier dans votre historique.</p>
              ) : (
                shareData!.records.map((item: any) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleShareItem("record", item)}
                    className={isDark ? "w-full text-left p-3 rounded-xl border border-slate-700 hover:border-sky-500 hover:bg-sky-500/10 transition cursor-pointer active:scale-[0.99]" : "w-full text-left p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition cursor-pointer active:scale-[0.99]"}
                  >
                    <p className={isDark ? "text-xs font-bold text-white" : "text-xs font-bold text-slate-900"}>{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {fmtShort(item.recordDate)}
                      {item.diagnosis ? ` • ${item.diagnosis}` : ""}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
