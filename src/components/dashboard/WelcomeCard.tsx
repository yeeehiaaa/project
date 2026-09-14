"use client";

import { Sparkles } from "lucide-react";

export default function WelcomeCard() {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-8 text-white shadow-xl">
      {/* Background decoration */}
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-16 left-1/2 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
        <div>
          <div className="mb-4 flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur">
            <Sparkles size={16} />
            <span className="text-sm font-medium">
              AI Health Assistant Active
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-tight">
            Good Morning,
            <br />
            Yahia 👋
          </h1>

          <p className="mt-4 max-w-xl text-violet-100">
            Your health indicators are stable today. Keep following your
            treatment and don't forget your next appointment.
          </p>
        </div>

        <div className="rounded-3xl bg-white/10 p-6 backdrop-blur-md">
          <p className="text-sm text-violet-100">
            Today's Health Score
          </p>

          <h2 className="mt-2 text-5xl font-bold">
            96%
          </h2>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-[96%] rounded-full bg-white" />
          </div>

          <p className="mt-3 text-sm text-violet-100">
            Excellent condition
          </p>
        </div>
      </div>
    </section>
  );
}