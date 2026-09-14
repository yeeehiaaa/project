"use client";

import { useState } from "react";
import {
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  Clock3,
  Home,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Video,
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
};

const initialAssistantMessage =
  "Bonjour ! Je suis MediConnect AI 👋\n\nJe vais vous poser quelques questions pour mieux comprendre votre situation et vous orienter vers la spécialité médicale la plus adaptée.\n\nCommençons : quel est le type principal de votre problème ?";

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: initialAssistantMessage,
    },
  ]);

  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestion, setCurrentQuestion] =
    useState<QuestionData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  /*
   * ============================================================
   * ADD MESSAGE
   * ============================================================
   */

  const addMessage = (
    role: "user" | "assistant",
    content: string,
  ) => {
    setMessages((previous) => [
      ...previous,
      {
        id: Date.now() + Math.random(),
        role,
        content,
      },
    ]);
  };

  /*
   * ============================================================
   * SEND MESSAGE TO AI
   * ============================================================
   */

 const handleSend = async (customMessage?: string) => {
  // L'évaluation est déjà terminée
  if (result) {
    return;
  }

  const text = (customMessage ?? input).trim();

  if (!text || loading) {
    return;
  }

  setInput("");
  setLoading(true);

  addMessage("user", text);

  // Timeout de sécurité : 45 secondes
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 45000);

  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: text,
        answers,
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

      setCurrentQuestion(questionData);
      setSelectedOptions([]);

      addMessage(
        "assistant",
        questionData.question,
      );

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

      addMessage(
        "assistant",
        finalResult.summary,
      );

      setLoading(false);
      return;
    }

    throw new Error(
      "Réponse inattendue du serveur.",
    );
  } catch (error) {
    clearTimeout(timeoutId);

    console.error(
      "AI assistant error:",
      error,
    );

    let errorMessage =
      "Une erreur est survenue. Veuillez réessayer.";

    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      errorMessage =
        "L'analyse prend trop de temps. Le service IA ne répond pas actuellement. Veuillez réessayer.";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    addMessage(
      "assistant",
      errorMessage,
    );

    setLoading(false);
  }
};

  /*
   * ============================================================
   * SELECT OPTION
   * ============================================================
   */

  const handleOptionClick = (option: string) => {
    /*
     * No interaction after final result.
     */
    if (result || loading || !currentQuestion) {
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
     * SINGLE CHOICE
     *
     * Automatically submit the answer.
     */
    submitAnswer([option]);
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
     * Send directly to API with the updated history.
     */
    const answerText = selected.join(", ");

    setLoading(true);

    addMessage("user", answerText);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: answerText,
          answers: updatedAnswers,
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

        setCurrentQuestion(questionData);

        addMessage(
          "assistant",
          questionData.question,
        );

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
         * Display summary in conversation.
         */
        addMessage(
          "assistant",
          finalResult.summary,
        );

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

  const handleNewAssessment = () => {
    /*
     * Reset everything.
     */
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content:
          initialAssistantMessage,
      },
    ]);

    setInput("");
    setAnswers([]);
    setCurrentQuestion(null);
    setResult(null);
    setSelectedOptions([]);
    setLoading(false);
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
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200">
              <BrainCircuit
                size={21}
                strokeWidth={2.2}
              />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900">
                MediConnect AI
              </h1>

              <p className="text-xs font-medium text-slate-500">
                Assistant médical intelligent
              </p>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-2 text-xs font-semibold text-violet-600 shadow-sm sm:flex">
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

        <div className="flex min-h-0 flex-col overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-xl shadow-slate-200/40">
          {/* Chat header */}

          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                  <Bot size={21} />
                </div>

                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Assistant médical
                </h2>

                <p className="text-xs text-slate-500">
                  {result
                    ? "Évaluation terminée"
                    : loading
                      ? "Analyse en cours..."
                      : "En ligne"}
                </p>
              </div>
            </div>

            {result && (
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <Check size={14} />
                Terminé
              </div>
            )}
          </div>

          {/* Messages */}

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-gradient-to-b from-slate-50/70 via-white to-violet-50/30 p-5 sm:p-7">
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
                  className={`max-w-[85%] ${
                    message.role === "user"
                      ? "rounded-3xl rounded-br-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200"
                      : "rounded-3xl rounded-bl-md border border-slate-100 bg-white text-slate-700 shadow-sm"
                  } px-5 py-4`}
                >
                  {message.role ===
                    "assistant" && (
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-violet-600">
                      <Bot size={14} />
                      MediConnect AI
                    </div>
                  )}

                  <p className="whitespace-pre-line text-sm leading-6">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading */}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-3xl rounded-bl-md border border-slate-100 bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2
                      size={16}
                      className="animate-spin text-violet-600"
                    />
                    <span>
                      MediConnect AI est en train
                      d'analyser...
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
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <MessageCircle
                      size={14}
                      className="text-violet-500"
                    />

                    {currentQuestion.multiple
                      ? "Plusieurs réponses possibles"
                      : "Choisissez une réponse"}
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
                            className={`group flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all ${
                              isSelected
                                ? "border-violet-400 bg-violet-50 text-violet-700 shadow-sm"
                                : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/60 hover:text-violet-700"
                            }`}
                          >
                            <span>
                              {option}
                            </span>

                            {currentQuestion.multiple ? (
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                  isSelected
                                    ? "border-violet-600 bg-violet-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && (
                                  <Check
                                    size={13}
                                  />
                                )}
                              </span>
                            ) : (
                              <ChevronRight
                                size={17}
                                className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500"
                              />
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>

                  {/* Multiple choice submit */}

                  {currentQuestion.multiple && (
                    <button
                      type="button"
                      disabled={
                        selectedOptions.length ===
                        0
                      }
                      onClick={() =>
                        submitAnswer(
                          selectedOptions,
                        )
                      }
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Continuer
                      <ChevronRight
                        size={17}
                      />
                    </button>
                  )}
                </div>
              )}

            {/* =================================================
                FINAL RESULT
            ================================================== */}

            {result && (
              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                {/* Result header */}

                <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-indigo-50 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
                      <Stethoscope size={22} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                        Health assessment
                      </p>

                      <h3 className="text-lg font-bold text-slate-900">
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
                    <h4 className="mb-2 text-sm font-bold text-slate-900">
                      Résumé
                    </h4>

                    <p className="text-sm leading-6 text-slate-600">
                      {result.summary}
                    </p>
                  </div>

                  {/* Specialties */}

                  {result.specialties.length >
                    0 && (
                    <div>
                      <h4 className="mb-3 text-sm font-bold text-slate-900">
                        Spécialité recommandée
                      </h4>

                      <div className="flex flex-wrap gap-2">
                        {result.specialties.map(
                          (specialty) => (
                            <span
                              key={specialty}
                              className="rounded-full bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700"
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
                      <h4 className="text-sm font-bold text-slate-900">
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
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                        <Stethoscope
                          size={24}
                          className="mx-auto mb-2 text-slate-400"
                        />

                        <p className="text-sm font-medium text-slate-600">
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
                              className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-violet-200 hover:bg-violet-50/30"
                            >
                              <div className="flex gap-4">
                                {/* Avatar */}

                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 font-bold text-violet-700">
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
                                  <h5 className="font-bold text-slate-900">
                                    Dr.{" "}
                                    {
                                      doctor.firstName
                                    }{" "}
                                    {
                                      doctor.lastName
                                    }
                                  </h5>

                                  <p className="mt-0.5 text-xs text-violet-600">
                                    {doctor.specialties.join(
                                      " • ",
                                    )}
                                  </p>

                                  {(doctor.city ||
                                    doctor.wilaya) && (
                                    <p className="mt-1 text-xs text-slate-500">
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
                                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-600">
                                        ★{" "}
                                        {doctor.averageRating.toFixed(
                                          1,
                                        )}
                                      </span>
                                    )}

                                    {doctor.yearsExperience !==
                                      null && (
                                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                        {
                                          doctor.yearsExperience
                                        }{" "}
                                        ans
                                        d'expérience
                                      </span>
                                    )}

                                    {doctor.acceptsOnline && (
                                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                        <Video
                                          size={11}
                                        />
                                        En ligne
                                      </span>
                                    )}

                                    {doctor.acceptsHomeVisit && (
                                      <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
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

                  <div className="border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      onClick={
                        handleNewAssessment
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:scale-[1.01] hover:shadow-xl"
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
          </div>

          {/* ======================================================
              INPUT
          ======================================================= */}

          <div className="shrink-0 border-t border-slate-100 bg-white p-4 sm:p-5">
            {result ? (
              /*
               * AFTER RESULT:
               * We deliberately don't show an active input.
               * The user must start a new assessment.
               */
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-3.5 text-center text-xs font-medium text-slate-500">
                <Check
                  size={15}
                  className="text-emerald-500"
                />

                Évaluation terminée — cliquez sur
                « Nouvelle évaluation » pour recommencer.
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
                  disabled={loading || !!result}
                  placeholder={
                    currentQuestion
                      ? "Ou écrivez votre réponse..."
                      : "Décrivez votre problème..."
                  }
                  className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !!result ||
                    !input.trim()
                  }
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
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

          <div className="rounded-[28px] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-6 text-white shadow-xl shadow-violet-200/50">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <BrainCircuit size={23} />
            </div>

            <h3 className="text-lg font-bold">
              Orientation intelligente
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/80">
              MediConnect AI adapte ses questions
              en fonction de vos réponses afin de
              vous orienter vers la spécialité la
              plus pertinente.
            </p>
          </div>

          {/* How it works */}

          <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-5 font-bold text-slate-900">
              Comment ça fonctionne ?
            </h3>

            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-sm font-bold text-violet-600">
                  1
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Répondez aux questions
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    L'IA adapte chaque question à
                    votre situation.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
                  2
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Analyse de votre situation
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Vos réponses sont analysées
                    pour déterminer le niveau
                    d'urgence et la spécialité.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                  3
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Trouvez un médecin
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Nous recherchons les médecins
                    disponibles correspondant à
                    la spécialité recommandée.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}

          <div className="rounded-[28px] border border-amber-100 bg-amber-50/70 p-5">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <ShieldAlert size={18} />
              </div>

              <div>
                <h4 className="text-sm font-bold text-amber-800">
                  Important
                </h4>

                <p className="mt-1 text-xs leading-5 text-amber-700">
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