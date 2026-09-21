"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HeartPulse,
  RotateCw,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  QrCode,
  Share2,
  Download,
  Copy,
  Check,
  ArrowLeft,
  Printer,
  Wifi,
  Palette,
  Droplet,
  AlertTriangle,
  Activity,
  PhoneCall,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type CardTheme = "white" | "sapphire" | "emerald" | "obsidian" | "royal";

export default function PatientVirtualCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeTheme, setActiveTheme] = useState<CardTheme>("white");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedContact, setCopiedContact] = useState(false);
  const [isDownloadingVCard, setIsDownloadingVCard] = useState(false);
  const [emergencyToken, setEmergencyToken] = useState<string | null>(null);
  const [emergencyUrl, setEmergencyUrl] = useState("");
  const [copiedEmergency, setCopiedEmergency] = useState(false);
  const [isRegeneratingQr, setIsRegeneratingQr] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("patient_card_theme") as CardTheme | null;
      if (saved && ["white", "sapphire", "emerald", "obsidian", "royal"].includes(saved)) {
        setActiveTheme(saved);
      }
    }
  }, []);

  const handleSelectTheme = (thm: CardTheme) => {
    setActiveTheme(thm);
    if (typeof window !== "undefined") {
      localStorage.setItem("patient_card_theme", thm);
    }
  };

  // Dynamic patient info with fallback
  const [patient, setPatient] = useState({
    name: "Patient",
    initials: "PT",
    patientId: "PAT-000000",
    bloodType: "O+",
    allergies: "None declared",
    allergiesList: [] as string[],
    chronicConditions: "No chronic condition declared",
    phone: "+213 550 00 00 00",
    email: "patient@mediconnect.dz",
    city: "Alger",
    wilaya: "Alger",
    emergencyContactName: "Emergency contact not provided",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    memberSince: "2026",
  });

  // Load patient profile if logged in
  useEffect(() => {
    async function loadPatient() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) return;
        const res = await fetch("/api/dashboard/patient/profile", {
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const profile = data?.profile;
        const pat = data?.patient;
        if (!profile) return;
        const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
        const allergiesRaw: string = pat?.allergies || "";
        const allergiesList = allergiesRaw
          .split(",")
          .map((a: string) => a.trim())
          .filter(Boolean);
        setPatient((prev) => ({
          ...prev,
          name: fullName || prev.name,
          initials:
            `${(profile.firstName || "").charAt(0)}${(profile.lastName || "").charAt(0)}`.toUpperCase() || prev.initials,
          patientId: pat?.id ? `PAT-${String(pat.id).slice(0, 8).toUpperCase()}` : prev.patientId,
          bloodType: pat?.bloodType || prev.bloodType,
          allergies: allergiesRaw || prev.allergies,
          allergiesList,
          chronicConditions: pat?.chronicConditions || prev.chronicConditions,
          phone: profile.phone || prev.phone,
          email: profile.email || prev.email,
          city: profile.city || prev.city,
          wilaya: profile.wilaya || prev.wilaya,
          emergencyContactName: pat?.emergencyContactName || prev.emergencyContactName,
          emergencyContactPhone: pat?.emergencyContactPhone || "",
          emergencyContactRelation: pat?.emergencyContactRelation || "",
          memberSince: profile.createdAt ? new Date(profile.createdAt).getFullYear().toString() : prev.memberSince,
        }));
      } catch (err) {
        console.warn("Patient profile load fallback:", err);
      }

      // Jeton d'urgence (QR Emergency Card) : créé côté serveur si absent.
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (token && typeof window !== "undefined") {
          const res = await fetch("/api/dashboard/patient/emergency-token", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.token) {
              setEmergencyToken(data.token);
              // URL joignable depuis un téléphone (LAN), pas localhost.
              let base = window.location.origin;
              try {
                const netRes = await fetch("/api/network-url", {
                  cache: "no-store",
                });
                if (netRes.ok) {
                  const netData = await netRes.json();
                  if (netData.success && netData.lanUrl) {
                    base = netData.lanUrl;
                  }
                }
              } catch {
                // repli : origin du navigateur
              }
              setEmergencyUrl(`${base}/r/${data.token}`);
            }
          }
        }
      } catch (err) {
        console.warn("Emergency token load fallback:", err);
      }
    }
    loadPatient();
  }, []);

  // Keyboard shortcut: Spacebar to flip
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

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(patient.phone);
    setCopiedContact(true);
    setTimeout(() => setCopiedContact(false), 2000);
  };

  // Copier le lien public d'urgence (QR Emergency Card)
  const handleCopyEmergency = () => {
    if (typeof window !== "undefined" && emergencyUrl) {
      navigator.clipboard.writeText(emergencyUrl);
      setCopiedEmergency(true);
      setTimeout(() => setCopiedEmergency(false), 2000);
    }
  };

  // Régénérer le jeton : l'ancien QR cesse immédiatement de fonctionner.
  const handleRegenerateQr = async () => {
    if (isRegeneratingQr) return;
    if (
      typeof window !== "undefined" &&
      !confirm("Régénérer le QR d'urgence ? L'ancien lien cessera de fonctionner.")
    ) {
      return;
    }
    setIsRegeneratingQr(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;
      const res = await fetch("/api/dashboard/patient/emergency-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "regenerate" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token && typeof window !== "undefined") {
          setEmergencyToken(data.token);
          let base = window.location.origin;
          try {
            const netRes = await fetch("/api/network-url", {
              cache: "no-store",
            });
            if (netRes.ok) {
              const netData = await netRes.json();
              if (netData.success && netData.lanUrl) {
                base = netData.lanUrl;
              }
            }
          } catch {
            // repli : origin du navigateur
          }
          setEmergencyUrl(`${base}/r/${data.token}`);
        }
      }
    } catch (err) {
      console.warn("Emergency token regenerate fallback:", err);
    } finally {
      setIsRegeneratingQr(false);
    }
  };

  // Export vCard (.vcf)
  const handleExportVCard = () => {
    setIsDownloadingVCard(true);
    const vCardContent = `BEGIN:VCARD
VERSION:3.0
FN:${patient.name}
TITLE:Patient DOCTORZ Co.
ORG:DOCTORZ Co.;Patient Space
TEL;TYPE=HOME,VOICE:${patient.phone}
EMAIL;TYPE=HOME,INTERNET:${patient.email}
ADR;TYPE=HOME:;;${patient.city};${patient.wilaya};;;Algérie
URL:https://mediconnect.dz/dashboard/patient/card
NOTE:Blood type: ${patient.bloodType} - Allergies: ${patient.allergies} - DOCTORZ Co. Verified
END:VCARD`;

    const blob = new Blob([vCardContent], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${patient.name.replace(/\s+/g, "_")}_Contact.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setIsDownloadingVCard(false), 800);
  };

  // Themes configurations (same as doctor card)
  const themeStyles = {
    white: {
      key: "white",
      name: "Blanc Clinique",
      shortName: "Blanc",
      isDark: false,
      cardBg: "from-white via-slate-50 to-blue-50/40",
      accentBorder: "border-slate-200/90 shadow-2xl shadow-blue-950/10",
      accentGlow: "from-blue-200/40 via-sky-100/25 to-transparent",
      badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      headerIcon: "text-blue-600",
      holoRing: "border-blue-300",
      highlightText: "text-blue-700",
      btnActive: "bg-slate-900 text-white hover:bg-slate-800 font-semibold",
      dot: "bg-white border-2 border-blue-600",
    },
    sapphire: {
      key: "sapphire",
      name: "Saphir Sombre",
      shortName: "Saphir",
      isDark: true,
      cardBg: "from-slate-950 via-slate-900 to-blue-950",
      accentBorder: "border-blue-500/40",
      accentGlow: "from-blue-600/20 via-blue-500/10 to-transparent",
      badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      headerIcon: "text-blue-400",
      holoRing: "border-blue-400/40",
      highlightText: "text-blue-300",
      btnActive: "bg-blue-600 text-white hover:bg-blue-500 font-semibold",
      dot: "bg-blue-600 border border-blue-400",
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
      btnActive: "bg-emerald-600 text-white hover:bg-emerald-500 font-semibold",
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
      btnActive: "bg-amber-600 text-white hover:bg-amber-500 font-semibold",
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
      btnActive: "bg-purple-600 text-white hover:bg-purple-500 font-semibold",
      dot: "bg-purple-600 border border-purple-400",
    },
  };

  const themeKeys: CardTheme[] = ["white", "sapphire", "emerald", "obsidian", "royal"];
  const currentTheme = themeStyles[activeTheme];
  const isDark = currentTheme.isDark;

  return (
    <div
      id="patient-virtual-card-wrapper"
      className={`min-h-screen flex flex-col selection:bg-blue-600 selection:text-white relative overflow-x-hidden transition-colors duration-300 ${
        isDark
          ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100"
          : "bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900"
      }`}
    >
      {/* Subtle Ambient Backdrops */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {isDark ? (
          <>
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/10 blur-[130px] rounded-full" />
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
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-200/25 blur-[120px] rounded-full" />
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
              href="/dashboard/patient"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer active:scale-[0.97] ${
                isDark
                  ? "text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border-slate-800"
                  : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200"
              }`}
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </Link>

            <div className={`hidden sm:flex items-center gap-2 pl-3 border-l ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Official Digital Health Card
              </span>
            </div>
          </div>

          {/* Actions & Theme picker */}
          <div className="flex items-center flex-wrap gap-2">
            <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${isDark ? "bg-slate-900/90 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
              <span className={`text-[11px] px-2 font-medium flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                <Palette size={13} />
                <span className="hidden md:inline">Theme:</span>
              </span>
              {themeKeys.map((thm) => {
                const conf = themeStyles[thm];
                const isActive = activeTheme === thm;
                return (
                  <button
                    key={thm}
                    type="button"
                    onClick={() => handleSelectTheme(thm)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer active:scale-[0.97] ${
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

            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy the public card link"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isDark
                  ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
              }`}
            >
              {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
              <span className="hidden sm:inline">{copiedLink ? "Link Copied!" : "Share"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportVCard}
              disabled={isDownloadingVCard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer active:scale-[0.97]"
            >
              <Download size={14} />
              <span className="hidden sm:inline">{isDownloadingVCard ? "Exporting..." : "Download vCard"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-10 flex flex-col items-center justify-center space-y-6 sm:space-y-8">
        <div className="text-center space-y-2 max-w-xl">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold shadow-xs ${
              isDark ? "bg-slate-900/90 border-slate-800 text-blue-400" : "bg-white border-slate-200 text-blue-700"
            }`}
          >
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Verified Patient • DOCTORZ Co.</span>
          </div>

          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            My Virtual Health Card
          </h1>

          <p className={`text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Click the card or use the button to flip it. Your essential health data, always with you.
          </p>
        </div>

        {/* 3D FLIPPABLE CARD */}
        <div id="perspective-stage" className="w-full max-w-[620px] select-none" style={{ perspective: "1600px" }}>
          <motion.div
            id="patient-3d-card"
            onClick={() => setIsFlipped((prev) => !prev)}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.75, ease: [0.4, 0.0, 0.2, 1] }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative w-full aspect-[1.58/1] min-h-[360px] sm:min-h-[390px] rounded-3xl shadow-2xl cursor-pointer group"
          >
            {/* FRONT SIDE */}
            <div
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              className={`absolute inset-0 w-full h-full rounded-3xl p-6 sm:p-8 flex flex-col justify-between border ${currentTheme.accentBorder} bg-gradient-to-br ${currentTheme.cardBg} shadow-2xl overflow-hidden`}
            >
              <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br ${currentTheme.accentGlow} blur-2xl pointer-events-none`} />
              <div
                className={`absolute inset-0 pointer-events-none ${isDark ? "opacity-[0.04]" : "opacity-[0.03]"}`}
                style={{
                  backgroundImage: `radial-gradient(circle at 1.5px 1.5px, ${isDark ? "#ffffff" : "#4338ca"} 1.5px, transparent 0)`,
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Front Top Bar */}
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-md border ${
                      isDark
                        ? "bg-gradient-to-tr from-white/10 to-white/5 border-white/15 text-white"
                        : "bg-blue-50 border-blue-200 text-blue-700 shadow-xs"
                    }`}
                  >
                    <HeartPulse size={22} className={currentTheme.headerIcon} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                        DOCTORZ Co.
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                          isDark ? "bg-white/10 text-slate-300 border-white/10" : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        DZ
                      </span>
                    </div>
                    <p className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Secure Patient Health Network
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className={`text-[11px] font-semibold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
                        Verified Patient
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {patient.patientId}
                    </span>
                  </div>
                  <div className={`p-2 rounded-xl border ${isDark ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                    <Wifi size={18} className="rotate-90" />
                  </div>
                </div>
              </div>

              {/* Front Middle Body */}
              <div className="relative z-10 my-auto py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="relative shrink-0">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-600 to-blue-800 p-0.5 shadow-lg border border-white/20">
                      <div className="w-full h-full rounded-[14px] bg-slate-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
                        <span className="text-2xl sm:text-3xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-100 to-blue-200">
                          {patient.initials}
                        </span>
                        <div className="absolute bottom-0 inset-x-0 bg-blue-600/60 py-0.5 text-center text-[9px] font-bold tracking-widest uppercase">
                          PT
                        </div>
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-white shadow-md">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2 className={`text-lg sm:text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                      {patient.name}
                    </h2>
                    <p className={`text-xs sm:text-sm font-semibold ${currentTheme.highlightText}`}>
                      Blood type {patient.bloodType}
                    </p>
                    <p className={`text-[11px] sm:text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      Member since {patient.memberSince} • {patient.city}
                    </p>
                    <div className={`pt-1 flex items-center gap-2 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <MapPin size={13} className="shrink-0 opacity-80" />
                      <span className="truncate max-w-[280px] sm:max-w-none">
                        {patient.city} ({patient.wilaya})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Blood seal */}
                <div
                  className={`hidden sm:flex flex-col items-center justify-center p-3 rounded-2xl border text-center ${
                    isDark ? "bg-white/5 border-white/10" : "bg-slate-100/90 border-slate-200 shadow-xs"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-full border border-dashed flex items-center justify-center mb-1 font-extrabold text-sm ${
                      isDark ? "border-white/30 text-red-300" : "border-red-400 bg-red-50 text-red-600"
                    }`}
                  >
                    {patient.bloodType}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Blood Group
                  </span>
                  <span className={`text-[8px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Emergency info</span>
                </div>
              </div>

              {/* Front Bottom Strip */}
              <div
                className={`relative z-10 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                  isDark ? "border-white/10 text-slate-300" : "border-slate-200 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Activity size={14} className="text-blue-500" />
                    <span className="truncate max-w-[260px]">{patient.chronicConditions}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-[11px] transition ${isDark ? "text-slate-400 group-hover:text-white" : "text-slate-500 group-hover:text-slate-900 font-medium"}`}>
                  <RotateCw size={12} className="animate-spin-slow" />
                  <span>Click to see back</span>
                </div>
              </div>
            </div>

            {/* BACK SIDE */}
            <div
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              className={`absolute inset-0 w-full h-full rounded-3xl p-6 sm:p-7 flex flex-col justify-between border ${currentTheme.accentBorder} bg-gradient-to-br ${currentTheme.cardBg} shadow-2xl overflow-hidden`}
            >
              <div className={`absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr ${currentTheme.accentGlow} blur-2xl pointer-events-none`} />

              <div className={`absolute top-0 inset-x-0 h-10 border-b flex items-center justify-between px-6 ${isDark ? "bg-slate-950/90 border-slate-800 text-slate-500" : "bg-slate-900/95 border-slate-800 text-slate-300"}`}>
                <span className="text-[10px] tracking-widest uppercase font-mono">HEALTH DATA ENCRYPTED • MEDICONNECT DZ</span>
                <span className="text-[10px] font-mono">ID: {patient.patientId}</span>
              </div>

              <div className="relative z-10 pt-7 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Contact & Emergency
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-emerald-500 shrink-0" />
                      <span className={`font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-blue-500 shrink-0" />
                      <span className={isDark ? "text-slate-200" : "text-slate-700"}>{patient.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneCall size={13} className="text-rose-500 shrink-0" />
                      <span className={`text-[11px] truncate max-w-[340px] ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        {patient.emergencyContactName}
                        {patient.emergencyContactPhone ? ` • ${patient.emergencyContactPhone}` : ""}
                        {patient.emergencyContactRelation ? ` (${patient.emergencyContactRelation})` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center p-2 rounded-xl bg-white text-slate-950 border border-slate-200">
                  {emergencyUrl ? (
                    <QRCodeSVG value={emergencyUrl} size={72} level="M" />
                  ) : (
                    <QrCode size={56} />
                  )}
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-600 mt-1">Urgence — Scan</span>
                </div>
              </div>

              <div className="relative z-10 py-1 space-y-1.5 text-xs">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Medical Summary
                </span>
                <div className="space-y-1">
                  <div className={`flex items-start gap-1.5 text-[11px] ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    <Droplet size={12} className="text-red-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">Blood type: {patient.bloodType}</span>
                  </div>
                  <div className={`flex items-start gap-1.5 text-[11px] ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">Allergies: {patient.allergies}</span>
                  </div>
                </div>
              </div>

              <div className={`relative z-10 pt-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${isDark ? "border-white/10" : "border-slate-200"}`}>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {patient.allergiesList.length > 0 ? (
                    patient.allergiesList.slice(0, 3).map((a, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          isDark ? "bg-white/10 text-slate-300 border-white/10" : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${isDark ? "bg-white/10 text-slate-300 border-white/10" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                      No known allergies
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-1 text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  <MapPin size={12} className="opacity-80" />
                  <span>
                    {patient.city} ({patient.wilaya})
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CONTROLS */}
        <div
          className={`w-full max-w-[620px] flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border transition-colors ${
            isDark ? "bg-slate-900/80 border-slate-800 shadow-xl" : "bg-white border-slate-200 shadow-lg text-slate-800"
          }`}
        >
          <button
            type="button"
            onClick={() => setIsFlipped((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer active:scale-[0.97]"
          >
            <RotateCw size={15} className={isFlipped ? "rotate-180 transition-transform" : ""} />
            <span>{isFlipped ? "View Front" : "View Back"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPhone}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-[0.97] ${
                isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
              }`}
            >
              {copiedContact ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copiedContact ? "Phone Copied!" : "Copy Phone"}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-[0.97] ${
                isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
              }`}
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* EMERGENCY QR STRIP */}
        <div
          className={`w-full max-w-[620px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-colors ${
            isDark
              ? "bg-red-950/40 border-red-500/30"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-600 text-white shrink-0">
              <QrCode size={18} />
            </div>
            <div>
              <p className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                QR d'urgence — Emergency QR
              </p>
              <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {emergencyUrl
                  ? "Scannez pour afficher groupe sanguin, allergies et contact d'urgence — sans connexion au compte."
                  : "Chargement du lien d'urgence..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyEmergency}
              disabled={!emergencyUrl}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer active:scale-[0.97]"
            >
              {copiedEmergency ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedEmergency ? "Lien copié !" : "Copier le lien"}</span>
            </button>
            <button
              type="button"
              onClick={handleRegenerateQr}
              disabled={!emergencyUrl || isRegeneratingQr}
              title="Régénérer : l'ancien QR cesse de fonctionner"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-[0.97] disabled:opacity-50 ${
                isDark ? "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700" : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <RotateCw size={14} className={isRegeneratingQr ? "animate-spin" : ""} />
              <span>{isRegeneratingQr ? "..." : "Régénérer"}</span>
            </button>
          </div>
        </div>

        {/* HIGHLIGHTS */}
        <div className="w-full max-w-[620px] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className={`p-3.5 rounded-xl border space-y-1 transition-colors ${isDark ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200 shadow-xs"}`}>
            <div className="flex items-center gap-1.5 text-blue-600 font-semibold">
              <ShieldCheck size={14} />
              <span>Verified Identity</span>
            </div>
            <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Patient identity verified on the DOCTORZ Co. platform.
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-1 transition-colors ${isDark ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200 shadow-xs"}`}>
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <QrCode size={14} />
              <span>QR d'urgence</span>
            </div>
            <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              En urgence, ce QR affiche groupe sanguin, allergies et contact — sans login.
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-1 transition-colors ${isDark ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200 shadow-xs"}`}>
            <div className="flex items-center gap-1.5 text-purple-600 font-semibold">
              <Download size={14} />
              <span>Universal vCard</span>
            </div>
            <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Export your contact to iOS, Android, Google Contacts and Outlook.
            </p>
          </div>
        </div>
      </main>

      <footer className={`relative z-10 border-t py-4 px-6 text-center text-xs transition-colors ${isDark ? "border-slate-800/60 text-slate-500" : "border-slate-200 text-slate-500"}`}>
        DOCTORZ Co. • Digital Patient Health Card & Telehealth
      </footer>
    </div>
  );
}
