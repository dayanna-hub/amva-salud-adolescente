import { z } from "zod";

export const eventTypeSchema = z.enum(["MORBIDITY", "MORTALITY"]);
export const sourceTypeSchema = z.enum(["INDIVIDUAL_CASES", "MONTHLY_CONSOLIDATED"]);
export const inputMethodSchema = z.enum(["FORM", "CSV", "XLSX"]);

export const submissionSchema = z.object({
  municipalityId: z.string().min(1),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  eventType: eventTypeSchema,
  sourceType: sourceTypeSchema,
  inputMethod: inputMethodSchema.default("FORM"),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const caseSchema = z.object({
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

export const consolidatedRowSchema = z.object({
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
    rows: z.array(caseSchema.omit({ submissionId: true })).min(1).max(10000),
  }),
  z.object({
    kind: z.literal("MONTHLY_CONSOLIDATED"),
    submission: submissionSchema.extend({ sourceType: z.literal("MONTHLY_CONSOLIDATED") }),
    rows: z.array(consolidatedRowSchema).min(1).max(10000),
  }),
  z.object({
    kind: z.literal("POPULATION"),
    rows: z.array(populationRowSchema).min(1).max(10000),
  }),
]);
