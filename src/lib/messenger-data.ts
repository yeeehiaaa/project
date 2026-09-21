import { Conversation, DoctorContact, PatientContact } from "@/types/messenger";

export const ALL_REGISTERED_DOCTORS: DoctorContact[] = [
  {
    id: "doc-sarah",
    name: "Dr. Sarah Khelifi",
    specialty: "Cardiologie & Maladies Vasculaires",
    hospital: "Clinique Ibn Sina & Cabinet Médical",
    city: "Alger",
    phone: "+213 550 12 34 56",
    email: "dr.khelifi@mediconnect.dz",
    licenseNumber: "ONM-DZ-2024-88941",
    online: true,
  },
  {
    id: "doc-amine",
    name: "Dr. Amine Benali",
    specialty: "Cardiologie Interventionnelle & Rythmologie",
    hospital: "CHU Mustapha Pacha",
    city: "Alger",
    phone: "+213 551 23 45 67",
    email: "dr.benali@chu-alger.dz",
    licenseNumber: "ONM-DZ-2018-45210",
    online: true,
  },
  {
    id: "doc-yasmine",
    name: "Dr. Yasmine Meziani",
    specialty: "Pédiatrie & Néonatalogie",
    hospital: "CHU Constantine (Ibn Badis)",
    city: "Constantine",
    phone: "+213 770 34 56 78",
    email: "dr.meziani@chu-constantine.dz",
    licenseNumber: "ONM-DZ-2019-33291",
    online: false,
  },
  {
    id: "doc-ryad",
    name: "Dr. Ryad Bouzid",
    specialty: "Radiologie & Imagerie Médicale",
    hospital: "Centre d'Imagerie Numérique Bab El Oued",
    city: "Alger",
    phone: "+213 661 45 67 89",
    email: "dr.bouzid@imagerie-alger.dz",
    licenseNumber: "ONM-DZ-2016-12984",
    online: true,
  },
  {
    id: "doc-leila",
    name: "Dr. Leila Belhadj",
    specialty: "Néphrologie & Hémodialyse",
    hospital: "CHU Beni Messous",
    city: "Alger",
    phone: "+213 552 67 89 01",
    email: "dr.belhadj@chu-benimessous.dz",
    licenseNumber: "ONM-DZ-2017-77123",
    online: true,
  },
  {
    id: "doc-karim-t",
    name: "Pr. Karim Tlemçani",
    specialty: "Chirurgie Cardiovasculaire & Thoracique",
    hospital: "Clinique Médico-Chirurgicale des Glycines",
    city: "Alger",
    phone: "+213 560 78 90 12",
    email: "pr.tlemcani@glycines-chirurgie.dz",
    licenseNumber: "ONM-DZ-2012-09412",
    online: false,
  },
  {
    id: "doc-nassim",
    name: "Dr. Nassim Zerrouki",
    specialty: "Médecine Interne & Diabétologie",
    hospital: "EHU d'Oran (1er Novembre 1954)",
    city: "Oran",
    phone: "+213 771 89 01 23",
    email: "dr.zerrouki@ehu-oran.dz",
    licenseNumber: "ONM-DZ-2020-56128",
    online: true,
  },
  {
    id: "doc-houda",
    name: "Dr. Houda Saidi",
    specialty: "Anesthésie-Réanimation & Soins Intensifs",
    hospital: "CHU Bab El Oued (Lamine Debaghine)",
    city: "Alger",
    phone: "+213 553 90 12 34",
    email: "dr.saidi@chu-babloued.dz",
    licenseNumber: "ONM-DZ-2015-88432",
    online: false,
  },
];

export const ALL_REGISTERED_PATIENTS: PatientContact[] = [
  {
    id: "pat-1",
    name: "Karim Haddad",
    age: 58,
    gender: "Homme",
    phone: "+33 6 12 34 56 78",
    email: "k.haddad@email.com",
    bloodGroup: "O+",
    chronicCondition: "Hypertension artérielle & Antécédent SCA",
    allergies: ["Pénicilline"],
    lastVisit: "Aujourd'hui",
    online: true,
  },
  {
    id: "pat-2",
    name: "Amina Meziane",
    age: 34,
    gender: "Femme",
    phone: "+33 6 98 76 54 32",
    email: "amina.mez@email.com",
    bloodGroup: "A+",
    chronicCondition: "Asthme sévère persistant",
    allergies: ["Aspirine", "AINS"],
    lastVisit: "Hier",
    online: false,
  },
  {
    id: "pat-3",
    name: "Youcef Mansouri",
    age: 67,
    gender: "Homme",
    phone: "+33 7 44 55 66 77",
    email: "y.mansouri@email.com",
    bloodGroup: "B+",
    chronicCondition: "Diabète de Type 2 sous Insuline",
    allergies: [],
    lastVisit: "12 Sep 2026",
    online: true,
  },
  {
    id: "pat-4",
    name: "Fatima Zohra Benali",
    age: 45,
    gender: "Femme",
    phone: "+33 6 33 22 11 00",
    email: "f.benali@email.com",
    bloodGroup: "AB+",
    chronicCondition: "Hypothyroïdie d'Hashimoto",
    allergies: ["Produits de contraste iodés"],
    lastVisit: "08 Sep 2026",
    online: false,
  },
  {
    id: "pat-5",
    name: "Mohammed Saadi",
    age: 62,
    gender: "Homme",
    phone: "+33 6 55 44 33 22",
    email: "m.saadi@email.com",
    bloodGroup: "O+",
    chronicCondition: "Douleur thoracique atypique & HTA ancienne",
    allergies: [],
    lastVisit: "05 Sep 2026",
    online: true,
  },
  {
    id: "pat-6",
    name: "Mourad Belkacem",
    age: 51,
    gender: "Homme",
    phone: "+33 6 22 11 33 44",
    email: "m.belkacem@email.com",
    bloodGroup: "A+",
    chronicCondition: "Bilan cardiologie pré-opératoire",
    allergies: [],
    lastVisit: "01 Sep 2026",
    online: false,
  },
  {
    id: "pat-7",
    name: "Nassima Larbi",
    age: 39,
    gender: "Femme",
    phone: "+33 7 11 22 33 44",
    email: "n.larbi@email.com",
    bloodGroup: "O-",
    chronicCondition: "Palpitations récurrentes & Extrasystoles au stress",
    allergies: [],
    lastVisit: "28 Août 2026",
    online: true,
  },
  {
    id: "pat-8",
    name: "Omar Kaddour",
    age: 73,
    gender: "Homme",
    phone: "+33 6 88 99 00 11",
    email: "o.kaddour@email.com",
    bloodGroup: "B-",
    chronicCondition: "Insuffisance cardiaque stade II NYHA & Œdèmes MI",
    allergies: ["Sulfamides"],
    lastVisit: "22 Août 2026",
    online: false,
  },
];

export const INITIAL_REAL_CONVERSATIONS: Conversation[] = [
  // 1. MÉDECIN - MÉDECIN (1:1 Dr. Sarah Khelifi & Dr. Amine Benali)
  {
    id: "conv-doc-amine",
    type: "colleague",
    title: "Dr. Amine Benali",
    subtitle: "Cardiologie Interventionnelle • CHU Mustapha Pacha",
    lastMessage: "Rapport de coronarographie disponible. La sténose IVA moyenne a été dilatée avec succès (Stent actif 3.0x18mm).",
    time: "10:15",
    unread: true,
    unreadCount: 1,
    status: "urgent",
    online: true,
    doctor: ALL_REGISTERED_DOCTORS.find((d) => d.id === "doc-amine"),
    messages: [
      {
        id: "msg-ab-1",
        senderId: "doc-sarah",
        senderName: "Dr. Sarah Khelifi",
        senderRole: "doctor",
        senderSpecialty: "Cardiologue",
        text: "Bonjour Amine. Je t'adresse le dossier de M. Bensaïd (61 ans). L'épreuve d'effort montre une ischémie myocardique sous-lésionnelle en antéro-septo-apical à 80% de la FMT. Quel est ton avis pour une coronarographie ?",
        time: "Hier 16:30",
        date: "15 Sep 2026",
        status: "read",
        attachment: {
          id: "att-1",
          name: "ECG_Epreuve_Effort_Bensaid_Sept2026.pdf",
          type: "pdf",
          size: "1.8 Mo",
        },
      },
      {
        id: "msg-ab-2",
        senderId: "doc-amine",
        senderName: "Dr. Amine Benali",
        senderRole: "colleague",
        senderSpecialty: "Cardiologie Interventionnelle CHU",
        text: "Salut Sarah. Vu le sous-décalage de 2mm en V3-V4 et ses facteurs de risque (diabète + tabagisme sevré), l'indication de coronarographie est formelle. Je l'ai programmé pour ce matin 08h30 en salle de KT.",
        time: "Hier 18:05",
        date: "15 Sep 2026",
        status: "read",
      },
      {
        id: "msg-ab-3",
        senderId: "doc-amine",
        senderName: "Dr. Amine Benali",
        senderRole: "colleague",
        senderSpecialty: "Cardiologie Interventionnelle CHU",
        text: "Rapport de coronarographie disponible. La sténose IVA moyenne a été dilatée avec succès (Stent actif 3.0x18mm). Bonne récupération du flux TIMI 3 sans dissection résiduelle. Double antiagrégation plaquettaire à poursuivre 12 mois.",
        time: "10:15",
        date: "Aujourd'hui",
        status: "delivered",
        attachment: {
          id: "att-coro",
          name: "Compte_Rendu_Coronarographie_Stent_IVA.pdf",
          type: "pdf",
          size: "2.4 Mo",
        },
      },
    ],
  },

  // 2. GROUPE MÉDICAL (Multi-médecins : Staff Cardiologie & Rythmologie CHU)
  {
    id: "group-staff-cardio",
    type: "group",
    title: "Staff Cardiologie & Rythmologie CHU",
    subtitle: "4 médecins • Revue des cas complexes et implantations",
    lastMessage: "Dr. Ryad Bouzid: L'angioscan cardiaque montre un score calcique d'Agatston à 420. Revascularisation hybride recommandée.",
    time: "11:20",
    unread: true,
    unreadCount: 2,
    status: "urgent",
    online: true,
    group: {
      id: "grp-1",
      name: "Staff Cardiologie & Rythmologie CHU",
      description: "Staff clinique hebdomadaire pour validation des indications opératoires, angioplasties complexes, TAVI et resynchronisation cardiaque.",
      specialty: "Cardiologie Pluridisciplinaire",
      createdDate: "01 Sep 2026",
      createdBy: "Dr. Sarah Khelifi",
      members: [
        ALL_REGISTERED_DOCTORS.find((d) => d.id === "doc-sarah")!,
        ALL_REGISTERED_DOCTORS.find((d) => d.id === "doc-amine")!,
        ALL_REGISTERED_DOCTORS.find((d) => d.id === "doc-ryad")!,
        ALL_REGISTERED_DOCTORS.find((d) => d.id === "doc-karim-t")!,
      ],
    },
    messages: [
      {
        id: "grp-msg-1",
        senderId: "system",
        senderName: "DOCTORZ Co. Securitas",
        senderRole: "system",
        text: "Groupe médical sécurisé créé par le Dr. Sarah Khelifi. 4 praticiens hospitaliers et spécialistes connectés. Échanges chiffrés de bout en bout selon les normes HDS.",
        time: "01 Sep 09:00",
        date: "01 Sep 2026",
        status: "read",
      },
      {
        id: "grp-msg-2",
        senderId: "doc-sarah",
        senderName: "Dr. Sarah Khelifi",
        senderRole: "doctor",
        senderSpecialty: "Cardiologue",
        text: "Chers confrères, je soumets au staff le cas de Mme Chergui (72 ans), RAC serré symptomatique (surface aortique 0.65 cm², gradient moyen 48 mmHg). EuroSCORE II à 4.2%. Discussion entre TAVI transfémoral vs remplacement valvulaire chirurgical.",
        time: "09:30",
        date: "Aujourd'hui",
        status: "read",
        attachment: {
          id: "att-echo-rac",
          name: "EchoDoppler_Cardiaque_RAC_Serre.pdf",
          type: "pdf",
          size: "3.1 Mo",
        },
      },
      {
        id: "grp-msg-3",
        senderId: "doc-karim-t",
        senderName: "Pr. Karim Tlemçani",
        senderRole: "colleague",
        senderSpecialty: "Chirurgie Cardiaque",
        text: "Bonjour Sarah. Vu l'âge physiologique et l'aorte porcelaine visualisée au scanner, la chirurgie conventionnelle à cœur ouvert présente un sur-risque. Le TAVI semble nettement supérieur ici.",
        time: "10:45",
        date: "Aujourd'hui",
        status: "read",
      },
      {
        id: "grp-msg-4",
        senderId: "doc-ryad",
        senderName: "Dr. Ryad Bouzid",
        senderRole: "colleague",
        senderSpecialty: "Radiologie & Scanner",
        text: "L'angioscan cardiaque montre un score calcique d'Agatston à 420. Les axes ilio-fémoraux sont larges (> 7.5 mm) et sans tortuosité majeure, l'accès transfémoral est optimal pour le TAVI.",
        time: "11:20",
        date: "Aujourd'hui",
        status: "read",
      },
    ],
  },

  // 3. MÉDECIN - PATIENT (Karim Haddad)
  {
    id: "conv-pat-karim",
    type: "patient",
    title: "Karim Haddad",
    subtitle: "58 ans • HTA sévère & Traitement anticoagulant",
    lastMessage: "Docteur, j'ai bien pris les 75mg de Kardégic ce matin. Dois-je poursuivre le Bisoprolol ?",
    time: "09:42",
    unread: true,
    unreadCount: 1,
    status: "urgent",
    online: true,
    patient: ALL_REGISTERED_PATIENTS.find((p) => p.id === "pat-1"),
    messages: [
      {
        id: "msg-kh-1",
        senderId: "pat-1",
        senderName: "Karim Haddad",
        senderRole: "patient",
        text: "Bonjour Docteur Khelifi, je vous transmets mon carnet d'automesure de tension de la semaine. Au repos le matin je suis à 128/82 mmHg.",
        time: "09:30",
        date: "Aujourd'hui",
        status: "read",
        attachment: {
          id: "att-automesure",
          name: "Releve_Tension_Arterielle_Domicile.pdf",
          type: "pdf",
          size: "420 Ko",
        },
      },
      {
        id: "msg-kh-2",
        senderId: "doc-sarah",
        senderName: "Dr. Sarah Khelifi",
        senderRole: "doctor",
        senderSpecialty: "Cardiologue",
        text: "Bonjour M. Haddad. Vos chiffres sont très bien équilibrés (128/82 mmHg avec une fréquence à 68 bpm). L'adaptation thérapeutique a bien fonctionné.",
        time: "09:36",
        date: "Aujourd'hui",
        status: "read",
      },
      {
        id: "msg-kh-3",
        senderId: "pat-1",
        senderName: "Karim Haddad",
        senderRole: "patient",
        text: "Docteur, j'ai bien pris les 75mg de Kardégic ce matin. Dois-je poursuivre le Bisoprolol à la même dose de 5mg ?",
        time: "09:42",
        date: "Aujourd'hui",
        status: "delivered",
      },
    ],
  },

  // 4. GROUPE MÉDICAL (Comité d'Astreinte & Gardes Clinique)
  {
    id: "group-garde-clinique",
    type: "group",
    title: "Garde & Urgences Clinique Ibn Sina",
    subtitle: "3 médecins • Coordination astreintes et transferts",
    lastMessage: "Dr. Leila Belhadj: Le patient sous dialyse est stabilisé avec une kaliémie corrigée à 4.6 mEq/L.",
    time: "Hier",
    unread: false,
    unreadCount: 0,
    status: "normal",
    online: true,
    group: {
      id: "grp-2",
      name: "Garde & Urgences Clinique Ibn Sina",
      description: "Coordination du service d'urgence, réanimation et gestion des lits chauds pour transferts SAMU/Protection Civile.",
      specialty: "Urgences & Soins Intensifs",
      createdDate: "10 Sep 2026",
      createdBy: "Dr. Sarah Khelifi",
      members: [
        ALL_REGISTERED_DOCTORS.find((d) => d.id === "doc-sarah")!,
        ALL_REGISTERED_DOCTORS.find((d) => d.id === "doc-leila")!,
        ALL_REGISTERED_DOCTORS.find((d) => d.id === "doc-nassim")!,
      ],
    },
    messages: [
      {
        id: "msg-gc-1",
        senderId: "doc-sarah",
        senderName: "Dr. Sarah Khelifi",
        senderRole: "doctor",
        senderSpecialty: "Cardiologue",
        text: "Astreinte du week-end : lit 4 réservé pour surveillance post-SCA. Veuillez vérifier la fonction rénale avant toute injection d'héparine.",
        time: "Hier 08:30",
        date: "15 Sep 2026",
        status: "read",
      },
      {
        id: "msg-gc-2",
        senderId: "doc-leila",
        senderName: "Dr. Leila Belhadj",
        senderRole: "colleague",
        senderSpecialty: "Néphrologue",
        text: "Le patient sous dialyse est stabilisé avec une kaliémie corrigée à 4.6 mEq/L. Séance d'hémodialyse supplémentaire programmée demain à 08h.",
        time: "Hier 14:15",
        date: "15 Sep 2026",
        status: "read",
      },
    ],
  },

  // 5. MÉDECIN - MÉDECIN (Dr. Leila Belhadj - Néphrologie)
  {
    id: "conv-doc-leila",
    type: "colleague",
    title: "Dr. Leila Belhadj",
    subtitle: "Néphrologie & Hémodialyse • CHU Beni Messous",
    lastMessage: "J'ai validé la clairance selon CKD-EPI (52 ml/min). L'AOD peut être maintenu à posologie ajustée.",
    time: "14 Sep",
    unread: false,
    unreadCount: 0,
    status: "normal",
    online: true,
    doctor: ALL_REGISTERED_DOCTORS.find((d) => d.id === "doc-leila"),
    messages: [
      {
        id: "msg-lb-1",
        senderId: "doc-sarah",
        senderName: "Dr. Sarah Khelifi",
        senderRole: "doctor",
        senderSpecialty: "Cardiologue",
        text: "Chère Leila, pour notre patient M. Mansouri (67 ans, diabétique), nous devons débuter l'Eliquis pour une FA paroxystique. Sa créatininémie est à 135 µmol/L. Peux-tu me confirmer la dose sécurisée ?",
        time: "14 Sep 10:00",
        date: "14 Sep 2026",
        status: "read",
      },
      {
        id: "msg-lb-2",
        senderId: "doc-leila",
        senderName: "Dr. Leila Belhadj",
        senderRole: "colleague",
        senderSpecialty: "Néphrologue",
        text: "J'ai validé la clairance selon CKD-EPI (52 ml/min). L'AOD peut être maintenu à posologie ajustée : 2.5 mg x 2/jour au lieu de 5mg x 2/jour en raison de l'âge et de la créat. Contrôle iono dans 15 jours.",
        time: "14 Sep 11:15",
        date: "14 Sep 2026",
        status: "read",
      },
    ],
  },

  // 6. MÉDECIN - PATIENT (Amina Meziane)
  {
    id: "conv-pat-amina",
    type: "patient",
    title: "Amina Meziane",
    subtitle: "34 ans • Asthme sévère persistant",
    lastMessage: "Merci infiniment Docteur pour le renouvellement de la Ventoline et du Seretide !",
    time: "13 Sep",
    unread: false,
    unreadCount: 0,
    status: "normal",
    online: false,
    patient: ALL_REGISTERED_PATIENTS.find((p) => p.id === "pat-2"),
    messages: [
      {
        id: "msg-am-1",
        senderId: "pat-2",
        senderName: "Amina Meziane",
        senderRole: "patient",
        text: "Bonjour Docteur Khelifi, avec le changement de saison j'ai ressenti un léger essoufflement à l'effort. Mon débit expiratoire de pointe est à 380 L/min.",
        time: "13 Sep 14:00",
        date: "13 Sep 2026",
        status: "read",
      },
      {
        id: "msg-am-2",
        senderId: "doc-sarah",
        senderName: "Dr. Sarah Khelifi",
        senderRole: "doctor",
        senderSpecialty: "Cardiologue",
        text: "Bonjour Amina. Prenez 2 bouffées de Seretide matin et soir, et gardez la Ventoline en cas de gêne aiguë. Je vous ai envoyé l'ordonnance électronique signée sur votre compte.",
        time: "13 Sep 14:20",
        date: "13 Sep 2026",
        status: "read",
        attachment: {
          id: "att-ord-amina",
          name: "Ordonnance_Electronique_Ventoline_Seretide.pdf",
          type: "prescription",
          size: "350 Ko",
        },
      },
      {
        id: "msg-am-3",
        senderId: "pat-2",
        senderName: "Amina Meziane",
        senderRole: "patient",
        text: "Merci infiniment Docteur pour le renouvellement de la Ventoline et du Seretide ! La pharmacie a validé le QR code immédiatement.",
        time: "13 Sep 14:35",
        date: "13 Sep 2026",
        status: "read",
      },
    ],
  },
];

const STORAGE_KEY = "mediconnect_doctor_conversations_db_v6";

// Per-doctor namespaced storage so doctor 1 never sees doctor 2's local state.
// Storage shape per doctor: Conversation[]
export function storageKeyForDoctor(doctorId?: string | null): string {
  if (!doctorId) return STORAGE_KEY;
  return `${STORAGE_KEY}__${doctorId}`;
}

// Shared delivery bus: when doctor A sends a message to doctor B,
// it is appended here so doctor B receives it on next load/poll,
// even on another device/account. Stored as: Record<recipientDoctorId, MessageEnvelope[]>
const SHARED_INBOX_KEY = "mediconnect_shared_doctor_inbox_v1";

export interface InboxEnvelope {
  conversationKey: string; // e.g. colleague id or group id hint
  peerDoctorId?: string; // recipient doctor contact id (for 1:1)
  groupId?: string; // recipient group conversation id (for groups)
  patientId?: string; // for patient messages routed to a doctor
  message: import("@/types/messenger").Message;
  conversationSnapshot?: import("@/types/messenger").Conversation;
  createdAt: string;
  fromDoctorId: string;
  fromDoctorName: string;
}

export function pushToSharedInbox(recipientDoctorId: string, envelope: InboxEnvelope): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(SHARED_INBOX_KEY);
    const store = raw ? JSON.parse(raw) : {};
    const list = Array.isArray(store[recipientDoctorId]) ? store[recipientDoctorId] : [];
    list.push(envelope);
    store[recipientDoctorId] = list;
    localStorage.setItem(SHARED_INBOX_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn("pushToSharedInbox error:", err);
  }
}

export function pullSharedInbox(recipientDoctorId: string): InboxEnvelope[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SHARED_INBOX_KEY);
    if (!raw) return [];
    const store = JSON.parse(raw);
    const list = Array.isArray(store[recipientDoctorId]) ? store[recipientDoctorId] : [];
    // consume
    if (list.length > 0) {
      store[recipientDoctorId] = [];
      localStorage.setItem(SHARED_INBOX_KEY, JSON.stringify(store));
    }
    return list;
  } catch (err) {
    console.warn("pullSharedInbox error:", err);
    return [];
  }
}

export function peekSharedInbox(recipientDoctorId: string): InboxEnvelope[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SHARED_INBOX_KEY);
    if (!raw) return [];
    const store = JSON.parse(raw);
    return Array.isArray(store[recipientDoctorId]) ? store[recipientDoctorId] : [];
  } catch {
    return [];
  }
}

export function loadConversationsFromStorage(doctorId?: string | null): Conversation[] {
  if (typeof window === "undefined") {
    return INITIAL_REAL_CONVERSATIONS;
  }
  try {
    const key = storageKeyForDoctor(doctorId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      // New doctor account starts with an EMPTY inbox (no leak from doctor 1).
      // Only the legacy default account (no id / doc-sarah) keeps demo data.
      const isLegacyDefault =
        !doctorId || doctorId === "doc-sarah" || doctorId.includes("sarah");
      const initial: Conversation[] = isLegacyDefault ? INITIAL_REAL_CONVERSATIONS : [];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn("Error loading conversations from localStorage:", err);
  }
  return [];
}

export function saveConversationsToStorage(
  conversations: Conversation[],
  doctorId?: string | null
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKeyForDoctor(doctorId), JSON.stringify(conversations));
  } catch (err) {
    console.error("Error saving conversations to localStorage:", err);
  }
}

export function resetConversationsToDefault(doctorId?: string | null): Conversation[] {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        storageKeyForDoctor(doctorId),
        JSON.stringify(INITIAL_REAL_CONVERSATIONS)
      );
    } catch (err) {
      console.warn("Error resetting storage:", err);
    }
  }
  return INITIAL_REAL_CONVERSATIONS;
}
