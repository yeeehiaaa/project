import PrescriptionHero from "@/components/prescriptions/PrescriptionHero";
import PrescriptionStats from "@/components/prescriptions/PrescriptionStats";
import ActivePrescriptions from "@/components/prescriptions/ActivePrescriptions";
import MedicationSchedule from "@/components/prescriptions/MedicationSchedule";
import AIPharmacistCard from "@/components/prescriptions/AIPharmacistCard";
import DrugInteractions from "@/components/prescriptions/DrugInteractions";
import PrescriptionHistory from "@/components/prescriptions/PrescriptionHistory";

export default function PrescriptionsPage() {
  return (
    <div className="space-y-8">
      <PrescriptionHero />

      <PrescriptionStats />

      <ActivePrescriptions />

      <MedicationSchedule />

      <AIPharmacistCard />

      <DrugInteractions />

      <PrescriptionHistory />
    </div>
  );
}