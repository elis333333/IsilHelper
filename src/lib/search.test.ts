import { describe, expect, it } from "vitest";
import { normalize, search, type SearchEntry } from "./search";

const entry = (
  key: string,
  name: string,
  kind: SearchEntry["kind"] = "module",
): SearchEntry => ({
  key,
  kind,
  name,
  courseId: 1,
  courseName: "Curso de prueba",
  context: null,
  url: null,
});

describe("normalización", () => {
  it("quita tildes y baja a minúsculas", () => {
    expect(normalize("Sílabo del CURSO")).toBe("silabo del curso");
  });

  it("recorta los espacios de los extremos", () => {
    expect(normalize("  Evaluación  ")).toBe("evaluacion");
  });
});

describe("buscador", () => {
  const entries = [
    entry("a", "Sílabo del curso"),
    entry("b", "T01 - Introducción a las bases de datos"),
    entry("c", "Práctica calificada 1"),
    entry("d", "Base de datos relacional"),
  ];

  it("encuentra sin tildes lo que se escribió con ellas", () => {
    expect(search(entries, "silabo").map((h) => h.key)).toEqual(["a"]);
  });

  it("encuentra con tildes lo que está sin ellas", () => {
    expect(search(entries, "práctica").map((h) => h.key)).toEqual(["c"]);
  });

  it("exige todas las palabras, en cualquier orden", () => {
    expect(search(entries, "datos base").map((h) => h.key).sort()).toEqual(["b", "d"]);
    expect(search(entries, "datos inexistente")).toEqual([]);
  });

  it("una consulta vacía no devuelve nada, en vez de devolverlo todo", () => {
    expect(search(entries, "")).toEqual([]);
    expect(search(entries, "   ")).toEqual([]);
  });

  it("puntúa antes el comienzo exacto que la coincidencia suelta", () => {
    const hits = search(entries, "base");
    expect(hits[0]?.key).toBe("d");
  });

  it("ordena los pendientes por delante a igualdad de puntuación", () => {
    const mixed = [
      entry("modulo", "Examen final", "module"),
      entry("pendiente", "Examen final", "pending"),
      entry("curso", "Examen final", "course"),
    ];
    expect(search(mixed, "examen final").map((h) => h.kind)).toEqual([
      "pending",
      "course",
      "module",
    ]);
  });

  it("respeta el límite", () => {
    const many = Array.from({ length: 100 }, (_, i) => entry(String(i), `Tema ${i}`));
    expect(search(many, "tema", 10)).toHaveLength(10);
  });

  it("no distingue mayúsculas", () => {
    expect(search(entries, "SÍLABO").map((h) => h.key)).toEqual(["a"]);
  });
});
