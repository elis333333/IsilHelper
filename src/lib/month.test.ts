import { describe, expect, it } from "vitest";
import {
  addMonths,
  dayKey,
  dayKeyOf,
  monthGrid,
  monthLabel,
  sameDay,
  startOfMonth,
  weekdayIndex,
} from "./month";

describe("weekdayIndex", () => {
  it("el lunes es 0 y el domingo es 6", () => {
    // 14 de septiembre de 2026 es lunes.
    expect(weekdayIndex(new Date(2026, 8, 14))).toBe(0);
    expect(weekdayIndex(new Date(2026, 8, 20))).toBe(6);
  });
});

describe("monthGrid", () => {
  const flat = (year: number, month: number) => monthGrid(year, month).flat();

  it("todas las semanas tienen siete días", () => {
    for (const week of monthGrid(2026, 8)) expect(week).toHaveLength(7);
  });

  it("empieza en lunes y termina en domingo", () => {
    const days = flat(2026, 8);
    expect(weekdayIndex(days[0]!.date)).toBe(0);
    expect(weekdayIndex(days.at(-1)!.date)).toBe(6);
  });

  it("septiembre de 2026 ocupa cinco semanas", () => {
    // Empieza martes y tiene 30 días.
    expect(monthGrid(2026, 8)).toHaveLength(5);
  });

  it("contiene todos los días del mes, y solo esos, marcados como dentro", () => {
    const inMonth = flat(2026, 8).filter((day) => day.inMonth);
    expect(inMonth).toHaveLength(30);
    expect(inMonth[0]!.date.getDate()).toBe(1);
    expect(inMonth.at(-1)!.date.getDate()).toBe(30);
  });

  it("rellena con días de fuera en vez de dejar huecos", () => {
    const days = flat(2026, 8);
    // 1 de septiembre de 2026 es martes, así que el lunes anterior es del mes
    // pasado y viene marcado como tal.
    expect(days[0]).toMatchObject({ inMonth: false });
    expect(days[0]!.date.getMonth()).toBe(7);
  });

  it("un mes que empieza en lunes no arrastra relleno por delante", () => {
    // Junio de 2026 empieza lunes.
    const days = flat(2026, 5);
    expect(days[0]!.date.getDate()).toBe(1);
    expect(days[0]!.inMonth).toBe(true);
  });

  it("diciembre corta bien al saltar de año", () => {
    const weeks = monthGrid(2026, 11);
    const inMonth = weeks.flat().filter((day) => day.inMonth);
    expect(inMonth).toHaveLength(31);
    expect(weeks.flat().at(-1)!.date.getFullYear()).toBe(2027);
  });

  it("un mes de seis semanas también sale entero", () => {
    // Agosto de 2026 empieza sábado y tiene 31 días: necesita seis filas.
    const weeks = monthGrid(2026, 7);
    expect(weeks).toHaveLength(6);
    expect(weeks.flat().filter((day) => day.inMonth)).toHaveLength(31);
  });
});

describe("addMonths", () => {
  it("avanza y retrocede al día 1", () => {
    expect(addMonths(new Date(2026, 8, 15), 1)).toEqual(new Date(2026, 9, 1));
    expect(addMonths(new Date(2026, 8, 15), -1)).toEqual(new Date(2026, 7, 1));
  });

  it("cruza el fin de año en las dos direcciones", () => {
    expect(addMonths(new Date(2026, 11, 3), 1)).toEqual(new Date(2027, 0, 1));
    expect(addMonths(new Date(2026, 0, 3), -1)).toEqual(new Date(2025, 11, 1));
  });

  it("no desborda desde un día 31", () => {
    // `setMonth` sobre el 31 de marzo daría el 3 de marzo al restar un mes.
    expect(addMonths(new Date(2026, 2, 31), -1)).toEqual(new Date(2026, 1, 1));
  });
});

describe("claves de día", () => {
  it("usa la fecha local, no UTC", () => {
    // Perú va en UTC-5: con `toISOString` esto caería en el día siguiente.
    const lateNight = new Date(2026, 8, 22, 23, 59);
    expect(dayKey(lateNight)).toBe("2026-09-22");
  });

  it("rellena mes y día a dos cifras", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("dayKeyOf parte de los segundos de la plataforma", () => {
    const seconds = Math.floor(new Date(2026, 8, 22, 23, 59).getTime() / 1000);
    expect(dayKeyOf(seconds)).toBe("2026-09-22");
  });
});

describe("varios", () => {
  it("startOfMonth se queda en el día 1 a medianoche", () => {
    expect(startOfMonth(new Date(2026, 8, 15, 18, 30))).toEqual(new Date(2026, 8, 1));
  });

  it("sameDay ignora la hora", () => {
    expect(sameDay(new Date(2026, 8, 15, 1), new Date(2026, 8, 15, 23))).toBe(true);
    expect(sameDay(new Date(2026, 8, 15), new Date(2026, 8, 16))).toBe(false);
  });

  it("monthLabel abre con mayúscula", () => {
    // "Setiembre" y no "septiembre": es lo que da `es-PE`, es la forma peruana
    // y es la que ya usa `dueLabel` en el resto de la interfaz.
    expect(monthLabel(new Date(2026, 8, 1))).toBe("Setiembre de 2026");
  });
});
