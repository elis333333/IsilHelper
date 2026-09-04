import { describe, expect, it } from "vitest";
import { classify, countByUrgency, toPendingItems } from "./pending";
import type { CalendarEvent } from "./types";

/** Jueves 4 de septiembre de 2026, 10:00 hora local. */
const NOW = new Date(2026, 8, 4, 10, 0, 0);
const seconds = (d: Date) => Math.floor(d.getTime() / 1000);
const at = (day: number, hour = 12) => seconds(new Date(2026, 8, day, hour));

describe("classify", () => {
  it("lo de ayer está vencido", () => {
    expect(classify(at(3), NOW)).toBe("overdue");
  });

  it("lo de hoy más temprano sigue siendo de hoy, no vencido", () => {
    // 08:00 ya pasó, pero es hoy: el estudiante aún puede entregarlo.
    expect(classify(at(4, 8), NOW)).toBe("today");
  });

  it("lo de hoy más tarde es de hoy", () => {
    expect(classify(at(4, 23), NOW)).toBe("today");
  });

  it("mañana entra en esta semana", () => {
    expect(classify(at(5), NOW)).toBe("week");
  });

  it("el séptimo día sigue en esta semana", () => {
    expect(classify(at(11), NOW)).toBe("week");
  });

  it("más allá de siete días es más adelante", () => {
    expect(classify(at(13), NOW)).toBe("later");
  });
});

describe("toPendingItems", () => {
  const event = (over: Partial<CalendarEvent> & { id: number }): CalendarEvent => ({
    name: `Tarea ${over.id}`,
    timesort: at(6),
    ...over,
  });

  it("ordena por fecha, no por curso", () => {
    const events = [
      event({ id: 1, timesort: at(10), course: { id: 20, fullname: "Cálculo" } }),
      event({ id: 2, timesort: at(5), course: { id: 30, fullname: "Base de datos" } }),
      event({ id: 3, timesort: at(7), course: { id: 20, fullname: "Cálculo" } }),
    ];
    expect(toPendingItems(events, NOW).map((i) => i.id)).toEqual([2, 3, 1]);
  });

  it("respeta el `overdue` que marca Moodle aunque la fecha sea futura", () => {
    const items = toPendingItems([event({ id: 1, timesort: at(20), overdue: true })], NOW);
    expect(items[0]?.urgency).toBe("overdue");
  });

  it("descarta lo que no trae fecha en vez de inventarle una prioridad", () => {
    const events = [
      event({ id: 1, timesort: 0 }),
      event({ id: 2, timesort: at(5) }),
    ];
    expect(toPendingItems(events, NOW).map((i) => i.id)).toEqual([2]);
  });

  it("sobrevive a un evento sin curso, sin url y sin módulo", () => {
    const items = toPendingItems([{ id: 9, name: "Suelto", timesort: at(5) }], NOW);
    expect(items[0]).toMatchObject({
      id: 9, courseId: null, courseName: null, kind: null, url: null,
    });
  });

  it("usa el nombre corto del curso si no viene el largo", () => {
    const items = toPendingItems(
      [event({ id: 1, course: { id: 5, shortname: "BD-2026" } })],
      NOW,
    );
    expect(items[0]?.courseName).toBe("BD-2026");
  });

  it("prefiere la url de la acción a la del evento", () => {
    const items = toPendingItems(
      [event({ id: 1, url: "https://x/evento", action: { url: "https://x/entregar" } })],
      NOW,
    );
    expect(items[0]?.url).toBe("https://x/entregar");
  });

  it("cuenta por urgencia para el resumen", () => {
    const events = [
      event({ id: 1, timesort: at(2) }),
      event({ id: 2, timesort: at(3) }),
      event({ id: 3, timesort: at(4, 15) }),
      event({ id: 4, timesort: at(6) }),
      event({ id: 5, timesort: at(30) }),
    ];
    expect(countByUrgency(toPendingItems(events, NOW))).toEqual({
      overdue: 2, today: 1, week: 1, later: 1,
    });
  });
});
