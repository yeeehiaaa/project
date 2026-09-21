"use client";

import { motion, Variants } from "framer-motion";
import { BrainCircuit, Sparkles, ArrowRight, Bot, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AISection() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const chatVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.3 } },
  };

  const messageVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: 0.4 + i * 0.15, duration: 0.4 },
    }),
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-700 py-24 text-white">
      {/* Decorative blobs */}
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-2xl" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="relative mx-auto flex max-w-7xl flex-col items-center gap-20 px-6 lg:flex-row"
      >
        {/* Left Content */}
        <motion.div variants={itemVariants} className="flex-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur-sm ring-1 ring-white/10">
            <Sparkles size={16} />
            Powered by Artificial Intelligence
          </span>
          <h2 className="mt-8 text-5xl font-extrabold leading-tight lg:text-6xl">
            Meet your
            <br />
            <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              AI Healthcare Assistant
            </span>
          </h2>
          <p className="mt-8 max-w-xl text-lg leading-8 text-blue-100">
            Ask medical questions, receive personalized recommendations,
            understand prescriptions and laboratory results, and navigate your
            healthcare journey with confidence.
          </p>
          <ul className="mt-10 space-y-3 text-lg">
            {[
              "Symptom Guidance",
              "Medication Information",
              "Lab Result Explanation",
              "Appointment Recommendations",
              "Health Tips & Prevention",
            ].map((item, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.08 }}
                viewport={{ once: true }}
                className="flex items-center gap-3"
              >
                <CheckCircle size={20} className="text-violet-300" />
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
          <Link
            href="/ai-assistant"
            className="group mt-10 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-semibold text-violet-700 shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-1 hover:scale-105 hover:shadow-xl hover:shadow-violet-500/40"
          >
            Try AI Assistant
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Right Chat Card */}
        <motion.div
          variants={chatVariants}
          className="flex flex-1 justify-center"
        >
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            {/* Chat Header */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
                <Bot size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">DOCTORZ Co.</h3>
                <p className="flex items-center gap-1.5 text-sm text-green-300">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                  Online
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="space-y-4">
              {[
                {
                  text: "Hello 👋\nHow can I help you today?",
                  from: "bot",
                },
                {
                  text: "I've had a headache for two days.",
                  from: "user",
                },
                {
                  text: "Based on your symptoms, I recommend consulting a physician if the pain persists or worsens. Would you like me to help you book an appointment?",
                  from: "bot",
                },
              ].map((message, index) => (
                <motion.div
                  key={index}
                  custom={index}
                  variants={messageVariants}
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    message.from === "user"
                      ? "ml-auto bg-white text-slate-800 shadow-md"
                      : "bg-white/20 text-white"
                  }`}
                >
                  {message.text.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < message.text.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </motion.div>
              ))}
            </div>

            {/* Input Placeholder */}
            <div className="mt-8 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white/50 backdrop-blur-sm">
              Ask anything...
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}