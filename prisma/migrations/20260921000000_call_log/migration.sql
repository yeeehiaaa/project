-- Journal des téléconsultations (durée, mode, horodatage)
CREATE TABLE "CallLog" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'video',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "durationSec" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CallLog_appointmentId_key" ON "CallLog"("appointmentId");
CREATE INDEX "CallLog_doctorId_idx" ON "CallLog"("doctorId");
CREATE INDEX "CallLog_patientId_idx" ON "CallLog"("patientId");
