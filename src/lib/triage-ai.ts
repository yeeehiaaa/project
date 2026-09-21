// NOTRE AI — moteur local d'orientation médicale (aucun appel externe).
// Utilisé par l'assistant patient : accueil personnalisé (nom, âge, sexe,
// antécédents), questions à choix multiples, puis orientation vers la
// spécialité correspondant aux symptômes + liste des médecins.

export interface TriagePatient {
  firstName: string;
  age: number | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  chronicConditions: string | null;
  allergies: string | null;
  currentMedications: string | null;
}

export interface TriageAnswer {
  question: string;
  answer: string | string[];
}

export interface TriageQuestion {
  type: "question";
  key: string;
  question: string;
  options: string[];
  multiple: boolean;
}

export type TriageUrgency = "low" | "moderate" | "urgent" | "emergency";

export interface TriageResult {
  type: "result";
  summary: string;
  urgency: TriageUrgency;
  emergencyMessage?: string | null;
  specialties: string[];
}

/* ============================================================
   ZONES (labels EXACTS utilisés partout, y compris la recherche libre)
============================================================ */

export const ZONE_COEUR = "Cœur et poitrine";
export const ZONE_RESPIRATION = "Respiration";
export const ZONE_DIGESTION = "Digestion et ventre";
export const ZONE_PEAU = "Peau, cheveux et ongles";
export const ZONE_NEURO = "Tête, mémoire et nerfs";
export const ZONE_FIEVRE = "Fièvre, fatigue et infections";
export const ZONE_MUSCLES = "Muscles, os et articulations";
export const ZONE_YEUX = "Yeux et vision";
export const ZONE_ORL = "Oreilles, nez et gorge";
export const ZONE_URINAIRE = "Urines et reins";
export const ZONE_FEMME = "Santé de la femme";
export const ZONE_MORAL = "Moral, stress et sommeil";
export const ZONE_HORMONES = "Diabète, thyroïde et hormones";
export const ZONE_ENFANT = "Santé de mon enfant";
export const ZONE_AUTRE = "Autre chose";

const DUREES = [
  "Moins de 24 heures",
  "Depuis quelques jours",
  "Depuis une à deux semaines",
  "Depuis plus d'un mois",
];

const AUCUN = "Aucun de ces signes";

interface ZoneConfig {
  symptoms: string[];
  flags: string[];
  specialties: string[];
}

const ZONES: Record<string, ZoneConfig> = {
  [ZONE_COEUR]: {
    symptoms: [
      "Douleur ou oppression thoracique",
      "Douleur qui irradie vers le bras, l'épaule ou la mâchoire",
      "Palpitations",
      "Essoufflement à l'effort",
      "Jambes gonflées",
      "Fatigue inhabituelle",
    ],
    flags: [
      "Douleur thoracique intense",
      "Essoufflement au repos",
      "Perte de connaissance ou malaise",
      AUCUN,
    ],
    specialties: ["Cardiologie"],
  },
  [ZONE_RESPIRATION]: {
    symptoms: [
      "Toux persistante",
      "Essoufflement",
      "Sifflements respiratoires",
      "Douleur en respirant",
      "Crachats",
    ],
    flags: [
      "Essoufflement au repos",
      "Lèvres ou visage bleutés",
      "Toux avec du sang",
      AUCUN,
    ],
    specialties: ["Pneumologie"],
  },
  [ZONE_DIGESTION]: {
    symptoms: [
      "Douleurs abdominales",
      "Nausées ou vomissements",
      "Diarrhée",
      "Constipation",
      "Brûlures d'estomac",
      "Ballonnements",
    ],
    flags: [
      "Vomissements de sang",
      "Selles noires ou sanglantes",
      "Douleur abdominale brutale",
      AUCUN,
    ],
    specialties: ["Gastro-entérologie"],
  },
  [ZONE_PEAU]: {
    symptoms: [
      "Boutons ou éruption",
      "Démangeaisons",
      "Plaques rouges",
      "Chute de cheveux",
      "Grain de beauté qui change",
    ],
    flags: [
      "Plaie qui s'infecte rapidement",
      "Gonflement du visage",
      AUCUN,
    ],
    specialties: ["Dermatologie"],
  },
  [ZONE_NEURO]: {
    symptoms: [
      "Maux de tête fréquents",
      "Vertiges",
      "Troubles de la mémoire",
      "Fourmillements",
      "Crises ou convulsions",
    ],
    flags: [
      "Maux de tête brutaux et violents",
      "Perte de connaissance",
      "Paralysie d'un côté du corps",
      "Troubles soudains de la parole",
      AUCUN,
    ],
    specialties: ["Neurologie"],
  },
  [ZONE_FIEVRE]: {
    symptoms: [
      "Fièvre",
      "Grande fatigue",
      "Frissons",
      "Courbatures",
      "Sueurs nocturnes",
    ],
    flags: [
      "Fièvre très élevée (≥ 39,5 °C)",
      "Raideur de la nuque",
      "Confusion",
      AUCUN,
    ],
    specialties: ["Médecine générale"],
  },
  [ZONE_MUSCLES]: {
    symptoms: [
      "Douleur articulaire",
      "Raideur matinale",
      "Gonflement d'une articulation",
      "Douleur musculaire",
      "Mal de dos",
      "Fracture ou traumatisme récent",
    ],
    flags: [
      "Fracture ou déformation visible",
      "Impossibilité de bouger un membre",
      AUCUN,
    ],
    specialties: ["Rhumatologie", "Orthopédie"],
  },
  [ZONE_YEUX]: {
    symptoms: [
      "Baisse de la vision",
      "Yeux rouges ou irrités",
      "Douleur oculaire",
      "Vision floue",
      "Larmoiement",
    ],
    flags: [
      "Perte brutale de la vision",
      "Traumatisme de l'œil",
      AUCUN,
    ],
    specialties: ["Ophtalmologie"],
  },
  [ZONE_ORL]: {
    symptoms: [
      "Mal de gorge",
      "Nez bouché ou qui coule",
      "Douleur d'oreille",
      "Perte d'audition",
      "Ronflements",
    ],
    flags: [
      "Forte fièvre avec mal de gorge intense",
      "Gonflement du cou",
      AUCUN,
    ],
    specialties: ["ORL"],
  },
  [ZONE_URINAIRE]: {
    symptoms: [
      "Brûlures en urinant",
      "Envies fréquentes d'uriner",
      "Urines troubles ou sanglantes",
      "Douleurs lombaires",
      "Difficulté à uriner",
    ],
    flags: [
      "Fièvre avec douleurs lombaires",
      "Impossibilité d'uriner",
      "Sang abondant dans les urines",
      AUCUN,
    ],
    specialties: ["Urologie"],
  },
  [ZONE_FEMME]: {
    symptoms: [
      "Règles douloureuses ou irrégulières",
      "Suivi de grossesse",
      "Douleurs pelviennes",
      "Signes de ménopause",
      "Contraception",
    ],
    flags: [
      "Saignements importants",
      "Douleur pelvienne intense",
      AUCUN,
    ],
    specialties: ["Gynécologie"],
  },
  [ZONE_MORAL]: {
    symptoms: [
      "Stress permanent",
      "Tristesse ou déprime",
      "Troubles du sommeil",
      "Anxiété ou angoisses",
      "Difficulté à se concentrer",
    ],
    flags: ["Pensées suicidaires", AUCUN],
    specialties: ["Psychiatrie"],
  },
  [ZONE_HORMONES]: {
    symptoms: [
      "Soif intense et urines fréquentes",
      "Prise ou perte de poids inexpliquée",
      "Fatigue avec frilosité",
      "Palpitations et nervosité",
      "Grosseur au cou",
    ],
    flags: [
      "Malaise avec sueurs froides",
      "Amaigrissement rapide",
      AUCUN,
    ],
    specialties: ["Endocrinologie"],
  },
  [ZONE_ENFANT]: {
    symptoms: [
      "Fièvre",
      "Toux ou rhume",
      "Vomissements ou diarrhée",
      "Éruption cutanée",
      "Vaccination et suivi",
    ],
    flags: [
      "Bébé de moins de 3 mois avec fièvre",
      "Convulsions",
      "Refuse de boire",
      AUCUN,
    ],
    specialties: ["Pédiatrie"],
  },
  [ZONE_AUTRE]: {
    symptoms: [
      "Douleur",
      "Gonflement ou grosseur",
      "Fièvre",
      "Fatigue",
      "Autre signe",
    ],
    flags: [
      "Douleur intense",
      "Saignement important",
      "Perte de connaissance",
      AUCUN,
    ],
    specialties: ["Médecine générale"],
  },
};

const EMERGENCY_FLAGS = new Set([
  "Douleur thoracique intense",
  "Essoufflement au repos",
  "Perte de connaissance ou malaise",
  "Perte de connaissance",
  "Toux avec du sang",
  "Vomissements de sang",
  "Selles noires ou sanglantes",
  "Douleur abdominale brutale",
  "Maux de tête brutaux et violents",
  "Paralysie d'un côté du corps",
  "Troubles soudains de la parole",
  "Impossibilité d'uriner",
  "Pensées suicidaires",
  "Bébé de moins de 3 mois avec fièvre",
  "Convulsions",
  "Perte brutale de la vision",
  "Lèvres ou visage bleutés",
  "Saignement important",
]);

const URGENT_FLAGS = new Set([
  "Fièvre très élevée (≥ 39,5 °C)",
  "Raideur de la nuque",
  "Confusion",
  "Fracture ou déformation visible",
  "Impossibilité de bouger un membre",
  "Traumatisme de l'œil",
  "Sang abondant dans les urines",
  "Saignements importants",
  "Douleur pelvienne intense",
  "Fièvre avec douleurs lombaires",
]);

/* ============================================================
   ACCUEIL PERSONNALISÉ (nom, âge, sexe, antécédents)
============================================================ */

function stripName(firstName: string): string {
  return firstName.trim().split(/\s+/)[0] || "";
}

export function buildWelcome(patient: TriagePatient | null): string {
  const name = patient ? stripName(patient.firstName) : "";
  const age = patient?.age ?? null;
  const isChild = age !== null && age < 15;
  const feminine = patient?.gender === "FEMALE";

  let hello: string;
  if (!name) {
    hello = "Bonjour 👋 Bienvenue sur DOCTORZ Co.";
  } else if (isChild) {
    hello = `Salut ${name} 👋 ${
      feminine ? "Bienvenue" : "Bienvenu"
    } sur DOCTORZ Co.`;
  } else {
    hello = `Bonjour ${name} 👋 ${
      feminine ? "Bienvenue" : "Bienvenu"
    } sur DOCTORZ Co.`;
  }

  const intro = isChild
    ? "Je suis l'assistant d'orientation DOCTORZ Co. : je vais te poser quelques petites questions (avec l'aide d'un parent) pour te diriger vers le bon médecin. Tout est analysé ici, dans l'application."
    : "Je suis votre assistant d'orientation DOCTORZ Co. : je vais vous poser quelques questions pour vous diriger vers la spécialité la plus adaptée. Tout est analysé localement, dans l'application.";

  let history = "";
  const chronic = patient?.chronicConditions?.trim();
  if (chronic && !isChild) {
    history = `\n\nJe vois dans votre dossier : ${chronic}. J'en tiendrai compte dans mon orientation.`;
  } else if (chronic && isChild) {
    history = `\n\nJe vois dans ton dossier : ${chronic}. J'en tiendrai compte.`;
  }

  return `${hello}\n\n${intro}${history}`;
}

/* ============================================================
   QUESTIONS
============================================================ */

export function getFirstQuestion(): TriageQuestion {
  return {
    type: "question",
    key: "zone",
    question:
      "Quelles sont les zones concernées ? (plusieurs choix possibles — par exemple le cœur ET le bras si la douleur irradie)",
    options: [
      ZONE_COEUR,
      ZONE_RESPIRATION,
      ZONE_DIGESTION,
      ZONE_PEAU,
      ZONE_NEURO,
      ZONE_FIEVRE,
      ZONE_MUSCLES,
      ZONE_YEUX,
      ZONE_ORL,
      ZONE_URINAIRE,
      ZONE_FEMME,
      ZONE_MORAL,
      ZONE_HORMONES,
      ZONE_ENFANT,
      ZONE_AUTRE,
    ],
    multiple: true,
  };
}

function getSymptomsQuestion(zone: string): TriageQuestion {
  const config = ZONES[zone] ?? ZONES[ZONE_AUTRE];
  return {
    type: "question",
    key: "symptomes",
    question: "Précisez vos symptômes (plusieurs choix possibles) :",
    options: config.symptoms,
    multiple: true,
  };
}

function getDurationQuestion(): TriageQuestion {
  return {
    type: "question",
    key: "duree",
    question: "Depuis quand ressentez-vous cela ?",
    options: DUREES,
    multiple: false,
  };
}

function getFlagsQuestion(zone: string): TriageQuestion {
  const config = ZONES[zone] ?? ZONES[ZONE_AUTRE];
  return {
    type: "question",
    key: "signes",
    question:
      "Présentez-vous l'un de ces signes alarmants ? (plusieurs choix possibles)",
    options: config.flags,
    multiple: true,
  };
}

function findAnswer(
  answers: TriageAnswer[],
  key: string
): TriageAnswer | undefined {
  // Les clés ne sont pas stockées : on retrouve l'étape par l'ordre.
  const order = ["zone", "symptomes", "duree", "signes"];
  const index = order.indexOf(key);
  return answers[index];
}

function asArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/* ============================================================
   MOTEUR : étape suivante
============================================================ */

export function getNextStep(
  answers: TriageAnswer[],
  patient: TriagePatient | null
): TriageQuestion | TriageResult {
  const zones = asArray(findAnswer(answers, "zone")?.answer).filter(
    (z) => ZONES[z]
  );

  if (zones.length === 0) {
    return getFirstQuestion();
  }

  // Une série de symptômes par zone : la douleur peut toucher
  // plusieurs zones (ex. cœur + bras). answers[1..zones.length]
  // correspondent aux zones dans l'ordre de sélection.
  const symptomsAnswered = answers.length - 1;
  if (symptomsAnswered < zones.length) {
    const zone = zones[symptomsAnswered];
    const base = getSymptomsQuestion(zone);
    return {
      ...base,
      question:
        zones.length > 1
          ? `Précisez vos symptômes — ${zone} (plusieurs choix possibles) :`
          : base.question,
    };
  }

  const cursor = 1 + zones.length;
  if (!answers[cursor]) {
    return getDurationQuestion();
  }

  if (!answers[cursor + 1]) {
    return getFlagsQuestion(zones[0]);
  }

  return buildResult(answers, zones, patient);
}

function buildResult(
  answers: TriageAnswer[],
  zones: string[],
  patient: TriagePatient | null
): TriageResult {
  const primary = zones[0];
  const symptomGroups = answers.slice(1, 1 + zones.length);
  const symptoms = [
    ...new Set(
      symptomGroups
        .flatMap((a) => asArray(a?.answer))
        .filter((s) => s !== AUCUN)
    ),
  ];
  const duration =
    asArray(answers[1 + zones.length]?.answer)[0] ?? "";
  const flags = asArray(answers[2 + zones.length]?.answer).filter(
    (s) => s !== AUCUN
  );

  // Irradiation cardiaque typique (cœur + bras/épaule/mâchoire).
  const radiating = symptoms.some((s) =>
    s.startsWith("Douleur qui irradie")
  );

  let urgency: TriageUrgency = "moderate";
  if (flags.some((f) => EMERGENCY_FLAGS.has(f))) {
    urgency = "emergency";
  } else if (
    flags.some((f) => URGENT_FLAGS.has(f)) ||
    (duration === DUREES[0] && flags.length > 0) ||
    (radiating && zones.includes(ZONE_COEUR))
  ) {
    urgency = "urgent";
  } else if (duration === DUREES[3] && flags.length === 0) {
    urgency = "low";
  }

  // Union des spécialités (zone principale en premier).
  const specialties: string[] = [];
  for (const z of zones) {
    for (const s of ZONES[z]?.specialties ?? []) {
      if (!specialties.includes(s)) {
        specialties.push(s);
      }
    }
  }
  const age = patient?.age ?? null;
  if (age !== null && age < 15 && !specialties.includes("Pédiatrie")) {
    specialties.unshift("Pédiatrie");
  }

  const name = patient ? stripName(patient.firstName) : "";
  const who = name ? `Merci ${name}. ` : "Merci. ";
  const zonesText =
    zones.length > 1
      ? `zones ${zones.join(" + ")}`
      : `zone ${primary}`;
  const symptomsText =
    symptoms.length > 0
      ? `(${symptoms.slice(0, 3).join(", ")}${
          symptoms.length > 3 ? ", …" : ""
        })`
      : "";
  const durationText = duration
    ? ` depuis ${duration.charAt(0).toLowerCase() + duration.slice(1)}`
    : "";

  const advice =
    urgency === "emergency"
      ? "⚠️ Certains signes nécessitent une prise en charge immédiate : rendez-vous aux urgences les plus proches sans attendre."
      : urgency === "urgent"
      ? "Votre situation devrait être vue rapidement : prenez rendez-vous dans les prochains jours."
      : urgency === "low"
      ? "Rien d'alarmant d'après vos réponses, mais un avis médical reste conseillé."
      : "Prenez rendez-vous dans les prochaines semaines pour un avis médical.";

  const historyNote =
    patient?.chronicConditions?.trim()
      ? ` J'ai tenu compte de vos antécédents (${patient.chronicConditions.trim()}).`
      : "";

  const summary =
    `${who}D'après vos réponses (${zonesText}) ${symptomsText}${durationText}, ` +
    `je vous oriente vers : ${specialties.join(" / ")}. ` +
    `${advice}${historyNote} ` +
    `Vous trouverez ci-dessous les médecins disponibles dans cette spécialité.`;

  return {
    type: "result",
    summary,
    urgency,
    emergencyMessage:
      urgency === "emergency"
        ? "Signes d'alerte détectés. Si votre état s'aggrave (douleur intense, malaise, difficultés à respirer), appelez immédiatement les secours ou rendez-vous aux urgences."
        : null,
    specialties,
  };
}

/* ============================================================
   TEXTE LIBRE : repérer une zone (sinon on garde les choix)
============================================================ */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const KEYWORDS: { zone: string; words: string[] }[] = [
  { zone: ZONE_COEUR, words: ["coeur", "poitrine", "thorax", "cardiaque", "palpitation"] },
  { zone: ZONE_RESPIRATION, words: ["respir", "souffle", "asthme", "toux", "poumon", "bronche"] },
  { zone: ZONE_DIGESTION, words: ["ventre", "estomac", "digest", "nausee", "vomiss", "diarrhee", "constip", "foie", "intestin", "abdom"] },
  { zone: ZONE_PEAU, words: ["peau", "bouton", "eczema", "psoriasis", "cheveu", "demangeaison", "dermato", "eruption"] },
  { zone: ZONE_NEURO, words: ["tete", "migraine", "vertige", "memoire", "neuro", "convulsion", "paralysie"] },
  { zone: ZONE_FIEVRE, words: ["fievre", "fatigue", "grippe", "courbature", "frisson", "froid"] },
  { zone: ZONE_MUSCLES, words: ["dos", "articul", "genou", "muscle", "os", "rhumat", "entorse", "fracture", "lombaire"] },
  { zone: ZONE_YEUX, words: ["oeil", "yeux", "vision", "vue", "ophtal", "voir"] },
  { zone: ZONE_ORL, words: ["oreille", "nez", "gorge", "orl", "sinus", "angine", "otite", "audition"] },
  { zone: ZONE_URINAIRE, words: ["urine", "urin", "rein", "vessie", "cystite", "prostate"] },
  { zone: ZONE_FEMME, words: ["grossesse", "enceinte", "regle", "gyneco", "menopause", "contracept"] },
  { zone: ZONE_MORAL, words: ["stress", "moral", "depress", "deprim", "sommeil", "insomnie", "anxiete", "angoisse", "psy"] },
  { zone: ZONE_HORMONES, words: ["diabete", "thyroide", "hormone", "endocrino", "glycemie"] },
  { zone: ZONE_ENFANT, words: ["enfant", "bebe", "fils", "fille", "nourrisson"] },
];

export function matchFreeTextToArea(text: string): string | null {
  const normalized = normalize(text);
  for (const entry of KEYWORDS) {
    if (entry.words.some((w) => normalized.includes(w))) {
      return entry.zone;
    }
  }
  return null;
}
