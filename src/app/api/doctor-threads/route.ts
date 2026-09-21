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
  doctorId: string;
  displayName: string;
}

async function resolveDoctor(request: NextRequest): Promise<Me | null> {
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
    if (!profile || profile.userType !== "DOCTOR") return null;
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: profile.id },
      select: { id: true },
    });
    if (!doctor) return null;
    const displayName =
      `Dr. ${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Médecin";
    return { doctorId: doctor.id, displayName };
  } catch {
    return null;
  }
}

function isDbNotReadyError(err: any): boolean {
  const code = err?.code;
  return code === "P2021" || code === "P1001" || code === "P1002";
}

function dbNotReadyResponse() {
  return NextResponse.json(
    {
      success: false,
      code: "db_not_ready",
      error:
        "Threads non initialisés côté serveur : lancez « npx prisma migrate deploy » puis « npx prisma generate » et redémarrez le serveur.",
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

// Nom d'affichage d'un médecin (annuaire).
async function doctorDirectory(): Promise<Map<string, { name: string; specialty: string }>> {
  const map = new Map<string, { name: string; specialty: string }>();
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        profile: true,
        specialties: { include: { specialty: true } },
      },
    });
    for (const d of doctors || []) {
      const name =
        `Dr. ${d.profile?.firstName || ""} ${d.profile?.lastName || ""}`.trim() ||
        "Médecin";
      const specialty =
        (d.specialties || [])
          .map((s: any) => s.specialty?.name)
          .filter(Boolean)[0] || "";
      map.set(d.id, { name, specialty });
    }
  } catch {
    // annuaire indisponible : les ids bruts seront affichés
  }
  return map;
}

async function serializeThread(thread: any, me: Me, directory: Map<string, { name: string; specialty: string }>) {
  const memberIds: string[] = (thread.members || []).map((m: any) => m.doctorId);
  const others = memberIds.filter((id) => id !== me.doctorId);
  const isGroup = !!thread.groupName;

  const messages = (thread.messages || []).map((m: any) => ({
    id: m.id,
    senderId: m.senderId,
    senderName:
      m.senderId === me.doctorId
        ? me.displayName
        : directory.get(m.senderId)?.name || m.senderName,
    senderRole: m.senderId === "system" ? "system" : "colleague",
    text: m.text,
    time: formatTime(new Date(m.createdAt)),
    date: formatDate(new Date(m.createdAt)),
    createdAt: m.createdAt,
    status: "delivered",
  }));

  const unreadCount = (thread.messages || []).filter(
    (m: any) =>
      m.senderId !== me.doctorId &&
      m.senderId !== "system" &&
      !(Array.isArray(m.readBy) && m.readBy.includes(me.doctorId))
  ).length;

  const last = messages[messages.length - 1];
  const otherName = others.length
    ? directory.get(others[0])?.name || "Confrère"
    : me.displayName;

  return {
    id: thread.id,
    type: isGroup ? "group" : "colleague",
    title: isGroup ? thread.groupName : otherName,
    subtitle: isGroup
      ? `${memberIds.length} médecins • ${thread.specialty || "Staff clinique"}`
      : directory.get(others[0])?.specialty || "Confrère",
    lastMessage: last ? last.text : "",
    time: last ? last.time : "",
    unread: unreadCount > 0,
    unreadCount,
    status: "normal",
    online: true,
    memberIds,
    peerDoctorId: isGroup ? null : others[0] || null,
    group:
      isGroup
        ? {
            id: thread.id,
            name: thread.groupName,
            description: thread.description || "",
            specialty: thread.specialty || "",
            createdDate: formatDate(new Date(thread.createdAt)),
            createdBy: thread.createdById,
            members: memberIds.map((id) => ({
              id,
              name:
                id === me.doctorId
                  ? me.displayName
                  : directory.get(id)?.name || "Médecin",
              specialty: directory.get(id)?.specialty || "",
              hospital: "",
              city: "",
              phone: "",
              email: "",
              licenseNumber: "",
              online: true,
            })),
          }
        : null,
    messages,
    updatedAt: thread.updatedAt,
  };
}

async function loadThread(threadId: string) {
  const found = await prisma.doctorThread.findMany({
    where: { id: threadId },
    include: {
      members: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  return (found || [])[0] || null;
}

function isMember(thread: any, doctorId: string): boolean {
  return (thread?.members || []).some((m: any) => m.doctorId === doctorId);
}

// ============================================================
// GET — mes threads (1:1 + groupes), triés par activité récente
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const me = await resolveDoctor(request);
    if (!me) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as doctor." },
        { status: 401 }
      );
    }

    let memberships: any[] = [];
    try {
      memberships = await prisma.doctorThreadMember.findMany({
        where: { doctorId: me.doctorId },
      });
    } catch (err) {
      if (isDbNotReadyError(err)) return dbNotReadyResponse();
      memberships = [];
    }

    const ids = [...new Set((memberships || []).map((m: any) => m.threadId))];
    const threads: any[] = [];
    for (const id of ids) {
      try {
        const t = await loadThread(id);
        if (t && isMember(t, me.doctorId)) threads.push(t);
      } catch (err) {
        if (isDbNotReadyError(err)) return dbNotReadyResponse();
      }
    }
    threads.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const directory = await doctorDirectory();
    const serialized = [];
    for (const t of threads) {
      serialized.push(await serializeThread(t, me, directory));
    }

    return NextResponse.json({
      success: true,
      myId: me.doctorId,
      myName: me.displayName,
      threads: serialized,
    });
  } catch (error) {
    console.error("GET /api/doctor-threads error:", error);
    if (isDbNotReadyError(error)) return dbNotReadyResponse();
    return NextResponse.json(
      { success: false, error: "Unable to load threads." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — get_or_create_colleague | create_group | add_member | send
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const me = await resolveDoctor(request);
    if (!me) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as doctor." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;
    const directory = await doctorDirectory();

    // ---- discussion 1:1 avec un confrère de la plateforme ----
    if (action === "get_or_create_colleague") {
      const { doctorId } = body;
      if (!doctorId || doctorId === me.doctorId) {
        return NextResponse.json(
          { success: false, error: "Valid doctorId is required." },
          { status: 400 }
        );
      }
      const target = await prisma.doctor.findUnique({ where: { id: doctorId } });
      if (!target) {
        return NextResponse.json(
          { success: false, error: "Doctor not found." },
          { status: 404 }
        );
      }

      // Thread 1:1 existant = exactement nous deux, sans nom de groupe.
      let existing: any = null;
      try {
        const mine = await prisma.doctorThreadMember.findMany({
          where: { doctorId: me.doctorId },
          include: { thread: { include: { members: true } } },
        });
        existing = (mine || [])
          .map((m: any) => m.thread)
          .find(
            (t: any) =>
              !t.groupName &&
              t.members.length === 2 &&
              t.members.some((m: any) => m.doctorId === doctorId)
          );
      } catch (err) {
        if (isDbNotReadyError(err)) return dbNotReadyResponse();
      }

      let threadId = existing?.id;
      if (!threadId) {
        try {
          const created = await prisma.doctorThread.create({
            data: {
              createdById: me.doctorId,
              members: { create: [{ doctorId: me.doctorId }, { doctorId }] },
            },
          });
          threadId = created.id;
        } catch (err: any) {
          if (isDbNotReadyError(err)) return dbNotReadyResponse();
          throw err;
        }
      }

      const thread = await loadThread(threadId);
      return NextResponse.json({
        success: true,
        thread: await serializeThread(thread, me, directory),
      });
    }

    // ---- groupe de médecins : nom + spécialité ----
    if (action === "create_group") {
      const { name, specialty, description, memberIds } = body;
      if (!name || !String(name).trim()) {
        return NextResponse.json(
          { success: false, error: "Group name is required." },
          { status: 400 }
        );
      }
      const ids = [...new Set([me.doctorId, ...((Array.isArray(memberIds) ? memberIds : []).filter((id: any) => typeof id === "string" && id && id !== me.doctorId))])];

      // Vérifier que les invités existent vraiment.
      for (const id of ids) {
        if (id === me.doctorId) continue;
        const d = await prisma.doctor.findUnique({ where: { id } });
        if (!d) {
          return NextResponse.json(
            { success: false, error: "One invited doctor was not found." },
            { status: 404 }
          );
        }
      }

      let created: any;
      try {
        created = await prisma.doctorThread.create({
          data: {
            groupName: String(name).trim().slice(0, 120),
            specialty: String(specialty || "").trim().slice(0, 120),
            description: String(description || "").trim().slice(0, 500),
            createdById: me.doctorId,
            members: { create: ids.map((doctorId: string) => ({ doctorId })) },
          },
        });
      } catch (err) {
        if (isDbNotReadyError(err)) return dbNotReadyResponse();
        throw err;
      }

      // Message système de création.
      try {
        await prisma.doctorThreadMessage.create({
          data: {
            threadId: created.id,
            senderId: "system",
            senderName: "DOCTORZ Co.",
            text: `Groupe « ${String(name).trim()} » créé par ${me.displayName} (${ids.length} médecins).`,
            readBy: [me.doctorId],
          },
        });
      } catch {
        // non bloquant
      }

      const thread = await loadThread(created.id);
      return NextResponse.json({
        success: true,
        thread: await serializeThread(thread, me, directory),
      });
    }

    // ---- inviter un confrère dans un groupe ----
    if (action === "add_member") {
      const { threadId, doctorId } = body;
      if (!threadId || !doctorId) {
        return NextResponse.json(
          { success: false, error: "threadId and doctorId are required." },
          { status: 400 }
        );
      }
      let thread: any = null;
      try {
        thread = await loadThread(threadId);
      } catch (err) {
        if (isDbNotReadyError(err)) return dbNotReadyResponse();
      }
      if (!thread || !isMember(thread, me.doctorId) || !thread.groupName) {
        return NextResponse.json(
          { success: false, error: "Group not found." },
          { status: 404 }
        );
      }
      const target = await prisma.doctor.findUnique({ where: { id: doctorId } });
      if (!target) {
        return NextResponse.json(
          { success: false, error: "Doctor not found." },
          { status: 404 }
        );
      }
      try {
        await prisma.doctorThreadMember.create({
          data: { threadId, doctorId },
        });
      } catch {
        // déjà membre : ignorer
      }
      const fresh = await loadThread(threadId);
      return NextResponse.json({
        success: true,
        thread: await serializeThread(fresh, me, directory),
      });
    }

    // ---- envoyer un message (1:1 ou groupe) ----
    if (action === "send") {
      const { threadId, text, clientMessageId } = body;
      if (!threadId || !text || !String(text).trim()) {
        return NextResponse.json(
          { success: false, error: "threadId and text are required." },
          { status: 400 }
        );
      }
      let thread: any = null;
      try {
        thread = await loadThread(threadId);
      } catch (err) {
        if (isDbNotReadyError(err)) return dbNotReadyResponse();
      }
      if (!thread || !isMember(thread, me.doctorId)) {
        return NextResponse.json(
          { success: false, error: "Thread not found." },
          { status: 404 }
        );
      }

      const messageId =
        typeof clientMessageId === "string" && clientMessageId.trim()
          ? clientMessageId.trim().slice(0, 100)
          : undefined;

      let message: any = null;
      try {
        message = await prisma.doctorThreadMessage.create({
          data: {
            ...(messageId ? { id: messageId } : {}),
            threadId,
            senderId: me.doctorId,
            senderName: me.displayName,
            text: String(text).trim().slice(0, 2000),
            readBy: [me.doctorId],
          },
        });
      } catch (err: any) {
        if (messageId) {
          try {
            const found = await prisma.doctorThreadMessage.findMany({
              where: { id: messageId },
            });
            message = (found || []).find((m: any) => m.id === messageId) || null;
          } catch {
            message = null;
          }
        }
        if (!message) {
          if (isDbNotReadyError(err)) return dbNotReadyResponse();
          throw err;
        }
      }

      try {
        await prisma.doctorThread.update({
          where: { id: threadId },
          data: {},
        });
      } catch {
        // updatedAt auto : ignorer
      }

      return NextResponse.json({ success: true, message }, { status: 201 });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /api/doctor-threads error:", error);
    if (isDbNotReadyError(error)) return dbNotReadyResponse();
    return NextResponse.json(
      { success: false, error: "Unable to process request." },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — marquer un thread comme lu pour moi
// ============================================================
export async function PATCH(request: NextRequest) {
  try {
    const me = await resolveDoctor(request);
    if (!me) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as doctor." },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { threadId } = body;
    if (!threadId) {
      return NextResponse.json(
        { success: false, error: "threadId is required." },
        { status: 400 }
      );
    }

    let thread: any = null;
    try {
      thread = await loadThread(threadId);
    } catch (err) {
      if (isDbNotReadyError(err)) return dbNotReadyResponse();
    }
    if (!thread || !isMember(thread, me.doctorId)) {
      return NextResponse.json(
        { success: false, error: "Thread not found." },
        { status: 404 }
      );
    }

    const unread = (thread.messages || []).filter(
      (m: any) =>
        m.senderId !== me.doctorId &&
        !(Array.isArray(m.readBy) && m.readBy.includes(me.doctorId))
    );
    for (const m of unread) {
      try {
        const current: string[] = Array.isArray(m.readBy) ? m.readBy : [];
        if (current.includes(me.doctorId)) continue;
        await prisma.doctorThreadMessage.update({
          where: { id: m.id },
          data: { readBy: [...current, me.doctorId] },
        });
      } catch {
        break;
      }
    }

    return NextResponse.json({ success: true, marked: unread.length });
  } catch (error) {
    console.error("PATCH /api/doctor-threads error:", error);
    if (isDbNotReadyError(error)) return dbNotReadyResponse();
    return NextResponse.json(
      { success: false, error: "Unable to mark as read." },
      { status: 500 }
    );
  }
}
