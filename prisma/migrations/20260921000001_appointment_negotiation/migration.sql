-- Négociation de créneaux RDV : contre-proposition médecin/patient
ALTER TYPE "AppointmentStatus" ADD VALUE 'RESCHEDULED';
ALTER TABLE "Appointment" ADD COLUMN "previousDate" TIMESTAMP(3);
