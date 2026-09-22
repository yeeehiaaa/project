-- Abonnements freemium (un par profil, FREE par défaut)
CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "userType" TEXT NOT NULL,
  "plan" TEXT NOT NULL DEFAULT 'FREE',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "cycle" TEXT,
  "provider" TEXT,
  "providerRef" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Subscription_profileId_key" ON "Subscription"("profileId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
