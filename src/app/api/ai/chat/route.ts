import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const AVAILABLE_SPECIALTIES = [
  "Médecine générale",
  "Cardiologie",
  "Dermatologie",
  "Pédiatrie",
  "Gynécologie",
  "Neurologie",
  "Psychiatrie",
  "Ophtalmologie",
  "ORL",
  "Orthopédie",
  "Gastro-entérologie",
  "Pneumologie",
  "Endocrinologie",
  "Urologie",
  "Rhumatologie",
  "Chirurgie générale",
] as const;

type Answer = {
  question: string;
  answer: string | string[];
};

type QuestionResponse = {
  type: "question";
  question: string;
  options: string[];
  multiple: boolean;
};

type ResultResponse = {
  type: "result";
  summary: string;
  urgency: "low" | "moderate" | "urgent" | "emergency";
  emergencyMessage?: string;
  specialties: string[];
};

type AIResponse = QuestionResponse | ResultResponse;

const SYSTEM_INSTRUCTION = `
Tu es DOCTORZ Co., un assistant d'orientation médicale préliminaire.

OBJECTIF :
Aider le patient à décrire son problème et l'orienter vers une ou plusieurs
spécialités médicales pertinentes.

RÈGLES DE SÉCURITÉ :
- Tu ne poses jamais de diagnostic.
- Tu ne prescris jamais de médicament.
- Tu ne remplaces jamais un médecin.
- Si des signes potentiellement graves apparaissent, recommande une prise en charge urgente.
- En cas de signe potentiellement vital, recommande immédiatement les urgences.

QUESTIONNAIRE ADAPTATIF :
- Pose UNE SEULE question à la fois.
- La question suivante doit dépendre des réponses précédentes.
- Utilise principalement des questions à choix.
- Les options doivent être simples.
- "multiple": true si plusieurs réponses peuvent être choisies.
- "multiple": false si une seule réponse est attendue.
- Maximum environ 8 questions.
- Si suffisamment d'informations sont disponibles, donne directement le résultat.
- Ne répète jamais inutilement une question déjà posée.

LANGUES :
Le patient peut utiliser :
- français
- arabe
- darija algérienne
- anglais
- plusieurs langues mélangées.

Comprends le sens global du message.
Ne fais jamais une orientation basée uniquement sur des mots-clés.

SPÉCIALITÉS AUTORISÉES :
${AVAILABLE_SPECIALTIES.map((s) => `- ${s}`).join("\n")}

Tu dois utiliser UNIQUEMENT ces spécialités.

RÉSULTAT FINAL :
Retourne :
- un résumé clair
- le niveau d'urgence
- une ou plusieurs spécialités pertinentes.

NIVEAUX :
- low
- moderate
- urgent
- emergency

Si emergency :
- ajoute emergencyMessage.

FORMAT OBLIGATOIRE :

QUESTION :

{
  "type": "question",
  "question": "Question",
  "options": [
    "Option 1",
    "Option 2",
    "Option 3"
  ],
  "multiple": false
}

OU RESULTAT :

{
  "type": "result",
  "summary": "Résumé",
  "urgency": "moderate",
  "emergencyMessage": "",
  "specialties": [
    "Médecine générale"
  ]
}

Retourne UNIQUEMENT du JSON valide.
`;

function normalizeAIResponse(value: unknown): AIResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;

  if (data.type === "question") {
    if (
      typeof data.question !== "string" ||
      !Array.isArray(data.options)
    ) {
      return null;
    }

    const options = data.options.filter(
      (option): option is string =>
        typeof option === "string" && option.trim().length > 0,
    );

    if (!options.length) {
      return null;
    }

    return {
      type: "question",
      question: data.question,
      options,
      multiple: Boolean(data.multiple),
    };
  }

  if (data.type === "result") {
    if (
      typeof data.summary !== "string" ||
      !Array.isArray(data.specialties)
    ) {
      return null;
    }

    const specialties = data.specialties.filter(
      (specialty): specialty is string =>
        typeof specialty === "string" &&
        AVAILABLE_SPECIALTIES.includes(
          specialty as (typeof AVAILABLE_SPECIALTIES)[number],
        ),
    );

    const validUrgencies = [
      "low",
      "moderate",
      "urgent",
      "emergency",
    ] as const;

    const urgency = validUrgencies.includes(
      data.urgency as (typeof validUrgencies)[number],
    )
      ? (data.urgency as ResultResponse["urgency"])
      : "moderate";

    return {
      type: "result",
      summary: data.summary,
      urgency,
      emergencyMessage:
        typeof data.emergencyMessage === "string"
          ? data.emergencyMessage
          : undefined,
      specialties,
    };
  }

  return null;
}

async function askGemini(
  message: string,
  answers: Answer[],
): Promise<AIResponse> {
  const historyText =
    answers.length > 0
      ? answers
          .map(
            (item, index) =>
              `Question ${index + 1}: ${item.question}
Réponse du patient: ${
                Array.isArray(item.answer)
                  ? item.answer.join(", ")
                  : item.answer
              }`,
          )
          .join("\n\n")
      : "Aucune réponse précédente.";

  const prompt = `
${SYSTEM_INSTRUCTION}

HISTORIQUE DU QUESTIONNAIRE :
${historyText}

DERNIER MESSAGE DU PATIENT :
${message || "Le patient commence le questionnaire."}

Analyse maintenant la situation.

Si tu as besoin d'informations :
retourne UNE question.

Si tu as suffisamment d'informations :
retourne le résultat final.
`;

  console.log("🤖 Gemini request");
  console.log("Answers:", answers.length);
  console.log("Message:", message);

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;

    console.log("✅ Gemini response:", text);

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");

      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("Gemini returned invalid JSON.");
      }

      parsed = JSON.parse(
        text.slice(firstBrace, lastBrace + 1),
      );
    }

    const normalized = normalizeAIResponse(parsed);

    if (!normalized) {
      throw new Error(
        "Gemini returned an invalid questionnaire structure.",
      );
    }

    return normalized;
  } catch (error) {
    console.error("❌ Gemini error:", error);

    throw error;
  }
}

async function findDoctorsBySpecialties(
  specialties: string[],
) {
  if (!specialties.length) {
    return [];
  }

  const doctors = await prisma.doctor.findMany({
    where: {
      isAcceptingNewPatients: true,
      specialties: {
        some: {
          specialty: {
            name: {
              in: specialties,
            },
          },
        },
      },
    },

    include: {
      profile: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          city: true,
          wilaya: true,
          avatarUrl: true,
        },
      },

      specialties: {
        include: {
          specialty: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },

    take: 10,
  });

  return doctors.map((doctor) => ({
    id: doctor.id,
    firstName: doctor.profile.firstName,
    lastName: doctor.profile.lastName,
    city: doctor.profile.city,
    wilaya: doctor.profile.wilaya,
    avatarUrl: doctor.profile.avatarUrl,

    specialties: doctor.specialties.map(
      (item) => item.specialty.name,
    ),

    acceptsOnline: doctor.acceptsOnline,
    acceptsHomeVisit: doctor.acceptsHomeVisit,
    averageRating: Number(doctor.averageRating),
    yearsExperience: doctor.yearsExperience,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const answers: Answer[] = Array.isArray(body.answers)
      ? body.answers
          .filter(
            (answer: unknown): answer is Answer =>
              Boolean(answer) &&
              typeof answer === "object" &&
              typeof (answer as Answer).question === "string" &&
              (
                typeof (answer as Answer).answer === "string" ||
                Array.isArray((answer as Answer).answer)
              ),
          )
          .slice(-8)
      : [];

    const aiResponse = await askGemini(
      message,
      answers,
    );

    if (aiResponse.type === "question") {
      return NextResponse.json({
        type: "question",
        message: aiResponse.question,
        question: aiResponse.question,
        options: aiResponse.options,
        multiple: aiResponse.multiple,
        specialties: [],
        doctors: [],
      });
    }

    const doctors = await findDoctorsBySpecialties(
      aiResponse.specialties,
    );

    return NextResponse.json({
      type: "result",
      message: aiResponse.summary,
      summary: aiResponse.summary,
      urgency: aiResponse.urgency,
      emergencyMessage:
        aiResponse.emergencyMessage ?? null,
      specialties: aiResponse.specialties,
      doctors,
    });
  } catch (error) {
    console.error("=================================");
    console.error("AI CHAT API ERROR");
    console.error(error);
    console.error("=================================");

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    /*
     * ============================================================
     * GEMINI QUOTA / RATE LIMIT
     * ============================================================
     *
     * Gemini retourne une erreur 429 lorsque le quota
     * de requêtes est dépassé.
     *
     * On ne transmet PAS le gros JSON technique de Gemini
     * au patient.
     */

    if (
      errorMessage.includes("429") ||
      errorMessage.includes("RESOURCE_EXHAUSTED") ||
      errorMessage.toLowerCase().includes("quota exceeded") ||
      errorMessage.toLowerCase().includes("free_tier_requests")
    ) {
      return NextResponse.json(
        {
          error:
            "Le service d'analyse IA a temporairement atteint sa limite de requêtes. Veuillez patienter quelques instants avant de réessayer.",
          code: "AI_QUOTA_EXCEEDED",
        },
        { status: 429 },
      );
    }

    /*
     * ============================================================
     * GEMINI TIMEOUT
     * ============================================================
     */

    if (
      errorMessage.toLowerCase().includes("timeout") ||
      errorMessage.toLowerCase().includes("timed out") ||
      errorMessage.toLowerCase().includes("deadline")
    ) {
      return NextResponse.json(
        {
          error:
            "Le service IA met trop de temps à répondre. Veuillez réessayer dans quelques instants.",
          code: "AI_TIMEOUT",
        },
        { status: 504 },
      );
    }

    /*
     * ============================================================
     * GEMINI / SERVER ERROR
     * ============================================================
     */

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de l'analyse. Veuillez réessayer.",
        code: "AI_ERROR",
      },
      { status: 500 },
    );
  }
}