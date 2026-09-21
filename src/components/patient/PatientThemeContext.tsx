"use client";

import { createContext, useContext } from "react";

export interface PatientThemeContextValue {
  theme: "light" | "dark";
  isDark: boolean;
}

export const PatientThemeContext = createContext<PatientThemeContextValue>({
  theme: "light",
  isDark: false,
});

export function usePatientTheme() {
  return useContext(PatientThemeContext);
}
