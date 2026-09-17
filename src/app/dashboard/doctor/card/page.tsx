import type { Metadata } from "next";
import DoctorVirtualCard from "@/components/doctor/DoctorVirtualCard";

export const metadata: Metadata = {
  title: "Carte Professionnelle Virtuelle | MediConnect AI",
  description:
    "Carte de visite et badge professionnel interactif 3D du médecin praticien sur MediConnect AI.",
};

export default function DoctorCardPage() {
  return <DoctorVirtualCard />;
}
