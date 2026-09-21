"use client";

import Link from "next/link";
import type { ReactNode, MouseEventHandler } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold transition cursor-pointer select-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50";

function variantClasses(variant: Variant, isDark: boolean): string {
  switch (variant) {
    case "primary":
      return "bg-gradient-to-r from-blue-700 to-sky-500 hover:from-blue-600 hover:to-sky-400 text-white px-4 py-2.5";
    case "danger":
      return "bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white px-4 py-2.5";
    case "ghost":
      return isDark
        ? "text-slate-300 hover:text-white hover:bg-white/10 px-3 py-2"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 px-3 py-2";
    case "secondary":
    default:
      return isDark
        ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5"
        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5";
  }
}

export function PButton({
  variant = "primary",
  isDark = false,
  className = "",
  children,
  type = "button",
  ...rest
}: {
  variant?: Variant;
  isDark?: boolean;
  className?: string;
  children: ReactNode;
  type?: "button" | "submit" | "reset";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`${base} ${variantClasses(variant, isDark)} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function PLink({
  href,
  variant = "primary",
  isDark = false,
  className = "",
  children,
  onClick,
}: {
  href: string;
  variant?: Variant;
  isDark?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${base} ${variantClasses(variant, isDark)} ${className}`}
    >
      {children}
    </Link>
  );
}

export function PIconButton({
  title,
  isDark = false,
  className = "",
  children,
  ...rest
}: {
  title: string;
  isDark?: boolean;
  className?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      title={title}
      className={`p-2.5 rounded-xl border transition cursor-pointer active:scale-95 ${
        isDark
          ? "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800"
          : "bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
