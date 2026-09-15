/**
 * Nombres de curso en corto, para donde no cabe el largo.
 *
 * Los cursos llegan como `1582 DIRECCION DE PERSONAS (VIR)`: un código de
 * matrícula, el nombre, y la modalidad entre paréntesis. En una celda de
 * calendario eso truncado da `1582 DIRECCI…`, que no distingue nada de nada.
 *
 * Puro, sin dominio de calendario: solo recorta nombres.
 */

/** Palabras que no distinguen un curso de otro. */
const STOPWORDS = new Set([
  "de", "del", "la", "el", "los", "las", "y", "e", "en",
  "a", "al", "por", "para", "con", "un", "una", "i", "ii", "iii",
]);

/** Cuántos caracteres caben en la línea de una celda. Lo que pase de aquí lo
 *  recorta el `text-overflow` del CSS, que a pantalla ancha no llega a hacer
 *  falta. */
const BUDGET = 22;

/**
 * El código de matrícula del principio.
 *
 * **Lleva punto**: los cursos reales vienen como `3672.202620 GESTION DE
 * PROYECTOS (SPR)`, con el código y el periodo pegados. La primera versión solo
 * quitaba dígitos seguidos, así que cortaba en el punto y dejaba `.202620` al
 * frente — que se comía la celda entera y no decía nada.
 */
const CODE = /^\s*\d[\d.\-/]*\s*[-–—:]?\s*/;

/** La modalidad del final: `(SPR)`, `(VIR)`, `(SRM)`, `(PRE)`. Es la misma en
 *  bloques enteros de cursos, así que tampoco distingue. */
const MODALITY = /\s*\([^)]*\)\s*$/;

/** La misma, por si algún curso la trae sin paréntesis. */
const BARE_MODALITY = /\s+(?:SPR|VIR|SRM|PRE)\s*$/i;

/**
 * El nombre sin el código de matrícula ni la modalidad.
 *
 * `3672.202620 GESTION DE PROYECTOS (SPR)` → `GESTION DE PROYECTOS`.
 *
 * Ninguno de los dos dice qué curso es: el código tiene la misma forma en los
 * once y la modalidad se repite por bloques. La modalidad solo se quita si está
 * al final, para no llevarse por delante un paréntesis del propio nombre.
 */
export function courseTitle(fullname: string): string {
  return fullname
    .replace(CODE, "")
    .replace(MODALITY, "")
    .replace(BARE_MODALITY, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** ¿Sirve el `shortname` de Moodle como abreviatura legible? */
function usableShortname(shortname: string | null): boolean {
  if (shortname === null) return false;
  const clean = shortname.trim();
  // Un `shortname` que es solo el código de matrícula —o el código más el
  // periodo— no dice más que el número que ya estamos quitando.
  return clean.length > 0 && clean.length <= BUDGET && /\p{L}{2,}/u.test(clean);
}

/**
 * La etiqueta corta de un curso.
 *
 * Prefiere el `shortname` de Moodle cuando lo hay y parece un nombre; si no,
 * compone con las primeras palabras significativas del nombre largo. Nunca
 * devuelve cadena vacía: antes que eso, devuelve el nombre tal cual vino.
 */
export function courseShortLabel(
  fullname: string | null,
  shortname: string | null = null,
): string {
  if (usableShortname(shortname)) return shortname!.trim();
  if (fullname === null) return "Sin curso";

  const title = courseTitle(fullname);
  if (title === "") return fullname.trim();
  if (title.length <= BUDGET) return title;

  const words = title.split(" ").filter((word) => !STOPWORDS.has(word.toLowerCase()));

  let label = "";
  for (const word of words) {
    const next = label === "" ? word : `${label} ${word}`;
    if (next.length > BUDGET) break;
    label = next;
  }

  // Si ni la primera palabra significativa cabe, se corta ella sola: mejor
  // media palabra reconocible que una celda sin curso.
  if (label === "") return `${(words[0] ?? title).slice(0, BUDGET - 1)}…`;

  return label;
}
