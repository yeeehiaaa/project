-- Ordonnance jointe à la réservation (fichier image/PDF en data URL, optionnel)
ALTER TABLE "StockRequest" ADD COLUMN "prescriptionFileUrl" TEXT;
ALTER TABLE "StockRequest" ADD COLUMN "prescriptionFileName" TEXT;
