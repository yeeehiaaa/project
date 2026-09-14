"use client";

import { useState } from "react";
import { SendHorizonal } from "lucide-react";
import { useChat } from "@/context/ChatContext";

export default function ChatInput() {
  const [text, setText] = useState("");

  const { sendMessage } = useChat();

  function handleSend() {
    if (!text.trim()) return;

    sendMessage(text);

    setText("");
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      handleSend();
    }
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder="Ask MediConnect AI anything about your health..."
        className="
          w-full
          resize-none
          bg-transparent
          text-slate-700
          placeholder:text-slate-400
          outline-none
        "
      />

      <div className="mt-4 flex items-center justify-between">

        <p className="text-xs text-slate-400">
          Press Enter to send • Shift + Enter for a new line
        </p>

        <button
          onClick={handleSend}
          className="
            flex
            items-center
            gap-2
            rounded-xl
            bg-gradient-to-r
            from-violet-600
            to-indigo-600
            px-5
            py-3
            font-medium
            text-white
            shadow-lg
            transition
            hover:scale-105
          "
        >
          <SendHorizonal size={18} />
          Send
        </button>

      </div>

    </div>
  );
}