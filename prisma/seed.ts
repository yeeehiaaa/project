import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const specialties = [
  {
    name: "Médecine générale",
    description: "Prise en charge générale et première orientation médicale.",
  },
  {
    name: "Cardiologie",
    description: "Diagnostic et prise en charge des maladies cardiovasculaires.",
  },
  {
    name: "Dermatologie",
    description: "Maladies de la peau, des cheveux et des ongles.",
  },
  {
    name: "Pédiatrie",
    description: "Soins médicaux destinés aux enfants et adolescents.",
  },
  {
    name: "Gynécologie",
    description: "Santé gynécologique et reproductive.",
  },
  {
    name: "Neurologie",
    description: "Maladies du système nerveux.",
  },
  {
    name: "Psychiatrie",
    description: "Santé mentale et troubles psychiatriques.",
  },
  {
    name: "Ophtalmologie",
    description: "Maladies et troubles de la vision et des yeux.",
  },
  {
    name: "ORL",
    description: "Maladies de l'oreille, du nez et de la gorge.",
  },
  {
    name: "Orthopédie",
    description: "Maladies et traumatismes de l'appareil locomoteur.",
  },
  {
    name: "Gastro-entérologie",
    description: "Maladies du système digestif.",
  },
  {
    name: "Pneumologie",
    description: "Maladies des poumons et des voies respiratoires.",
  },
  {
    name: "Endocrinologie",
    description: "Maladies hormonales et métaboliques.",
  },
  {
    name: "Urologie",
    description: "Maladies de l'appareil urinaire et génital masculin.",
  },
  {
    name: "Rhumatologie",
    description: "Maladies des articulations, muscles et os.",
  },
  {
    name: "Chirurgie générale",
    description: "Prise en charge chirurgicale de différentes pathologies.",
  },
];

async function main() {
  for (const specialty of specialties) {
    await prisma.specialty.upsert({
      where: {
        name: specialty.name,
      },
      update: {
        description: specialty.description,
      },
      create: specialty,
    });
  }

  console.log("Specialties seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });