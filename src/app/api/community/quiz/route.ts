import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDoctorWithSpecialties } from "@/lib/lab-auth";
import { resolveAuth } from "@/lib/pharmacy-auth";
import { authorMap } from "@/lib/community";

// ============================================================
// Quiz / QCM formation continue : création, passage (corrigé
// serveur), tentatives, classement.
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuth(request);
    if (!auth || auth.userType !== "DOCTOR") {
      return NextResponse.json(
        { success: false, error: "Not authenticated as doctor." },
        { status: 401 }
      );
    }
    const doc = await resolveDoctorWithSpecialties(request);
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId") || "";
    const leaderboard = searchParams.get("leaderboard") || "";

    if (quizId) {
      // Questions SANS les bonnes réponses (sauf auteur).
      const quizzes = (await (prisma as any).quiz.findMany({})) || [];
      const quiz = quizzes.find((q: any) => q.id === quizId);
      if (!quiz) {
        return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
      }
      const allQ = (await (prisma as any).quizQuestion.findMany({})) || [];
      const questions = allQ
        .filter((x: any) => x.quizId === quizId)
        .map((x: any) => ({
          id: x.id,
          text: x.text,
          options: Array.isArray(x.options) ? x.options : [],
          ...(doc && quiz.doctorId === doc.doctorId ? { correct: x.correct } : {}),
        }));
      return NextResponse.json({
        success: true,
        quiz: { id: quiz.id, title: quiz.title },
        questions,
        mine: !!doc && quiz.doctorId === doc.doctorId,
      });
    }

    if (leaderboard) {
      const attempts = (await (prisma as any).quizAttempt.findMany({})) || [];
      const mine = attempts.filter((a: any) => a.quizId === leaderboard);
      const best = new Map<string, any>();
      for (const a of mine) {
        const prev = best.get(a.doctorId);
        const pct = a.total > 0 ? a.score / a.total : 0;
        if (!prev || pct > prev.pct || (pct === prev.pct && a.score > prev.score)) {
          best.set(a.doctorId, { ...a, pct });
        }
      }
      const { map: authors } = await authorMap();
      const board = Array.from(best.values())
        .map((a: any) => ({
          name: authors.get(a.doctorId)?.name || "Médecin",
          score: a.score,
          total: a.total,
          pct: Math.round(a.pct * 100),
        }))
        .sort((a, b) => b.pct - a.pct || b.score - a.score)
        .slice(0, 10);
      return NextResponse.json({ success: true, leaderboard: board });
    }

    const quizzes = (await (prisma as any).quiz.findMany({})) || [];
    const allQ = (await (prisma as any).quizQuestion.findMany({})) || [];
    const attempts = (await (prisma as any).quizAttempt.findMany({})) || [];
    const { map: authors, specNames } = await authorMap();
    const list = quizzes
      .map((q: any) => {
        const nq = allQ.filter((x: any) => x.quizId === q.id).length;
        const mine = attempts.filter(
          (a: any) => a.quizId === q.id && doc && a.doctorId === doc.doctorId
        );
        const best = mine.reduce((m: number, a: any) => {
          const pct = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
          return Math.max(m, pct);
        }, -1);
        return {
          id: q.id,
          title: q.title,
          questions: nq,
          attempts: attempts.filter((a: any) => a.quizId === q.id).length,
          myBest: best >= 0 ? best : null,
          mine: !!doc && q.doctorId === doc.doctorId,
          targetNames: (q.specialtyIds || []).length
            ? (q.specialtyIds || []).map((id: string) => specNames.get(String(id)) || "Spécialité")
            : ["Toutes spécialités"],
          author: authors.get(q.doctorId) || { name: "Médecin", specialtyNames: [] },
          createdAt: q.createdAt,
        };
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return NextResponse.json({ success: true, quizzes: list });
  } catch (error) {
    console.error("GET /api/community/quiz error:", error);
    return NextResponse.json({ success: false, error: "Unable to load." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuth(request);
    if (!auth || auth.userType !== "DOCTOR") {
      return NextResponse.json(
        { success: false, error: "Not authenticated as doctor." },
        { status: 401 }
      );
    }
    const doc = await resolveDoctorWithSpecialties(request);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Doctor profile not found." },
        { status: 404 }
      );
    }
    const body = await request.json().catch(() => ({}));

    // Soumission d'une tentative {quizId, answers: {questionId: optionIndex}}
    if (body.attempt && body.quizId) {
      const allQ = (await (prisma as any).quizQuestion.findMany({})) || [];
      const questions = allQ.filter((x: any) => x.quizId === body.quizId);
      if (questions.length === 0) {
        return NextResponse.json({ success: false, error: "Quiz vide." }, { status: 400 });
      }
      const answers = body.answers || {};
      let score = 0;
      const correction = questions.map((q: any) => {
        const given = Number(answers[q.id]);
        const ok = given === Number(q.correct);
        if (ok) score++;
        return { questionId: q.id, given: isNaN(given) ? null : given, correct: Number(q.correct), ok };
      });
      await (prisma as any).quizAttempt.create({
        data: {
          quizId: body.quizId,
          doctorId: doc.doctorId,
          score,
          total: questions.length,
        },
      });
      return NextResponse.json({ success: true, score, total: questions.length, correction });
    }

    // Création {title, specialtyIds?, questions: [{text, options[2-4], correct}]}
    const title = String(body.title || "").trim();
    const questions = Array.isArray(body.questions) ? body.questions : [];
    if (!title || questions.length === 0 || questions.length > 20) {
      return NextResponse.json(
        { success: false, error: "Titre + 1 à 20 questions requis." },
        { status: 400 }
      );
    }
    for (const q of questions) {
      const opts = Array.isArray(q?.options)
        ? q.options.map((o: any) => String(o ?? "").trim()).filter(Boolean)
        : [];
      if (!String(q?.text || "").trim() || opts.length < 2 || opts.length > 4) {
        return NextResponse.json(
          { success: false, error: "Chaque question : texte + 2 à 4 options." },
          { status: 400 }
        );
      }
      if (Number(q?.correct) < 0 || Number(q?.correct) >= opts.length) {
        return NextResponse.json(
          { success: false, error: "Bonne réponse invalide." },
          { status: 400 }
        );
      }
    }
    const quiz = await (prisma as any).quiz.create({
      data: {
        doctorId: doc.doctorId,
        title: title.slice(0, 160),
        specialtyIds: Array.isArray(body.specialtyIds)
          ? body.specialtyIds.map(String).slice(0, 10)
          : [],
      },
    });
    for (const q of questions) {
      const opts = q.options.map((o: any) => String(o ?? "").trim()).filter(Boolean);
      await (prisma as any).quizQuestion.create({
        data: {
          quizId: quiz.id,
          text: String(q.text).trim().slice(0, 500),
          options: opts.map((t: string) => t.slice(0, 160)),
          correct: Number(q.correct),
        },
      });
    }
    return NextResponse.json({ success: true, quizId: quiz.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/community/quiz error:", error);
    return NextResponse.json({ success: false, error: "Unable to save." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await resolveAuth(request);
    if (!auth || auth.userType !== "DOCTOR") {
      return NextResponse.json(
        { success: false, error: "Not authenticated as doctor." },
        { status: 401 }
      );
    }
    const doc = await resolveDoctorWithSpecialties(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    if (!id || !doc) {
      return NextResponse.json({ success: false, error: "id is required." }, { status: 400 });
    }
    const quizzes = (await (prisma as any).quiz.findMany({})) || [];
    const quiz = quizzes.find((q: any) => q.id === id);
    if (!quiz || quiz.doctorId !== doc.doctorId) {
      return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    }
    await (prisma as any).quiz.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/community/quiz error:", error);
    return NextResponse.json({ success: false, error: "Unable to delete." }, { status: 500 });
  }
}
