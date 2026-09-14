"use client";

import {
  Bell,
  Search,
  MessageCircle,
  CalendarDays,
} from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between bg-white/70
backdrop-blur-xl
rounded-3xl
shadow-lg px-8">

      {/* Left */}
      <div>

        <h1 className="text-2xl font-bold text-gray-900">
          Patient Dashboard
        </h1>

        <p className="text-sm text-gray-500">
          Welcome back 👋 Stay healthy today.
        </p>

      </div>

      {/* Right */}

      <div className="flex items-center gap-4">

        {/* Search */}

        <div className="flex w-80 items-center gap-3 rounded-xl border bg-gray-50 px-4 py-3">

          <Search size={18} className="text-gray-400" />

          <input
            placeholder="Search..."
            className="w-full bg-transparent outline-none"
          />

        </div>

        {/* Calendar */}

        <button className="rounded-xl border p-3 transition hover:bg-gray-50">
          <CalendarDays size={20} />
        </button>

        {/* Messages */}

        <button className="relative rounded-xl border p-3 transition hover:bg-gray-50">

          <MessageCircle size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-500"></span>

        </button>

        {/* Notifications */}

        <button className="relative rounded-xl border p-3 transition hover:bg-gray-50">

          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>

        </button>

        {/* Avatar */}

        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white">
            Y
          </div>

          <div>

            <h3 className="font-semibold">
              Yahia
            </h3>

            <p className="text-sm text-gray-500">
              Patient
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}