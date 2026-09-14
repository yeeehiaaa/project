"use client";

import { Bot } from "lucide-react";
import { motion } from "framer-motion";

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-4">

      {/* AI Avatar */}

      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
        <Bot size={22} />
      </div>

      {/* Bubble */}

      <div className="rounded-[26px] bg-slate-100 px-6 py-5 shadow-sm">

        <div className="flex items-center gap-2">

          {[0, 1, 2].map((dot) => (
            <motion.div
              key={dot}
              className="h-3 w-3 rounded-full bg-violet-500"
              animate={{
                y: [0, -6, 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: dot * 0.2,
              }}
            />
          ))}

        </div>

        <p className="mt-3 text-sm text-slate-500">
          MediConnect AI is thinking...
        </p>

      </div>

    </div>
  );
}