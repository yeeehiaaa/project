"use client";

import { motion, Variants } from "framer-motion";
import { Star, MapPin, Stethoscope } from "lucide-react";
import Link from "next/link";

const doctors = [
  {
    name: "Dr. Sarah Johnson",
    specialty: "Cardiologist",
    rating: 4.9,
    city: "Algiers",
    image: "/images/doctors/doctor1.jpg",
  },
  {
    name: "Dr. Ahmed Benali",
    specialty: "Neurologist",
    rating: 4.8,
    city: "Oran",
    image: "/images/doctors/doctor2.jpg",
  },
  {
    name: "Dr. Lina Martin",
    specialty: "Pediatrician",
    rating: 5.0,
    city: "Constantine",
    image: "/images/doctors/doctor3.jpg",
  },
];

export default function Doctors() {
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
          className="mb-16 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-100/80 px-4 py-2 text-sm font-semibold text-violet-700 backdrop-blur-sm">
            <Stethoscope size={16} />
            Our Doctors
          </span>
          <h2 className="mt-5 text-4xl font-bold text-slate-900 md:text-5xl lg:text-6xl">
            Meet Our{" "}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Trusted Specialists
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
            Connect with experienced healthcare professionals across Algeria.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid gap-8 md:grid-cols-2 xl:grid-cols-3"
        >
          {doctors.map((doctor) => {
            const initials = doctor.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase();

            return (
              <motion.div
                key={doctor.name}
                variants={cardVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white/50 shadow-sm backdrop-blur-sm transition-all hover:border-violet-200 hover:bg-white/80 hover:shadow-xl hover:shadow-violet-100/30"
              >
                {/* Image with fallback */}
                <div className="relative h-72 w-full overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-600">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback to initials if image fails
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement!.style.display = "flex";
                      e.currentTarget.parentElement!.classList.add(
                        "flex",
                        "items-center",
                        "justify-center"
                      );
                      e.currentTarget.parentElement!.innerHTML = `
                        <span class="text-6xl font-bold text-white/80">${initials}</span>
                      `;
                    }}
                  />
                </div>

                <div className="p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {doctor.name}
                      </h3>
                      <p className="mt-2 font-medium text-violet-600">
                        {doctor.specialty}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-yellow-100/80 px-3 py-1 text-sm font-semibold text-yellow-700 backdrop-blur-sm">
                      <Star size={15} fill="currentColor" />
                      {doctor.rating}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-slate-500">
                    <MapPin size={18} />
                    {doctor.city}
                  </div>

                  <Link
                    href="/appointments/new"
                    className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30"
                  >
                    Book Appointment
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}