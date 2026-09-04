import { describe, expect, it } from "vitest";
import { isNoise, withoutNoise } from "./noise";
import type { CourseModule } from "./types";

describe("filtro de ruido", () => {
  it.each([
    "Ayúdanos a mejorar: tu experiencia cuenta",
    "Ayudanos a mejorar: tu experiencia cuenta",
    "AYÚDANOS A MEJORAR",
    "Tus calificaciones",
    "Encuesta: Hagamos que este curso funcione para ti",
  ])("descarta %s", (name) => {
    expect(isNoise(name)).toBe(true);
  });

  it.each([
    "T01 - Introducción",
    "Sílabo del curso",
    "Evaluación parcial",
    "Material complementario",
    "Práctica calificada 2",
  ])("conserva %s", (name) => {
    expect(isNoise(name)).toBe(false);
  });

  it("quita solo el ruido de una lista de módulos", () => {
    const modules: CourseModule[] = [
      { id: 1, name: "T01 - Introducción" },
      { id: 2, name: "Tus calificaciones" },
      { id: 3, name: "Sílabo" },
      { id: 4, name: "Encuesta: cuéntanos" },
    ];
    expect(withoutNoise(modules).map((m) => m.id)).toEqual([1, 3]);
  });
});
