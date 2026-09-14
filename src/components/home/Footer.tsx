"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { BrainCircuit, Mail, Phone, MapPin, Sparkles } from "lucide-react";

export default function Footer() {
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: "easeOut" } 
    }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 py-16 text-gray-300">
      {/* Decorative gradient blobs */}
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/5 blur-2xl" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="relative mx-auto max-w-7xl px-6"
      >
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
                <Sparkles size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white">MediConnect AI</h3>
            </div>
            <p className="mt-6 leading-7 text-slate-400">
              Intelligent healthcare solutions connecting patients, doctors and
              artificial intelligence.
            </p>
            <div className="mt-6 flex gap-3">
              {["Twitter", "LinkedIn", "YouTube"].map((social) => (
                <span
                  key={social}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-violet-500/20 hover:text-violet-300"
                >
                  {social.charAt(0)}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Platform */}
          <motion.div variants={fadeUp}>
            <h4 className="mb-5 font-bold text-white">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/ai-assistant"
                  className="transition hover:text-violet-300 hover:underline underline-offset-2"
                >
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link
                  href="/doctors"
                  className="transition hover:text-violet-300 hover:underline underline-offset-2"
                >
                  Doctors
                </Link>
              </li>
              <li>
                <Link
                  href="/telemedicine"
                  className="transition hover:text-violet-300 hover:underline underline-offset-2"
                >
                  Telemedicine
                </Link>
              </li>
              <li>
                <Link
                  href="/health-tracking"
                  className="transition hover:text-violet-300 hover:underline underline-offset-2"
                >
                  Health Tracking
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div variants={fadeUp}>
            <h4 className="mb-5 font-bold text-white">Company</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/about"
                  className="transition hover:text-violet-300 hover:underline underline-offset-2"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="transition hover:text-violet-300 hover:underline underline-offset-2"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition hover:text-violet-300 hover:underline underline-offset-2"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition hover:text-violet-300 hover:underline underline-offset-2"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={fadeUp}>
            <h4 className="mb-5 font-bold text-white">Contact</h4>
            <div className="space-y-4 text-sm">
              <p className="flex items-center gap-3 transition hover:text-violet-300">
                <Mail size={18} className="text-violet-400" />
                <a href="mailto:contact@mediconnect.ai">contact@mediconnect.ai</a>
              </p>
              <p className="flex items-center gap-3 transition hover:text-violet-300">
                <Phone size={18} className="text-violet-400" />
                <a href="tel:+213XX">+213 XX XX XX XX</a>
              </p>
              <p className="flex items-center gap-3 transition hover:text-violet-300">
                <MapPin size={18} className="text-violet-400" />
                <span>Algeria</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          variants={fadeUp}
          className="mt-14 border-t border-white/10 pt-8 text-center text-sm text-slate-500"
        >
          <p>
            © {new Date().getFullYear()} MediConnect AI. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </footer>
  );
}