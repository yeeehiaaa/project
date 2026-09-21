import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import { Sparkles, ArrowLeft, ShieldCheck, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In | DOCTORZ Co.",
  description:
    "Sign in to your DOCTORZ Co. account to manage appointments, consult medical records, or access your clinical provider dashboard.",
};

export default function LoginPage() {
  return (
    <main
      id="login-page-main"
      className="relative min-h-screen w-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-50 via-slate-50 to-indigo-50/30 selection:bg-violet-600 selection:text-white px-4 py-8 sm:px-6 sm:py-10"
    >
      {/* Background Subtle Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[360px] bg-gradient-to-b from-violet-200/40 via-indigo-100/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Top Header Navigation */}
      <header className="relative z-10 w-full max-w-md flex items-center justify-between">
        <Link
          id="login-header-logo"
          href="/"
          className="inline-flex items-center gap-2.5 group transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                DOCTORZ Co.
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold uppercase rounded bg-violet-100 text-violet-700">
                AI
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 leading-none">
              Healthcare Platform
            </p>
          </div>
        </Link>

        <Link
          id="back-to-home-link"
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-violet-700 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-200/60"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Center Sign-In Card */}
      <section
        id="login-card-container"
        className="relative z-10 w-full max-w-md my-auto pt-6 pb-4"
      >
        <LoginForm />
      </section>

      {/* Bottom Trust & Compliance Footer */}
      <footer className="relative z-10 w-full max-w-md text-center pt-4">
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500 mb-2">
          <div className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>HIPAA Aligned</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <Lock size={13} className="text-violet-600" />
            <span>256-Bit SSL Encryption</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} DOCTORZ Co. Inc. All health records are
          protected under strict medical confidentiality regulations.
        </p>
      </footer>
    </main>
  );
}
