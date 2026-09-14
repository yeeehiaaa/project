"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Bot } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function CTA() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-600 py-24 text-white">
      {/* Decorative blobs - only render on client to avoid hydration mismatch */}
      {mounted && (
        <>
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-2xl" />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="relative mx-auto max-w-7xl px-6 text-center"
      >
        {/* Badge */}
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur-sm ring-1 ring-white/20"
        >
          <Sparkles size={16} />
          Healthcare powered by AI
        </motion.span>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-8 text-5xl font-extrabold leading-tight lg:text-6xl"
        >
          Your health journey
          <br />
          <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            starts with intelligence
          </span>
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-blue-100"
        >
          Connect with doctors, get AI-powered health insights,
          and manage your medical journey in one intelligent platform.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-10 flex flex-col justify-center gap-5 sm:flex-row"
        >
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 font-semibold text-violet-700 shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:shadow-violet-500/40"
          >
            Get Started
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/ai-assistant"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 font-semibold backdrop-blur-sm transition-all hover:-translate-y-1 hover:scale-105 hover:bg-white/20 hover:shadow-lg"
          >
            <Bot size={20} />
            Explore AI Assistant
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}