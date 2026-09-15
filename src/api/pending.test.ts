import { describe, expect, it } from "vitest";
import {
  classify,
  countByUrgency,
  countUpcomingExams,
  dropStaleOverdue,
  toPendingItems,
} from "./pending";
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

describe("dropStaleOverdue", () => {
  const items = (...timesorts: number[]) =>
    toPendingItems(
      timesorts.map((timesort, index) => ({ id: index + 1, name: `Tarea ${index}`, timesort })),
      NOW,
    );

  it("mantiene lo que venció anoche", () => {
    // 22 horas: lo de ayer por la tarde sigue siendo de esta mañana.
    expect(dropStaleOverdue(items(at(3, 12)), NOW)).toHaveLength(1);
  });

  it("quita lo que venció hace más de un día", () => {
    expect(dropStaleOverdue(items(at(3, 8)), NOW)).toHaveLength(0);
  });

  it("quita lo de hace ocho días, que es el caso que motivó el filtro", () => {
    expect(dropStaleOverdue(items(at(-4)), NOW)).toHaveLength(0);
  });

  it("mantiene el borde exacto de las 24 horas", () => {
    expect(dropStaleOverdue(items(at(3, 10)), NOW)).toHaveLength(1);
  });

  it("no toca nada futuro", () => {
    expect(dropStaleOverdue(items(at(4, 23), at(30)), NOW)).toHaveLength(2);
  });

  it("deja el contador de urgencias de acuerdo con la lista", () => {
    // Es la razón de aplicarlo en la capa de datos: dos vencidos, uno dentro
    // de la ventana y otro fuera, tienen que contar uno.
    const filtered = dropStaleOverdue(items(at(3, 12), at(1), at(6)), NOW);
    expect(countByUrgency(filtered).overdue).toBe(1);
  });
});

describe("countUpcomingExams", () => {
  /** Los nombres son los reales del ciclo 202620. */
  const exam = (id: number, name: string, modname: string, timesort: number): CalendarEvent => ({
    id,
    name,
    timesort,
    modulename: modname,
  });

  it("cuenta integrales y procesos de aprendizaje por separado", () => {
    const events = [
      exam(1, "Vencimiento de Evaluación Integral", "assign", at(6)),
      exam(2, "Vencimiento de Proceso de Aprendizaje 4", "assign", at(7)),
      exam(3, "Se cierra Proceso de Aprendizaje 6", "quiz", at(8)),
    ];
    expect(countUpcomingExams(toPendingItems(events, NOW), NOW)).toEqual({
      total: 3, ei: 1, pa: 2,
    });
  });

  it("no cuenta lo que no es evaluación", () => {
    const events = [
      exam(1, "Trabajo grupal", "assign", at(6)),
      exam(2, "RESILIENCIA pendiente", "forum", at(7)),
      exam(3, "Autoevaluación de la semana 3", "quiz", at(8)),
    ];
    expect(countUpcomingExams(toPendingItems(events, NOW), NOW).total).toBe(0);
  });

  it("cuenta dos veces un mismo PA con dos fechas", () => {
    // Decisión de producto: vencer y cerrarse son dos cosas que hacer en dos
    // días distintos, y fundirlas escondería una de las dos.
    const events = [
      exam(1, "Vencimiento de Proceso de Aprendizaje 3", "assign", at(6)),
      exam(2, "Se cierra Proceso de Aprendizaje 3", "quiz", at(9)),
    ];
    expect(countUpcomingExams(toPendingItems(events, NOW), NOW)).toEqual({
      total: 2, ei: 0, pa: 2,
    });
  });

  it("deja fuera lo que cae más allá de esta semana", () => {
    const events = [exam(1, "Vencimiento de Evaluación Integral", "assign", at(30))];
    expect(countUpcomingExams(toPendingItems(events, NOW), NOW).total).toBe(0);
  });

  it("cuenta lo que venció hace horas y sigue en la lista", () => {
    // Si está visible abajo con su marca de VENCIDO, tiene que estar contado
    // arriba: la franja se vende como el aviso único sobre evaluaciones.
    const events = [exam(1, "Vencimiento de Evaluación Integral", "assign", at(3, 12))];
    expect(countUpcomingExams(toPendingItems(events, NOW), NOW)).toEqual({
      total: 1, ei: 1, pa: 0,
    });
  });

  it("no cuenta lo que ya no se enseña por viejo", () => {
    const events = [exam(1, "Vencimiento de Proceso de Aprendizaje 1", "assign", at(3, 8))];
    expect(countUpcomingExams(toPendingItems(events, NOW), NOW).total).toBe(0);
  });

  it("cuenta lo que vence el séptimo día por la noche", () => {
    // El fallo de la primera captura contra la cuenta real: con la ventana
    // medida en milisegundos desde las 18:00, un PA a las 23:59 del séptimo día
    // caía fuera por unas horas mientras la lista lo etiquetaba ESTA SEMANA.
    const evening = new Date(2026, 8, 4, 18, 0, 0);
    const events = [exam(1, "Vencimiento de Proceso de Aprendizaje 2", "assign", at(11, 23))];
    expect(countUpcomingExams(toPendingItems(events, evening), evening).total).toBe(1);
  });

  it("concuerda con la tarjeta de ESTA SEMANA", () => {
    // La forma exacta de la captura: la tarjeta decía 3 y la franja 1.
    const evening = new Date(2026, 8, 4, 18, 0, 0);
    const events = [
      exam(1, "Vencimiento de Proceso de Aprendizaje 3", "assign", at(10, 23)),
      exam(2, "Vencimiento de Proceso de Aprendizaje 2", "assign", at(11, 23)),
      exam(3, "Trabajo grupal", "assign", at(9)),
    ];
    const items = toPendingItems(events, evening);

    expect(countByUrgency(items).week).toBe(3);
    expect(countUpcomingExams(items, evening).pa).toBe(2);
  });

  it("cuenta también lo de hoy, que la lista no marca ESTA SEMANA", () => {
    // "Esta semana" del titular incluye hoy; el reparto de `classify` le da
    // cubo propio. Lo que se excluye es solo "más adelante".
    const events = [exam(1, "Vencimiento de Evaluación Integral", "assign", at(4, 23))];
    expect(countUpcomingExams(toPendingItems(events, NOW), NOW).total).toBe(1);
  });

  it("sin evaluaciones devuelve ceros", () => {
    expect(countUpcomingExams([], NOW)).toEqual({ total: 0, ei: 0, pa: 0 });
  });
});
