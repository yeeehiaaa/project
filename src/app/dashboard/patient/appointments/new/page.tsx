"use client";

import BookWizard from "../BookWizard";

// Deep link used by triage assistant (?specialty=...) and banners.
export default function NewAppointmentPage() {
  return (
    <div className="pb-10">
      <BookWizard
        backHref="/dashboard/patient/appointments"
        doneHref="/dashboard/patient"
        doneLabel="Back to dashboard"
      />
    </div>
  );
}
