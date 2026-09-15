import { describe, expect, it } from "vitest";
import { lookbackFrom } from "./calendar";
import { CYCLE_START_ISO } from "../lib/constants";

const cycleStart = Math.floor(Date.parse(CYCLE_START_ISO) / 1000);

describe("lookbackFrom", () => {
  it("pide desde el inicio del ciclo, no desde hace 30 días", () => {
    // A mitad de ciclo, 30 días atrás se comería el principio de septiembre, y
    // con él el primer mes del calendario.
    const now = new Date(2026, 10, 20);
    expect(lookbackFrom(now)).toBe(cycleStart);
  });

  it("la ventana se ensancha si la constante se queda vieja", () => {
    // Empezado el ciclo siguiente sin actualizar `CYCLE_START_ISO`, se sigue
    // pidiendo desde septiembre de 2026. Es el precio de no poder saber desde
    // el código cuándo empieza un ciclo, y está anotado en la función.
    const now = new Date(2027, 2, 1);
    expect(lookbackFrom(now)).toBe(cycleStart);
  });

  it("al principio del ciclo la ventana empieza antes del primer día", () => {
    // Los 30 días móviles ganan, y eso está bien: pedir de más no cuesta nada
    // y cubre lo que el ciclo anterior dejara colgando.
    const now = new Date(2026, 8, 4);
    expect(lookbackFrom(now)).toBeLessThan(cycleStart);
  });
});
