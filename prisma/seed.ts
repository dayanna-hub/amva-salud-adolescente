import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

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

const seedUsers = [
  { name: "Super Admin AMVA", email: "admin@amva.gov.co", role: "SUPER_ADMIN" as UserRole, municipalityCode: null },
  { name: "Admin Medellín", email: "medellin@amva.gov.co", role: "ADMIN_MUNICIPAL" as UserRole, municipalityCode: "05001" },
  { name: "Digitador Caldas", email: "caldas@amva.gov.co", role: "DIGITADOR" as UserRole, municipalityCode: "05129" },
  { name: "Analista AMVA", email: "analista@amva.gov.co", role: "ANALISTA" as UserRole, municipalityCode: null },
];

const DEFAULT_PASSWORD = "Cambiar123!";

async function main() {
  const municipalityByCode = new Map<string, string>();

  for (const [code, name] of municipalities) {
    const m = await prisma.municipality.upsert({
      where: { code },
      update: { name, active: true },
      create: { code, name },
    });
    municipalityByCode.set(code, m.id);
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const u of seedUsers) {
    const municipalityId = u.municipalityCode ? municipalityByCode.get(u.municipalityCode) ?? null : null;
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        municipalityId,
        active: true,
        passwordHash,
      },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        municipalityId,
        active: true,
        passwordHash,
      },
    });
  }

  console.log(`Seed completado: ${municipalities.length} municipios, ${seedUsers.length} usuarios.`);
  console.log(`Contraseña por defecto para todos los usuarios sembrados: ${DEFAULT_PASSWORD}`);
  console.log("Recuerda rotarla en el primer inicio de sesión.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
