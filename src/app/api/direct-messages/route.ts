import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface Me {
  role: "patient" | "doctor";
  recordId: string;
  displayName: string;
}

async function resolveMe(request: NextRequest): Promise<Me | null> {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return null;
    const token = authorization.substring(7).trim();
    if (!token) return null;
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return null;

    const profile = await prisma.profile.findUnique({
      where: { authUserId: userData.user.id },
    });
    if (!profile) return null;

    if (profile.userType === "PATIENT") {
      const patient = await prisma.patient.findUnique({
        where: { profileId: profile.id },
        select: { id: true },
      });
      if (!patient) return null;
      const displayName =
        `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
        profile.email;
      return { role: "patient", recordId: patient.id, displayName };
    }

    if (profile.userType === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({
        where: { profileId: profile.id },
        select: { id: true },
      });
      if (!doctor) return null;
      const displayName =
        `Dr. ${profile.firstName || ""} ${profile.lastName || ""}`.trim();
      return { role: "doctor", recordId: doctor.id, displayName };
    }

    return null;
  } catch {
    return null;
  }
}

function isDbNotReadyError(err: any): boolean {
  const code = err?.code;
  // P2021 : table absente (migration non appliquée)
  // P1001/P1002 : base injoignable
  return code === "P2021" || code === "P1001" || code === "P1002";
}

function dbNotReadyResponse() {
  return NextResponse.json(
    {
      success: false,
      code: "db_not_ready",
      error:
        "Messagerie non initialisée côté serveur : lancez « npx prisma migrate deploy » puis « npx prisma generate » et redémarrez le serveur.",
    },
    { status: 503 }
  );
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function formatDate(d: Date): string {
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return "Aujourd'hui";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function serializeConversation(conv: any, me: Me) {
  const isPatient = me.role === "patient";
  const other = isPatient ? conv.doctor : conv.patient;
  const otherProfile = other?.profile || {};
  const specialties: string[] = isPatient
    ? (other?.specialties || []).map((s: any) => s.specialty?.name).filter(Boolean)
    : [];

  const otherName = isPatient
    ? `Dr. ${otherProfile.firstName || ""} ${otherProfile.lastName || ""}`.trim() || "Médecin"
    : `${otherProfile.firstName || ""} ${otherProfile.lastName || ""}`.trim() || "Patient";

  const messages = (conv.messages || []).map((m: any) => {
    const mine =
      (isPatient && m.senderRole === "patient") ||
      (!isPatient && m.senderRole === "doctor");
    return {
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName,
      senderRole: m.senderRole,
      text: m.text,
      time: formatTime(new Date(m.createdAt)),
      date: formatDate(new Date(m.createdAt)),
      createdAt: m.createdAt,
      attachment: m.attachment || null,
      status: mine ? (m.read ? "read" : "delivered") : "delivered",
    };
  });

  const last = messages[messages.length - 1];

  const rawUnread = (conv.messages || []).filter(
    (m: any) =>
      ((isPatient && m.senderRole === "doctor") ||
        (!isPatient && m.senderRole === "patient")) &&
      !m.read
  ).length;

  return {
    id: conv.id,
    patientId: conv.patientId,
    doctorId: conv.doctorId,
    title: otherName,
    subtitle: isPatient
      ? specialties[0] || "Médecin"
      : otherProfile.city || "Patient",
    lastMessage: last ? last.text : "",
    time: last ? last.time : "",
    unread: rawUnread > 0,
    unreadCount: rawUnread,
    otherParty: {
      id: other?.id || "",
      name: otherName,
      specialty: specialties[0] || "",
      city: otherProfile.city || "",
      avatarUrl: otherProfile.avatarUrl || null,
      online: true,
    },
    messages,
    updatedAt: conv.updatedAt,
  };
}

// ============================================================
// GET — mes conversations (strictement les miennes)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const me = await resolveMe(request);
    if (!me) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 }
      );
    }

    const where =
      me.role === "patient" ? { patientId: me.recordId } : { doctorId: me.recordId };

    let convs: any[] = [];
    try {
      convs = await prisma.directConversation.findMany({
        where,
        include: {
          doctor: {
            include: {
              profile: true,
              specialties: { include: { specialty: true } },
            },
          },
          patient: { include: { profile: true } },
          messages: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { updatedAt: "desc" },
      });
    } catch (err) {
      if (isDbNotReadyError(err)) throw err;
      console.warn("direct-messages GET findMany failed:", err);
      convs = [];
    }

    // Filtrage défensif côté JS (valable aussi en mode mock) :
    // je ne vois QUE les conversations où je suis patient OU médecin.
    const mine = (convs || []).filter((c: any) =>
      me.role === "patient"
        ? c.patientId === me.recordId
        : c.doctorId === me.recordId
    );

    const conversations = [];
    for (const c of mine) {
      conversations.push(await serializeConversation(c, me));
    }

    return NextResponse.json({
      success: true,
      role: me.role,
      myId: me.recordId,
      myName: me.displayName,
      conversations,
    });
  } catch (error) {
    console.error("GET /api/direct-messages error:", error);
    if (isDbNotReadyError(error)) return dbNotReadyResponse();
    return NextResponse.json(
      { success: false, error: "Unable to load conversations." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — get_or_create | send
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const me = await resolveMe(request);
    if (!me) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // ---- get_or_create : patient → doctorId | doctor → patientId ----
    if (action === "get_or_create") {
      const { doctorId, patientId } = body;
      let pId = "";
      let dId = "";

      if (me.role === "patient") {
        if (!doctorId) {
          return NextResponse.json(
            { success: false, error: "doctorId is required." },
            { status: 400 }
          );
        }
        const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
        if (!doctor) {
          return NextResponse.json(
            { success: false, error: "Doctor not found." },
            { status: 404 }
          );
        }
        pId = me.recordId;
        dId = doctorId;
      } else {
        if (!patientId) {
          return NextResponse.json(
            { success: false, error: "patientId is required." },
            { status: 400 }
          );
        }
        const patient = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient) {
          return NextResponse.json(
            { success: false, error: "Patient not found." },
            { status: 404 }
          );
        }
        pId = patientId;
        dId = me.recordId;
      }

      let conv: any = null;
      try {
        const existing = await prisma.directConversation.findMany({
          where: { patientId: pId, doctorId: dId },
        });
        conv = (existing || []).find(
          (c: any) => c.patientId === pId && c.doctorId === dId
        );
      } catch {
        conv = null;
      }

      if (!conv) {
        try {
          conv = await prisma.directConversation.create({
            data: { patientId: pId, doctorId: dId },
          });
        } catch (err: any) {
          // Course possible : la paire existe déjà (contrainte unique).
          if (err?.code === "P2002") {
            const existing = await prisma.directConversation.findMany({
              where: { patientId: pId, doctorId: dId },
            });
            conv = (existing || [])[0] || null;
          } else {
            throw err;
          }
        }
      }

      if (!conv) {
        return NextResponse.json(
          { success: false, error: "Unable to open conversation." },
          { status: 500 }
        );
      }

      // Recharger avec messages + interlocuteur pour la réponse.
      let full: any = conv;
      try {
        full =
          (await prisma.directConversation.findMany({
            where:
              me.role === "patient"
                ? { patientId: me.recordId }
                : { doctorId: me.recordId },
            include: {
              doctor: {
                include: {
                  profile: true,
                  specialties: { include: { specialty: true } },
                },
              },
              patient: { include: { profile: true } },
              messages: { orderBy: { createdAt: "asc" } },
            },
          })) || [];
        full =
          full.find((c: any) => c.id === conv.id) || conv;
        if (!full.messages) full = { ...full, messages: [] };
      } catch {
        full = { ...conv, messages: [], doctor: null, patient: null };
      }

      return NextResponse.json({
        success: true,
        conversation: await serializeConversation(full, me),
      });
    }

    // ---- send : message dans MA conversation ----
    if (action === "send") {
      const { conversationId, text, clientMessageId, attachment } = body;
      if (!conversationId || !text || !String(text).trim()) {
        return NextResponse.json(
          { success: false, error: "conversationId and text are required." },
          { status: 400 }
        );
      }

      let conv: any = null;
      try {
        const found = await prisma.directConversation.findMany({
          where: { id: conversationId },
        });
        conv = (found || [])[0] || null;
      } catch {
        conv = null;
      }

      // Vérification d'appartenance stricte : patient X ↔ médecin Y uniquement.
      if (
        !conv ||
        (me.role === "patient" && conv.patientId !== me.recordId) ||
        (me.role === "doctor" && conv.doctorId !== me.recordId)
      ) {
        return NextResponse.json(
          { success: false, error: "Conversation not found." },
          { status: 404 }
        );
      }

      const messageId =
        typeof clientMessageId === "string" && clientMessageId.trim()
          ? clientMessageId.trim().slice(0, 100)
          : undefined;

      // Pièce jointe validée : fichier uploadé ou élément médical partagé.
      let cleanAttachment: any = null;
      if (attachment && typeof attachment === "object") {
        const raw = JSON.stringify(attachment);
        if (raw.length <= 10000) {
          if (attachment.type === "file" && typeof attachment.url === "string") {
            cleanAttachment = {
              type: "file",
              url: String(attachment.url).slice(0, 500),
              name: String(attachment.name || "fichier").slice(0, 120),
              mime: String(attachment.mime || "").slice(0, 100),
            };
          } else if (
            attachment.type === "share" &&
            typeof attachment.kind === "string" &&
            typeof attachment.title === "string"
          ) {
            cleanAttachment = {
              type: "share",
              kind: String(attachment.kind).slice(0, 30),
              refId: String(attachment.refId || "").slice(0, 100),
              title: String(attachment.title).slice(0, 200),
              subtitle: String(attachment.subtitle || "").slice(0, 300),
              lines: Array.isArray(attachment.lines)
                ? attachment.lines.map((l: any) => String(l)).slice(0, 8).map((l: string) => l.slice(0, 200))
                : [],
            };
          }
        }
      }

      let message: any = null;
      try {
        message = await prisma.directMessage.create({
          data: {
            ...(messageId ? { id: messageId } : {}),
            conversationId: conv.id,
            senderRole: me.role,
            senderId: me.recordId,
            senderName: me.displayName,
            text: String(text).trim().slice(0, 2000),
            read: false,
            ...(cleanAttachment ? { attachment: cleanAttachment } : {}),
          },
        });
      } catch (err: any) {
        // L'ID client existe déjà (double envoi) : renvoyer le message existant.
        if (messageId) {
          try {
            const found = await prisma.directMessage.findMany({
              where: { id: messageId },
            });
            message =
              (found || []).find((m: any) => m.id === messageId) || null;
          } catch {
            message = null;
          }
        }
        if (!message) throw err;
      }

      try {
        await prisma.directConversation.update({
          where: { id: conv.id },
          data: {},
        });
      } catch {
        // mock ou updatedAt auto : ignorer
      }

      return NextResponse.json({ success: true, message }, { status: 201 });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /api/direct-messages error:", error);
    if (isDbNotReadyError(error)) return dbNotReadyResponse();
    return NextResponse.json(
      { success: false, error: "Unable to process request." },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — marquer comme lus les messages de l'interlocuteur
// ============================================================
export async function PATCH(request: NextRequest) {
  try {
    const me = await resolveMe(request);
    if (!me) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { conversationId } = body;
    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "conversationId is required." },
        { status: 400 }
      );
    }

    let conv: any = null;
    try {
      const found = await prisma.directConversation.findMany({
        where: { id: conversationId },
      });
      conv = (found || [])[0] || null;
    } catch {
      conv = null;
    }

    if (
      !conv ||
      (me.role === "patient" && conv.patientId !== me.recordId) ||
      (me.role === "doctor" && conv.doctorId !== me.recordId)
    ) {
      return NextResponse.json(
        { success: false, error: "Conversation not found." },
        { status: 404 }
      );
    }

    const otherRole = me.role === "patient" ? "doctor" : "patient";
    let toMark: any[] = [];
    try {
      toMark =
        (await prisma.directMessage.findMany({
          where: { conversationId: conv.id, senderRole: otherRole, read: false },
          select: { id: true },
        })) || [];
    } catch {
      toMark = [];
    }

    // Boucle d'updates unitaires : compatible mock + DB réelle.
    for (const m of toMark) {
      try {
        await prisma.directMessage.update({
          where: { id: m.id },
          data: { read: true },
        });
      } catch {
        break;
      }
    }

    return NextResponse.json({ success: true, marked: toMark.length });
  } catch (error) {
    console.error("PATCH /api/direct-messages error:", error);
    if (isDbNotReadyError(error)) return dbNotReadyResponse();
    return NextResponse.json(
      { success: false, error: "Unable to mark as read." },
      { status: 500 }
    );
  }
}
