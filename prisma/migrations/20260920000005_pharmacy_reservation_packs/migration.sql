-- Réservations groupées : un panier = un code, revue ligne par ligne
CREATE TABLE "PharmacyReservation" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "facilityId" TEXT NOT NULL,
  "pickupCode" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "prescriptionId" TEXT,
  "prescriptionFileUrl" TEXT,
  "prescriptionFileName" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PharmacyReservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PharmacyReservationItem" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "medicationName" TEXT NOT NULL,
  "dosage" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PharmacyReservationItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PharmacyReservation_pickupCode_key" ON "PharmacyReservation"("pickupCode");
CREATE INDEX "PharmacyReservation_patientId_idx" ON "PharmacyReservation"("patientId");
CREATE INDEX "PharmacyReservation_facilityId_idx" ON "PharmacyReservation"("facilityId");
CREATE INDEX "PharmacyReservation_status_idx" ON "PharmacyReservation"("status");
CREATE INDEX "PharmacyReservationItem_reservationId_idx" ON "PharmacyReservationItem"("reservationId");

ALTER TABLE "PharmacyReservation" ADD CONSTRAINT "PharmacyReservation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PharmacyReservation" ADD CONSTRAINT "PharmacyReservation_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "HealthcareFacility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PharmacyReservationItem" ADD CONSTRAINT "PharmacyReservationItem_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "PharmacyReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
