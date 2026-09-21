import type { Metadata } from "next";
import DoctorVirtualCard from "@/components/doctor/DoctorVirtualCard";

export const metadata: Metadata = {
  title: "Carte Professionnelle Virtuelle | DOCTORZ Co.",
  description:
    "Carte de visite et badge professionnel interactif 3D du médecin praticien sur DOCTORZ Co.",
};

export default function DoctorCardPage() {
  return <DoctorVirtualCard />;
}
