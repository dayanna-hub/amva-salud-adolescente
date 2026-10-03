import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const municipalities = [
  ["05079", "Barbosa"],
  ["05088", "Bello"],
  ["05129", "Caldas"],
  ["05212", "Copacabana"],
  ["05266", "Envigado"],
  ["05308", "Girardota"],
  ["05360", "Itagüí"],
  ["05380", "La Estrella"],
  ["05001", "Medellín"],
  ["05631", "Sabaneta"],
] as const;

async function main() {
  for (const [code, name] of municipalities) {
    await prisma.municipality.upsert({
      where: { code },
      update: { name, active: true },
      create: { code, name },
    });
  }

  console.log(`Seed completado: ${municipalities.length} municipios.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
