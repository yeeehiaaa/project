"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Search,
  ShieldCheck,
  Clock,
  CheckCheck,
  Plus,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

let msgCounter = 0;
function createClientMsgId() {
  msgCounter += 1;
  return `msg-pat-client-${msgCounter}`;
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

export default function PatientMessagesPage() {
  const [conversations, setConversations] = useState<PatientConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState<DoctorContact[]>([]);
  const [currentPatientId, setCurrentPatientId] = useState("pat-1");
  const [currentPatientName, setCurrentPatientName] = useState("Karim Haddad");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

  // Fetch conversations
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?userId=${currentPatientId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.doctors)) {
            setAvailableDoctors(data.doctors);
          }
          if (Array.isArray(data.conversations)) {
            setConversations(data.conversations);
            setSelectedConvId((prev) => {
              if (prev && data.conversations.some((c: any) => c.id === prev)) {
                return prev;
              }
              return data.conversations[0]?.id || "";
            });
          }
        }
      }
    } catch (err) {
      console.warn("Error fetching patient messages:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPatientId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll to bottom on conversation change or new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConvId, conversations]);

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !activeConv || sending) return;

    setSending(true);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const tempMsg: Message = {
      id: createClientMsgId(),
      senderId: currentPatientId,
      senderName: currentPatientName,
      senderRole: "patient",
      text,
      time: timeStr,
      date: "Aujourd'hui",
      status: "sent",
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
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_message",
          payload: {
            conversationId: activeConv.id,
            targetParticipantId: activeConv.doctor?.id,
            text,
            senderId: currentPatientId,
            senderName: currentPatientName,
            senderRole: "patient",
          },
        }),
      });
      // Refresh to ensure server sync
      fetchMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  // Start new chat with doctor
  const handleStartDoctorChat = async (doctor: DoctorContact) => {
    const existing = conversations.find(
      (c) => c.doctor?.id === doctor.id || c.id.includes(doctor.id)
    );
    if (existing) {
      setSelectedConvId(existing.id);
      setShowNewChatModal(false);
      return;
    }

    const newConvId = `conv-direct-${currentPatientId}-${doctor.id}`;
    const initialText = `Bonjour Docteur ${doctor.name}, je vous contacte concernant mon suivi médical.`;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newConv: PatientConversation = {
      id: newConvId,
      type: "patient",
      title: doctor.name,
      subtitle: doctor.specialty,
      lastMessage: initialText,
      time: timeStr,
      unread: false,
      doctor,
      messages: [
        {
          id: createClientMsgId(),
          senderId: currentPatientId,
          senderName: currentPatientName,
          senderRole: "patient",
          text: initialText,
          time: timeStr,
          date: "Aujourd'hui",
          status: "sent",
        },
      ],
    };

    setConversations((prev) => [newConv, ...prev]);
    setSelectedConvId(newConvId);
    setShowNewChatModal(false);

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_message",
          payload: {
            conversationId: newConvId,
            targetParticipantId: doctor.id,
            text: initialText,
            senderId: currentPatientId,
            senderName: currentPatientName,
            senderRole: "patient",
          },
        }),
      });
      fetchMessages();
    } catch (err) {
      console.error("Failed to initiate conversation:", err);
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Messagerie Médicale
            </h1>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <ShieldCheck size={13} />
              Secret Médical Protégé
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Échangez directement et en toute confidentialité avec vos médecins traitants
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewChatModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition"
        >
          <Plus size={18} />
          Contacter un Médecin
        </button>
      </div>

      {/* Main chat interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-200 shadow-xs min-h-[640px] overflow-hidden">
        {/* Left Sidebar: Conversations List */}
        <div className="lg:col-span-4 border-r border-slate-100 flex flex-col h-full">
          {/* Search bar */}
          <div className="p-4 border-b border-slate-100">
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
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
          </div>

          {/* Conversations scroll area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-violet-500" />
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
                    className={`w-full text-left p-4 transition flex items-start gap-3 ${
                      isSelected
                        ? "bg-violet-50/70 border-l-4 border-violet-600"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
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
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {conv.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {conv.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-violet-600 font-medium truncate mt-0.5">
                        {conv.subtitle}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-1">
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
        <div className="lg:col-span-8 flex flex-col h-full bg-slate-50/30">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {activeConv.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeConv.subtitle} • Praticien Référent
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                    <Clock size={12} />
                    Réponse sous 24h
                  </span>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeConv.messages.map((msg) => {
                  const isMe = msg.senderRole === "patient";
                  const isSystem = msg.senderRole === "system";

                  if (isSystem) {
                    return (
                      <div
                        key={msg.id}
                        className="mx-auto max-w-md text-center py-2 px-4 rounded-xl bg-slate-100/80 border border-slate-200/60 text-[11px] text-slate-500 leading-relaxed"
                      >
                        <ShieldCheck size={14} className="inline mr-1 text-emerald-600" />
                        {msg.text}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                          isMe
                            ? "bg-violet-600 text-white rounded-br-xs"
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                        }`}
                      >
                        {!isMe && (
                          <div className="font-bold text-[11px] text-violet-700 mb-1 flex items-center gap-1">
                            <Stethoscope size={12} />
                            {msg.senderName}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <div
                          className={`mt-1.5 flex items-center gap-1 text-[10px] justify-end ${
                            isMe ? "text-violet-200" : "text-slate-400"
                          }`}
                        >
                          <span>{msg.time}</span>
                          {isMe && <CheckCheck size={12} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t border-slate-100 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Écrivez un message à votre médecin..."
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageCircle size={48} className="text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">
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
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Contacter un Praticien
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sélectionnez un médecin pour initier une consultation par message
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                {availableDoctors.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">
                    Aucun médecin disponible pour le moment.
                  </p>
                ) : (
                  availableDoctors.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 hover:border-violet-300 hover:bg-violet-50/40 transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {doc.name.replace(/^Dr\.\s*/i, "").charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {doc.name}
                          </h4>
                          <p className="text-[11px] text-violet-600 font-medium truncate">
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
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition"
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
    </div>
  );
}
