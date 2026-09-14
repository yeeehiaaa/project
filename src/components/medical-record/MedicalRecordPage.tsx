"use client";

import { motion } from "framer-motion";

import MedicalHeader from "@/components/medical-record/MedicalHeader";
import PatientInformation from "@/components/medical-record/PatientInformation";
import VitalSigns from "@/components/medical-record/VitalSigns";
import MedicalHistory from "@/components/medical-record/MedicalHistory";
import CurrentMedications from "@/components/medical-record/CurrentMedications";
import AllergiesCard from "@/components/medical-record/AllergiesCard";
import VaccinationCard from "@/components/medical-record/VaccinationCard";
import LaboratoryResults from "@/components/medical-record/LabResults";
import MedicalTimeline from "@/components/medical-record/MedicalTimeline";
import MedicalDocuments from "@/components/medical-record/MedicalDocuments";

export default function MedicalRecordPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-7xl space-y-8"
    >
      {/* Header */}
      <MedicalHeader />

      {/* Patient Information */}
      <PatientInformation />

      {/* Vital Signs */}
      <VitalSigns />

      {/* Medical History + Allergies */}
      <div className="grid gap-8 xl:grid-cols-2">
        <MedicalHistory />
        <AllergiesCard />
      </div>

      {/* Medications + Vaccinations */}
      <div className="grid gap-8 xl:grid-cols-2">
        <CurrentMedications />
        <VaccinationCard />
      </div>

      {/* Laboratory Results */}
      <LaboratoryResults />

      {/* Timeline */}
<MedicalTimeline />
<MedicalDocuments />
    </motion.div>
  );
}