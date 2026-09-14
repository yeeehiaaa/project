"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import ChatSidebar from "./ChatSidebar";
import SuggestionCards from "./SuggestionCards";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { useChat } from "@/context/ChatContext";

export default function AIPageContent() {
  const { messages } = useChat();

  return (
    <div className="grid min-h-[calc(100vh-180px)] grid-cols-[320px_1fr] gap-8">

      {/* Left Sidebar */}

      <ChatSidebar />

      {/* Chat Area */}

<div className="flex min-h-0 flex-col rounded-[34px] bg-white shadow-sm">

        {/* Header */}

        <div className="border-b border-slate-100 p-8">

          <div className="flex items-center gap-4">

            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg">

              <Sparkles
                size={30}
                className="text-white"
              />

            </div>

            <div>

              <h1 className="text-3xl font-bold text-slate-900">
                MediConnect AI
              </h1>

              <p className="mt-1 text-slate-500">
                Your intelligent healthcare assistant
              </p>

            </div>

          </div>

        </div>

        {/* Welcome */}

        {messages.length <= 1 && (
  <div className="border-b border-slate-100 p-8">
    <SuggestionCards />
  </div>
)}

        {/* Conversation */}

<div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">

          <ChatMessages />

        </div>

        {/* Input */}

        <div className="border-t border-slate-100 p-6">

          <ChatInput />

        </div>

      </div>

</div>
  );
}