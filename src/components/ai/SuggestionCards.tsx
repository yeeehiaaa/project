"use client";

import {
  Brain,
  FileText,
  Stethoscope,
  HeartPulse,
  ArrowRight,
} from "lucide-react";

import { useChat } from "@/context/ChatContext";

const suggestions = [
  {
    title: "Analyze my symptoms",
    description: "Describe your symptoms and receive AI-powered insights.",
    icon: Stethoscope,
    gradient: "from-violet-600 to-indigo-600",
  },
  {
    title: "Explain my prescription",
    description: "Understand medications, dosage and possible side effects.",
    icon: FileText,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Review my lab results",
    description: "Upload blood tests or medical reports for interpretation.",
    icon: Brain,
    gradient: "from-emerald-500 to-green-500",
  },
  {
    title: "Lifestyle recommendations",
    description: "Receive personalized health and wellness advice.",
    icon: HeartPulse,
    gradient: "from-pink-500 to-rose-500",
  },
];

export default function SuggestionCards() {
    const { sendMessage } = useChat();
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          How can I help you today?
        </h2>

        <p className="mt-2 text-slate-500">
          Choose one of the suggestions below or ask your own medical question.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {suggestions.map((item) => {
          const Icon = item.icon;

          return (
            <button
  key={item.title}
  onClick={() => sendMessage(item.title)}
  className="
    group
    rounded-[28px]
    border
    border-slate-100
    bg-white
    p-6
    text-left
    shadow-sm
    transition-all
    duration-300
    hover:-translate-y-1
    hover:border-violet-200
    hover:shadow-xl
  "
>
              <div
                className={`
                  mb-5
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-gradient-to-br
                  ${item.gradient}
                  shadow-lg
                `}
              >
                <Icon
                  size={26}
                  className="text-white"
                />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {item.description}
              </p>

              <div className="mt-6 flex items-center gap-2 font-semibold text-violet-600">
                <span>Start Conversation</span>

                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}