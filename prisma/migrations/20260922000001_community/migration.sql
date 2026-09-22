-- Communauté médecins : posts, sondages, commentaires, mentions
ALTER TABLE "DoctorNotification" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "DoctorNotification" ADD COLUMN "postId" TEXT;
CREATE INDEX "DoctorNotification_postId_idx" ON "DoctorNotification"("postId");

CREATE TABLE "DoctorPost" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'POST',
  "title" TEXT,
  "text" TEXT NOT NULL,
  "mediaPath" TEXT,
  "mediaType" TEXT,
  "specialtyIds" TEXT[] NOT NULL DEFAULT '{}',
  "pollOptions" JSONB,
  "eventDate" TIMESTAMP(3),
  "eventPlace" TEXT,
  "hidden" BOOLEAN NOT NULL DEFAULT false,
  "reportsCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DoctorPost_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DoctorPost_doctorId_idx" ON "DoctorPost"("doctorId");
CREATE INDEX "DoctorPost_kind_idx" ON "DoctorPost"("kind");
CREATE INDEX "DoctorPost_createdAt_idx" ON "DoctorPost"("createdAt");

CREATE TABLE "PostComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "parentId" TEXT,
  "text" TEXT NOT NULL,
  "mentionedDoctorIds" TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PostComment_postId_idx" ON "PostComment"("postId");
CREATE INDEX "PostComment_parentId_idx" ON "PostComment"("parentId");

CREATE TABLE "PostLike" (
  "postId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostLike_pkey" PRIMARY KEY ("postId", "doctorId")
);
CREATE INDEX "PostLike_postId_idx" ON "PostLike"("postId");

CREATE TABLE "PostBookmark" (
  "postId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostBookmark_pkey" PRIMARY KEY ("postId", "doctorId")
);
CREATE INDEX "PostBookmark_doctorId_idx" ON "PostBookmark"("doctorId");

CREATE TABLE "PostReport" (
  "postId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostReport_pkey" PRIMARY KEY ("postId", "doctorId")
);

CREATE TABLE "PollVote" (
  "postId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "optionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PollVote_pkey" PRIMARY KEY ("postId", "doctorId")
);
CREATE INDEX "PollVote_postId_idx" ON "PollVote"("postId");

CREATE TABLE "EventRsvp" (
  "postId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventRsvp_pkey" PRIMARY KEY ("postId", "doctorId")
);
CREATE INDEX "EventRsvp_postId_idx" ON "EventRsvp"("postId");
