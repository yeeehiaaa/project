-- AlterTable : pièce jointe (fichier ou élément médical partagé) au format JSON
ALTER TABLE "DirectMessage" ADD COLUMN "attachment" JSONB;
