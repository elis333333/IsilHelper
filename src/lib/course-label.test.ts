import { describe, expect, it } from "vitest";
import { courseShortLabel, courseTitle } from "./course-label";

/** Los nombres reales: el código lleva punto y el periodo pegado detrás. */
const DIRECCION = "1582.202620 DIRECCION DE PERSONAS (VIR)";
const PROYECTOS = "3672.202620 GESTION DE PROYECTOS (SPR)";
const ANALISIS = "3684.202620 ANALISIS Y DISEÑO DE SISTEMAS BASICO (PRE)";

describe("courseTitle", () => {
  it("quita el código con punto y la modalidad", () => {
    expect(courseTitle(DIRECCION)).toBe("DIRECCION DE PERSONAS");
    expect(courseTitle(PROYECTOS)).toBe("GESTION DE PROYECTOS");
    expect(courseTitle(ANALISIS)).toBe("ANALISIS Y DISEÑO DE SISTEMAS BASICO");
  });

  it("no deja el periodo suelto delante", () => {
    // El fallo que se veía en la celda: `PA 1 · .20262…`.
    expect(courseTitle(PROYECTOS).startsWith(".")).toBe(false);
  });

  it("también quita el código sin punto", () => {
    expect(courseTitle("1582 DIRECCION DE PERSONAS (VIR)")).toBe("DIRECCION DE PERSONAS");
  });

  it("quita la modalidad aunque venga sin paréntesis", () => {
    expect(courseTitle("3672.202620 GESTION DE PROYECTOS SPR")).toBe("GESTION DE PROYECTOS");
  });

  it("aguanta un nombre sin código ni modalidad", () => {
    expect(courseTitle("BASE DE DATOS")).toBe("BASE DE DATOS");
  });

  it("solo quita el paréntesis del final", () => {
    expect(courseTitle("1234 TALLER (AVANZADO) DE REDES")).toBe("TALLER (AVANZADO) DE REDES");
  });

  it("acepta el código separado con guion", () => {
    expect(courseTitle("1582 - DIRECCION DE PERSONAS")).toBe("DIRECCION DE PERSONAS");
  });
});

describe("courseShortLabel", () => {
  it("deja el nombre entero cuando cabe, sin quitarle los enlaces", () => {
    // Quitar el código deja sitio de sobra para el nombre de verdad.
    expect(courseShortLabel(DIRECCION)).toBe("DIRECCION DE PERSONAS");
    expect(courseShortLabel(PROYECTOS)).toBe("GESTION DE PROYECTOS");
  });

  it("compone con las primeras palabras significativas cuando no cabe", () => {
    expect(courseShortLabel(ANALISIS)).toBe("ANALISIS DISEÑO");
  });

  it("deja el nombre entero cuando ya es corto", () => {
    expect(courseShortLabel("1234 REDES (PRE)")).toBe("REDES");
  });

  it("prefiere el shortname de Moodle cuando parece un nombre", () => {
    expect(courseShortLabel(DIRECCION, "POO")).toBe("POO");
    expect(courseShortLabel(DIRECCION, "BD-2026")).toBe("BD-2026");
  });

  it("ignora un shortname que es solo el código", () => {
    // No dice más que el número que acabamos de quitar por delante.
    expect(courseShortLabel(DIRECCION, "1582.202620")).toBe("DIRECCION DE PERSONAS");
    expect(courseShortLabel(DIRECCION, "1582-202620")).toBe("DIRECCION DE PERSONAS");
  });

  it("ignora un shortname más largo que el presupuesto", () => {
    expect(courseShortLabel(PROYECTOS, "GESTION DE PROYECTOS INFORMATICOS")).toBe(
      "GESTION DE PROYECTOS",
    );
  });

  it("corta la primera palabra si ni ella cabe", () => {
    const label = courseShortLabel("1234 CONTRAESTABLECIMIENTOTECNICO");
    expect(label).toBe("CONTRAESTABLECIMIENTO…");
    expect(label.length).toBeLessThanOrEqual(22);
  });

  it("dice 'Sin curso' cuando no hay nombre", () => {
    expect(courseShortLabel(null)).toBe("Sin curso");
  });
});
