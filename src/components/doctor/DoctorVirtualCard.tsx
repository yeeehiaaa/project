"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Stethoscope,
  RotateCw,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  QrCode,
  Share2,
  Download,
  Copy,
  Check,
  Building,
  ArrowLeft,
  Printer,
  HeartPulse,
  Wifi,
  Palette,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type CardTheme = "white" | "sapphire" | "emerald" | "obsidian" | "royal";

export default function DoctorVirtualCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeTheme, setActiveTheme] = useState<CardTheme>("white");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedContact, setCopiedContact] = useState(false);
  const [isDownloadingVCard, setIsDownloadingVCard] = useState(false);

  // Restore theme preference if previously saved
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("doctor_card_theme") as CardTheme | null;
      if (savedTheme && ["white", "sapphire", "emerald", "obsidian", "royal"].includes(savedTheme)) {
        setActiveTheme(savedTheme);
      }
    }
  }, []);

  const handleSelectTheme = (thm: CardTheme) => {
    setActiveTheme(thm);
    if (typeof window !== "undefined") {
      localStorage.setItem("doctor_card_theme", thm);
    }
  };

  // Dynamic doctor info with fallback
  const [doctor, setDoctor] = useState({
    name: "Dr. Sarah Khelifi",
    initials: "SK",
    title: "Médecin Spécialiste",
    specialty: "Cardiologie & Maladies Vasculaires",
    subSpecialty: "Rythmologie & Échocardiographie Doppler",
    licenseNumber: "DZ-23456 / ONM",
    rppsNumber: "10102938475",
    cabinet: "Centre Médical Les Jasmins",
    hospitalAffiliation: "Clinique Médico-Chirurgicale d'Oran",
    address: "14 Boulevard Colonel Amirouche, Oran, Algérie",
    phone: "+213 (0) 41 89 20 40",
    mobile: "+213 551 234 567",
    email: "dr.khelifi@mediconnect.dz",
    hours: "Dimanche - Jeudi : 08:30 - 16:30",
    experienceYears: "14 ans d'expérience",
    rating: "4.9 / 5.0",
    reviewsCount: "128 avis certifiés",
    languages: ["Français", "Arabe (العربية)", "English"],
    diplomas: [
      "Diplôme d'Études Spécialisées (DES) en Cardiologie - Faculté de Médecine d'Alger",
      "D.U. Échocardiographie Doppler & Rythmologie Interventionnelle - Univ. Paris Descartes",
      "Membre Titulaire de la Société Algérienne de Cardiologie (SAC)",
    ],
    conventions: ["Conventionné CNAS", "CASNOS", "Carte Chifa", "Prise en charge mutuelles"],
  });

  // Load doctor profile if logged in
  useEffect(() => {
    async function loadDoctor() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          const res = await fetch("/api/auth/profile", {
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.profile?.firstName && data?.profile?.lastName) {
              const fullName = `Dr. ${data.profile.firstName} ${data.profile.lastName}`;
              const initials = `${data.profile.firstName.charAt(0)}${data.profile.lastName.charAt(0)}`.toUpperCase();
              setDoctor((prev) => ({
                ...prev,
                name: fullName,
                initials: initials || prev.initials,
                email: data.user?.email || prev.email,
                phone: data.profile?.phone || prev.phone,
              }));
            }
          }
        }
      } catch (err) {
        console.warn("Doctor profile load fallback:", err);
      }
    }
    loadDoctor();
  }, []);

  // Keyboard shortcut: Spacebar or Enter to flip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Copy shareable public link
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Copy contact phone
  const handleCopyPhone = () => {
    navigator.clipboard.writeText(doctor.mobile);
    setCopiedContact(true);
    setTimeout(() => setCopiedContact(false), 2000);
  };

  // Export vCard (.vcf)
  const handleExportVCard = () => {
    setIsDownloadingVCard(true);
    const vCardContent = `BEGIN:VCARD
VERSION:3.0
FN:${doctor.name}
N:Khelifi;Sarah;;Dr.;
TITLE:${doctor.specialty}
ORG:${doctor.cabinet};${doctor.hospitalAffiliation}
TEL;TYPE=WORK,VOICE:${doctor.phone}
TEL;TYPE=CELL,VOICE:${doctor.mobile}
EMAIL;TYPE=WORK,INTERNET:${doctor.email}
ADR;TYPE=WORK:;;${doctor.address};Oran;;31000;Algérie
URL:https://mediconnect.dz/doctor/card
NOTE:Licence ONM: ${doctor.licenseNumber} - DOCTORZ Co. Verified
END:VCARD`;

    const blob = new Blob([vCardContent], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${doctor.name.replace(/\s+/g, "_")}_Contact.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setIsDownloadingVCard(false), 800);
  };

  // Themes configurations with White Clinique as first and default
  const themeStyles = {
    white: {
      key: "white",
      name: "Blanc Clinique",
      shortName: "Blanc",
      isDark: false,
      cardBg: "from-white via-slate-50 to-indigo-50/40",
      accentBorder: "border-slate-200/90 shadow-2xl shadow-indigo-950/10",
      accentGlow: "from-indigo-200/40 via-sky-100/25 to-transparent",
      badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      headerIcon: "text-indigo-600",
      holoRing: "border-indigo-300",
      highlightText: "text-indigo-700",
      btnActive: "bg-slate-900 text-white shadow-sm font-semibold",
      dot: "bg-white border-2 border-indigo-600",
    },
    sapphire: {
      key: "sapphire",
      name: "Saphir Sombre",
      shortName: "Saphir",
      isDark: true,
      cardBg: "from-slate-950 via-slate-900 to-indigo-950",
      accentBorder: "border-indigo-500/40",
      accentGlow: "from-indigo-600/20 via-blue-500/10 to-transparent",
      badgeBg: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
      headerIcon: "text-indigo-400",
      holoRing: "border-indigo-400/40",
      highlightText: "text-indigo-300",
      btnActive: "bg-indigo-600 text-white shadow-indigo-600/30 font-semibold",
      dot: "bg-indigo-600 border border-indigo-400",
    },
    emerald: {
      key: "emerald",
      name: "Émeraude",
      shortName: "Émeraude",
      isDark: true,
      cardBg: "from-slate-950 via-slate-900 to-emerald-950",
      accentBorder: "border-emerald-500/40",
      accentGlow: "from-emerald-600/20 via-teal-500/10 to-transparent",
      badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      headerIcon: "text-emerald-400",
      holoRing: "border-emerald-400/40",
      highlightText: "text-emerald-300",
      btnActive: "bg-emerald-600 text-white shadow-emerald-600/30 font-semibold",
      dot: "bg-emerald-600 border border-emerald-400",
    },
    obsidian: {
      key: "obsidian",
      name: "Obsidienne & Or",
      shortName: "Obsidienne",
      isDark: true,
      cardBg: "from-neutral-950 via-zinc-900 to-stone-950",
      accentBorder: "border-amber-500/40",
      accentGlow: "from-amber-600/15 via-yellow-500/10 to-transparent",
      badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      headerIcon: "text-amber-400",
      holoRing: "border-amber-400/40",
      highlightText: "text-amber-300",
      btnActive: "bg-amber-600 text-white shadow-amber-600/30 font-semibold",
      dot: "bg-amber-600 border border-amber-400",
    },
    royal: {
      key: "royal",
      name: "Pourpre Royal",
      shortName: "Pourpre",
      isDark: true,
      cardBg: "from-slate-950 via-zinc-900 to-purple-950",
      accentBorder: "border-purple-500/40",
      accentGlow: "from-purple-600/20 via-fuchsia-500/10 to-transparent",
      badgeBg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      headerIcon: "text-purple-400",
      holoRing: "border-purple-400/40",
      highlightText: "text-purple-300",
      btnActive: "bg-purple-600 text-white shadow-purple-600/30 font-semibold",
      dot: "bg-purple-600 border border-purple-400",
    },
  };

  const themeKeys: CardTheme[] = ["white", "sapphire", "emerald", "obsidian", "royal"];
  const currentTheme = themeStyles[activeTheme];
  const isDark = currentTheme.isDark;

  return (
    <div
      id="virtual-card-wrapper"
      className={`min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white relative overflow-x-hidden transition-colors duration-300 ${
        isDark
          ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100"
          : "bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900"
      }`}
    >
      {/* Subtle Ambient Backdrops */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {isDark ? (
          <>
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/10 blur-[130px] rounded-full" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 blur-[140px] rounded-full" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
                backgroundSize: "32px 32px",
              }}
            />
          </>
        ) : (
          <>
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-200/25 blur-[120px] rounded-full" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-200/25 blur-[130px] rounded-full" />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)`,
                backgroundSize: "32px 32px",
              }}
            />
          </>
        )}
      </div>

      {/* TOP NAVIGATION BAR */}
      <header
        className={`relative z-20 border-b px-4 sm:px-6 py-3.5 transition-colors ${
          isDark
            ? "border-slate-800/80 bg-slate-950/60 backdrop-blur-md"
            : "border-slate-200/80 bg-white/80 backdrop-blur-md"
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/doctor"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                isDark
                  ? "text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border-slate-800"
                  : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200"
              }`}
            >
              <ArrowLeft size={14} />
              <span>Retour Dashboard</span>
            </Link>

            <div
              className={`hidden sm:flex items-center gap-2 pl-3 border-l ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Carte Numérique Officielle
              </span>
            </div>
          </div>

          {/* Actions & Theme picker */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Header Theme Switcher Pills */}
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${
                isDark ? "bg-slate-900/90 border-slate-800" : "bg-slate-100 border-slate-200"
              }`}
            >
              <span
                className={`text-[11px] px-2 font-medium flex items-center gap-1 ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                <Palette size={13} />
                <span className="hidden md:inline">Thème :</span>
              </span>
              {themeKeys.map((thm) => {
                const conf = themeStyles[thm];
                const isActive = activeTheme === thm;
                return (
                  <button
                    key={thm}
                    type="button"
                    onClick={() => handleSelectTheme(thm)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                      isActive
                        ? conf.btnActive
                        : isDark
                        ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                    <span className="capitalize">{conf.shortName}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Share */}
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copier le lien public de la carte"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isDark
                  ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
              }`}
            >
              {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
              <span className="hidden sm:inline">
                {copiedLink ? "Lien Copié !" : "Partager"}
              </span>
            </button>

            {/* Export vCard */}
            <button
              type="button"
              onClick={handleExportVCard}
              disabled={isDownloadingVCard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <Download size={14} />
              <span className="hidden sm:inline">
                {isDownloadingVCard ? "Export en cours..." : "Télécharger vCard"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-10 flex flex-col items-center justify-center space-y-6 sm:space-y-8">
        {/* Header Heading */}
        <div className="text-center space-y-2 max-w-xl">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold shadow-xs ${
              isDark
                ? "bg-slate-900/90 border-slate-800 text-indigo-400"
                : "bg-white border-slate-200 text-indigo-700"
            }`}
          >
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Badge Professionnel Certifié • Ordre des Médecins</span>
          </div>

          <h1
            className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Carte Professionnelle Virtuelle 3D
          </h1>

          <p className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Cliquez sur la carte ou utilisez le bouton pour la retourner. Scannable, partageable et conforme aux standards médicaux.
          </p>
        </div>

        {/* ============================================================
            3D FLIPPABLE VIRTUAL CARD CONTAINER
        ============================================================ */}
        <div
          id="perspective-stage"
          className="w-full max-w-[620px] select-none"
          style={{ perspective: "1600px" }}
        >
          <motion.div
            id="doctor-3d-card"
            onClick={() => setIsFlipped((prev) => !prev)}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{
              duration: 0.75,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative w-full aspect-[1.58/1] min-h-[360px] sm:min-h-[390px] rounded-3xl shadow-2xl cursor-pointer group"
          >
            {/* ========================================================
                FRONT SIDE OF THE VIRTUAL CARD
            ======================================================== */}
            <div
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className={`absolute inset-0 w-full h-full rounded-3xl p-6 sm:p-8 flex flex-col justify-between border ${currentTheme.accentBorder} bg-gradient-to-br ${currentTheme.cardBg} shadow-2xl overflow-hidden`}
            >
              {/* Card Ambient Glow / Watermark Grid */}
              <div
                className={`absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br ${currentTheme.accentGlow} blur-2xl pointer-events-none`}
              />
              <div
                className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-[0.04]" : "opacity-[0.03]"}`}
                style={{
                  backgroundImage: `radial-gradient(circle at 1.5px 1.5px, ${isDark ? "#ffffff" : "#4338ca"} 1.5px, transparent 0)`,
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Front Top Bar */}
              <div className="relative z-10 flex items-start justify-between">
                {/* Organization & Official Caduceus */}
                <div className="flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-md border ${
                      isDark
                        ? "bg-gradient-to-tr from-white/10 to-white/5 border-white/15 text-white"
                        : "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs"
                    }`}
                  >
                    <Stethoscope size={22} className={currentTheme.headerIcon} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm sm:text-base font-bold tracking-tight ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        DOCTORZ Co. Pro
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                          isDark
                            ? "bg-white/10 text-slate-300 border-white/10"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        DZ
                      </span>
                    </div>
                    <p className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Réseau Médical Sécurisé d&apos;Algérie
                    </p>
                  </div>
                </div>

                {/* NFC Smart Contactless & Status */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span
                        className={`text-[11px] font-semibold ${
                          isDark ? "text-emerald-300" : "text-emerald-700"
                        }`}
                      >
                        Praticien Enregistré
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {doctor.licenseNumber}
                    </span>
                  </div>

                  <div
                    className={`p-2 rounded-xl border ${
                      isDark
                        ? "bg-white/5 border-white/10 text-slate-300"
                        : "bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                  >
                    <Wifi size={18} className="rotate-90" />
                  </div>
                </div>
              </div>

              {/* Front Middle Body */}
              <div className="relative z-10 my-auto py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4 sm:gap-5">
                  {/* Doctor Avatar / Monogram Shield */}
                  <div className="relative shrink-0">
                    <div className="h-20 w-20 sm:h-22 sm:w-22 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-800 p-0.5 shadow-lg border border-white/20">
                      <div className="w-full h-full rounded-[14px] bg-slate-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
                        <span className="text-2xl sm:text-3xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-100 to-indigo-200">
                          {doctor.initials}
                        </span>
                        <div className="absolute bottom-0 inset-x-0 bg-indigo-600/60 py-0.5 text-center text-[9px] font-bold tracking-widest uppercase">
                          MD
                        </div>
                      </div>
                    </div>

                    {/* Verified check icon */}
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-white shadow-md">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </div>

                  {/* Doctor Full Identity */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2
                        className={`text-lg sm:text-2xl font-bold tracking-tight ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {doctor.name}
                      </h2>
                    </div>

                    <p className={`text-xs sm:text-sm font-semibold ${currentTheme.highlightText}`}>
                      {doctor.specialty}
                    </p>

                    <p className={`text-[11px] sm:text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {doctor.subSpecialty}
                    </p>

                    <div
                      className={`pt-1 flex items-center gap-2 text-[11px] ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <Building size={13} className="shrink-0 opacity-80" />
                      <span className="truncate max-w-[280px] sm:max-w-none">
                        {doctor.cabinet}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Micro holographic seal */}
                <div
                  className={`hidden sm:flex flex-col items-center justify-center p-3 rounded-2xl border text-center ${
                    isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-slate-100/90 border-slate-200 shadow-xs"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-full border border-dashed flex items-center justify-center mb-1 ${
                      isDark
                        ? "border-white/30 text-amber-300"
                        : "border-amber-400 bg-amber-50 text-amber-600"
                    }`}
                  >
                    <Award size={20} />
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Ordre National
                  </span>
                  <span className={`text-[8px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Section Médicale
                  </span>
                </div>
              </div>

              {/* Front Bottom Details Strip */}
              <div
                className={`relative z-10 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                  isDark ? "border-white/10 text-slate-300" : "border-slate-200 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <HeartPulse size={14} className="text-rose-500" />
                    <span>{doctor.experienceYears}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-500">★</span>
                    <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {doctor.rating}
                    </span>
                    <span className={isDark ? "text-slate-400 text-[10px]" : "text-slate-500 text-[10px]"}>
                      ({doctor.reviewsCount})
                    </span>
                  </div>
                </div>

                {/* Flip Card Prompt Helper */}
                <div
                  className={`flex items-center gap-1.5 text-[11px] transition ${
                    isDark
                      ? "text-slate-400 group-hover:text-white"
                      : "text-slate-500 group-hover:text-slate-900 font-medium"
                  }`}
                >
                  <RotateCw size={12} className="animate-spin-slow" />
                  <span>Cliquer pour voir le verso</span>
                </div>
              </div>
            </div>

            {/* ========================================================
                BACK SIDE OF THE VIRTUAL CARD (180 DEGREE ROTATED)
            ======================================================== */}
            <div
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
              className={`absolute inset-0 w-full h-full rounded-3xl p-6 sm:p-7 flex flex-col justify-between border ${currentTheme.accentBorder} bg-gradient-to-br ${currentTheme.cardBg} shadow-2xl overflow-hidden`}
            >
              {/* Back Card Ambient */}
              <div
                className={`absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr ${currentTheme.accentGlow} blur-2xl pointer-events-none`}
              />

              {/* Magnetic Strip Representation */}
              <div
                className={`absolute top-0 inset-x-0 h-10 border-b flex items-center justify-between px-6 ${
                  isDark
                    ? "bg-slate-950/90 border-slate-800 text-slate-500"
                    : "bg-slate-900/95 border-slate-800 text-slate-300"
                }`}
              >
                <span className="text-[10px] tracking-widest uppercase font-mono">
                  CLINICAL DATA ENCRYPTED • MEDICONNECT DZ
                </span>
                <span className="text-[10px] font-mono">
                  ID: {doctor.rppsNumber}
                </span>
              </div>

              {/* Top Details (under magnetic strip) */}
              <div className="relative z-10 pt-7 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Coordonnées Officielles & Prise de Contact
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-emerald-500 shrink-0" />
                      <span className={`font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                        {doctor.mobile}
                      </span>
                      <span className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        • Fixe: {doctor.phone}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-indigo-500 shrink-0" />
                      <span className={isDark ? "text-slate-200" : "text-slate-700"}>
                        {doctor.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-rose-500 shrink-0" />
                      <span
                        className={`text-[11px] truncate max-w-[340px] ${
                          isDark ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {doctor.address}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Realistic QR Code Box */}
                <div className="shrink-0 flex flex-col items-center justify-center p-2 rounded-xl bg-white text-slate-950 shadow-md border border-slate-200">
                  <QrCode size={56} />
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-600 mt-1">
                    Scan RDV
                  </span>
                </div>
              </div>

              {/* Middle Section: Diplomas & Credentials */}
              <div className="relative z-10 py-1 space-y-1.5 text-xs">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Qualifications & Titres Universitaires
                </span>
                <div className="space-y-1">
                  {doctor.diplomas.slice(0, 2).map((dip, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-1.5 text-[11px] ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      <Award size={12} className="text-amber-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{dip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Section: Conventions & Hours */}
              <div
                className={`relative z-10 pt-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                  isDark ? "border-white/10" : "border-slate-200"
                }`}
              >
                {/* Conventions Pill Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {doctor.conventions.map((conv, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        isDark
                          ? "bg-white/10 text-slate-300 border-white/10"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {conv}
                    </span>
                  ))}
                </div>

                {/* Hours */}
                <div
                  className={`flex items-center gap-1 text-[11px] ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  <Clock size={12} className="opacity-80" />
                  <span>{doctor.hours}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ============================================================
            INTERACTIVE CONTROLS & QUICK ACTIONS BAR
        ============================================================ */}
        <div
          className={`w-full max-w-[620px] flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border transition-colors ${
            isDark
              ? "bg-slate-900/80 border-slate-800 shadow-xl"
              : "bg-white border-slate-200 shadow-lg text-slate-800"
          }`}
        >
          {/* Flip Card Button */}
          <button
            type="button"
            id="btn-flip-card"
            onClick={() => setIsFlipped((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <RotateCw size={15} className={isFlipped ? "rotate-180 transition-transform" : ""} />
            <span>{isFlipped ? "Voir Face Avant (Recto)" : "Voir Face Arrière (Verso)"}</span>
          </button>

          {/* Action cluster */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPhone}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
              }`}
            >
              {copiedContact ? (
                <Check size={14} className="text-emerald-500" />
              ) : (
                <Copy size={14} />
              )}
              <span>{copiedContact ? "Téléphone Copié !" : "Copier Téléphone"}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
              }`}
            >
              <Printer size={14} />
              <span>Imprimer</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            FEATURE HIGHLIGHTS & COMPLIANCE GRID
        ============================================================ */}
        <div className="w-full max-w-[620px] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div
            className={`p-3.5 rounded-xl border space-y-1 transition-colors ${
              isDark ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="flex items-center gap-1.5 text-indigo-600 font-semibold">
              <ShieldCheck size={14} />
              <span>Authenticité Garantée</span>
            </div>
            <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Identifiant certifié par l&apos;Ordre National des Médecins algérien.
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border space-y-1 transition-colors ${
              isDark ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <QrCode size={14} />
              <span>Scan Patient Instantané</span>
            </div>
            <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Prise de rendez-vous directe en scannant le QR code avec n&apos;importe quel smartphone.
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border space-y-1 transition-colors ${
              isDark ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="flex items-center gap-1.5 text-purple-600 font-semibold">
              <Download size={14} />
              <span>Export vCard Universel</span>
            </div>
            <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Compatible avec tous les répertoires iOS, Android, Google Contacts et Outlook.
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        className={`relative z-10 border-t py-4 px-6 text-center text-xs transition-colors ${
          isDark ? "border-slate-800/60 text-slate-500" : "border-slate-200 text-slate-500"
        }`}
      >
        DOCTORZ Co. • Carte Professionnelle de Santé Numérique & Télémédecine
      </footer>
    </div>
  );
}
