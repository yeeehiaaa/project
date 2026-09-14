"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Sparkles,
  Send,
  Mic,
  Stethoscope,
  Pill,
  FlaskConical,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";

type Message = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

const suggestions = [
  {
    title: "Analyze my symptoms",
    description: "Tell me what you're experiencing",
    icon: Stethoscope,
  },
  {
    title: "Explain my prescription",
    description: "Understand your medications",
    icon: Pill,
  },
  {
    title: "Review my lab results",
    description: "Get help understanding results",
    icon: FlaskConical,
  },
  {
    title: "Lifestyle recommendations",
    description: "Improve your daily health",
    icon: HeartPulse,
  },
];

export default function AIAssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello! I'm MediConnect AI 👋 I'm here to help you better understand your health. You can tell me about your symptoms, medications, lab results, or ask me any health-related question.",
    },
  ]);

  const handleSend = async () => {
  const message = input.trim();

  if (!message) return;

  const userMessage: Message = {
    id: Date.now(),
    role: "user",
    content: message,
  };

  setMessages((current) => [...current, userMessage]);
  setInput("");

  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Unable to contact the AI.");
    }

    setMessages((current) => [
      ...current,
      {
        id: Date.now() + 1,
        role: "assistant",
        content: data.message,
      },
    ]);
  } catch (error) {
    console.error("AI Assistant error:", error);

    setMessages((current) => [
      ...current,
      {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "I'm sorry, I couldn't process your request right now. Please try again in a moment.",
      },
    ]);
  }
};

  const handleSuggestion = (title: string) => {
    setInput(title);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      {/* ============================================================
          HEADER
      ============================================================ */}

      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200">
            <BrainCircuit className="h-7 w-7 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                AI Assistant
              </h1>

              <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                <Sparkles className="h-3 w-3" />
                AI Powered
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Your intelligent healthcare companion
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================
          MAIN CONTENT
      ============================================================ */}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        {/* ========================================================
            CHAT
        ======================================================== */}

        <div className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm">
          {/* Chat header */}

          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                  <BrainCircuit className="h-5 w-5 text-violet-600" />
                </div>

                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  MediConnect AI
                </p>

                <p className="text-xs text-emerald-600">
                  Online · Ready to help
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`flex max-w-[78%] items-end gap-3 ${
                      isAssistant ? "flex-row" : "flex-row-reverse"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isAssistant
                          ? "bg-gradient-to-br from-violet-600 to-indigo-600"
                          : "bg-slate-100"
                      }`}
                    >
                      {isAssistant ? (
                        <BrainCircuit className="h-4 w-4 text-white" />
                      ) : (
                        <span className="text-xs font-bold text-slate-600">
                          You
                        </span>
                      )}
                    </div>

                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                        isAssistant
                          ? "rounded-bl-md bg-slate-50 text-slate-700"
                          : "rounded-br-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Input */}

          <div className="shrink-0 border-t border-slate-100 p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition-all focus-within:border-violet-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-50">
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-violet-600"
                aria-label="Voice input"
              >
                <Mic className="h-5 w-5" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
                placeholder="Describe your symptoms or ask a health question..."
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />

              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200 transition disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </motion.button>
            </div>

            <p className="mt-2 text-center text-[11px] text-slate-400">
              Press Enter to send
            </p>
          </div>
        </div>

        {/* ========================================================
            RIGHT SIDEBAR
        ======================================================== */}

        <div className="flex min-h-0 flex-col gap-5">
          {/* Quick actions */}

          <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Quick actions
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Start with a common request
              </p>
            </div>

            <div className="space-y-2">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon;

                return (
                  <button
                    key={suggestion.title}
                    type="button"
                    onClick={() => handleSuggestion(suggestion.title)}
                    className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-violet-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 transition group-hover:bg-violet-200">
                      <Icon className="h-5 w-5 text-violet-600" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800">
                        {suggestion.title}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-slate-400">
                        {suggestion.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Safety notice */}

          <div className="rounded-[24px] border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
              <ShieldCheck className="h-5 w-5 text-violet-600" />
            </div>

            <h3 className="text-sm font-bold text-slate-900">
              Your health matters
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              MediConnect AI provides general health information and
              guidance. It does not replace a qualified healthcare
              professional.
            </p>

            <div className="mt-4 rounded-xl bg-white/70 p-3">
              <p className="text-[11px] font-medium leading-5 text-violet-700">
                If you are experiencing a medical emergency, contact
                emergency services immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}