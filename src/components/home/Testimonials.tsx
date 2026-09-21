"use client";

import { motion, Variants } from "framer-motion";
import { Star } from "lucide-react";
import { useState, useEffect } from "react";

const testimonials = [
  {
    name: "Ahmed Benali",
    role: "Patient",
    image: "https://i.pravatar.cc/150?img=12",
    text: "DOCTORZ Co. made booking appointments incredibly simple. The AI assistant answered my questions instantly.",
    rating: 5,
  },
  {
    name: "Dr. Sarah Kaci",
    role: "Cardiologist",
    image: "https://i.pravatar.cc/150?img=32",
    text: "Managing patients, prescriptions and consultations from one platform has completely changed my workflow.",
    rating: 5,
  },
  {
    name: "Yasmine B.",
    role: "Patient",
    image: "https://i.pravatar.cc/150?img=47",
    text: "Having all my medical records, prescriptions and laboratory results in one secure place is amazing.",
    rating: 4,
  },
];

export default function Testimonials() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
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
            <Star size={16} className="fill-violet-700 text-violet-700" />
            Testimonials
          </span>
          <h2 className="mt-6 text-4xl font-bold text-slate-900 md:text-5xl lg:text-6xl">
            Trusted by{" "}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              thousands of users
            </span>
          </h2>
          <p className="mt-6 text-lg text-slate-600">
            Hear what patients and healthcare professionals say about
            DOCTORZ Co.
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
          {testimonials.map((testimonial) => {
            const initials = testimonial.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase();

            return (
              <motion.div
                key={testimonial.name}
                variants={cardVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group rounded-3xl border border-slate-200/70 bg-white/50 p-8 shadow-sm backdrop-blur-sm transition-all hover:border-violet-200 hover:bg-white/80 hover:shadow-xl hover:shadow-violet-100/30"
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={`${
                        i < testimonial.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-slate-200 text-slate-200"
                      } transition-colors duration-200`}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="mt-6 leading-8 text-slate-600">
                  "{testimonial.text}"
                </p>

                {/* Profile */}
                <div className="mt-8 flex items-center gap-4">
                  {mounted && testimonial.image ? (
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-bold text-white ring-2 ring-white shadow-sm">
                      {initials}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}