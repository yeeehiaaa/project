-- AlterTable : jeton public d'urgence pour la QR Emergency Card
ALTER TABLE "Patient" ADD COLUMN "emergencyToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Patient_emergencyToken_key" ON "Patient"("emergencyToken");
