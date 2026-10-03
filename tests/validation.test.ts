import { describe, it, expect } from "vitest";
import { caseSchema, consolidatedRowSchema, safeInt } from "@/lib/validation";

describe("safeInt", () => {
  it("devuelve undefined para valores nulos o vacíos", () => {
    expect(safeInt(null)).toBeUndefined();
    expect(safeInt("")).toBeUndefined();
    expect(safeInt(undefined)).toBeUndefined();
  });

  it("devuelve undefined para valores no numéricos", () => {
    expect(safeInt("abc")).toBeUndefined();
    expect(safeInt("12.5")).toBeUndefined();
    expect(safeInt("NaN")).toBeUndefined();
  });

  it("devuelve el entero para valores válidos", () => {
    expect(safeInt("2026")).toBe(2026);
    expect(safeInt("0")).toBe(0);
    expect(safeInt("-3")).toBe(-3);
  });
});

describe("caseSchema - phase derivada del server", () => {
  it("ignora el phase enviado por el cliente y deriva de la edad", () => {
    // Payload malicioso: age=10 con phase=LATE_18_19
    const parsed = caseSchema.safeParse({
      submissionId: "cm123",
      eventDate: "2026-01-15",
      municipalityIdSnapshot: "muni123",
      age: 10,
      phase: "LATE_18_19", // inconsistente con age=10
      sex: "FEMALE",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      // El servidor debe derivar EARLY_10_13 a partir de age=10
      expect(parsed.data.phase).toBe("EARLY_10_13");
    }
  });

  it("acepta edad válida 14-17 → MIDDLE_14_17", () => {
    const parsed = caseSchema.safeParse({
      submissionId: "cm123",
      eventDate: "2026-01-15",
      municipalityIdSnapshot: "muni123",
      age: 15,
      phase: "EARLY_10_13", // el cliente manda lo que sea
      sex: "MALE",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phase).toBe("MIDDLE_14_17");
    }
  });

  it("rechaza edad fuera de rango adolescente", () => {
    const parsed = caseSchema.safeParse({
      submissionId: "cm123",
      eventDate: "2026-01-15",
      municipalityIdSnapshot: "muni123",
      age: 9,
      phase: "EARLY_10_13",
      sex: "FEMALE",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("consolidatedRowSchema - phase derivada si edad presente", () => {
  it("deriva phase de age cuando age está presente", () => {
    const parsed = consolidatedRowSchema.safeParse({
      age: 18,
      phase: "EARLY_10_13", // inconsistente
      caseCount: 5,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phase).toBe("LATE_18_19");
    }
  });

  it("respeta el phase enviado si age no está presente", () => {
    const parsed = consolidatedRowSchema.safeParse({
      age: null,
      phase: "MIDDLE_14_17",
      caseCount: 5,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phase).toBe("MIDDLE_14_17");
    }
  });
});
