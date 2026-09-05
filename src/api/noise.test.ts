import { describe, expect, it } from "vitest";
import { isNoise, withoutNoise } from "./noise";
import type { CourseModule } from "./types";

const module = (name: string, modname?: string): CourseModule => ({
  id: 1,
  name,
  ...(modname === undefined ? {} : { modname }),
});

describe("filtro de ruido", () => {
  it.each([
    "Etiqueta",
    "Área de texto y medios",
    "\n\n \n\n",
    "! ESQUEMA DE EVALUACIÓN DEL CURSO",
    "T01 - Introducción",
  ])("descarta la etiqueta %j sea cual sea su nombre", (name) => {
    expect(isNoise(module(name, "label"))).toBe(true);
  });

  it.each([
    "Ayúdanos a mejorar: tu experiencia cuenta",
    "Ayudanos a mejorar: tu experiencia cuenta",
    "AYÚDANOS A MEJORAR",
    "Encuesta: Hagamos que este curso funcione para ti",
  ])("descarta la encuesta %j", (name) => {
    expect(isNoise(module(name, "url"))).toBe(true);
  });

  it.each([
    ["T01 - Introducción", "url"],
    ["Sílabo del curso", "resource"],
    ["Evaluación parcial", "assign"],
    ["Material complementario", "folder"],
    ["Clase grabada 1", "zoom"],
    ["Práctica calificada 2", "assign"],
  ])("conserva %j de tipo %s", (name, modname) => {
    expect(isNoise(module(name, modname))).toBe(false);
  });

  it("conserva los tipos nuevos: una carpeta y una sala de Zoom son material", () => {
    expect(isNoise(module("Recursos de la unidad", "folder"))).toBe(false);
    expect(isNoise(module("Sesión 3", "zoom"))).toBe(false);
  });

  it("sin modname solo puede juzgar por el nombre", () => {
    expect(isNoise(module("Encuesta de satisfacción"))).toBe(true);
    expect(isNoise(module("T02 - Variables"))).toBe(false);
  });

  it("quita solo el ruido de una lista de módulos", () => {
    const modules: CourseModule[] = [
      { id: 1, name: "T01 - Introducción", modname: "url" },
      { id: 2, name: "! ESQUEMA DE EVALUACIÓN", modname: "label" },
      { id: 3, name: "Sílabo", modname: "resource" },
      { id: 4, name: "Encuesta: cuéntanos", modname: "url" },
      { id: 5, name: "\n\n \n\n", modname: "label" },
    ];
    expect(withoutNoise(modules).map((m) => m.id)).toEqual([1, 3]);
  });
});
