"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Building,
  CreditCard,
  Clock,
  MapPin,
  Award,
  CheckCircle2,
} from "lucide-react";

interface DoctorProfileViewProps {
  doctorInfo: {
    id: string;
    name: string;
    specialty: string;
    cabinet: string;
    license: string;
    status: "DISPONIBLE" | "EN_CONSULTATION" | "PAUSE";
    rating: number;
    reviewsCount: number;
    avatarUrl: string | null;
  };
  isDark: boolean;
  doctorInitials: string;
}

export default function DoctorProfileView({
  doctorInfo,
  isDark,
  doctorInitials,
}: DoctorProfileViewProps) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Profile Card Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-lg transition-colors relative overflow-hidden ${
          isDark
            ? "bg-slate-900/90 border-slate-800 text-white"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Avatar with verified ring */}
          <div className="relative shrink-0">
            <div
              className={`h-24 w-24 sm:h-28 sm:w-28 rounded-3xl overflow-hidden shadow-xl p-1 border ${
                isDark
                  ? "bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 border-indigo-400/30"
                  : "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 border-indigo-200"
              }`}
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-800 flex items-center justify-center text-white font-black text-3xl">
                {doctorInfo.avatarUrl ? (
                  <Image
                    src={doctorInfo.avatarUrl}
                    alt={doctorInfo.name}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{doctorInitials}</span>
                )}
              </div>
            </div>
            <div
              title="Praticien Vérifié"
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-md"
            >
              <CheckCircle2 size={16} strokeWidth={3} />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isDark
                    ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                }`}
              >
                Inscrit à l&apos;Ordre National des Médecins
              </span>
              <span className="text-xs text-slate-400 font-medium">
                RPPS : {doctorInfo.license || "10098472910"}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {doctorInfo.name || "Dr. Sarah Khelifi"}
            </h2>

            <p
              className={`text-sm font-semibold ${
                isDark ? "text-indigo-400" : "text-indigo-700"
              }`}
            >
              {doctorInfo.specialty || "Spécialiste en Cardiologie & Maladies Vasculaires"}
            </p>

            <div
              className={`flex items-center gap-3 text-xs flex-wrap ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              <div className="flex items-center gap-1">
                <Building size={14} className="opacity-80" />
                <span>{doctorInfo.cabinet || "Centre Médical & Clinique Ibn Sina"}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MapPin size={14} className="opacity-80" />
                <span>14 Boulevard des Martyrs, Alger / Paris</span>
              </div>
            </div>
          </div>

          {/* Virtual Card button */}
          <div className="shrink-0 flex flex-col gap-2">
            <Link
              href="/doctor/card"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition cursor-pointer"
            >
              <CreditCard size={16} />
              <span>Voir ma Carte 3D</span>
            </Link>

            <span
              className={`text-[11px] text-center ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              NFC & QR Code partageable
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Profile Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Affiliations & Certifications */}
        <div
          className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2.5 pb-3 border-b dark:border-slate-800">
            <Award size={18} className="text-indigo-600" />
            <h3 className="font-bold text-sm">Diplômes & Habilitations</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">
                  Doctorat d&apos;État en Médecine (Mention Très Honorable)
                </strong>
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                  Faculté de Médecine — Université Centrale
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">
                  D.E.S. Cardiologie & Explorations Fonctionnelles
                </strong>
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                  CHU Mustapha Bacha
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">
                  Habilitation Télémédecine & Télé-expertise ARS / HDS
                </strong>
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                  Plateforme Nationale e-Santé Certifiée
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Practice Hours & Rates */}
        <div
          className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2.5 pb-3 border-b dark:border-slate-800">
            <Clock size={18} className="text-indigo-600" />
            <h3 className="font-bold text-sm">Horaires de Consultation</h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b dark:border-slate-800/60">
              <span className="font-semibold">Lundi — Jeudi</span>
              <span className={isDark ? "text-slate-300" : "text-slate-600"}>
                08:30 — 17:30
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b dark:border-slate-800/60">
              <span className="font-semibold">Vendredi</span>
              <span className={isDark ? "text-slate-300" : "text-slate-600"}>
                08:30 — 12:30 (Matinée urgences)
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b dark:border-slate-800/60">
              <span className="font-semibold">Samedi</span>
              <span className={isDark ? "text-slate-300" : "text-slate-600"}>
                09:00 — 14:00 (Sur rendez-vous)
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="font-semibold text-rose-500">Dimanche</span>
              <span className="text-rose-500 font-semibold">Fermé</span>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border mt-3 text-xs flex items-center justify-between ${
              isDark
                ? "bg-slate-950/60 border-slate-800"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div>
              <span className="font-semibold block">Conventionnement :</span>
              <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                Secteur 1 / Conventionné Sécurité Sociale
              </span>
            </div>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Carte Vitale acceptée
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
