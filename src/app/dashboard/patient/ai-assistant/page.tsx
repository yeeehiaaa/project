"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePatientTheme } from "@/components/patient/PatientThemeContext";
import {
  TriagePatient,
  buildWelcome,
  getFirstQuestion,
  getNextStep,
  matchFreeTextToArea,
} from "@/lib/triage-ai";
import {
  Bot,
  BrainCircuit,
  Check,
  CheckCheck,
  Clock3,
  History,
  Home,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Video,
  X,
} from "lucide-react";

type Answer = {
  question: string;
  answer: string | string[];
};

type QuestionData = {
  type: "question";
  question: string;
  options: string[];
  multiple: boolean;
};

type Doctor = {
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
};

type ResultData = {
  type: "result";
  summary: string;
  urgency: "low" | "moderate" | "urgent" | "emergency";
  emergencyMessage?: string | null;
  specialties: string[];
  doctors: Doctor[];
};

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  senderName?: string;
  time: string;
  status?: "sent" | "delivered" | "read";
};

const initialAssistantMessage =
  "Bonjour 👋 Je prépare votre accueil personnalisé...";

export default function AIAssistantPage() {
  const { isDark } = usePatientTheme();
  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestion, setCurrentQuestion] =
    useState<QuestionData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  /*
   * ============================================================
   * EFFET D'ECRITURE (l'assistant ecrit en temps reel)
   * ============================================================
   */
  const [typingId, setTypingId] = useState<number | null>(null);
  const [typedCount, setTypedCount] = useState(0);
  // Messages déjà écrits en entier : on ne les retape jamais (anti-boucle).
  const typedDoneRef = useRef<Set<number>>(new Set<number>([1]));
  // Garde anti-conflit entre flux de conversation (restart, reprise...).
  const flowRef = useRef(0);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const last = messages[messages.length - 1];

    if (last.role !== "assistant") {
      setTypingId(null);
      return;
    }

    // Déjà écrit en entier : ne jamais recommencer (anti-boucle).
    if (
      typingId === last.id ||
      typedDoneRef.current.has(last.id)
    ) {
      return;
    }

    setTypingId(last.id);
    setTypedCount(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, typingId]);

  useEffect(() => {
    if (typingId === null) {
      return;
    }

    const target = messages.find(
      (item) => item.id === typingId,
    );

    if (!target || target.role !== "assistant") {
      setTypingId(null);
      return;
    }

    if (typedCount >= target.content.length) {
      typedDoneRef.current.add(target.id);
      setTypingId(null);
      return;
    }

    const timer = setTimeout(() => {
      setTypedCount((count) =>
        Math.min(count + 3, target.content.length),
      );
    }, 24);

    return () => clearTimeout(timer);
  }, [typingId, typedCount, messages]);

  /*
   * ============================================================
   * PATIENT KNOWLEDGE BASE (NOTRE AI) : nom, âge, sexe, antécédents
   * ============================================================
   */
  const [patient, setPatient] =
    useState<TriagePatient | null>(null);

  const startWithQuestion = async (
    triagePatient: TriagePatient | null,
  ) => {
    flowRef.current += 1;
    const first = getFirstQuestion();

    setSessionId(
      `sess-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
    );
    setInput("");
    setAnswers([]);
    setResult(null);
    setSelectedOptions([]);
    setLoading(false);
    setMessages([]);
    setCurrentQuestion(null);

    // 1er message : l'accueil personnalisé (points puis frappe).
    // Démarrage volontairement rapide : l'utilisateur vient de cliquer.
    if (
      !(await deliverAssistant(buildWelcome(triagePatient), {
        dotsMs: 900,
      }))
    ) {
      return;
    }

    // 2eme message : la question + les choix.
    if (
      !(await deliverAssistant(first.question, { dotsMs: 1200 }))
    ) {
      return;
    }
    setCurrentQuestion({
      type: "question",
      question: first.question,
      options: first.options,
      multiple: first.multiple,
    });
  };

  /*
   * ============================================================
   * HISTORIQUE PERSISTANT (localStorage, par compte patient)
   * ============================================================
   */
  interface SavedTriageSession {
    id: string;
    updatedAt: string;
    title: string;
    messages: Message[];
    answers: Answer[];
    currentQuestion: QuestionData | null;
    result: ResultData | null;
  }

  const [sessionId, setSessionId] = useState<string>(
    () =>
      `sess-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
  );
  const [patientKey, setPatientKey] =
    useState<string>("guest");
  const [hydrated, setHydrated] = useState(false);
  const [started, setStarted] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<
    SavedTriageSession[]
  >([]);

  const historyStorageKey = (key: string) =>
    `mediconnect_triage_history_${key}`;

  const readHistory = (
    key: string,
  ): SavedTriageSession[] => {
    try {
      const raw = localStorage.getItem(
        historyStorageKey(key),
      );
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeHistory = (
    key: string,
    list: SavedTriageSession[],
  ) => {
    try {
      localStorage.setItem(
        historyStorageKey(key),
        JSON.stringify(list.slice(0, 20)),
      );
    } catch {
      // stockage indisponible : on continue sans historique
    }
  };

  const sessionTitle = (entry: {
    updatedAt: string;
    answers: Answer[];
    result: ResultData | null;
  }) => {
    const date = new Date(
      entry.updatedAt,
    ).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });

    if (
      entry.result &&
      entry.result.specialties.length > 0
    ) {
      return `${entry.result.specialties.join(" / ")} • ${date}`;
    }

    if (entry.answers.length > 0) {
      return `En cours • ${date}`;
    }

    return `Nouvelle discussion • ${date}`;
  };

  const openHistory = () => {
    const list = [...readHistory(patientKey)].sort(
      (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    );
    setHistoryList(list);
    setShowHistory(true);
  };

  const resumeSession = (
    entry: SavedTriageSession,
  ) => {
    flowRef.current += 1;
    entry.messages.forEach((item) =>
      typedDoneRef.current.add(item.id),
    );
    setSessionId(entry.id);
    setStarted(true);
    setMessages(entry.messages);
    setAnswers(entry.answers);
    setCurrentQuestion(entry.currentQuestion);
    setResult(entry.result);
    setSelectedOptions([]);
    setShowHistory(false);
  };

  const deleteSession = (id: string) => {
    const next = readHistory(patientKey).filter(
      (item) => item.id !== id,
    );
    writeHistory(patientKey, next);
    setHistoryList(
      [...next].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    );

    // Si on supprime la conversation courante, on en démarre une neuve.
    if (id === sessionId) {
      startWithQuestion(patient);
    }
  };

  /*
   * Chargement du profil patient au montage : l'assistant connaît
   * le patient avant même de dire bonjour (nom, âge, sexe, dossier).
   */
  useEffect(() => {
    let mounted = true;

    (async () => {
      let key = "guest";
      let triagePatient: TriagePatient | null = null;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.id) {
          key = session.user.id;
        }

        if (!session?.access_token) {
          throw new Error("No session");
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(
          "/api/dashboard/patient/profile",
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok || !data?.profile) {
          throw new Error("No profile");
        }

        const profile = data.profile;
        const record = data.patient || {};

        let age: number | null = null;

        if (profile.birthDate) {
          const birth = new Date(profile.birthDate);

          if (!Number.isNaN(birth.getTime())) {
            const now = new Date();
            age =
              now.getFullYear() -
              birth.getFullYear();
            const monthDiff =
              now.getMonth() - birth.getMonth();

            if (
              monthDiff < 0 ||
              (monthDiff === 0 &&
                now.getDate() < birth.getDate())
            ) {
              age -= 1;
            }
          }
        }

        triagePatient = {
          firstName: profile.firstName || "",
          age,
          gender: profile.gender ?? null,
          chronicConditions:
            record.chronicConditions ?? null,
          allergies: record.allergies ?? null,
          currentMedications:
            record.currentMedications ?? null,
        };
      } catch {
        /*
         * Sans profil : accueil générique, le triage reste utilisable.
         */
        triagePatient = null;
      }

      if (!mounted) {
        return;
      }

      setPatientKey(key);
      setPatient(triagePatient);

      /*
       * Reprendre la dernière VRAIE conversation si elle existe.
       * Les sessions fantômes (vides, ou avec l'ancien message
       * d'attente "prépare votre accueil") sont purgées : sinon
       * l'écran de démarrage disparaît tout seul au chargement.
       */
      const isJunk = (entry: {
        messages: Message[];
        answers: Answer[];
        result: ResultData | null;
      }) => {
        const msgs = entry.messages || [];
        if (msgs.length === 0) return true;
        if (
          msgs.length === 1 &&
          /prépare votre accueil/i.test(msgs[0].content || "")
        ) {
          return true;
        }
        return false;
      };

      const rawSaved = [...readHistory(key)].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      );
      const cleaned = rawSaved.filter((entry) => !isJunk(entry));
      if (cleaned.length !== rawSaved.length) {
        writeHistory(key, cleaned);
      }
      const saved = cleaned;
      const last = saved[0];

      if (last && last.messages.length > 0) {
        setSessionId(last.id);
        setStarted(true);
        last.messages.forEach((item) =>
          typedDoneRef.current.add(item.id),
        );
        setMessages(last.messages);
        setAnswers(last.answers);
        setCurrentQuestion(last.currentQuestion);
        setResult(last.result);
        setHistoryList(saved);
      }
      // Sinon : on reste sur l'écran de démarrage, le patient
      // clique pour commencer la conversation.

      setHydrated(true);
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Sauvegarde automatique de la conversation en cours.
   */
  useEffect(() => {
    if (!hydrated || !started) {
      return;
    }

    const entry: SavedTriageSession = {
      id: sessionId,
      updatedAt: new Date().toISOString(),
      title: "",
      messages,
      answers,
      currentQuestion,
      result,
    };
    entry.title = sessionTitle(entry);

    const list = readHistory(patientKey);
    const index = list.findIndex(
      (item) => item.id === sessionId,
    );
    const next =
      index === -1
        ? [entry, ...list]
        : list.map((item, i) =>
            i === index ? entry : item,
          );

    writeHistory(patientKey, next);
  }, [
    messages,
    answers,
    currentQuestion,
    result,
    sessionId,
    patientKey,
    hydrated,
    started,
  ]);

  /*
   * ============================================================
   * ADD MESSAGE
   * ============================================================
   */

  const nowTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;
  };

  const patientDisplayName = () => {
    const raw = patient?.firstName?.trim() ?? "";
    return raw.split(/\s+/)[0] || "Moi";
  };

  const addMessage = (
    role: "user" | "assistant",
    content: string,
    options?: {
      senderName?: string;
      status?: "sent" | "delivered" | "read";
    },
  ) => {
    const message: Message = {
      id: Date.now() + Math.random(),
      role,
      content,
      senderName:
        options?.senderName ??
        (role === "user"
          ? patientDisplayName()
          : "DOCTORZ Co."),
      time: nowTime(),
      status:
        options?.status ??
        (role === "user" ? "sent" : undefined),
    };

    setMessages((previous) => [...previous, message]);

    return message.id;
  };

  /*
   * ============================================================
   * ACCUSÉS DE LECTURE : envoyé (✓) -> remis (✓✓) -> vu
   * ============================================================
   */
  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const last = messages[messages.length - 1];

    // L'assistant lit les messages du patient peu après sa réponse.
    if (last.role === "assistant") {
      if (
        !messages.some(
          (item) =>
            item.role === "user" && item.status !== "read",
        )
      ) {
        return;
      }

      const timer = setTimeout(() => {
        setMessages((previous) =>
          previous.map((item) =>
            item.role === "user" && item.status !== "read"
              ? { ...item, status: "read" as const }
              : item,
          ),
        );
      }, 700);

      return () => clearTimeout(timer);
    }

    // Un message patient passe à "remis" peu après l'envoi.
    const pending = [...messages]
      .reverse()
      .find(
        (item) =>
          item.role === "user" && item.status === "sent",
      );

    if (!pending) {
      return;
    }

    const timer = setTimeout(() => {
      setMessages((previous) =>
        previous.map((item) =>
          item.id === pending.id
            ? { ...item, status: "delivered" as const }
            : item,
        ),
      );
    }, 800);

    return () => clearTimeout(timer);
  }, [messages]);

  /*
   * ============================================================
   * SEND MESSAGE TO AI
   * ============================================================
   */

 const handleSend = async (customMessage?: string) => {
  // L'évaluation est déjà terminée
  if (result || typingId) {
    return;
  }

  // Choix QCM (unique ou multiples) : envoyés via le bouton Envoyer.
  if (currentQuestion && selectedOptions.length > 0) {
    setInput("");
    await submitAnswer(selectedOptions);
    return;
  }

  const text = (customMessage ?? input).trim();

  if (!text || loading) {
    return;
  }

  setInput("");
  setLoading(true);

  addMessage("user", text);

  /*
   * NOTRE AI : à la première étape, le texte libre est compris
   * via mots-clés. Sinon (ou plus tard), on garde les choix.
   */
  if (answers.length > 0 || !matchFreeTextToArea(text)) {
    setLoading(false);

    await deliverAssistant(
      answers.length > 0
        ? "Merci pour ces précisions. Pour que je puisse bien vous orienter, choisissez une réponse parmi les propositions ci-dessous."
        : "Je n'ai pas bien compris. Choisissez une proposition ci-dessous.",
    );

    return;
  }

  // Timeout de sécurité : 45 secondes
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 45000);

  try {
    const response = await fetch("/api/ai/triage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: text,
        answers,
        patient,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
  const errorMessage =
    typeof data?.error === "string"
      ? data.error
      : "Le service IA est temporairement indisponible.";

  if (response.status === 429) {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "assistant",
        content:
          "Le service d'analyse IA a temporairement atteint sa limite de requêtes. Veuillez patienter quelques instants avant de réessayer.",
      },
    ]);

    setLoading(false);
    return;
  }

  throw new Error(errorMessage);
}

    /*
     * QUESTION
     */
    if (data.type === "question") {
      const questionData: QuestionData = {
        type: "question",
        question: data.question || data.message,
        options: Array.isArray(data.options)
          ? data.options
          : [],
        multiple: Boolean(data.multiple),
      };

      setCurrentQuestion(null);
      setSelectedOptions([]);

      if (
        !(await deliverAssistant(
          questionData.question,
        ))
      ) {
        return;
      }
      setCurrentQuestion(questionData);

      setLoading(false);
      return;
    }

    /*
     * FINAL RESULT
     */
    if (data.type === "result") {
      const finalResult: ResultData = {
        type: "result",
        summary: data.summary || data.message || "",
        urgency: data.urgency || "moderate",
        emergencyMessage:
          data.emergencyMessage || null,
        specialties: Array.isArray(data.specialties)
          ? data.specialties
          : [],
        doctors: Array.isArray(data.doctors)
          ? data.doctors
          : [],
      };

      setResult(finalResult);
      setCurrentQuestion(null);
      setSelectedOptions([]);

      setLoading(false);
      return;
    }

    throw new Error(
      "Réponse inattendue du serveur.",
    );
  } catch (error) {
    console.error(
      "AI assistant error:",
      error,
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur est survenue. Veuillez réessayer.";

    addMessage(
      "assistant",
      errorMessage,
    );

    setLoading(false);
  }
};

  /*
   * ============================================================
   * NOTRE AI : envoi réaliste (points + frappe).
   * Retourne false si un nouveau flux a pris le relais.
   */
  const deliverAssistant = async (
    content: string,
    options?: { senderName?: string; dotsMs?: number },
  ): Promise<boolean> => {
    const flow = flowRef.current;

    setLoading(true);
    const wait =
      typeof options?.dotsMs === "number"
        ? options.dotsMs
        : 2000 + Math.random() * 800;
    await new Promise((resolve) => setTimeout(resolve, wait));
    if (flowRef.current !== flow) {
      return false;
    }

    setLoading(false);
    addMessage("assistant", content, { senderName: options?.senderName });
    return true;
  };

  /*
   * SELECT OPTION
   * ============================================================
   */

  const handleOptionClick = (option: string) => {
    /*
     * No interaction after final result.
     */
    if (result || loading || typingId || !currentQuestion) {
      return;
    }

    /*
     * MULTIPLE CHOICE
     */
    if (currentQuestion.multiple) {
      setSelectedOptions((previous) => {
        if (previous.includes(option)) {
          return previous.filter(
            (item) => item !== option,
          );
        }

        return [...previous, option];
      });

      return;
    }

    /*
     * SINGLE CHOICE : on sélectionne seulement, l'envoi se fait
     * via le bouton Envoyer (comme une vraie conversation).
     */
    setSelectedOptions((previous) => {
      if (previous.includes(option)) {
        return previous.filter(
          (item) => item !== option,
        );
      }

      return [option];
    });
  };

  /*
   * ============================================================
   * SUBMIT ANSWER
   * ============================================================
   */

  const submitAnswer = async (
    selected: string[],
  ) => {
    /*
     * Never submit if assessment is finished.
     */
    if (
      result ||
      loading ||
      typingId ||
      !currentQuestion ||
      selected.length === 0
    ) {
      return;
    }

    const newAnswer: Answer = {
      question: currentQuestion.question,
      answer:
        selected.length === 1
          ? selected[0]
          : selected,
    };

    const updatedAnswers = [
      ...answers,
      newAnswer,
    ];

    /*
     * Save answer locally.
     */
    setAnswers(updatedAnswers);

    /*
     * Clear selected options.
     */
    setSelectedOptions([]);

    /*
     * Send to NOTRE AI with the updated history.
     */
    const answerText = selected.join(", ");

    setLoading(true);

    addMessage("user", answerText);

    // Dernière étape : l'assistant accuse réception puis prépare le résultat.
    const previewStep = getNextStep(updatedAnswers, patient);

    if (previewStep.type === "result") {
      // Masquer les choix aussitôt : il ne reste que le message
      // de remerciement, puis le panneau de résultat.
      setCurrentQuestion(null);

      const rawName =
        patient?.firstName?.trim().split(/\s+/)[0] || "";
      const thanksText = rawName
        ? `Merci ${rawName} pour vos réponses, je vous prépare le résultat de votre évaluation...`
        : "Merci pour vos réponses, je vous prépare le résultat de votre évaluation...";

      setLoading(false);

      // Laisser le message s'écrire puis une pause de lecture.
      if (!(await deliverAssistant(thanksText))) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    try {
      const triageHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const {
        data: { session: triageSession },
      } = await supabase.auth.getSession();

      if (triageSession?.access_token) {
        triageHeaders["Authorization"] =
          `Bearer ${triageSession.access_token}`;
      }

      const response = await fetch("/api/ai/triage", {
        method: "POST",
        headers: triageHeaders,
        body: JSON.stringify({
          message: answerText,
          answers: updatedAnswers,
          patient,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Une erreur est survenue.",
        );
      }

      /*
       * ========================================================
       * NEXT QUESTION
       * ========================================================
       */

      if (data.type === "question") {
        const questionData: QuestionData = {
          type: "question",
          question:
            data.question || data.message,
          options: Array.isArray(data.options)
            ? data.options
            : [],
          multiple: Boolean(data.multiple),
        };

        setCurrentQuestion(null);

        if (
          !(await deliverAssistant(
            questionData.question,
          ))
        ) {
          return;
        }
        setCurrentQuestion(questionData);

        setLoading(false);
        return;
      }

      /*
       * ========================================================
       * FINAL RESULT
       * ========================================================
       */

      if (data.type === "result") {
        const finalResult: ResultData = {
          type: "result",
          summary:
            data.summary ||
            data.message ||
            "",
          urgency:
            data.urgency || "moderate",
          emergencyMessage:
            data.emergencyMessage ||
            null,
          specialties: Array.isArray(
            data.specialties,
          )
            ? data.specialties
            : [],
          doctors: Array.isArray(data.doctors)
            ? data.doctors
            : [],
        };

        /*
         * VERY IMPORTANT:
         *
         * The questionnaire is now FINISHED.
         */
        setResult(finalResult);

        /*
         * Remove active question.
         */
        setCurrentQuestion(null);

        /*
         * Clear options.
         */
        setSelectedOptions([]);

        /*
         * Clear options.
         */
        setSelectedOptions([]);

        setLoading(false);
        return;
      }

      throw new Error(
        "Réponse inattendue du serveur.",
      );
    } catch (error) {
      console.error(
        "AI questionnaire error:",
        error,
      );

      addMessage(
        "assistant",
        error instanceof Error
          ? error.message
          : "Une erreur est survenue. Veuillez réessayer.",
      );

      setLoading(false);
    }
  };

  /*
   * ============================================================
   * RESTART ASSESSMENT
   * ============================================================
   */

  const handleStartConversation = () => {
    setStartError(null);
    setStarted(true);
    startWithQuestion(patient).catch((err) => {
      console.error("Start conversation error:", err);
      setStartError(
        "Impossible de démarrer la conversation. Vérifiez votre connexion puis réessayez.",
      );
    });
  };

  const handleNewAssessment = () => {
    // L'historique garde l'ancienne (autosave), on démarre une neuve.
    setStarted(true);
    startWithQuestion(patient);
  };

  /*
   * ============================================================
   * URGENCY HELPERS
   * ============================================================
   */

  const getUrgencyLabel = (
    urgency: ResultData["urgency"],
  ) => {
    switch (urgency) {
      case "low":
        return "Faible";

      case "moderate":
        return "Modérée";

      case "urgent":
        return "Urgente";

      case "emergency":
        return "Urgence médicale";

      default:
        return "À évaluer";
    }
  };

  const getUrgencyClasses = (
    urgency: ResultData["urgency"],
  ) => {
    switch (urgency) {
      case "low":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "moderate":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "urgent":
        return "bg-orange-50 text-orange-700 border-orange-200";

      case "emergency":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="mb-6 flex shrink-0 items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-200">
              <BrainCircuit
                size={21}
                strokeWidth={2.2}
              />
            </div>

            <div>
              <h1 className={isDark ? "text-xl font-bold text-white" : "text-xl font-bold text-slate-900"}>
                DOCTORZ Co.
              </h1>

              <p className={isDark ? "text-xs font-medium text-slate-400" : "text-xs font-medium text-slate-500"}>
                Assistant médical intelligent
              </p>
            </div>
          </div>
        </div>

        <div className={isDark ? "hidden items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-300 shadow-sm sm:flex" : "hidden items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-semibold text-sky-600 shadow-sm sm:flex"}>
          <Sparkles size={14} />
          Orientation médicale
        </div>
      </div>

      {/* ======================================================
          MAIN AREA
      ======================================================= */}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* ====================================================
            CHAT
        ===================================================== */}

        <div className={isDark ? "flex min-h-0 flex-col overflow-hidden rounded-[30px] border border-slate-800 bg-slate-900/80 shadow-xl shadow-slate-200/40" : "flex min-h-0 flex-col overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40"}>
          {/* Chat header */}

          <div className={isDark ? "flex shrink-0 items-center justify-between border-b border-slate-800 px-6 py-5" : "flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5"}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                  <Bot size={21} />
                </div>

                <span className={isDark ? "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-500" : "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"} />
              </div>

              <div>
                <h2 className={isDark ? "font-bold text-white" : "font-bold text-slate-900"}>
                  Assistant médical
                </h2>

                <p className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
                  {result
                    ? "Évaluation terminée"
                    : loading
                      ? "Analyse en cours..."
                      : "En ligne"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openHistory}
                title="Historique des conversations"
                className={isDark ? "p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer active:scale-[0.97]" : "p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer active:scale-[0.97]"}
              >
                <History size={16} />
              </button>

              {!result &&
                messages.some(
                  (item) => item.role === "user",
                ) && (
                  <button
                    type="button"
                    onClick={handleNewAssessment}
                    title="Nouvelle évaluation"
                    className={isDark ? "p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer active:scale-[0.97]" : "p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer active:scale-[0.97]"}
                  >
                    <RotateCcw size={16} />
                  </button>
                )}

              {result && (
              <div className={isDark ? "flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300" : "flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"}>
                <Check size={14} />
                Terminé
              </div>
              )}
            </div>
          </div>

          {/* Messages */}

          <div className={isDark ? "min-h-0 flex-1 space-y-5 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950/30 p-5 sm:p-7" : "min-h-0 flex-1 space-y-5 overflow-y-auto bg-gradient-to-b from-slate-50/70 via-white to-sky-50/30 p-5 sm:p-7"}>
            {!started ? (
              <div className="flex h-full min-h-[320px] items-center justify-center">
                <div className={isDark ? "w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl" : "w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl"}>
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-600/30">
                    <Bot size={30} />
                  </div>
                  <h3 className={isDark ? "text-xl font-bold text-white" : "text-xl font-bold text-slate-900"}>
                    {patient?.firstName ? `Bonjour ${patient.firstName.split(" ")[0]} 👋` : "Bonjour 👋"}
                  </h3>
                  <p className={isDark ? "mt-2 text-sm leading-6 text-slate-400" : "mt-2 text-sm leading-6 text-slate-500"}>
                    Je suis votre assistant d'orientation DOCTORZ Co. Répondez à quelques questions et je vous dirigerai vers le bon spécialiste.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartConversation}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:from-blue-500 hover:to-sky-400 active:scale-[0.98] cursor-pointer"
                  >
                    <MessageCircle size={17} />
                    Commencer la conversation
                  </button>
                  {startError && (
                    <p className="mt-2.5 text-xs font-medium text-rose-500">
                      {startError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={openHistory}
                    className={isDark ? "mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 px-5 py-3 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white active:scale-[0.98] cursor-pointer" : "mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] cursor-pointer"}
                  >
                    <History size={15} />
                    Reprendre une discussion
                  </button>
                </div>
              </div>
            ) : (
            <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-[85%] flex-col ${
                    message.role === "user"
                      ? "items-end"
                      : "items-start"
                  }`}
                >
                  {message.role === "user" && (
                    <span className="mb-1 px-1 text-[11px] font-semibold text-sky-600">
                      {message.senderName ?? "Moi"}
                    </span>
                  )}

                  <div
                    className={`${
                      message.role === "user"
                        ? "rounded-3xl rounded-br-md bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-200"
                        : isDark
                          ? "rounded-3xl rounded-bl-md border border-slate-800 bg-slate-800 text-slate-200 shadow-sm"
                          : "rounded-3xl rounded-bl-md border border-slate-100 bg-white text-slate-700 shadow-sm"
                    } px-5 py-4`}
                  >
                    {message.role ===
                      "assistant" && (
                      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-sky-600">
                        <Bot size={14} />
                        {message.senderName ??
                          "DOCTORZ Co."}
                      </div>
                    )}

                    <p className="whitespace-pre-line text-sm leading-6">
                      {typingId === message.id
                        ? message.content.slice(0, typedCount)
                        : message.content}
                      {typingId === message.id && (
                        <span className="ml-0.5 animate-pulse font-bold text-sky-500">
                          |
                        </span>
                      )}
                    </p>
                  </div>

                  <span className="mt-1 flex items-center gap-1 px-1 text-[10px] text-slate-400">
                    {message.time ?? ""}

                    {message.role === "user" && (
                      <>
                        <span>·</span>
                        {message.status === "read" ? (
                          <span className="flex items-center gap-0.5 font-semibold text-sky-500">
                            Vu
                            <CheckCheck size={12} />
                          </span>
                        ) : message.status ===
                          "delivered" ? (
                          <CheckCheck size={12} />
                        ) : (
                          <Check size={12} />
                        )}
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading */}

            {loading && (
              <div className="flex justify-start">
                <div className={isDark ? "rounded-3xl rounded-bl-md border border-slate-800 bg-slate-800 px-5 py-4 shadow-sm" : "rounded-3xl rounded-bl-md border border-slate-100 bg-white px-5 py-4 shadow-sm"}>
                  <div className={isDark ? "flex items-center gap-2 text-sm text-slate-300" : "flex items-center gap-2 text-sm text-slate-500"}>
                    <span className="font-medium">
                      DOCTORZ Co. écrit
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500"
                        style={{ animationDelay: "300ms" }}
                      />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                QUESTION OPTIONS
            ================================================== */}

            {currentQuestion &&
              !result &&
              !loading && (
                <div className="mt-2">
                  <div className={isDark ? "mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400" : "mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500"}>
                    <MessageCircle
                      size={14}
                      className="text-sky-500"
                    />

                    {currentQuestion.multiple
                      ? "Plusieurs réponses possibles - puis Envoyez"
                      : "Choisissez une réponse puis Envoyez"}
                  </div>

                  <div className="grid gap-2.5">
                    {currentQuestion.options.map(
                      (option) => {
                        const isSelected =
                          selectedOptions.includes(
                            option,
                          );

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              handleOptionClick(
                                option,
                              )
                            }
                            className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all cursor-pointer active:scale-[0.99] ${
                              isSelected
                                ? isDark
                                  ? "border-sky-500/50 bg-sky-500/15 text-sky-200 hover:bg-sky-500/20"
                                  : "border-sky-400 bg-sky-50 text-sky-700 hover:bg-sky-100"
                                : isDark
                                  ? "border-slate-700 bg-slate-800 text-slate-200 hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-200"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/60 hover:text-sky-700"
                            }`}
                          >
                            <span>
                              {option}
                            </span>

                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                isSelected
                                  ? "border-sky-600 bg-sky-600 text-white"
                                  : isDark
                                    ? "border-slate-600 bg-slate-800"
                                    : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <Check
                                  size={13}
                                />
                              )}
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>

                  {/* L'envoi des choix se fait via le bouton Envoyer principal. */}
                </div>
              )}

            {/* =================================================
                FINAL RESULT
            ================================================== */}

            {result && (
              <div className={isDark ? "mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-slate-200/50" : "mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50"}>
                {/* Result header */}

                <div className={isDark ? "border-b border-slate-800 bg-gradient-to-r from-sky-950/40 via-slate-900 to-blue-950/40 p-6" : "border-b border-slate-100 bg-gradient-to-r from-sky-50 via-white to-blue-50 p-6"}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-blue-600 text-white shadow-lg">
                      <Stethoscope size={22} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                        Health assessment
                      </p>

                      <h3 className={isDark ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>
                        Résultat de votre évaluation
                      </h3>
                    </div>
                  </div>

                  {/* Urgency */}

                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${getUrgencyClasses(
                      result.urgency,
                    )}`}
                  >
                    <Clock3 size={14} />

                    {getUrgencyLabel(
                      result.urgency,
                    )}
                  </div>
                </div>

                {/* Result body */}

                <div className="space-y-6 p-6">
                  {/* Summary */}

                  <div>
                    <h4 className={isDark ? "mb-2 text-sm font-bold text-white" : "mb-2 text-sm font-bold text-slate-900"}>
                      Résumé
                    </h4>

                    <p className={isDark ? "text-sm leading-6 text-slate-300" : "text-sm leading-6 text-slate-600"}>
                      {result.summary}
                    </p>
                  </div>

                  {/* Specialties */}

                  {result.specialties.length >
                    0 && (
                    <div>
                      <h4 className={isDark ? "mb-3 text-sm font-bold text-white" : "mb-3 text-sm font-bold text-slate-900"}>
                        Spécialité recommandée
                      </h4>

                      <div className="flex flex-wrap gap-2">
                        {result.specialties.map(
                          (specialty) => (
                            <span
                              key={specialty}
                              className={isDark ? "rounded-full bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-200" : "rounded-full bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700"}
                            >
                              {specialty}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Emergency */}

                  {result.urgency ===
                    "emergency" &&
                    result.emergencyMessage && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                            <ShieldAlert
                              size={20}
                            />
                          </div>

                          <div>
                            <h4 className="mb-1 text-sm font-bold text-red-800">
                              Attention médicale
                            </h4>

                            <p className="text-sm leading-6 text-red-700">
                              {
                                result.emergencyMessage
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Doctors */}

                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className={isDark ? "text-sm font-bold text-white" : "text-sm font-bold text-slate-900"}>
                        Médecins correspondants
                      </h4>

                      <span className="text-xs font-medium text-slate-400">
                        {result.doctors.length}{" "}
                        résultat
                        {result.doctors.length !==
                        1
                          ? "s"
                          : ""}
                      </span>
                    </div>

                    {result.doctors.length ===
                    0 ? (
                      <div className={isDark ? "rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-center" : "rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center"}>
                        <Stethoscope
                          size={24}
                          className="mx-auto mb-2 text-slate-400"
                        />

                        <p className={isDark ? "text-sm font-medium text-slate-300" : "text-sm font-medium text-slate-600"}>
                          Aucun médecin correspondant
                          n'est actuellement disponible
                          pour cette spécialité.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {result.doctors.map(
                          (doctor) => (
                            <div
                              key={doctor.id}
                              className={isDark ? "rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-sky-500/40 hover:bg-sky-500/10" : "rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-sky-200 hover:bg-sky-50/30"}
                            >
                              <div className="flex gap-4">
                                {/* Avatar */}

                                <div className={isDark ? "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 font-bold text-sky-200" : "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 font-bold text-sky-700"}>
                                  {doctor.avatarUrl ? (
                                    <img
                                      src={
                                        doctor.avatarUrl
                                      }
                                      alt={`Dr ${doctor.firstName} ${doctor.lastName}`}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <>
                                      {doctor.firstName?.[0]}
                                      {doctor.lastName?.[0]}
                                    </>
                                  )}
                                </div>

                                {/* Doctor info */}

                                <div className="min-w-0 flex-1">
                                  <h5 className={isDark ? "font-bold text-white" : "font-bold text-slate-900"}>
                                    Dr.{" "}
                                    {
                                      doctor.firstName
                                    }{" "}
                                    {
                                      doctor.lastName
                                    }
                                  </h5>

                                  <p className="mt-0.5 text-xs text-sky-600">
                                    {doctor.specialties.join(
                                      " • ",
                                    )}
                                  </p>

                                  {(doctor.city ||
                                    doctor.wilaya) && (
                                    <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>
                                      {
                                        doctor.city
                                      }
                                      {doctor.city &&
                                      doctor.wilaya
                                        ? ", "
                                        : ""}
                                      {
                                        doctor.wilaya
                                      }
                                    </p>
                                  )}

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {doctor.averageRating >
                                      0 && (
                                      <span className={isDark ? "rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300" : "rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-600"}>
                                        ★{" "}
                                        {doctor.averageRating.toFixed(
                                          1,
                                        )}
                                      </span>
                                    )}

                                    {doctor.yearsExperience !==
                                      null && (
                                      <span className={isDark ? "rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300" : "rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600"}>
                                        {
                                          doctor.yearsExperience
                                        }{" "}
                                        ans
                                        d'expérience
                                      </span>
                                    )}

                                    {doctor.acceptsOnline && (
                                      <span className={isDark ? "flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300" : "flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"}>
                                        <Video
                                          size={11}
                                        />
                                        En ligne
                                      </span>
                                    )}

                                    {doctor.acceptsHomeVisit && (
                                      <span className={isDark ? "flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300" : "flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700"}>
                                        <Home
                                          size={11}
                                        />
                                        À domicile
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  {/* =================================================
                      NEW ASSESSMENT
                  ================================================== */}

                  <div className={isDark ? "border-t border-slate-800 pt-5" : "border-t border-slate-100 pt-5"}>
                    <a
                      href={`/dashboard/patient/appointments/new${
                        result.specialties[0]
                          ? `?specialty=${encodeURIComponent(result.specialties[0])}`
                          : ""
                      }`}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:scale-[1.01] hover:from-emerald-500 hover:to-teal-500 cursor-pointer active:scale-[0.97]"
                    >
                      <Stethoscope size={17} />
                      Prendre rendez-vous
                    </a>

                    <p className="mt-2 text-center text-[11px] text-slate-400">
                      La recherche sera pré-remplie avec la spécialité recommandée.
                    </p>
                  </div>

                  <div className={isDark ? "border-t border-slate-800 pt-5" : "border-t border-slate-100 pt-5"}>
                    <button
                      type="button"
                      onClick={
                        handleNewAssessment
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:scale-[1.01] hover:from-blue-600 hover:to-sky-400 cursor-pointer active:scale-[0.97]"
                    >
                      <RotateCcw
                        size={17}
                      />
                      Nouvelle évaluation
                    </button>

                    <p className="mt-2 text-center text-[11px] text-slate-400">
                      Commencer une nouvelle
                      évaluation médicale
                    </p>
                  </div>
                </div>
              </div>
            )}
            </>
            )}
          </div>

          {/* ======================================================
              INPUT
          ======================================================= */}

          {/* ======================================================
              HISTORIQUE DES CONVERSATIONS
          ======================================================= */}

          {showHistory && (
            <div
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setShowHistory(false);
                }
              }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <div
                className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden max-h-[80vh] flex flex-col ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-slate-900"
                }`}
              >
                <div
                  className={`p-4 border-b flex items-center justify-between ${
                    isDark
                      ? "border-slate-800 bg-slate-950/50"
                      : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <h3 className="font-bold text-sm">
                    Historique des conversations
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className={`p-2 rounded-xl transition cursor-pointer active:scale-[0.97] ${
                      isDark
                        ? "hover:bg-slate-800 text-slate-400"
                        : "hover:bg-slate-200 text-slate-500"
                    }`}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-3 overflow-y-auto space-y-2">
                  {historyList.length === 0 ? (
                    <p className="p-6 text-center text-xs text-slate-400">
                      Aucune conversation enregistrée pour le moment.
                    </p>
                  ) : (
                    historyList.map((entry) => (
                      <div
                        key={entry.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                          isDark
                            ? "border-slate-800 bg-slate-950/60"
                            : "border-slate-200 bg-slate-50"
                        } ${entry.id === sessionId ? "ring-2 ring-sky-500/50" : ""}`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">
                            {entry.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {new Date(
                              entry.updatedAt,
                            ).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {entry.result && (
                              <span
                                className={`ml-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getUrgencyClasses(
                                  entry.result.urgency,
                                )}`}
                              >
                                {getUrgencyLabel(
                                  entry.result.urgency,
                                )}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => resumeSession(entry)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition cursor-pointer active:scale-[0.97]"
                          >
                            Reprendre
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSession(entry.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer active:scale-[0.97] ${
                              isDark
                                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                                : "border-slate-200 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={isDark ? "shrink-0 border-t border-slate-800 bg-slate-900/80 p-4 sm:p-5" : "shrink-0 border-t border-slate-100 bg-white p-4 sm:p-5"}>
            {result ? (
              /*
               * AFTER RESULT:
               * We deliberately don't show an active input.
               * The user must start a new assessment.
               */
              <div className={isDark ? "flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3.5 text-center text-xs font-medium text-slate-300" : "flex items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-3.5 text-center text-xs font-medium text-slate-500"}>
                <Check
                  size={15}
                  className="text-emerald-500"
                />

                Évaluation terminée — cliquez sur
                « Nouvelle évaluation » pour recommencer.
              </div>
            ) : !started ? (
              <div className={isDark ? "flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3.5 text-center text-xs font-medium text-slate-300" : "flex items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-3.5 text-center text-xs font-medium text-slate-500"}>
                <Bot size={15} className="text-blue-500" />
                Cliquez sur « Commencer la conversation » pour démarrer.
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-3"
              >
                <input
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  disabled
                  placeholder={
                    currentQuestion
                      ? "Choisissez votre réponse et cliquez sur Envoyer"
                      : "Décrivez votre problème..."
                  }
                  className={isDark ? "h-12 min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500 focus:bg-slate-900 focus:ring-4 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60" : "h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"}
                />

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !!result ||
                    typingId !== null ||
                    !currentQuestion ||
                    (!input.trim() &&
                      selectedOptions.length === 0)
                  }
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 text-white transition hover:scale-105 hover:from-blue-600 hover:to-sky-400 cursor-pointer active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                  aria-label="Envoyer"
                >
                  {loading ? (
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ======================================================
            RIGHT INFORMATION PANEL
        ======================================================= */}

        <aside className="hidden min-h-0 space-y-4 overflow-y-auto xl:block">
          {/* AI info */}

          <div className="rounded-[28px] bg-gradient-to-br from-sky-600 via-blue-600 to-blue-700 p-6 text-white shadow-xl shadow-sky-200/50">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <BrainCircuit size={23} />
            </div>

            <h3 className="text-lg font-bold">
              Orientation intelligente
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/80">
              DOCTORZ Co. adapte ses questions
              en fonction de vos réponses afin de
              vous orienter vers la spécialité la
              plus pertinente.
            </p>
          </div>

          {/* How it works */}

          <div className={isDark ? "rounded-[28px] border border-slate-800 bg-slate-900/80 p-6 shadow-sm" : "rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm"}>
            <h3 className={isDark ? "mb-5 font-bold text-white" : "mb-5 font-bold text-slate-900"}>
              Comment ça fonctionne ?
            </h3>

            <div className="space-y-5">
              <div className="flex gap-3">
                <div className={isDark ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sm font-bold text-sky-200" : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-bold text-sky-600"}>
                  1
                </div>

                <div>
                  <p className={isDark ? "text-sm font-semibold text-slate-100" : "text-sm font-semibold text-slate-800"}>
                    Répondez aux questions
                  </p>

                  <p className={isDark ? "mt-1 text-xs leading-5 text-slate-400" : "mt-1 text-xs leading-5 text-slate-500"}>
                    L'IA adapte chaque question à
                    votre situation.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className={isDark ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-sm font-bold text-blue-200" : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600"}>
                  2
                </div>

                <div>
                  <p className={isDark ? "text-sm font-semibold text-slate-100" : "text-sm font-semibold text-slate-800"}>
                    Analyse de votre situation
                  </p>

                  <p className={isDark ? "mt-1 text-xs leading-5 text-slate-400" : "mt-1 text-xs leading-5 text-slate-500"}>
                    Vos réponses sont analysées
                    pour déterminer le niveau
                    d'urgence et la spécialité.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className={isDark ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-sm font-bold text-blue-200" : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600"}>
                  3
                </div>

                <div>
                  <p className={isDark ? "text-sm font-semibold text-slate-100" : "text-sm font-semibold text-slate-800"}>
                    Trouvez un médecin
                  </p>

                  <p className={isDark ? "mt-1 text-xs leading-5 text-slate-400" : "mt-1 text-xs leading-5 text-slate-500"}>
                    Nous recherchons les médecins
                    disponibles correspondant à
                    la spécialité recommandée.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}

          <div className={isDark ? "rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-5" : "rounded-[28px] border border-amber-100 bg-amber-50/70 p-5"}>
            <div className="flex gap-3">
              <div className={isDark ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300" : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600"}>
                <ShieldAlert size={18} />
              </div>

              <div>
                <h4 className={isDark ? "text-sm font-bold text-amber-200" : "text-sm font-bold text-amber-800"}>
                  Important
                </h4>

                <p className={isDark ? "mt-1 text-xs leading-5 text-amber-200/80" : "mt-1 text-xs leading-5 text-amber-700"}>
                  Cette fonctionnalité fournit une
                  orientation préliminaire et ne
                  remplace pas un diagnostic médical
                  professionnel.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
