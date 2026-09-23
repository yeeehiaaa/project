-- Communauté v3 : hashtags, vues déjà là, dislikes déjà là, protocoles, quiz, suivi, stories, expertise, push
ALTER TABLE "DoctorPost" ADD COLUMN "hashtags" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "DoctorPost" ADD COLUMN "mediaPaths" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "DoctorPost" ADD COLUMN "pollDeadline" TIMESTAMP(3);
ALTER TABLE "DoctorNotification" ADD COLUMN "teleExpertiseId" TEXT;

CREATE TABLE "DoctorFollow" (
  "followerId" TEXT NOT NULL,
  "followedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DoctorFollow_pkey" PRIMARY KEY ("followerId", "followedId")
);
CREATE INDEX "DoctorFollow_followerId_idx" ON "DoctorFollow"("followerId");
CREATE INDEX "DoctorFollow_followedId_idx" ON "DoctorFollow"("followedId");

CREATE TABLE "Protocol" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "specialtyId" TEXT,
  "content" TEXT NOT NULL,
  "filePath" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "validated" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Protocol_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Protocol_specialtyId_idx" ON "Protocol"("specialtyId");

CREATE TABLE "ProtocolConfirm" (
  "protocolId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProtocolConfirm_pkey" PRIMARY KEY ("protocolId", "doctorId")
);
CREATE INDEX "ProtocolConfirm_protocolId_idx" ON "ProtocolConfirm"("protocolId");

CREATE TABLE "Quiz" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "specialtyIds" TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Quiz_doctorId_idx" ON "Quiz"("doctorId");

CREATE TABLE "QuizQuestion" (
  "id" TEXT NOT NULL,
  "quizId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "options" JSONB NOT NULL,
  "correct" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId");

CREATE TABLE "QuizAttempt" (
  "id" TEXT NOT NULL,
  "quizId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");
CREATE INDEX "QuizAttempt_doctorId_idx" ON "QuizAttempt"("doctorId");

CREATE TABLE "Story" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "text" TEXT,
  "mediaPath" TEXT,
  "mediaType" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Story_doctorId_idx" ON "Story"("doctorId");
CREATE INDEX "Story_expiresAt_idx" ON "Story"("expiresAt");

CREATE TABLE "TeleExpertise" (
  "id" TEXT NOT NULL,
  "postId" TEXT,
  "fromDoctorId" TEXT NOT NULL,
  "toDoctorId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeleExpertise_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TeleExpertise_toDoctorId_idx" ON "TeleExpertise"("toDoctorId");
CREATE INDEX "TeleExpertise_fromDoctorId_idx" ON "TeleExpertise"("fromDoctorId");

CREATE TABLE "PushSubscription" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_doctorId_idx" ON "PushSubscription"("doctorId");
