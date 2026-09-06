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
