import { z } from "zod";

export const eventTypeSchema = z.enum(["MORBIDITY", "MORTALITY"]);
export const sourceTypeSchema = z.enum(["INDIVIDUAL_CASES", "MONTHLY_CONSOLIDATED"]);
export const inputMethodSchema = z.enum(["FORM", "CSV", "XLSX"]);

/**
 * Convierte de forma segura un valor de query string a entero.
 * Devuelve `undefined` si el input es nulo, vacío o no numérico,
 * evitando propagar NaN a Prisma.
 */
export function safeInt(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return undefined;
  return n;
}

/**
 * Phase derivada en el servidor a partir de la edad, ignorando el valor
 * enviado por el cliente. Esto evita que un payload malicioso asocie
 * `age: 10` con `phase: LATE_18_19`.
 */
function derivePhase(age: number): "EARLY_10_13" | "MIDDLE_14_17" | "LATE_18_19" {
  if (age >= 10 && age <= 13) return "EARLY_10_13";
  if (age >= 14 && age <= 17) return "MIDDLE_14_17";
  return "LATE_18_19";
}

export const submissionSchema = z.object({
  municipalityId: z.string().min(1),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  eventType: eventTypeSchema,
  sourceType: sourceTypeSchema,
  inputMethod: inputMethodSchema.default("FORM"),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const caseSchemaBase = z.object({
  submissionId: z.string().min(1),
  eventDate: z.coerce.date(),
  municipalityIdSnapshot: z.string().min(1),
  age: z.coerce.number().int().min(10).max(19),
  phase: z.enum(["EARLY_10_13", "MIDDLE_14_17", "LATE_18_19"]),
  sex: z.enum(["FEMALE", "MALE", "NOT_REPORTED"]),
  zone: z.enum(["URBAN", "RURAL"]).optional().nullable(),
  diagnosis: z.string().trim().max(220).optional().nullable(),
  cie10Code: z.string().trim().max(12).optional().nullable(),
  causeOfDeath: z.string().trim().max(220).optional().nullable(),
  deathCie10Code: z.string().trim().max(12).optional().nullable(),
  educationLevel: z.string().trim().max(120).optional().nullable(),
  stratum: z.coerce.number().int().min(1).max(6).optional().nullable(),
  ethnicity: z.string().trim().max(120).optional().nullable(),
  affiliationRegime: z.enum(["UNAFFILIATED", "SUBSIDIZED", "CONTRIBUTORY"]).optional().nullable(),
});

export const caseSchema = caseSchemaBase.transform((value) => ({
  ...value,
  phase: derivePhase(value.age),
}));

export const consolidatedRowSchemaBase = z.object({
  age: z.coerce.number().int().min(10).max(19).optional().nullable(),
  phase: z.enum(["EARLY_10_13", "MIDDLE_14_17", "LATE_18_19"]).optional().nullable(),
  sex: z.enum(["FEMALE", "MALE", "NOT_REPORTED"]).optional().nullable(),
  zone: z.enum(["URBAN", "RURAL"]).optional().nullable(),
  diagnosis: z.string().trim().max(220).optional().nullable(),
  cie10Code: z.string().trim().max(12).optional().nullable(),
  causeOfDeath: z.string().trim().max(220).optional().nullable(),
  deathCie10Code: z.string().trim().max(12).optional().nullable(),
  educationLevel: z.string().trim().max(120).optional().nullable(),
  stratum: z.coerce.number().int().min(1).max(6).optional().nullable(),
  ethnicity: z.string().trim().max(120).optional().nullable(),
  affiliationRegime: z.enum(["UNAFFILIATED", "SUBSIDIZED", "CONTRIBUTORY"]).optional().nullable(),
  caseCount: z.coerce.number().int().positive(),
});

export const consolidatedRowSchema = consolidatedRowSchemaBase.transform((row) => ({
  ...row,
  phase: row.age !== null && row.age !== undefined ? derivePhase(row.age) : row.phase,
}));

export const populationRowSchema = z.object({
  municipalityId: z.string().min(1),
  year: z.coerce.number().int().min(2000).max(2100),
  age: z.coerce.number().int().min(10).max(19),
  sex: z.enum(["FEMALE", "MALE", "NOT_REPORTED"]),
  populationCount: z.coerce.number().int().nonnegative(),
});

export const importSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("INDIVIDUAL_CASES"),
    submission: submissionSchema.extend({ sourceType: z.literal("INDIVIDUAL_CASES") }),
    rows: z.array(caseSchemaBase.omit({ submissionId: true })).min(1).max(10000),
  }),
  z.object({
    kind: z.literal("MONTHLY_CONSOLIDATED"),
    submission: submissionSchema.extend({ sourceType: z.literal("MONTHLY_CONSOLIDATED") }),
    rows: z.array(consolidatedRowSchemaBase).min(1).max(10000),
  }),
  z.object({
    kind: z.literal("POPULATION"),
    rows: z.array(populationRowSchema).min(1).max(10000),
  }),
]);

