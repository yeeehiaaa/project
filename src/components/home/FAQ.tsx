"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How do I book an appointment?",
    answer:
      "Search for a doctor, choose an available time slot, and confirm your appointment in just a few clicks.",
  },
  {
    question: "Is my medical information secure?",
    answer:
      "Yes. Your data is encrypted and protected using industry-standard security practices.",
  },
  {
    question: "Can I access my prescriptions online?",
    answer:
      "Absolutely. All prescriptions are stored securely in your personal account and can be downloaded anytime.",
  },
  {
    question: "Does DOCTORZ Co. include an AI assistant?",
    answer:
      "Yes. Our AI assistant helps explain symptoms, medications, laboratory results and guides you through your healthcare journey.",
  },
  {
    question: "Can doctors manage their patients online?",
    answer:
      "Yes. Doctors can manage appointments, consultations, prescriptions, laboratory requests and medical records from a unified dashboard.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 py-24">
      {/* Decorative blobs */}
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-100/80 px-4 py-2 text-sm font-semibold text-violet-700 backdrop-blur-sm">
            <HelpCircle size={16} />
            Frequently Asked Questions
          </span>
          <h2 className="mt-6 text-4xl font-bold text-slate-900 lg:text-5xl">
            Got Questions?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Everything you need to know about DOCTORZ Co.
          </p>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="mt-14 space-y-4"
        >
          {faqs.map((faq, index) => {
            const isOpen = open === index;

            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`rounded-2xl border transition-all duration-200 ${
                  isOpen
                    ? "border-violet-200 bg-white/80 shadow-lg shadow-violet-100/50 backdrop-blur-sm"
                    : "border-slate-200/70 bg-white/50 backdrop-blur-sm hover:border-violet-200 hover:shadow-md"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm text-violet-600">
                      {index + 1}
                    </span>
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`shrink-0 text-slate-400 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-violet-600" : ""
                    }`}
                    size={20}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-violet-100/50 px-6 py-5 text-slate-600 leading-7">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}