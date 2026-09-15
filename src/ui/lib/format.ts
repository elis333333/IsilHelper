/** Formato de fechas y cifras. Español de Perú, sin exclamaciones. */

const DAY_MS = 86_400_000;

const longDate = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long" });
const time = new Intl.DateTimeFormat("es-PE", { hour: "numeric", minute: "2-digit" });

function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / DAY_MS);
}

/** "hoy · 23:59", "mañana", "hace 3 días", "12 de septiembre". */
export function dueLabel(dueSeconds: number, now: Date = new Date()): string {
  const due = new Date(dueSeconds * 1000);
  const diff = daysBetween(now, due);

  if (diff === 0) return `hoy · ${time.format(due)}`;
  if (diff === 1) return `mañana · ${time.format(due)}`;
  if (diff === -1) return "ayer";
  if (diff < -1) return `hace ${Math.abs(diff)} días`;
  if (diff <= 7) return `en ${diff} días · ${longDate.format(due)}`;
  return longDate.format(due);
}

/**
 * Solo el tiempo que falta, sin la fecha: "hoy", "mañana", "en 6 días".
 *
 * `dueLabel` pega además la hora y la fecha larga, que en una lista está bien
 * porque es la única línea que habla de tiempo. En el panel del calendario la
 * fecha ya la dice la celda en la que está, así que repetirla es ruido.
 */
export function remainingLabel(dueSeconds: number, now: Date = new Date()): string {
  const diff = daysBetween(now, new Date(dueSeconds * 1000));

  if (diff === 0) return "hoy";
  if (diff === 1) return "mañana";
  if (diff === -1) return "ayer";
  if (diff < -1) return `hace ${Math.abs(diff)} días`;
  return `en ${diff} días`;
}

const exactFormat = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** La fecha completa con hora, para el modal: ahí no se resume nada. */
export function exactDue(dueSeconds: number): string {
  const label = exactFormat.format(new Date(dueSeconds * 1000));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Porcentaje sin decimales. Devuelve null si no hay dato, para que quien
 *  llame decida qué decir en vez de mostrar un cero que no es cierto. */
export function percentage(value: number | null): string | null {
  return value === null ? null : `${Math.round(value)} %`;
}

/** Nombres de actividad de Moodle en lenguaje de estudiante. */
const KINDS: Record<string, string> = {
  assign: "Tarea",
  quiz: "Cuestionario",
  forum: "Foro",
  workshop: "Taller",
  lesson: "Lección",
  choice: "Consulta",
  feedback: "Encuesta",
  scorm: "Actividad",
  url: "Enlace",
  resource: "Archivo",
  folder: "Carpeta",
  page: "Página",
  label: "Nota",
};

export function kindLabel(kind: string | null): string | null {
  if (kind === null) return null;
  return KINDS[kind] ?? null;
}

/** Tamaño de archivo en unidades que se leen de un vistazo. Devuelve null
 *  cuando Moodle no declara el tamaño, para que quien llame calle en vez de
 *  enseñar un 0 KB que no es cierto. */
export function fileSize(bytes: number | null): string | null {
  if (bytes === null || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return mb < 10 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`;
}

/** Plural del castellano, que es el único que hace falta aquí. */
export function plural(count: number, singular: string, many: string): string {
  return `${count} ${count === 1 ? singular : many}`;
}
