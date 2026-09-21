import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import {
  TriagePatient,
  getFirstQuestion,
  getNextStep,
  matchFreeTextToArea,
} from "@/lib/triage-ai";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * NOTRE AI — moteur local d'orientation médicale (remplace Gemini).
 * POST { message, answers, patient } ->
 *   { type: "question", question, options, multiple } ou
 *   { type: "result", summary, urgency, emergencyMessage, specialties, doctors }
 * Les médecins sont de VRAIS médecins de la plateforme (Prisma),
 * filtrés par les spécialités recommandées.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, answers, patient } = body as {
      message?: string;
      answers?: { question: string; answer: string | string[] }[];
      patient?: TriagePatient | null;
    };

    const history = Array.isArray(answers) ? answers : [];

    // Texte libre à la première étape : compris via mots-clés.
    let working = history;
    if (
      working.length === 0 &&
      typeof message === "string" &&
      message.trim()
    ) {
      const area = matchFreeTextToArea(message);
      if (area) {
        const first = getFirstQuestion();
        working = [{ question: first.question, answer: area }];
      } else {
        const first = getFirstQuestion();
        return NextResponse.json({
          type: "question",
          question: first.question,
          options: first.options,
          multiple: first.multiple,
        });
      }
    }

    const step = getNextStep(working, patient ?? null);

    if (step.type === "question") {
      return NextResponse.json({
        type: "question",
        question: step.question,
        options: step.options,
        multiple: step.multiple,
      });
    }

    // Résultat : chercher les vrais médecins de ces spécialités.
    let doctors: {
      id: string;
      firstName: string;
      lastName: string;
      city: string | null;
      wilaya: string | null;
      avatarUrl: string | null;
      specialties: string[];
      acceptsOnline: boolean;
      acceptsHomeVisit: boolean;
      averageRating: number;
      yearsExperience: number | null;
    }[] = [];

    try {
      const authorization = request.headers.get("authorization");
      let authenticated = false;

      if (authorization?.startsWith("Bearer ")) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const token = authorization.substring(7).trim();
          const { data, error } = await supabase.auth.getUser(token);
          authenticated = !error && !!data?.user;
        }
      }

      if (authenticated) {
        const dbDoctors = await prisma.doctor.findMany({
          where: {
            isAcceptingNewPatients: true,
            profile: { accountStatus: "ACTIVE" },
            specialties: {
              some: {
                specialty: { name: { in: step.specialties } },
              },
            },
          },
          include: {
            profile: true,
            specialties: { include: { specialty: true } },
          },
          orderBy: { averageRating: "desc" },
          take: 6,
        });

        doctors = dbDoctors.map((doc) => ({
          id: doc.id,
          firstName: doc.profile?.firstName || "",
          lastName: doc.profile?.lastName || "",
          city: doc.profile?.city || null,
          wilaya: doc.profile?.wilaya || null,
          avatarUrl: doc.profile?.avatarUrl || null,
          specialties: doc.specialties.map((s) => s.specialty.name),
          acceptsOnline: doc.acceptsOnline,
          acceptsHomeVisit: doc.acceptsHomeVisit,
          averageRating: Number(doc.averageRating) || 0,
          yearsExperience: doc.yearsExperience ?? null,
        }));
      }
    } catch (doctorsError) {
      console.error("Triage doctors lookup error:", doctorsError);
    }

    return NextResponse.json({
      type: "result",
      summary: step.summary,
      urgency: step.urgency,
      emergencyMessage: step.emergencyMessage ?? null,
      specialties: step.specialties,
      doctors,
    });
  } catch (error) {
    console.error("POST /api/ai/triage error:", error);
    return NextResponse.json(
      { success: false, error: "Une erreur est survenue." },
      { status: 500 }
    );
  }
}
