"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { Stethoscope, Users, Star, Bot, ArrowRight, ShieldCheck, Sparkles, HeartPulse } from "lucide-react";

export default function Hero() {
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const floatingCardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (custom) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: 0.4 + custom * 0.2, duration: 0.5, type: "spring" },
    }),
  };

  return (
    <>
      {/* ======================================================
          HERO
      ====================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 pt-36 pb-24">
        {/* Decorative blobs */}
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/10 blur-2xl" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 lg:flex-row"
        >
          {/* Left Content */}
          <div className="flex-1 space-y-8">
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full bg-violet-100/80 px-4 py-2 text-sm font-semibold text-violet-700 backdrop-blur-sm"
            >
              <Sparkles size={16} />
              AI-Powered Healthcare Platform
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="text-5xl font-extrabold leading-tight text-slate-900 lg:text-7xl"
            >
              Healthcare
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Made Smarter
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="max-w-xl text-lg leading-8 text-slate-600"
            >
              Find doctors, book appointments, access your medical records,
              receive AI assistance and manage your health from one secure
              platform.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap gap-5"
            >
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-300"
              >
                Get Started
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/doctors"
                className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-8 py-4 font-semibold text-violet-700 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-violet-300 hover:bg-violet-50 hover:shadow-md"
              >
                <Stethoscope size={18} />
                Find a Doctor
              </Link>
            </motion.div>

            {/* Trust badge */}
            <motion.div
              variants={fadeUp}
              className="flex items-center gap-3 text-sm text-slate-500"
            >
              <ShieldCheck size={18} className="text-violet-500" />
              <span>Secure & HIPAA compliant</span>
              <span className="h-4 w-px bg-slate-300" />
              <span>⭐ 4.9/5 from 2k+ reviews</span>
            </motion.div>
          </div>

          {/* Right Illustration */}
          <motion.div
            variants={fadeUp}
            className="relative flex flex-1 justify-center"
          >
            {/* Glow behind illustration */}
            <div className="absolute h-[450px] w-[450px] rounded-full bg-violet-300/30 blur-3xl" />

            {/* Floating card: top-left */}
            <motion.div
              custom={0}
              variants={floatingCardVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              className="absolute left-0 top-10 z-20 rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur-sm ring-1 ring-violet-100/50"
            >
              <p className="text-sm text-slate-500">Available Doctors</p>
              <div className="mt-1 flex items-center gap-2">
                <Stethoscope size={20} className="text-violet-600" />
                <h3 className="text-2xl font-bold text-violet-600">250+</h3>
              </div>
            </motion.div>

            {/* Floating card: bottom-right */}
            <motion.div
              custom={1}
              variants={floatingCardVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              className="absolute bottom-10 right-0 z-20 rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur-sm ring-1 ring-emerald-100/50"
            >
              <p className="text-sm text-slate-500">Patients Served</p>
              <div className="mt-1 flex items-center gap-2">
                <Users size={20} className="text-emerald-600" />
                <h3 className="text-2xl font-bold text-emerald-600">120K+</h3>
              </div>
            </motion.div>

            {/* Floating card: AI badge */}
            <motion.div
              custom={2}
              variants={floatingCardVariants}
              whileHover={{ y: -4 }}
              className="absolute -bottom-4 left-8 z-20 rounded-2xl bg-indigo-50/90 p-3 shadow-lg backdrop-blur-sm ring-1 ring-indigo-100/50"
            >
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">AI Assistant 24/7</span>
              </div>
            </motion.div>

            {/* Main illustration: a large medical-themed card with icons */}
            <div className="relative z-10 flex w-[520px] max-w-full flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-violet-50 to-indigo-50 p-8 shadow-2xl ring-1 ring-white/20 backdrop-blur-sm">
              <div className="flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/30">
                <HeartPulse size={80} className="text-white" />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-2xl font-bold text-slate-900">Smart Healthcare</h3>
                <p className="mt-2 text-slate-600">AI-powered platform for your well-being</p>
              </div>
              <div className="mt-4 flex gap-6">
                <div className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm">
                  <Stethoscope size={18} className="text-violet-600" />
                  <span className="text-sm font-medium text-slate-700">250+ Doctors</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm">
                  <Users size={18} className="text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">120K+ Patients</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ======================================================
          STATS – glassmorphism style
      ====================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-white/50 py-16 backdrop-blur-sm"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 md:grid-cols-4">
          {[
            { number: "250+", label: "Doctors", icon: Stethoscope, color: "violet" },
            { number: "120K+", label: "Patients", icon: Users, color: "emerald" },
            { number: "98%", label: "Satisfaction", icon: Star, color: "amber" },
            { number: "24/7", label: "AI Assistant", icon: Bot, color: "indigo" },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            const colorClasses = {
              violet: "from-violet-50 to-violet-100/60 border-violet-200 text-violet-600",
              emerald: "from-emerald-50 to-emerald-100/60 border-emerald-200 text-emerald-600",
              amber: "from-amber-50 to-amber-100/60 border-amber-200 text-amber-600",
              indigo: "from-indigo-50 to-indigo-100/60 border-indigo-200 text-indigo-600",
            };
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`rounded-2xl border bg-gradient-to-br p-6 text-center shadow-sm transition-all hover:shadow-md ${colorClasses[stat.color as keyof typeof colorClasses]}`}
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/60 shadow-sm">
                  <Icon size={22} />
                </div>
                <h3 className="mt-3 text-4xl font-bold text-slate-900">{stat.number}</h3>
                <p className="mt-1 text-sm font-medium text-slate-600">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </>
  );
}