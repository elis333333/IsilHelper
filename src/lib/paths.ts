/**
 * Rutas de destino de las descargas.
 *
 * `chrome.downloads.download` acepta `filename` **relativo a la carpeta de
 * descargas del navegador**: no admite rutas absolutas, ni `..`, ni segmentos
 * vacíos. Cuando la ruta no le gusta no avisa con un error legible, rechaza la
 * descarga entera. Por eso el saneado es función pura y va con tests.
 *
 * El árbol es el que pidió el proyecto:
 *
 *     Descargas/IsilHelper/<Curso>/<Sección>/<archivo>
 *
 * Con una excepción: cuando un módulo trae más de un archivo —una carpeta de
 * Moodle, una tarea con varios adjuntos— se intercala `<Módulo>/`. Sin eso,
 * dos carpetas distintas con un `guia.pdf` cada una se pisarían dentro de la
 * misma sección, y la segunda acabaría como `guia (1).pdf`, que ya no dice de
 * dónde salió.
 */

/** Carpeta raíz dentro de las descargas del navegador. */
export const ROOT = "IsilHelper";

/** Windows no admite estos nombres ni siquiera con extensión detrás. */
const RESERVED = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
]);

/** Tope por segmento. Los nombres de módulo de Moodle son largos y hay
 *  sistemas de archivos que cortan en 255 bytes; 90 deja sitio de sobra para
 *  la ruta completa sin acercarse al límite. */
const MAX_SEGMENT = 90;

/** Separadores y reservados de Windows. Las tildes se quedan: el material
 *  está en español y `Diseño` es más útil que `Dise-o`. */
const ILLEGAL = /[<>:"/\\|?*]/g;

/** Primer código imprimible: por debajo van los caracteres de control. */
const FIRST_PRINTABLE = 0x20;

/** Los de control rompen la ruta y no se ven al leerla, que es lo peor de
 *  todo. Se quitan comparando códigos y no con una expresión regular, para no
 *  tener que escribirlos en el fuente. */
function stripControl(value: string): string {
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code !== undefined && code >= FIRST_PRINTABLE) out += char;
  }
  return out;
}

/** Lo común a segmentos y nombres de archivo: limpiar, colapsar espacios y
 *  quitar los puntos y espacios de los extremos. Windows recorta en silencio
 *  los del final, así que dos nombres distintos acabarían siendo el mismo. */
function clean(name: string): string {
  return stripControl(name.normalize("NFC"))
    .replace(ILLEGAL, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .replace(/[. ]+$/, "")
    .trim();
}

/** Convierte un nombre cualquiera en un segmento de ruta seguro. */
export function sanitizeSegment(name: string): string {
  const cleaned = clean(name).slice(0, MAX_SEGMENT).replace(/[. ]+$/, "").trim();
  if (cleaned === "") return "sin nombre";

  const stem = (cleaned.split(".")[0] ?? "").toUpperCase();
  return RESERVED.has(stem) ? `_${cleaned}` : cleaned;
}

/** Igual que un segmento, pero conservando la extensión al recortar: un PDF
 *  que pierde el `.pdf` deja de abrirse con doble clic. */
export function sanitizeFilename(name: string, fallback = "archivo"): string {
  const cleaned = clean(name);
  if (cleaned === "") return fallback;
  if (cleaned.length <= MAX_SEGMENT) return sanitizeSegment(cleaned);

  const dot = cleaned.lastIndexOf(".");
  // Una "extensión" de más de cinco letras casi nunca lo es, así que ahí se
  // recorta como un segmento cualquiera.
  if (dot <= 0 || cleaned.length - dot > 6) return sanitizeSegment(cleaned);

  const ext = cleaned.slice(dot);
  const stem = cleaned.slice(0, MAX_SEGMENT - ext.length).trim();
  return sanitizeSegment(`${stem}${ext}`);
}

export type PathParts = {
  courseName: string;
  sectionName: string;
  moduleName: string;
  filename: string;
  /** El módulo trae más de un archivo, así que necesita carpeta propia. */
  ownFolder: boolean;
};

/**
 * Ruta relativa a la carpeta de descargas, lista para `chrome.downloads`.
 *
 * Se usa además como **identidad del archivo** en la cola y en el registro de
 * lo ya descargado: dos archivos con la misma ruta son el mismo archivo, y esa
 * es justo la pregunta que hay que contestar para no bajar dos veces lo mismo.
 */
export function downloadPath(parts: PathParts): string {
  return [
    ROOT,
    sanitizeSegment(parts.courseName),
    sanitizeSegment(parts.sectionName),
    ...(parts.ownFolder ? [sanitizeSegment(parts.moduleName)] : []),
    sanitizeFilename(parts.filename),
  ].join("/");
}

export type DrivePathParts = {
  courseName: string;
  sectionName: string;
  /** El módulo de Moodle que enlaza a Drive: `T01 - Introducción`. Es el
   *  "Tema" de la estructura `Curso / Sección / Tema /`. */
  moduleName: string;
  /** Las subcarpetas de Drive por debajo del módulo, de fuera hacia dentro.
   *  Vacío para lo que cuelga directamente de la carpeta enlazada. */
  trail: string[];
  filename: string;
};

/**
 * Ruta de destino de un archivo que vive en Drive.
 *
 *     Descargas/IsilHelper/<Curso>/<Sección>/<Tema>/<subcarpetas…>/<archivo>
 *
 * Se separa de `downloadPath` en vez de añadirle un parámetro porque son dos
 * formas distintas: en Moodle el módulo solo aparece cuando trae más de un
 * archivo, y aquí **el módulo siempre está**, porque es el nombre con el que
 * el estudiante reconoce el tema. Debajo se reproduce el árbol propio de
 * Drive, que es la única pista que tiene de cómo lo organizó el profesor.
 */
export function drivePath(parts: DrivePathParts): string {
  return [
    ROOT,
    sanitizeSegment(parts.courseName),
    sanitizeSegment(parts.sectionName),
    sanitizeSegment(parts.moduleName),
    ...parts.trail.map(sanitizeSegment),
    sanitizeFilename(parts.filename),
  ].join("/");
}
