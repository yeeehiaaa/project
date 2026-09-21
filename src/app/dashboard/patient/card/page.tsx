import type { Metadata } from "next";
import PatientVirtualCard from "@/components/patient/PatientVirtualCard";

export const metadata: Metadata = {
  title: "My Virtual Health Card | DOCTORZ Co.",
  description:
    "Interactive 3D virtual health card of the patient on DOCTORZ Co.",
};

export default function PatientCardPage() {
  return <PatientVirtualCard />;
}
