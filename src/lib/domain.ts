export const municipalities = [
  "Barbosa",
  "Bello",
  "Caldas",
  "Copacabana",
  "Envigado",
  "Girardota",
  "Itagüí",
  "La Estrella",
  "Medellín",
  "Sabaneta",
] as const;

export const phases = [
  { value: "EARLY_10_13", label: "Adolescencia temprana (10–13)" },
  { value: "MIDDLE_14_17", label: "Adolescencia media (14–17)" },
  { value: "LATE_18_19", label: "Adolescencia tardía (18–19)" },
] as const;

export function phaseFromAge(age: number) {
  if (age >= 10 && age <= 13) return "EARLY_10_13";
  if (age >= 14 && age <= 17) return "MIDDLE_14_17";
  if (age >= 18 && age <= 19) return "LATE_18_19";
  return null;
}
