import { describe, expect, it } from "vitest";
import {
  cellEvents,
  groupByDay,
  MAX_PER_CELL,
  panelPlacement,
  panelRows,
} from "./calendar";
import { toPendingItems } from "../../api/pending";
import type { CalendarEvent } from "../../api/types";

const NOW = new Date(2026, 8, 15, 10, 0, 0);
const at = (month: number, day: number, hour = 12) =>
  Math.floor(new Date(2026, month, day, hour).getTime() / 1000);

const event = (id: number, name: string, modname: string, timesort: number): CalendarEvent => ({
  id,
  name,
  timesort,
  modulename: modname,
});

const items = (...events: CalendarEvent[]) => toPendingItems(events, NOW);

describe("groupByDay", () => {
  it("reparte cada evento en su día", () => {
    const byDay = groupByDay(
      items(
        event(1, "Vencimiento de Proceso de Aprendizaje 1", "assign", at(8, 21)),
        event(2, "Vencimiento de Proceso de Aprendizaje 2", "assign", at(8, 22)),
      ),
    );

    expect([...byDay.keys()].sort()).toEqual(["2026-09-21", "2026-09-22"]);
    expect(byDay.get("2026-09-21")).toHaveLength(1);
  });

  it("junta en una sola celda lo que cae el mismo día", () => {
    // De noviembre a diciembre hay días con varios vencimientos a la vez.
    const byDay = groupByDay(
      items(
        event(1, "Vencimiento de Proceso de Aprendizaje 4", "assign", at(10, 27, 9)),
        event(2, "RESILIENCIA pendiente", "forum", at(10, 27, 18)),
        event(3, "Vencimiento de Evaluación Integral", "assign", at(10, 27, 23)),
      ),
    );

    expect(byDay.get("2026-11-27")).toHaveLength(3);
  });

  it("ordena la celda por urgencia de tipo, no por hora", () => {
    // La integral entra la última y de las tres es la que vence más tarde, y
    // aun así tiene que salir primera.
    const byDay = groupByDay(
      items(
        event(1, "RESILIENCIA pendiente", "forum", at(10, 27, 9)),
        event(2, "Trabajo grupal", "assign", at(10, 27, 10)),
        event(3, "Vencimiento de Evaluación Integral", "assign", at(10, 27, 23)),
      ),
    );

    expect(byDay.get("2026-11-27")?.map((entry) => entry.kind)).toEqual([
      "EI",
      "TAREA",
      "FORO",
    ]);
  });

  it("desempata por hora dentro del mismo tipo", () => {
    const byDay = groupByDay(
      items(
        event(1, "Trabajo grupal tarde", "assign", at(10, 27, 20)),
        event(2, "Trabajo grupal temprano", "assign", at(10, 27, 8)),
      ),
    );

    expect(byDay.get("2026-11-27")?.map((entry) => entry.item.id)).toEqual([2, 1]);
  });

  it("usa el día local, no el UTC", () => {
    // Perú va en UTC-5: una entrega de las 23:59 caería en el día siguiente si
    // la clave saliera de `toISOString`.
    const byDay = groupByDay(items(event(1, "Trabajo grupal", "assign", at(8, 22, 23))));
    expect(byDay.has("2026-09-22")).toBe(true);
  });

  it("conserva el subtipo del PA para el modal", () => {
    const byDay = groupByDay(
      items(event(1, "Se cierra Proceso de Aprendizaje 6", "quiz", at(8, 21))),
    );
    expect(byDay.get("2026-09-21")?.[0]?.pa).toEqual({ number: 6, phase: "cierre" });
  });

  it("sin eventos devuelve un índice vacío", () => {
    expect(groupByDay([]).size).toBe(0);
  });
});

describe("cellEvents", () => {
  const fake = (count: number) =>
    groupByDay(
      items(
        ...Array.from({ length: count }, (_, index) =>
          event(index + 1, `Trabajo ${index}`, "assign", at(10, 27, index + 1)),
        ),
      ),
    ).get("2026-11-27")!;

  it("enseña todo cuando cabe", () => {
    expect(cellEvents(fake(2))).toMatchObject({ rest: 0 });
    expect(cellEvents(fake(2)).shown).toHaveLength(2);
  });

  it("con uno de más los enseña todos en vez de resumir", () => {
    // Un "+1" ocupa la misma línea que el evento que esconde.
    const cell = cellEvents(fake(MAX_PER_CELL + 1));
    expect(cell.shown).toHaveLength(MAX_PER_CELL + 1);
    expect(cell.rest).toBe(0);
  });

  it("resume a partir de dos de más", () => {
    const cell = cellEvents(fake(6));
    expect(cell.shown).toHaveLength(MAX_PER_CELL);
    expect(cell.rest).toBe(3);
  });

  it("lo que se resume es lo menos urgente", () => {
    const byDay = groupByDay(
      items(
        event(1, "Foro uno", "forum", at(10, 27, 8)),
        event(2, "Foro dos", "forum", at(10, 27, 9)),
        event(3, "Foro tres", "forum", at(10, 27, 10)),
        event(4, "Foro cuatro", "forum", at(10, 27, 11)),
        event(5, "Vencimiento de Evaluación Integral", "assign", at(10, 27, 23)),
      ),
    );

    const cell = cellEvents(byDay.get("2026-11-27")!);
    expect(cell.shown[0]?.kind).toBe("EI");
    expect(cell.rest).toBe(2);
  });
});

describe("panelRows", () => {
  it("un solo evento se queda en 2×2", () => {
    expect(panelRows(1)).toBe(2);
  });

  it("dos o más piden una fila más", () => {
    expect(panelRows(2)).toBe(3);
    expect(panelRows(7)).toBe(3);
  });
});

describe("panelPlacement", () => {
  /** Setiembre de 2026: cinco filas de semana. */
  const SETIEMBRE = 5;
  /** Noviembre de 2026: seis, porque empieza en domingo. */
  const NOVIEMBRE = 6;

  it("por defecto se ancla hacia la derecha y hacia abajo", () => {
    const placement = panelPlacement(0, 0, SETIEMBRE, 1);
    expect(placement).toMatchObject({ column: 1, row: 2, rows: 2 });
    expect(placement).toMatchObject({ columnOffset: 0, rowOffset: 0 });
  });

  it("en la última columna se ancla a la izquierda", () => {
    const placement = panelPlacement(0, 6, SETIEMBRE, 1);
    expect(placement.column).toBe(6);
    expect(placement.columnOffset).toBe(1);
  });

  it("con dos eventos crece hacia abajo, no a lo ancho", () => {
    const placement = panelPlacement(0, 0, SETIEMBRE, 3);
    expect(placement.columns).toBe(2);
    expect(placement.rows).toBe(3);
    expect(placement.row).toBe(2);
  });

  it("en la última fila se ancla hacia arriba y la celda queda abajo", () => {
    const placement = panelPlacement(SETIEMBRE - 1, 0, SETIEMBRE, 3);
    expect(placement.row).toBe(4);
    expect(placement.rowOffset).toBe(2);
  });

  it("en la penúltima fila también, y la celda queda en el medio", () => {
    // El caso que no existía con 2×2: la celda apuntada no está ni arriba ni
    // abajo del bloque, así que el panel tiene que crecer desde el centro.
    const placement = panelPlacement(SETIEMBRE - 2, 0, SETIEMBRE, 3);
    expect(placement.row).toBe(4);
    expect(placement.rowOffset).toBe(1);
  });

  it("noviembre con varios vencimientos en la última semana", () => {
    // Seis filas de semana, bloque de tres: empieza en la pista 5 y termina
    // justo en la última línea, la 8.
    const placement = panelPlacement(NOVIEMBRE - 1, 3, NOVIEMBRE, 4);
    expect(placement.row).toBe(5);
    expect(placement.row + placement.rows).toBe(NOVIEMBRE + 2);
    expect(placement.rowOffset).toBe(2);
  });

  it("nunca se sale de la retícula, en ningún mes ni con ningún alto", () => {
    // Es la invariante de la que depende que nada se desplace: pasarse de la
    // última línea crearía una fila implícita y empujaría el mes entero.
    for (const weekCount of [4, 5, 6]) {
      for (let week = 0; week < weekCount; week += 1) {
        for (let column = 0; column < 7; column += 1) {
          for (const eventCount of [1, 2]) {
            const p = panelPlacement(week, column, weekCount, eventCount);

            expect(p.row).toBeGreaterThanOrEqual(2);
            expect(p.row + p.rows).toBeLessThanOrEqual(weekCount + 2);
            expect(p.column).toBeGreaterThanOrEqual(1);
            expect(p.column + p.columns).toBeLessThanOrEqual(8);

            // Y la celda apuntada siempre queda dentro del bloque.
            expect(p.rowOffset).toBeGreaterThanOrEqual(0);
            expect(p.rowOffset).toBeLessThan(p.rows);
            expect(p.columnOffset).toBeGreaterThanOrEqual(0);
            expect(p.columnOffset).toBeLessThan(p.columns);
          }
        }
      }
    }
  });
});
