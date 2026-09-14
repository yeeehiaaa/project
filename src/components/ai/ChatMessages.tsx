"use client";

import { motion } from "framer-motion";
import {
  Bot,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

import TypingIndicator from "./TypingIndicator";
import { useChat } from "@/context/ChatContext";

export default function ChatMessages() {
    const { messages, isTyping } = useChat();

  return (
    <div className="space-y-8">
      {messages.map((message) =>
        message.sender === "user" ? (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-end"
          >
            <div className="flex max-w-[75%] items-end gap-4">
              <div className="rounded-[24px] bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-4 text-white shadow-lg">
                <p className="leading-7">{message.text}</p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md">
                <User size={18} />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md">
              <Bot size={20} />
            </div>

            <div className="max-w-[80%]">
              <div className="rounded-[24px] bg-slate-50 px-6 py-5 shadow-sm">
                <p className="leading-7 text-slate-700">
                  {message.text}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-violet-600">
                  <Copy size={16} />
                </button>

                <button className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-green-600">
                  <ThumbsUp size={16} />
                </button>

                <button className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-red-600">
                  <ThumbsDown size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )
      )}

      {/* AI Typing */}
{isTyping && <TypingIndicator />}
    </div>
  );
}