"use client";

import {
  Plus,
  MessageSquare,
  Star,
  Clock3,
  Trash2,
} from "lucide-react";

const todayChats = [
  "Chest pain analysis",
  "Blood test interpretation",
];

const yesterdayChats = [
  "Migraine symptoms",
  "Medication reminder",
  "Nutrition advice",
];

export default function ChatSidebar() {
  return (
    <aside className="flex h-full flex-col rounded-[34px] bg-white p-6 shadow-sm">

      {/* New Chat */}

      <button
        className="
        flex
        items-center
        justify-center
        gap-3
        rounded-2xl
        bg-gradient-to-r
        from-violet-600
        to-indigo-600
        py-4
        font-semibold
        text-white
        shadow-lg
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
        "
      >
        <Plus size={20} />
        New Conversation
      </button>

      {/* Today */}

      <div className="mt-8">

        <div className="mb-4 flex items-center gap-2">

          <Clock3
            size={16}
            className="text-violet-600"
          />

          <h3 className="text-sm font-bold uppercase tracking-[2px] text-slate-500">
            Today
          </h3>

        </div>

        <div className="space-y-2">

          {todayChats.map((chat) => (

            <button
              key={chat}
              className="
              flex
              w-full
              items-center
              gap-3
              rounded-2xl
              px-4
              py-3
              text-left
              transition-all
              duration-300
              hover:bg-violet-50
              hover:text-violet-700
              "
            >
              <MessageSquare size={18} />

              <span className="truncate text-sm font-medium">
                {chat}
              </span>

            </button>

          ))}

        </div>

      </div>

      {/* Yesterday */}

      <div className="mt-8">

        <div className="mb-4 flex items-center gap-2">

          <Clock3
            size={16}
            className="text-slate-400"
          />

          <h3 className="text-sm font-bold uppercase tracking-[2px] text-slate-500">
            Yesterday
          </h3>

        </div>

        <div className="space-y-2">

          {yesterdayChats.map((chat) => (

            <button
              key={chat}
              className="
              flex
              w-full
              items-center
              gap-3
              rounded-2xl
              px-4
              py-3
              text-left
              transition-all
              duration-300
              hover:bg-violet-50
              hover:text-violet-700
              "
            >
              <MessageSquare size={18} />

              <span className="truncate text-sm font-medium">
                {chat}
              </span>

            </button>

          ))}

        </div>

      </div>

      {/* Bottom */}

      <div className="mt-auto space-y-3">

        <button
          className="
          flex
          w-full
          items-center
          gap-3
          rounded-2xl
          bg-violet-50
          px-4
          py-3
          font-medium
          text-violet-700
          transition
          hover:bg-violet-100
          "
        >
          <Star size={18} />
          Saved Conversations
        </button>

        <button
          className="
          flex
          w-full
          items-center
          gap-3
          rounded-2xl
          bg-red-50
          px-4
          py-3
          font-medium
          text-red-600
          transition
          hover:bg-red-100
          "
        >
          <Trash2 size={18} />
          Clear History
        </button>

      </div>

    </aside>
  );
}