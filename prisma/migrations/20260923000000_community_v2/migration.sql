-- Communauté v2 : conclusion des cas, vues, dislikes, votes commentaires
ALTER TABLE "DoctorPost" ADD COLUMN "outcome" TEXT;
ALTER TABLE "DoctorPost" ADD COLUMN "outcomeAt" TIMESTAMP(3);
ALTER TABLE "DoctorPost" ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PostComment" ADD COLUMN "edited" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "PostDislike" (
  "postId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostDislike_pkey" PRIMARY KEY ("postId", "doctorId")
);
CREATE INDEX "PostDislike_postId_idx" ON "PostDislike"("postId");

CREATE TABLE "CommentVote" (
  "postId" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommentVote_pkey" PRIMARY KEY ("commentId", "doctorId")
);
CREATE INDEX "CommentVote_commentId_idx" ON "CommentVote"("commentId");
CREATE INDEX "CommentVote_postId_idx" ON "CommentVote"("postId");
