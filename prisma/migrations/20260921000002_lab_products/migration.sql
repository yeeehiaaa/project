-- Module laboratoires pharmaceutiques : catalogue + notifications médecins
CREATE TABLE "LabProduct" (
  "id" TEXT NOT NULL,
  "facilityId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "dci" TEXT,
  "dosage" TEXT,
  "forme" TEXT,
  "indications" TEXT,
  "price" DECIMAL(10,2),
  "description" TEXT,
  "docUrl" TEXT,
  "docName" TEXT,
  "specialtyIds" TEXT[] NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "views" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LabProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DoctorNotification" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DoctorNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LabProduct_facilityId_idx" ON "LabProduct"("facilityId");
CREATE INDEX "LabProduct_status_idx" ON "LabProduct"("status");
CREATE INDEX "DoctorNotification_doctorId_idx" ON "DoctorNotification"("doctorId");
CREATE INDEX "DoctorNotification_productId_idx" ON "DoctorNotification"("productId");

ALTER TABLE "LabProduct" ADD CONSTRAINT "LabProduct_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "HealthcareFacility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
