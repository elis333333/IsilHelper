import { describe, expect, it } from "vitest";
import { FOOTER_COPY, MODAL_COPY, pickVariant, type DonationCopy } from "./donacion";

const TODAS: DonationCopy[] = [...MODAL_COPY, ...FOOTER_COPY];

describe("pickVariant", () => {
  const variantes = ["a", "b", "c"] as const;

  it("reparte por tramos iguales", () => {
    expect(pickVariant(variantes, 0)).toBe("a");
    expect(pickVariant(variantes, 0.4)).toBe("b");
    expect(pickVariant(variantes, 0.7)).toBe("c");
  });

  it("no se sale por arriba", () => {
    // `Math.random()` nunca devuelve 1, pero un 0,999… con una lista corta
    // redondea al índice de después del final si nadie lo acota.
    expect(pickVariant(variantes, 0.9999999)).toBe("c");
    expect(pickVariant(variantes, 1)).toBe("c");
  });

  it("con una sola variante siempre devuelve esa", () => {
    expect(pickVariant(["única"], 0.5)).toBe("única");
  });
});

/**
 * La regla de voz, escrita como test.
 *
 * Es el tipo de cosa que se respeta al escribirla y se rompe seis meses
 * después, al añadir una variante con prisa.
 */
describe("voz de los textos de aporte", () => {
  const PROHIBIDAS = [
    "apóyame", "apoyame", "ayúdame", "ayudame",
    "considera", "si te gusta mi trabajo", "necesito",
  ];

  it("ninguna mendiga", () => {
    for (const copy of TODAS) {
      const texto = `${copy.titulo} ${copy.cuerpo}`.toLowerCase();
      for (const palabra of PROHIBIDAS) expect(texto).not.toContain(palabra);
    }
  });

  it("ninguna lleva signos de exclamación", () => {
    // La skill de voz no admite ninguno en pieza publicada.
    for (const copy of TODAS) {
      expect(`${copy.titulo}${copy.cuerpo}`).not.toMatch(/[!¡]/);
    }
  });

  it("todas dicen que no pasa nada si no se aporta", () => {
    // No como posdata: tiene que estar en el propio cuerpo.
    const salidas = /gratis|si no|tampoco|igual|no cambia|cero|sin contraparte|lo que sea/i;
    for (const copy of TODAS) expect(copy.cuerpo).toMatch(salidas);
  });

  it("los títulos del pie caben en una línea", () => {
    for (const copy of FOOTER_COPY) expect(copy.titulo.length).toBeLessThanOrEqual(48);
  });

  it("no hay títulos repetidos, que es lo que haría inútil rotar", () => {
    const titulos = TODAS.map((copy) => copy.titulo);
    expect(new Set(titulos).size).toBe(titulos.length);
  });
});
