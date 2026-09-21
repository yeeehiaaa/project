"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import DashboardContent from "@/components/dashboard/DashboardContent";
import PatientIpadDock, { PatientTabType } from "@/components/patient/PatientIpadDock";
import { usePatientTheme } from "@/components/patient/PatientThemeContext";

// Existing patient sections reused as tab content (no content change)
import AppointmentsPage from "./appointments/AppointmentsList";
import AIAssistantPage from "./ai-assistant/page";
import PatientMessagesPage from "./messages/page";
import MedicalRecordPage from "./medical-record/page";
import LaboratoryPage from "./laboratory/page";
import PrescriptionsPage from "./prescriptions/page";
import PharmaciesPage from "./pharmacies/page";
import VaccinationsPage from "./vaccinations/page";
import PatientProfilePage from "./profile/page";

const VALID_TABS: PatientTabType[] = [
  "dashboard",
  "appointments",
  "ai_assistant",
  "messages",
  "medical_record",
  "laboratory",
  "prescriptions",
  "pharmacies",
  "vaccinations",
  "profile",
];

function PatientDashboard() {
  const searchParams = useSearchParams();
  const { isDark } = usePatientTheme();

  const requestedTab = searchParams.get("tab") as PatientTabType | null;
  const [activeTab, setActiveTab] = useState<PatientTabType>(
    requestedTab && VALID_TABS.includes(requestedTab) ? requestedTab : "dashboard"
  );

  return (
    <div className="pb-24 sm:pb-28">
      {activeTab === "dashboard" && <DashboardContent />}
      {activeTab === "appointments" && <AppointmentsPage />}
      {activeTab === "ai_assistant" && <AIAssistantPage />}
      {activeTab === "messages" && <PatientMessagesPage />}
      {activeTab === "medical_record" && <MedicalRecordPage />}
      {activeTab === "laboratory" && <LaboratoryPage />}
      {activeTab === "prescriptions" && <PrescriptionsPage />}
      {activeTab === "pharmacies" && <PharmaciesPage />}
      {activeTab === "vaccinations" && <VaccinationsPage />}
      {activeTab === "profile" && <PatientProfilePage />}

      <PatientIpadDock activeTab={activeTab} onChangeTab={setActiveTab} isDark={isDark} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <PatientDashboard />
    </Suspense>
  );
}
