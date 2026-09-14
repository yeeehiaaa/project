-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('PATIENT', 'DOCTOR', 'PHARMACIST', 'LABORATORY_STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('IN_PERSON', 'ONLINE', 'HOME_VISIT');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RefillStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LaboratoryStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResultFlag" AS ENUM ('NORMAL', 'LOW', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM ('HOSPITAL', 'CLINIC', 'PRIVATE_OFFICE', 'PHARMACY', 'LABORATORY', 'HEALTH_CENTER');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nationalId" TEXT,
    "gender" "Gender",
    "birthDate" TIMESTAMP(3),
    "preferredLanguage" TEXT NOT NULL DEFAULT 'fr',
    "phone" TEXT,
    "avatarUrl" TEXT,
    "address" TEXT,
    "city" TEXT,
    "wilaya" TEXT,
    "postalCode" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthcareFacility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FacilityType" NOT NULL,
    "registrationNumber" TEXT,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "wilaya" TEXT,
    "postalCode" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "openingHours" JSONB,
    "emergencyService" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthcareFacility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "nationalRegistration" TEXT,
    "biography" TEXT,
    "yearsExperience" INTEGER,
    "consultationLanguages" TEXT,
    "education" TEXT,
    "certifications" TEXT,
    "consultationFee" DECIMAL(10,2),
    "consultationDuration" INTEGER,
    "acceptsOnline" BOOLEAN NOT NULL DEFAULT false,
    "acceptsHomeVisit" BOOLEAN NOT NULL DEFAULT false,
    "isAcceptingNewPatients" BOOLEAN NOT NULL DEFAULT true,
    "averageRating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorSpecialty" (
    "doctorId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,

    CONSTRAINT "DoctorSpecialty_pkey" PRIMARY KEY ("doctorId","specialtyId")
);

-- CreateTable
CREATE TABLE "DoctorFacility" (
    "doctorId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,

    CONSTRAINT "DoctorFacility_pkey" PRIMARY KEY ("doctorId","facilityId")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "guardianFirstName" TEXT,
    "guardianLastName" TEXT,
    "guardianEmail" TEXT,
    "guardianPhone" TEXT,
    "guardianRelation" TEXT,
    "bloodType" TEXT,
    "allergies" TEXT,
    "chronicConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pharmacist" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pharmacist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacistFacility" (
    "pharmacistId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,

    CONSTRAINT "PharmacistFacility_pkey" PRIMARY KEY ("pharmacistId","facilityId")
);

-- CreateTable
CREATE TABLE "LaboratoryStaff" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaboratoryStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaboratoryFacility" (
    "laboratoryStaffId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,

    CONSTRAINT "LaboratoryFacility_pkey" PRIMARY KEY ("laboratoryStaffId","facilityId")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "type" "AppointmentType" NOT NULL DEFAULT 'IN_PERSON',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "notes" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "title" TEXT NOT NULL,
    "diagnosis" TEXT,
    "symptoms" TEXT,
    "notes" TEXT,
    "recordDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "prescriptionNumber" TEXT NOT NULL,
    "prescribedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT,
    "route" TEXT,
    "durationDays" INTEGER,
    "quantity" INTEGER,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefillRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "requestedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RefillStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "response" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefillRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaboratoryResult" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "laboratoryName" TEXT,
    "testDate" TIMESTAMP(3) NOT NULL,
    "status" "LaboratoryStatus" NOT NULL DEFAULT 'PENDING',
    "reportUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaboratoryResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaboratoryParameter" (
    "id" TEXT NOT NULL,
    "laboratoryResultId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "referenceMin" DECIMAL(10,3),
    "referenceMax" DECIMAL(10,3),
    "flag" "ResultFlag" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LaboratoryParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaccination" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "dose" TEXT,
    "vaccinationDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "provider" TEXT,
    "batchNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "title" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_authUserId_key" ON "Profile"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_nationalId_key" ON "Profile"("nationalId");

-- CreateIndex
CREATE INDEX "Profile_userType_idx" ON "Profile"("userType");

-- CreateIndex
CREATE INDEX "Profile_city_idx" ON "Profile"("city");

-- CreateIndex
CREATE INDEX "Profile_wilaya_idx" ON "Profile"("wilaya");

-- CreateIndex
CREATE UNIQUE INDEX "HealthcareFacility_registrationNumber_key" ON "HealthcareFacility"("registrationNumber");

-- CreateIndex
CREATE INDEX "HealthcareFacility_type_idx" ON "HealthcareFacility"("type");

-- CreateIndex
CREATE INDEX "HealthcareFacility_city_idx" ON "HealthcareFacility"("city");

-- CreateIndex
CREATE INDEX "HealthcareFacility_wilaya_idx" ON "HealthcareFacility"("wilaya");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_name_key" ON "Specialty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_profileId_key" ON "Doctor"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_licenseNumber_key" ON "Doctor"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_nationalRegistration_key" ON "Doctor"("nationalRegistration");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_profileId_key" ON "Patient"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Pharmacist_profileId_key" ON "Pharmacist"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Pharmacist_licenseNumber_key" ON "Pharmacist"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LaboratoryStaff_profileId_key" ON "LaboratoryStaff"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "LaboratoryStaff_licenseNumber_key" ON "LaboratoryStaff"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_profileId_key" ON "Admin"("profileId");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_idx" ON "Appointment"("doctorId");

-- CreateIndex
CREATE INDEX "Appointment_appointmentDate_idx" ON "Appointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "MedicalRecord_patientId_idx" ON "MedicalRecord"("patientId");

-- CreateIndex
CREATE INDEX "MedicalRecord_doctorId_idx" ON "MedicalRecord"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_prescriptionNumber_key" ON "Prescription"("prescriptionNumber");

-- CreateIndex
CREATE INDEX "Prescription_patientId_idx" ON "Prescription"("patientId");

-- CreateIndex
CREATE INDEX "Prescription_doctorId_idx" ON "Prescription"("doctorId");

-- CreateIndex
CREATE INDEX "Prescription_status_idx" ON "Prescription"("status");

-- CreateIndex
CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");

-- CreateIndex
CREATE INDEX "RefillRequest_patientId_idx" ON "RefillRequest"("patientId");

-- CreateIndex
CREATE INDEX "RefillRequest_prescriptionId_idx" ON "RefillRequest"("prescriptionId");

-- CreateIndex
CREATE INDEX "RefillRequest_status_idx" ON "RefillRequest"("status");

-- CreateIndex
CREATE INDEX "LaboratoryResult_patientId_idx" ON "LaboratoryResult"("patientId");

-- CreateIndex
CREATE INDEX "LaboratoryResult_testDate_idx" ON "LaboratoryResult"("testDate");

-- CreateIndex
CREATE INDEX "LaboratoryResult_status_idx" ON "LaboratoryResult"("status");

-- CreateIndex
CREATE INDEX "LaboratoryParameter_laboratoryResultId_idx" ON "LaboratoryParameter"("laboratoryResultId");

-- CreateIndex
CREATE INDEX "Vaccination_patientId_idx" ON "Vaccination"("patientId");

-- CreateIndex
CREATE INDEX "Vaccination_vaccinationDate_idx" ON "Vaccination"("vaccinationDate");

-- CreateIndex
CREATE INDEX "AIConversation_patientId_idx" ON "AIConversation"("patientId");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_idx" ON "AIMessage"("conversationId");

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSpecialty" ADD CONSTRAINT "DoctorSpecialty_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSpecialty" ADD CONSTRAINT "DoctorSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorFacility" ADD CONSTRAINT "DoctorFacility_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorFacility" ADD CONSTRAINT "DoctorFacility_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "HealthcareFacility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pharmacist" ADD CONSTRAINT "Pharmacist_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacistFacility" ADD CONSTRAINT "PharmacistFacility_pharmacistId_fkey" FOREIGN KEY ("pharmacistId") REFERENCES "Pharmacist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacistFacility" ADD CONSTRAINT "PharmacistFacility_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "HealthcareFacility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratoryStaff" ADD CONSTRAINT "LaboratoryStaff_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratoryFacility" ADD CONSTRAINT "LaboratoryFacility_laboratoryStaffId_fkey" FOREIGN KEY ("laboratoryStaffId") REFERENCES "LaboratoryStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratoryFacility" ADD CONSTRAINT "LaboratoryFacility_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "HealthcareFacility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefillRequest" ADD CONSTRAINT "RefillRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefillRequest" ADD CONSTRAINT "RefillRequest_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratoryResult" ADD CONSTRAINT "LaboratoryResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaboratoryParameter" ADD CONSTRAINT "LaboratoryParameter_laboratoryResultId_fkey" FOREIGN KEY ("laboratoryResultId") REFERENCES "LaboratoryResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
