import { describe, it, expect } from "vitest";
import { phaseFromAge } from "@/lib/domain";

describe("phaseFromAge", () => {
  it("retorna EARLY_10_13 para 10-13", () => {
    expect(phaseFromAge(10)).toBe("EARLY_10_13");
    expect(phaseFromAge(13)).toBe("EARLY_10_13");
  });

  it("retorna MIDDLE_14_17 para 14-17", () => {
    expect(phaseFromAge(14)).toBe("MIDDLE_14_17");
    expect(phaseFromAge(17)).toBe("MIDDLE_14_17");
  });

  it("retorna LATE_18_19 para 18-19", () => {
    expect(phaseFromAge(18)).toBe("LATE_18_19");
    expect(phaseFromAge(19)).toBe("LATE_18_19");
  });

  it("retorna null para edades fuera del rango adolescente", () => {
    expect(phaseFromAge(9)).toBeNull();
    expect(phaseFromAge(20)).toBeNull();
    expect(phaseFromAge(0)).toBeNull();
  });
});
