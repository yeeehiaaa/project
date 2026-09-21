-- CreateTable
CREATE TABLE "DoctorThread" (
    "id" TEXT NOT NULL,
    "groupName" TEXT,
    "specialty" TEXT,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorThreadMember" (
    "threadId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DoctorThreadMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "readBy" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorThreadMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoctorThread_updatedAt_idx" ON "DoctorThread"("updatedAt");

-- CreateIndex
CREATE INDEX "DoctorThreadMember_doctorId_idx" ON "DoctorThreadMember"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorThreadMessage_threadId_idx" ON "DoctorThreadMessage"("threadId");

-- AddForeignKey
ALTER TABLE "DoctorThreadMember" ADD CONSTRAINT "DoctorThreadMember_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "DoctorThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorThreadMessage" ADD CONSTRAINT "DoctorThreadMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "DoctorThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
