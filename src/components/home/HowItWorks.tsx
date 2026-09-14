"use client";

import { motion, Variants } from "framer-motion";
import { UserPlus, Search, CalendarCheck2, HeartPulse } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Create your account",
    description:
      "Register securely as a patient, doctor, pharmacist or healthcare provider.",
  },
  {
    icon: Search,
    number: "02",
    title: "Find the right doctor",
    description: "Search by specialty, location, ratings and availability.",
  },
  {
    icon: CalendarCheck2,
    number: "03",
    title: "Book instantly",
    description:
      "Choose an available time slot and receive instant confirmation.",
  },
  {
    icon: HeartPulse,
    number: "04",
    title: "Receive healthcare",
    description:
      "Consult your doctor, access prescriptions, lab results and AI assistance.",
  },
];

export default function HowItWorks() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
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
            Simple Process
          </span>
          <h2 className="mt-6 text-4xl font-bold text-slate-900 md:text-5xl lg:text-6xl">
            Healthcare in{" "}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              04 steps
            </span>
          </h2>
          <p className="mt-6 text-lg text-slate-600">
            MediConnect AI simplifies the entire healthcare journey,
            from registration to treatment.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="relative mt-20"
        >
          {/* Vertical timeline line - hidden on mobile */}
          <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-violet-300 via-indigo-300 to-blue-300 lg:block" />

          <div className="space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isOdd = index % 2 === 1;

              return (
                <div
                  key={step.number}
                  className={`flex flex-col items-center gap-10 lg:flex-row ${
                    isOdd ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Card */}
                  <motion.div
                    variants={cardVariants}
                    whileHover={{ y: -6, scale: 1.01 }}
                    className="flex-1 w-full lg:w-auto"
                  >
                    <div className="rounded-3xl border border-slate-200/70 bg-white/50 p-8 shadow-sm backdrop-blur-sm transition-all hover:border-violet-200 hover:bg-white/80 hover:shadow-xl hover:shadow-violet-100/30">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
                        <Icon className="text-white" size={30} />
                      </div>
                      <p className="mt-6 text-sm font-bold tracking-widest text-violet-500">
                        STEP {step.number}
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-slate-900">
                        {step.title}
                      </h3>
                      <p className="mt-4 leading-7 text-slate-600">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>

                  {/* Timeline dot - visible only on large screens */}
                  <div className="hidden lg:block">
                    <div className="relative flex h-8 w-8 items-center justify-center">
                      <div className="absolute h-full w-full animate-ping rounded-full bg-violet-400 opacity-40" />
                      <div className="relative h-6 w-6 rounded-full bg-violet-600 ring-4 ring-white shadow-lg" />
                      <span className="sr-only">Step {step.number}</span>
                    </div>
                  </div>

                  {/* Empty spacer for alternate layout */}
                  <div className="hidden flex-1 lg:block" />
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}