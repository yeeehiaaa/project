-- CreateTable
CREATE TABLE "PharmacyStock" (
    "id" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "lowThreshold" INTEGER NOT NULL DEFAULT 5,
    "price" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT,
    "prescriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "pickupCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "wilaya" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyStock_facilityId_medicationName_dosage_key" ON "PharmacyStock"("facilityId", "medicationName", "dosage");

-- CreateIndex
CREATE INDEX "PharmacyStock_facilityId_idx" ON "PharmacyStock"("facilityId");

-- CreateIndex
CREATE INDEX "PharmacyStock_medicationName_idx" ON "PharmacyStock"("medicationName");

-- CreateIndex
CREATE UNIQUE INDEX "StockRequest_pickupCode_key" ON "StockRequest"("pickupCode");

-- CreateIndex
CREATE INDEX "StockRequest_patientId_idx" ON "StockRequest"("patientId");

-- CreateIndex
CREATE INDEX "StockRequest_facilityId_idx" ON "StockRequest"("facilityId");

-- CreateIndex
CREATE INDEX "StockRequest_status_idx" ON "StockRequest"("status");

-- CreateIndex
CREATE INDEX "StockAlert_patientId_idx" ON "StockAlert"("patientId");

-- CreateIndex
CREATE INDEX "StockAlert_medicationName_idx" ON "StockAlert"("medicationName");

-- AddForeignKey
ALTER TABLE "PharmacyStock" ADD CONSTRAINT "PharmacyStock_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "HealthcareFacility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockRequest" ADD CONSTRAINT "StockRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockRequest" ADD CONSTRAINT "StockRequest_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "HealthcareFacility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
