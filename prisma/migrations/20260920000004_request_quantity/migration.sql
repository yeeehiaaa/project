-- AlterTable : quantité demandée par le patient (défaut 1)
ALTER TABLE "StockRequest" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
