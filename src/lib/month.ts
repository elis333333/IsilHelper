/**
 * Aritmética de la retícula mensual.
 *
 * Nada de dominio: aquí no se sabe qué es un pendiente ni un curso. Solo
 * semanas, días y cuáles caen fuera del mes. Se prueba sin reloj del sistema
 * porque no lo consulta: la fecha siempre entra como argumento.
 *
 * **La semana empieza el lunes.** Es la semana peruana, y la del `getDay()` de
 * JavaScript empieza el domingo, así que ese desfase se corrige una sola vez
 * aquí y no en cada sitio que dibuje una fila.
 */

/** Nombre corto de cada columna, de lunes a domingo. */
export const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

/** Lunes 0 … domingo 6. `getDay()` da domingo 0, que no sirve aquí. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Suma meses sin desbordar de mes.
 *
 * `setMonth` sobre un día 31 se va al mes siguiente —el 31 de marzo menos un
 * mes es el 3 de marzo, no el 28 de febrero—, así que se construye desde el
 * día 1, que es lo único que le importa a una vista mensual.
 */
export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Clave de un día, en local y no en UTC.
 *
 * Perú va en UTC-5, así que un `toISOString()` convertiría todo lo que vence
 * después de las 19:00 en un evento del día siguiente. Es el error que haría
 * que una entrega de las 23:59 apareciera en la celda equivocada.
 */
export function dayKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** La misma clave, desde los segundos Unix que trae la plataforma. */
export function dayKeyOf(seconds: number): string {
  return dayKey(new Date(seconds * 1000));
}

export type MonthDay = {
  date: Date;
  /** `false` en los días de relleno del mes anterior o del siguiente. */
  inMonth: boolean;
};

/**
 * Las semanas de un mes, cada una con sus siete días.
 *
 * Empieza en el lunes de la semana del día 1 y termina el domingo de la semana
 * del último día, así que salen 4, 5 o 6 filas según cómo caiga el mes. Los
 * días de relleno vienen marcados con `inMonth: false` en vez de omitidos: la
 * retícula tiene que estar completa, y quien pinte decide cómo los atenúa.
 */
export function monthGrid(year: number, month: number): MonthDay[][] {
  const first = new Date(year, month, 1);
  const cursor = new Date(year, month, 1 - weekdayIndex(first));
  const weeks: MonthDay[][] = [];

  do {
    const week: MonthDay[] = [];
    for (let i = 0; i < 7; i += 1) {
      week.push({ date: new Date(cursor), inMonth: cursor.getMonth() === month });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    // Se pide otra fila mientras el cursor —que ya es el lunes siguiente— siga
    // dentro del mes. En diciembre el cursor salta a enero y el mes deja de
    // coincidir, que es justo lo que corta el bucle.
  } while (cursor.getMonth() === month && cursor.getFullYear() === year);

  return weeks;
}

const DAY_FORMAT = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** "Martes 22 de setiembre". Encabeza el panel y nombra la celda para quien
 *  navega con lector de pantalla, que sin esto oiría solo "22". */
export function dayLabel(date: Date): string {
  const label = DAY_FORMAT.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const MONTH_FORMAT = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" });

/** "Septiembre de 2026". En español el mes va en minúscula, pero esto abre
 *  titular, así que lleva mayúscula inicial como cualquier frase. */
export function monthLabel(date: Date): string {
  const label = MONTH_FORMAT.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
