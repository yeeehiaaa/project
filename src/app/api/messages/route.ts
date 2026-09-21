import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { Conversation, DoctorContact, PatientContact, Message } from "@/types/messenger";

// Per-doctor isolated conversation store: each doctor only sees his own inbox.
// Previously a single global array was shared by ALL doctors, so doctor 2
// saw everything created by doctor 1.
const liveInboxes = new Map<string, Conversation[]>();
let legacySeeded = false;

// Disk persistence so deliveries survive a dev-server restart
// (in-memory state alone is wiped on every restart).
const INBOX_FILE = join(process.cwd(), ".data", "doctor-inboxes.json");

function persistInboxes(): void {
  try {
    mkdirSync(join(process.cwd(), ".data"), { recursive: true });
    writeFileSync(INBOX_FILE, JSON.stringify(Object.fromEntries(liveInboxes)), "utf-8");
  } catch (err) {
    console.warn("persistInboxes error:", err);
  }
}

function restoreInboxes(): void {
  try {
    if (liveInboxes.size > 0) return;
    if (!existsSync(INBOX_FILE)) return;
    const obj = JSON.parse(readFileSync(INBOX_FILE, "utf-8"));
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) liveInboxes.set(key, value as Conversation[]);
    }
    // Restored real inboxes: never reseed demo data on top of them.
    if (liveInboxes.size > 0) legacySeeded = true;
  } catch (err) {
    console.warn("restoreInboxes error:", err);
  }
}

// Helper to map DB doctor to DoctorContact
function mapDbDoctorToContact(doc: any): DoctorContact {
  const firstName = doc.profile?.firstName || "";
  const lastName = doc.profile?.lastName || "";
  const fullName = firstName || lastName ? `Dr. ${firstName} ${lastName}`.trim() : `Dr. ${doc.id}`;

  const specName =
    doc.specialties?.[0]?.specialty?.name ||
    doc.diploma ||
    "Médecine Générale";

  let hospitalName = "Clinique & Cabinet Médical";
  if (doc.biography?.includes("CHU Mustapha")) hospitalName = "CHU Mustapha Pacha (Alger)";
  else if (doc.biography?.includes("Constantine") || doc.profile?.city === "Constantine") hospitalName = "CHU Constantine (Ibn Badis)";
  else if (doc.biography?.includes("Oran") || doc.profile?.city === "Oran") hospitalName = "EHU d'Oran (1er Novembre 1954)";
  else if (doc.biography?.includes("Bab El Oued")) hospitalName = "CHU Bab El Oued (Lamine Debaghine)";
  else if (doc.biography?.includes("Beni Messous")) hospitalName = "CHU Beni Messous (Alger)";
  else if (doc.biography?.includes("Glycines")) hospitalName = "Clinique Médico-Chirurgicale des Glycines";
  else if (doc.profile?.city) hospitalName = `Centre Hospitalier & Clinique (${doc.profile.city})`;

  return {
    id: doc.id,
    name: fullName,
    specialty: specName,
    hospital: hospitalName,
    city: doc.profile?.city || "Alger",
    phone: doc.profile?.phone || "+213 550 00 00 00",
    email: doc.profile?.email || `${doc.id}@mediconnect.dz`,
    licenseNumber: doc.licenseNumber || "ONM-DZ-2024",
    online: true,
    avatarUrl: doc.profile?.avatarUrl,
  };
}

// Helper to parse DB allergies (which can be a string, JSON array, or null) into string[]
function parseAllergies(allergies: any): string[] {
  if (!allergies) return [];
  if (Array.isArray(allergies)) return allergies.map(String).filter(Boolean);
  if (typeof allergies === "string") {
    const trimmed = allergies.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
      } catch {
        // fall through
      }
    }
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

// Helper to map DB patient to PatientContact
function mapDbPatientToContact(pat: any): PatientContact {
  const firstName = pat.profile?.firstName || "";
  const lastName = pat.profile?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || `Patient ${pat.id}`;

  let age = 45;
  if (pat.profile?.birthDate) {
    const birthYear = new Date(pat.profile.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const calculated = currentYear - birthYear;
    if (calculated > 0 && calculated < 120) age = calculated;
  }

  const gender = pat.profile?.gender === "FEMALE" ? "Femme" : "Homme";

  return {
    id: pat.id,
    name: fullName,
    age,
    gender,
    phone: pat.profile?.phone || "+33 6 00 00 00 00",
    email: pat.profile?.email || `${pat.id}@email.com`,
    bloodGroup: pat.bloodType || "O+",
    chronicCondition: pat.chronicConditions || "Suivi régulier",
    allergies: parseAllergies(pat.allergies),
    lastVisit: "Récemment",
    online: true,
  };
}

// Generate realistic clinical conversations between doctors, patients and groups from DB
function generateDatabaseConversations(
  doctors: DoctorContact[],
  patients: PatientContact[]
): Conversation[] {
  const drAmine = doctors.find((d) => d.id === "doc-1" || d.id === "doc-amine") || doctors[0];
  const drYasmine = doctors.find((d) => d.id === "doc-3" || d.id === "doc-yasmine") || doctors[1] || doctors[0];
  const drRyad = doctors.find((d) => d.id === "doc-ryad") || doctors[2] || doctors[0];
  const prKarim = doctors.find((d) => d.id === "doc-karim-t") || doctors[3] || doctors[0];

  const patKarim = patients.find((p) => p.id === "pat-1") || patients[0];
  const patAmina = patients.find((p) => p.id === "pat-2") || patients[1] || patients[0];
  const patYoucef = patients.find((p) => p.id === "pat-3") || patients[2] || patients[0];
  const patFatima = patients.find((p) => p.id === "pat-4") || patients[3] || patients[0];

  const rcpMembers = doctors.slice(0, 5);

  return [
    // 1. Confrère: Dr. Amine Benali (Cardiologue interventionnel, CHU Mustapha Pacha)
    {
      id: "conv-doc-amine",
      type: "colleague",
      title: drAmine.name,
      subtitle: `${drAmine.specialty} • ${drAmine.hospital}`,
      lastMessage: "Rapport de coronarographie disponible : la sténose IVA moyenne a été dilatée avec succès (Stent actif 3.0x18mm).",
      time: "10:15",
      unread: true,
      unreadCount: 1,
      status: "urgent",
      online: true,
      doctor: drAmine,
      messages: [
        {
          id: "msg-ab-1",
          senderId: "doc-sarah",
          senderName: "Dr. Sarah Khelifi",
          senderRole: "doctor",
          senderSpecialty: "Cardiologue",
          text: `Bonjour Amine. Je t'adresse le dossier de ${patKarim.name} (${patKarim.age} ans). L'épreuve d'effort montre une ischémie myocardique sous-lésionnelle en antéro-septo-apical à 80% de la FMT. Quel est ton avis pour une coronarographie ?`,
          time: "Hier 16:30",
          date: "15 Sep 2026",
          status: "read",
          attachment: {
            id: "att-ecg-bensaid",
            name: "Epreuve_Effort_Ischemie_Bensaid.pdf",
            type: "pdf",
            size: "2.4 Mo",
          },
        },
        {
          id: "msg-ab-2",
          senderId: drAmine.id,
          senderName: drAmine.name,
          senderRole: "colleague",
          senderSpecialty: drAmine.specialty,
          text: "Bonjour Sarah. J'ai examiné le tracé. Le sous-décalage de 2.5 mm en V3-V5 est très significatif. Nous le programmons au laboratoire de cathétérisme de Mustapha Pacha pour demain 8h30.",
          time: "Hier 17:15",
          date: "15 Sep 2026",
          status: "read",
        },
        {
          id: "msg-ab-3",
          senderId: drAmine.id,
          senderName: drAmine.name,
          senderRole: "colleague",
          senderSpecialty: drAmine.specialty,
          text: "Rapport de coronarographie disponible : la sténose IVA moyenne a été dilatée avec succès (Stent actif 3.0x18mm). Flux TIMI 3 final impeccable. Sous Kardégic 75mg + Brilique 90mg x2/j.",
          time: "10:15",
          date: "Aujourd'hui",
          status: "delivered",
          attachment: {
            id: "att-coro-rapport",
            name: "Rapport_Coronarographie_Stent_IVA.pdf",
            type: "pdf",
            size: "3.8 Mo",
          },
        },
      ],
    },

    // 2. Patient: Karim Haddad (Post-SCA & Hypertension)
    {
      id: "conv-pat-karim",
      type: "patient",
      title: patKarim.name,
      subtitle: `Patient #${patKarim.id} • ${patKarim.age} ans (${patKarim.chronicCondition})`,
      lastMessage: "Docteur, ma tension de ce matin est à 128/82 mmHg et mon pouls à 68 bpm. Je continue la même dose ?",
      time: "09:40",
      unread: true,
      unreadCount: 2,
      status: "normal",
      online: true,
      patient: patKarim,
      messages: [
        {
          id: "msg-kh-1",
          senderId: patKarim.id,
          senderName: patKarim.name,
          senderRole: "patient",
          text: "Bonjour Docteur Khelifi, je vous transmets mes mesures tensionnelles de cette première semaine après le changement de traitement.",
          time: "09:35",
          date: "Aujourd'hui",
          status: "read",
        },
        {
          id: "msg-kh-2",
          senderId: patKarim.id,
          senderName: patKarim.name,
          senderRole: "patient",
          text: "Docteur, ma tension de ce matin est à 128/82 mmHg et mon pouls à 68 bpm. Je tolère très bien le Bisoprolol 2.5mg, plus d'essoufflement à la montée d'escalier. Je continue la même dose ?",
          time: "09:40",
          date: "Aujourd'hui",
          status: "delivered",
          attachment: {
            id: "att-automesures-kh",
            name: "Releve_Tensionnel_7Jours.pdf",
            type: "pdf",
            size: "620 Ko",
          },
        },
      ],
    },

    // 3. Groupe RCP: Réunion de Concertation Cardiologique & Chirurgicale
    {
      id: "conv-group-rcp",
      type: "group",
      title: "Staff Pluridisciplinaire Cardio-Thoracique",
      subtitle: `${rcpMembers.length} spécialistes • Cardiologie & Chirurgie`,
      lastMessage: `${prKarim.name}: "Dossier validé pour pontage coronarien mini-invasif mardi matin."`,
      time: "08:50",
      unread: false,
      unreadCount: 0,
      status: "urgent",
      online: true,
      group: {
        id: "grp-rcp-cardio",
        name: "Staff Pluridisciplinaire Cardio-Thoracique",
        description: "Staff clinique hebdomadaire de concertation pour les lésions coronariennes tritronculaires et valvulopathies chirurgicales complexes.",
        specialty: "Chirurgie Cardiaque & Rythmologie",
        createdDate: "01 Sep 2026",
        createdBy: "Dr. Sarah Khelifi",
        members: rcpMembers,
      },
      messages: [
        {
          id: "msg-rcp-1",
          senderId: "doc-sarah",
          senderName: "Dr. Sarah Khelifi",
          senderRole: "doctor",
          senderSpecialty: "Cardiologue",
          text: "Bonjour chers confrères. Je soumets à la RCP le dossier d'une patiente de 64 ans, lésion du tronc commun distal associée à une sténose aortique serrée (gradient moyen 45 mmHg). Avez-vous pu visualiser le coroscanner ?",
          time: "08:15",
          date: "Aujourd'hui",
          status: "read",
        },
        {
          id: "msg-rcp-2",
          senderId: drRyad.id,
          senderName: drRyad.name,
          senderRole: "colleague",
          senderSpecialty: drRyad.specialty,
          text: "Oui Sarah. Les reconstructions 3D du scanner montrent une calcification étendue de la valve aortique sans atteinte coronaire distale. L'anneau est mesuré à 23.4 mm.",
          time: "08:32",
          date: "Aujourd'hui",
          status: "read",
          attachment: {
            id: "att-coroscanner-3d",
            name: "Reconstruction_3D_Valvulaire.pdf",
            type: "pdf",
            size: "12.1 Mo",
          },
        },
        {
          id: "msg-rcp-3",
          senderId: prKarim.id,
          senderName: prKarim.name,
          senderRole: "colleague",
          senderSpecialty: prKarim.specialty,
          text: "Dossier validé pour pontage coronarien mini-invasif mardi matin. Prévoir TAVI combiné si le score STS reste modéré.",
          time: "08:50",
          date: "Aujourd'hui",
          status: "read",
        },
      ],
    },

    // 4. Confrère: Dr. Yasmine Meziani (Pédiatrie, CHU Constantine)
    {
      id: "conv-doc-yasmine",
      type: "colleague",
      title: drYasmine.name,
      subtitle: `${drYasmine.specialty} • ${drYasmine.hospital}`,
      lastMessage: "L'échocardiographie pédiatrique confirme une petite CIV restrictive musculaire. Rassurer les parents, simple surveillance.",
      time: "Hier 15:20",
      unread: false,
      status: "normal",
      online: true,
      doctor: drYasmine,
      messages: [
        {
          id: "msg-ym-1",
          senderId: drYasmine.id,
          senderName: drYasmine.name,
          senderRole: "colleague",
          senderSpecialty: drYasmine.specialty,
          text: "Bonjour Dr. Khelifi. Je t'ai envoyé l'enregistrement du souffle systolique chez le nourrisson de 4 mois que nous avons reçu hier aux urgences pédiatriques de Constantine.",
          time: "Hier 14:10",
          date: "15 Sep 2026",
          status: "read",
        },
        {
          id: "msg-ym-2",
          senderId: drYasmine.id,
          senderName: drYasmine.name,
          senderRole: "colleague",
          senderSpecialty: drYasmine.specialty,
          text: "L'échocardiographie pédiatrique confirme une petite CIV restrictive musculaire. Rassurer les parents, simple surveillance échographique à 6 mois sans restriction d'activité.",
          time: "Hier 15:20",
          date: "15 Sep 2026",
          status: "read",
        },
      ],
    },

    // 5. Patient: Amina Meziane (Asthme sévère persistant)
    {
      id: "conv-pat-amina",
      type: "patient",
      title: patAmina.name,
      subtitle: `Patiente #${patAmina.id} • ${patAmina.age} ans (${patAmina.chronicCondition})`,
      lastMessage: "Bonjour Docteur, j'ai eu une gêne respiratoire hier soir avec sifflements. Mon débit de pointe était à 320 L/min.",
      time: "Hier 18:45",
      unread: false,
      status: "urgent",
      online: false,
      patient: patAmina,
      messages: [
        {
          id: "msg-am-1",
          senderId: patAmina.id,
          senderName: patAmina.name,
          senderRole: "patient",
          text: "Bonjour Docteur, j'ai eu une gêne respiratoire hier soir avec sifflements. Mon débit de pointe était à 320 L/min. J'ai pris deux bouffées de Ventoline et ça s'est calmé.",
          time: "Hier 18:45",
          date: "15 Sep 2026",
          status: "read",
        },
      ],
    },

    // 6. Patient: Youcef Mansouri (Diabète de type 2)
    {
      id: "conv-pat-youcef",
      type: "patient",
      title: patYoucef.name,
      subtitle: `Patient #${patYoucef.id} • ${patYoucef.age} ans (${patYoucef.chronicCondition})`,
      lastMessage: "Résultats du bilan rénal et HbA1c reçus : hémoglobine glyquée à 7.1%, fonction rénale normale.",
      time: "12 Sep",
      unread: false,
      status: "normal",
      online: true,
      patient: patYoucef,
      messages: [
        {
          id: "msg-ym-pat-1",
          senderId: patYoucef.id,
          senderName: patYoucef.name,
          senderRole: "patient",
          text: "Bonjour Dr. Khelifi, voici les résultats de mon bilan trimestriel du laboratoire. L'HbA1c est descendue à 7.1%.",
          time: "12 Sep 11:20",
          date: "12 Sep 2026",
          status: "read",
          attachment: {
            id: "att-lab-youcef",
            name: "Bilan_Biologique_HbA1c_Creatinine.pdf",
            type: "lab",
            size: "1.2 Mo",
          },
        },
      ],
    },

    // 7. Patient: Fatima Zohra Benali (Dysthyroïdie / Hashimoto)
    {
      id: "conv-pat-fatima",
      type: "patient",
      title: patFatima.name,
      subtitle: `Patiente #${patFatima.id} • ${patFatima.age} ans (${patFatima.chronicCondition})`,
      lastMessage: "La pharmacie a bien délivré le Lévothyrox 87.5 µg selon votre ordonnance électronique. Merci beaucoup.",
      time: "08 Sep",
      unread: false,
      status: "normal",
      online: false,
      patient: patFatima,
      messages: [
        {
          id: "msg-fb-1",
          senderId: patFatima.id,
          senderName: patFatima.name,
          senderRole: "patient",
          text: "La pharmacie a bien délivré le Lévothyrox 87.5 µg selon votre ordonnance électronique. Merci beaucoup pour votre réactivité Docteur.",
          time: "08 Sep 16:15",
          date: "08 Sep 2026",
          status: "read",
        },
      ],
    },
  ];
}

// =========================================================================
// GET: per-doctor isolated inbox + full directory for discovery
// =========================================================================
export async function GET(req: NextRequest) {
  try {
    restoreInboxes();
    const { searchParams } = new URL(req.url);
    void searchParams;

    // 1. Fetch real doctors from Prisma database
    const dbDoctors = await prisma.doctor.findMany({
      include: {
        profile: true,
        specialties: {
          include: {
            specialty: true,
          },
        },
      },
    });

    // 2. Fetch real patients from Prisma database
    const dbPatients = await prisma.patient.findMany({
      include: {
        profile: true,
      },
    });

    // 3. Map to messenger contracts
    const doctors: DoctorContact[] = dbDoctors.map(mapDbDoctorToContact);
    const patients: PatientContact[] = dbPatients.map(mapDbPatientToContact);

    // 4. AUCUNE conversation démo : uniquement des conversations réelles.
    // Les discussions confrères/groupes vivent dans /api/doctor-threads,
    // les discussions patient dans /api/direct-messages.
    // Cette route ne sert plus que d'annuaire (médecins + patients).
    const inbox: Conversation[] = [];

    return NextResponse.json({
      success: true,
      source: "prisma_database",
      databaseConnected: true,
      counts: {
        doctors: doctors.length,
        patients: patients.length,
        conversations: inbox.length,
      },
      doctors,
      patients,
      conversations: inbox,
    });
  } catch (error) {
    console.error("GET /api/messages database error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la communication avec la base de données",
      },
      { status: 500 }
    );
  }
}

// =========================================================================
// POST: Actions on database conversations (send message, create group, reset)
// =========================================================================
export async function POST(req: NextRequest) {
  try {
    restoreInboxes();
    const body = await req.json();
    const { action, payload } = body;

    // Fetch doctors and patients from Prisma
    const dbDoctors = await prisma.doctor.findMany({
      include: {
        profile: true,
        specialties: {
          include: {
            specialty: true,
          },
        },
      },
    });
    const dbPatients = await prisma.patient.findMany({
      include: {
        profile: true,
      },
    });

    const doctors: DoctorContact[] = dbDoctors.map(mapDbDoctorToContact);
    const patients: PatientContact[] = dbPatients.map(mapDbPatientToContact);

    function getInbox(doctorId: string): Conversation[] {
      if (!liveInboxes.has(doctorId)) liveInboxes.set(doctorId, []);
      return liveInboxes.get(doctorId)!;
    }

    // ACTION: SEND MESSAGE (delivered to sender + recipient inboxes)
    if (action === "send_message") {
      const {
        conversationId,
        clientMessageId,
        text,
        senderId = "unknown-doctor",
        senderName = "Dr. Praticien",
        senderRole = "doctor",
        senderSpecialty = "Médecine Générale",
        attachment,
        fromDoctorId,
        recipientDoctorId,
        groupMemberIds = [],
        conversationType = "colleague",
        convTitle,
        convSubtitle,
        peerDoctor,
        groupInfo,
        patientInfo,
      } = payload;

      const senderDoctorId: string = fromDoctorId || senderId;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      // Reuse the client's message id so sender + recipient + polling all
      // reference ONE message (otherwise the sender sees it twice on merge).
      const messageId =
        clientMessageId ||
        `msg-db-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const newMessage: Message = {
        id: messageId,
        senderId: senderDoctorId,
        senderName,
        senderRole,
        senderSpecialty,
        text,
        time: timeStr,
        date: "Aujourd'hui",
        status: "sent",
        attachment,
      };

      // Update sender inbox (create shell if this conversation was born locally
      // and the server has never seen it — otherwise delivery is impossible)
      const senderInbox = getInbox(senderDoctorId);
      let convIndex = senderInbox.findIndex((c) => c.id === conversationId);
      if (convIndex === -1 && conversationId) {
        const shell: Conversation = {
          id: conversationId,
          type: (conversationType as Conversation["type"]) || "colleague",
          title: convTitle || "Discussion",
          subtitle: convSubtitle || "",
          lastMessage: text,
          time: timeStr,
          unread: false,
          unreadCount: 0,
          status: "normal",
          online: true,
          ...(peerDoctor ? { doctor: peerDoctor } : {}),
          ...(groupInfo ? { group: groupInfo } : {}),
          ...(patientInfo ? { patient: patientInfo } : {}),
          messages: [],
        };
        senderInbox.unshift(shell);
        convIndex = 0;
      }
      if (convIndex !== -1) {
        const conv = senderInbox[convIndex];
        if (!conv.messages.some((m) => m.id === newMessage.id)) {
          conv.messages.push(newMessage);
          conv.lastMessage = text;
          conv.time = timeStr;
        }
      }

      // Deliver to 1:1 recipient inbox (doctor 1 -> doctor 2)
      const targets = new Set<string>();
      if (recipientDoctorId && recipientDoctorId !== senderDoctorId) {
        targets.add(recipientDoctorId);
      }
      if (Array.isArray(groupMemberIds)) {
        for (const mid of groupMemberIds) {
          if (mid && mid !== senderDoctorId) targets.add(mid);
        }
      }
      for (const targetId of targets) {
        const inbox = getInbox(targetId);
        const idx = inbox.findIndex((c) => c.id === conversationId);
        const delivered = { ...newMessage, status: "delivered" as const };
        if (idx !== -1) {
          if (!inbox[idx].messages.some((m) => m.id === newMessage.id)) {
            inbox[idx].messages.push(delivered);
            inbox[idx].lastMessage = text;
            inbox[idx].time = timeStr;
            inbox[idx].unread = true;
            inbox[idx].unreadCount = (inbox[idx].unreadCount || 0) + 1;
          }
        } else if (convIndex !== -1) {
          // Recipient has no copy yet: clone conversation shell with this message.
          // For 1:1 chats the title must show the SENDER (not the recipient's own name).
          const src = senderInbox[convIndex];
          const isColleague = src.type === "colleague";
          inbox.unshift({
            ...src,
            title: isColleague ? senderName : src.title,
            subtitle: isColleague ? senderSpecialty || src.subtitle : src.subtitle,
            messages: [...src.messages.slice(0, -1), delivered],
            lastMessage: text,
            time: timeStr,
            unread: true,
            unreadCount: 1,
          });
        }
      }

      persistInboxes();

      return NextResponse.json({
        success: true,
        message: newMessage,
        conversationId,
      });
    }

    // ACTION: CREATE GROUP WITH DB DOCTORS (added to every member inbox)
    if (action === "create_group") {
      const { name, description, specialty, memberIds = [], createdBy = "Dr. Praticien", fromDoctorId } = payload;

      const groupDoctors = doctors.filter((d) => memberIds.includes(d.id));

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const newGroupConv: Conversation = {
        id: `group-db-${Date.now()}`,
        type: "group",
        title: name,
        subtitle: `${groupDoctors.length} médecins de l'hôpital • ${specialty || "Staff clinique"}`,
        lastMessage: `Groupe médical initié par ${createdBy}. Enregistré en base de données.`,
        time: timeStr,
        unread: false,
        unreadCount: 0,
        status: "normal",
        online: true,
        group: {
          id: `grp-db-${Date.now()}`,
          name,
          description: description || "Concertation pluridisciplinaire enregistrée dans le système de santé",
          specialty: specialty || "Coordination médicale",
          createdDate: "Aujourd'hui",
          createdBy,
          members: groupDoctors,
        },
        messages: [
          {
            id: `sys-db-${Date.now()}`,
            senderId: "system",
            senderName: "Base de Données DOCTORZ Co.",
            senderRole: "system",
            text: `Groupe médical certifié « ${name} » synchronisé avec succès dans la base de données. ${groupDoctors.length} praticiens rattachés. Chiffrement HDS validé.`,
            time: timeStr,
            date: "Aujourd'hui",
            status: "read",
          },
        ],
      };

      const recipients = new Set<string>(memberIds);
      if (fromDoctorId) recipients.add(fromDoctorId);
      if (recipients.size === 0) {
        // fallback: at least creator
        if (fromDoctorId) getInbox(fromDoctorId).unshift(newGroupConv);
      } else {
        for (const rid of recipients) {
          const inbox = getInbox(rid);
          const copy: Conversation =
            rid === fromDoctorId
              ? newGroupConv
              : { ...newGroupConv, unread: true, unreadCount: 1 };
          inbox.unshift(copy);
        }
      }

      persistInboxes();

      return NextResponse.json({
        success: true,
        conversation: newGroupConv,
      });
    }

    // ACTION: RESET TO DEFAULT DB STATE (per-doctor)
    if (action === "reset") {
      const { doctorId: resetDoctorId } = payload || {};
      const fresh = generateDatabaseConversations(doctors, patients);
      if (resetDoctorId) {
        liveInboxes.set(resetDoctorId, fresh);
      }
      persistInboxes();
      return NextResponse.json({
        success: true,
        conversations: fresh,
      });
    }

    return NextResponse.json(
      { success: false, error: "Action inconnue" },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du traitement de la requête" },
      { status: 500 }
    );
  }
}
