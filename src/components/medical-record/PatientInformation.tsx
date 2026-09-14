"use client";

import { motion } from "framer-motion";
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Ruler,
  Weight,
  Shield,
  Users,
  Droplets,
  BadgeCheck,
} from "lucide-react";

const info = [
  {
    icon: Calendar,
    label: "Age",
    value: "22 years",
  },
  {
    icon: User,
    label: "Gender",
    value: "Male",
  },
  {
    icon: Droplets,
    label: "Blood Group",
    value: "O+",
  },
  {
    icon: Ruler,
    label: "Height",
    value: "178 cm",
  },
  {
    icon: Weight,
    label: "Weight",
    value: "72 kg",
  },
  {
    icon: Heart,
    label: "BMI",
    value: "22.7",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+213 555 55 55 55",
  },
  {
    icon: Mail,
    label: "Email",
    value: "yahia@email.com",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "Sidi Bel Abbès, Algeria",
  },
  {
    icon: Users,
    label: "Emergency Contact",
    value: "Ahmed Chaib",
  },
  {
    icon: Shield,
    label: "Insurance",
    value: "CNAS",
  },
  {
    icon: BadgeCheck,
    label: "Patient ID",
    value: "#MC-2026-00125",
  },
];

export default function PatientInformation() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[34px] bg-white p-8 shadow-sm"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[3px] text-violet-600">
            Patient
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-900">
            Personal Information
          </h2>
        </div>
      </div>

      <div className="flex flex-col gap-10 xl:flex-row">
        {/* Avatar */}

        <div className="flex flex-col items-center">
          <img
            src="/avatars/patient.png"
            alt="Patient"
            className="h-40 w-40 rounded-3xl object-cover shadow-xl ring-4 ring-violet-100"
          />

          <h3 className="mt-6 text-2xl font-bold text-slate-900">
            Yahia Chaib
          </h3>

          <p className="mt-1 text-slate-500">
            Premium Patient
          </p>
        </div>

        {/* Informations */}

        <div className="grid flex-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {info.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="
                  rounded-3xl
                  border
                  border-slate-100
                  bg-slate-50
                  p-5
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-violet-200
                  hover:shadow-lg
                "
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md">
                  <Icon size={20} />
                </div>

                <p className="text-sm text-slate-500">
                  {item.label}
                </p>

                <h4 className="mt-2 font-semibold text-slate-900">
                  {item.value}
                </h4>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}