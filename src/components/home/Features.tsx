"use client";

import { motion, Variants } from "framer-motion";
import {
  CalendarDays,
  BrainCircuit,
  FileText,
  Pill,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Smart Appointment Booking",
    description:
      "Book appointments with verified doctors in just a few clicks.",
  },
  {
    icon: BrainCircuit,
    title: "AI Medical Assistant",
    description:
      "Receive intelligent guidance powered by artificial intelligence 24/7.",
  },
  {
    icon: FileText,
    title: "Electronic Medical Records",
    description:
      "Access your complete health history securely from anywhere.",
  },
  {
    icon: Pill,
    title: "Digital Prescriptions",
    description:
      "Doctors can send prescriptions instantly to your preferred pharmacy.",
  },
  {
    icon: FlaskConical,
    title: "Laboratory Integration",
    description:
      "View laboratory requests and results directly from your account.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Healthcare",
    description:
      "Your medical data is encrypted and protected with enterprise security.",
  },
];

export default function Features() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 py-24">
      {/* Decorative blobs */}
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-200/20 blur-2xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-100/80 px-4 py-2 text-sm font-semibold text-violet-700 backdrop-blur-sm">
            Platform Features
          </span>
          <h2 className="mt-6 text-4xl font-bold text-slate-900 md:text-5xl lg:text-6xl">
            Everything you need for{" "}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              modern healthcare
            </span>
          </h2>
          <p className="mt-6 text-lg text-slate-600">
            MediConnect AI centralizes appointments, medical records,
            prescriptions, laboratory services and AI assistance in one secure
            platform.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group rounded-3xl border border-slate-200/70 bg-white/50 p-8 shadow-sm backdrop-blur-sm transition-all hover:border-violet-200 hover:bg-white/80 hover:shadow-xl hover:shadow-violet-100/30"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 transition-all group-hover:scale-105">
                  <Icon size={30} className="text-white" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-4 leading-7 text-slate-600">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}