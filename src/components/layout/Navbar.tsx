"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Menu, Phone, X, Sparkles } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

 // const navLinks = [
   // { href: "/", label: "Home" },//
   // { href: "#services", label: "Services" },//
   // { href: "#doctors", label: "Doctors" },//
   // { href: "#about", label: "About" },//
   // { href: "#contact", label: "Contact" },//
  //];//

  // Smooth scroll to section
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === "/") return; // Home link – let it navigate normally

    e.preventDefault();
    const targetId = href.replace("#", "");
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      // Close mobile menu after click
      setIsMobileMenuOpen(false);
    }
  };

  const drawerVariants: Variants = {
    hidden: { x: "100%" },
    visible: { x: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
    exit: { x: "100%", transition: { type: "spring", damping: 25, stiffness: 300 } },
  };

  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const linkVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.3 },
    }),
  };

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/25">
              <Sparkles size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">DOCTORZ Co.</h1>
              <p className="text-xs font-medium text-slate-400">AI Healthcare</p>
            </div>
          </Link>

       

          {/* Desktop Actions */}
          <div className="hidden items-center gap-4 lg:flex">
            <a
              href="#emergency"
              onClick={(e) => handleScrollTo(e, "#emergency")}
              className="flex items-center gap-2 rounded-full border border-violet-200 bg-white/50 px-5 py-2.5 text-sm font-medium text-violet-700 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:shadow-md cursor-pointer"
            >
              <Phone size={17} />
              Emergency
            </a>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={28} className="text-slate-600" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Overlay */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute right-0 top-0 h-full w-80 bg-white/95 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex h-full flex-col p-6">
                {/* Close button */}
                <button
                  className="ml-auto rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>

                {/* Brand in drawer */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">DOCTORZ Co.</h2>
                    <p className="text-xs text-slate-400">AI Healthcare</p>
                  </div>
                </div>

               //

                {/* Mobile actions */}
                <div className="mt-auto space-y-3 pb-6">
                  <a
                    href="#emergency"
                    onClick={(e) => handleScrollTo(e, "#emergency")}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-violet-200 bg-white/50 px-5 py-3 text-sm font-medium text-violet-700 shadow-sm backdrop-blur-sm transition-all hover:bg-violet-50 cursor-pointer"
                  >
                    <Phone size={17} />
                    Emergency
                  </a>
                  <Link
                    href="/register"
                    className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:shadow-xl"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}