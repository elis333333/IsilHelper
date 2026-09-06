/**
 * Lectura del contenido de una carpeta de Drive a partir del HTML de
 * `embeddedfolderview`.
 *
 * **Esto es scraping y hay que decirlo en voz alta.** No es una interfaz
 * publicada para terceros: es una página de Google, y Google puede cambiarla
 * sin avisar y sin considerarlo una ruptura. Se elige igualmente como vía por
 * defecto porque la alternativa —OAuth con `client_id` propio— son diez pasos
 * en la consola de Google que la mayoría de estudiantes no llega a terminar
 * (`fase-3.md` §8b). El razonamiento completo está allí; aquí está lo que esa
 * elección obliga a hacer en el código:
 *
 * 1. **El módulo está aislado.** Todo el conocimiento sobre la forma del HTML
 *    de Drive vive en este archivo y en `drive-links.ts`. El día que se rompa,
 *    arreglarlo es cambiar esto y sus tests, no perseguirlo por media base de
 *    código.
 * 2. **La rotura es legible.** No devuelve una lista vacía cuando no entiende
 *    el HTML: devuelve `ok: false` con la causa. Un scraping que falla en
 *    silencio convierte un cambio de Google en «perdí mi material», que es
 *    exactamente la confusión que esta extensión existe para quitar de encima.
 *
 * **Sin DOM a propósito.** El service worker de MV3 no tiene `DOMParser`, así
 * que un parser basado en el DOM solo funcionaría en la pestaña. Con
 * expresiones regulares funciona en los dos sitios y se prueba sin navegador.
 */

import { classifyDriveUrl, type DriveTarget, type NativeApp } from "./drive-links";

/** Los mime de documento nativo, para la segunda fuente del tipo. */
const NATIVE_MIMES: Record<string, NativeApp> = {
  "application/vnd.google-apps.document": "document",
  "application/vnd.google-apps.spreadsheet": "spreadsheet",
  "application/vnd.google-apps.presentation": "presentation",
};

export type DriveEntry = {
  id: string;
  /** `null` cuando la entrada existe pero no se pudo leer su nombre. Se
   *  distingue de la cadena vacía: uno es «no lo sé» y el otro sería mentira. */
  name: string | null;
  /** `unknown` cuando el enlace no tiene una forma conocida. **No se asume que
   *  sea un archivo**: tratar una carpeta como archivo falla al bajarla. */
  kind: "folder" | "file" | "native" | "unknown";
  app: NativeApp | null;
  url: string | null;
};

/**
 * El resultado distingue «no hay sesión» de «no entiendo el HTML», y ninguna
 * de las dos se parece a una lista vacía.
 *
 * **Cero entradas casi nunca significa una carpeta vacía**: significa que el
 * HTML cambió. Ante la duda se devuelve la rotura, que es el lado seguro del
 * error: avisar de más ante una carpeta realmente vacía es un susto; callar
 * ante una rotura es una pérdida de material que el estudiante descubre
 * cuando ya no hay acceso.
 */
export type FolderListing =
  | {
      ok: true;
      entries: DriveEntry[];
      /** El `<title>` de la página, que es el nombre de la carpeta. `null` si
       *  el HTML no lo trae. */
      folderName: string | null;
    }
  | { ok: false; reason: "login" | "shape" };

/** Marca de que Drive respondió con la pantalla de acceso en vez de con la
 *  carpeta. Es «no hay sesión», no «se rompió la vía»: son dos mensajes
 *  distintos y confundirlos manda a arreglar lo que no está roto. */
const LOGIN = /accounts\.google\.com\/(?:v3\/)?signin|ServiceLogin|<title>[^<]*Sign in/i;

/**
 * Cada entrada es un `<div class="flip-entry" …>`. **El ancla es la clase, no
 * el `id="entry-<ID>"` del div**, y la diferencia importa: el identificador
 * bueno está en el `href`, que es el mismo que hay que usar para bajar el
 * archivo. Depender del atributo `id` sería fiarse de dos sitios distintos
 * para el mismo dato, y del que además no se usa para nada más.
 *
 * Se permiten clases adicionales: `class="flip-entry algo"` sigue siendo una
 * entrada. Y el `-` del final del patrón evita confundirla con sus hijas
 * —`flip-entry-info`, `flip-entry-title`—, que llevan el mismo prefijo.
 */
const ENTRY = /class="flip-entry(?:\s[^"]*)?"/g;

const HREF = /href="([^"]+)"/;
const TITLE = /class="flip-entry-title"[^>]*>([^<]*)</;
const ANCHOR_TEXT = /<a\b[^>]*>([^<]+)</;

/** Respaldo para el identificador cuando no hay `href` que leer. El prefijo es
 *  opcional a propósito: un HTML anonimizado puede haberlo perdido. */
const ENTRY_ID = /id="(?:entry-)?([A-Za-z0-9_-]+)"/;

/**
 * El icono de tipo, que es una **segunda fuente del tipo dentro del mismo
 * HTML y sin peticiones extra**:
 *
 *     drive-thirdparty.googleusercontent.com/16/type/application/pdf
 *
 * Se usa **solo como respaldo**, cuando el `href` no clasifica. Como
 * confirmación no aportaría: obligaría a decidir qué hacer si las dos fuentes
 * discrepan, y esa rama habría que escribirla sin ningún dato sobre cuándo
 * ocurre. Como respaldo es todo ganancia: no toca el camino normal y da una
 * segunda oportunidad justo cuando la primera falla, que es el día que Google
 * cambie la forma de sus URLs.
 */
const ICON_MIME = /drive-thirdparty\.googleusercontent\.com\/\d+\/type\/([^"'\s?]+)/;

/** El `<title>` de la página es el nombre de la carpeta. Sirve para nombrar el
 *  directorio de destino sin tener que pedirlo aparte. */
const PAGE_TITLE = /<title>([^<]*)<\/title>/i;

/**
 * Entidades nombradas que aparecen de verdad en el material.
 *
 * Las acentuadas no son opcionales: los nombres están en español y
 * `Introducci&oacute;n.pdf` es la forma normal, no un caso raro. **La tabla es
 * sensible a mayúsculas** —`&Oacute;` y `&oacute;` son letras distintas—, así
 * que la búsqueda es exacta y no se normaliza la clave.
 */
const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú",
  Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú",
  ntilde: "ñ", Ntilde: "Ñ", uuml: "ü", Uuml: "Ü",
  iquest: "¿", iexcl: "¡", laquo: "«", raquo: "»", deg: "°", middot: "·",
  hellip: "…", ndash: "–", mdash: "—",
  lsquo: "\u2018", rsquo: "\u2019", ldquo: "\u201C", rdquo: "\u201D",
};

/** Sin DOM no hay decodificador de entidades gratis, y los nombres del
 *  material llevan tildes y comillas. Un `Guía &amp; taller.pdf` guardado tal
 *  cual deja el `&amp;` en el nombre del archivo. */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
    // Sin `toLowerCase`: colapsaría `&Oacute;` con `&oacute;` y convertiría
    // una mayúscula acentuada en minúscula dentro del nombre del archivo.
    .replace(/&([a-zA-Z]+);/g, (whole, name: string) => ENTITIES[name] ?? whole);
}

/** El nombre, por orden de preferencia. El título propio es el bueno; el texto
 *  del enlace es el respaldo para cuando cambie la clase, que es lo primero
 *  que cambia cuando algo cambia. */
function readName(block: string): string | null {
  const title = TITLE.exec(block)?.[1];
  const anchor = ANCHOR_TEXT.exec(block)?.[1];
  const raw = (title ?? anchor ?? "").trim();
  if (raw === "") return null;
  const name = decodeEntities(raw).trim();
  return name === "" ? null : name;
}

/**
 * Lee el contenido de una carpeta.
 *
 * El **tipo sale de la forma del enlace**, no de un blob JS aparte. La página
 * completa de Drive lleva un `_DRIVE_ivd` con id, padre, nombre, mime y
 * tamaño, que es más información; pero es un blob hexadecimal dentro de la
 * aplicación entera, exige una segunda petición a la ruta menos estable de las
 * dos, y de todo eso solo el mime hace falta de verdad. El `href` ya lo dice:
 * una carpeta enlaza a `/folders/`, un documento nativo a `/document/d/`, y
 * cambiar eso rompería todas las carpetas incrustadas del mundo. Se prefiere
 * la fuente más estable aunque dé menos campos. `_DRIVE_ivd` queda descrito en
 * `fase-3.md` §8b por si algún día hace falta el tamaño.
 */
export function parseFolderHtml(html: string): FolderListing {
  if (LOGIN.test(html)) return { ok: false, reason: "login" };

  // Los índices de cada entrada delimitan su bloque. No se puede emparejar
  // `<div>` anidados con una expresión regular, pero tampoco hace falta: lo
  // que hay entre una entrada y la siguiente es esa entrada.
  const starts: number[] = [];
  ENTRY.lastIndex = 0;
  while (ENTRY.exec(html) !== null) starts.push(ENTRY.lastIndex);

  // Cero entradas se informa como rotura, **haya contenedor o no**. La
  // tentación es tratar «contenedor presente y sin entradas» como carpeta
  // vacía, pero eso está sin confirmar contra una carpeta vacía real, y
  // acertar por suerte aquí cuesta caro: el día que Drive cambie el HTML sin
  // quitar el contenedor, todas las carpetas parecerían vacías. El mensaje de
  // `listingProblem` nombra las dos causas y no afirma la que no consta.
  if (starts.length === 0) return { ok: false, reason: "shape" };

  const entries: DriveEntry[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < starts.length; index++) {
    const from = starts[index];
    if (from === undefined) continue;
    const block = html.slice(from, starts[index + 1] ?? html.length);

    const href = HREF.exec(block)?.[1];
    const url = href === undefined ? null : decodeEntities(href);
    const target = url === null ? { kind: "unknown" as const } : classifyDriveUrl(url);

    // El identificador sale del enlace, que es además el que hay que usar para
    // bajar el archivo. El atributo `id` del div es el respaldo para cuando no
    // hay enlace que leer.
    const id = "id" in target ? target.id : ENTRY_ID.exec(block)?.[1];
    if (id === undefined) continue;

    // La misma entrada dos veces es la misma entrada.
    if (seen.has(id)) continue;
    seen.add(id);

    const resolved = target.kind === "unknown" ? fromIconMime(block) : target;

    entries.push({
      id,
      name: readName(block),
      kind: resolved.kind === "ambiguous" ? "unknown" : resolved.kind,
      app: resolved.kind === "native" ? resolved.app : null,
      url,
    });
  }

  return { ok: true, entries, folderName: readFolderName(html) };
}

/**
 * El tipo a partir del icono, cuando el enlace no lo da.
 *
 * Es la segunda fuente de la que hablaba `ICON_MIME`: mismo HTML, ninguna
 * petición de más. Solo se consulta si el `href` no clasificó, así que en el
 * camino normal no cambia nada.
 */
function fromIconMime(block: string): DriveTarget | { kind: "unknown" } {
  const mime = ICON_MIME.exec(block)?.[1];
  if (mime === undefined) return { kind: "unknown" };

  if (mime === "application/vnd.google-apps.folder") return { kind: "folder", id: "" };

  const native = NATIVE_MIMES[mime];
  if (native !== undefined) return { kind: "native", id: "", app: native };

  // Cualquier otro mime es un binario: un PDF, un PPTX, un SQL.
  return mime.startsWith("application/vnd.google-apps.")
    ? { kind: "unknown" }
    : { kind: "file", id: "" };
}

/** El nombre de la carpeta, para nombrar el directorio de destino sin pedirlo
 *  aparte. `null` cuando el HTML no trae `<head>`, que es lo que pasa si se
 *  guardó solo el fragmento de la lista. */
function readFolderName(html: string): string | null {
  const raw = PAGE_TITLE.exec(html)?.[1]?.trim();
  if (raw === undefined || raw === "") return null;
  const name = decodeEntities(raw).trim();
  return name === "" ? null : name;
}

/** Lo que la interfaz enseña cuando la lectura falla. Las dos causas se dicen
 *  por separado, y la de la forma nombra las dos posibilidades en vez de
 *  afirmar la que no consta. Es el mismo criterio que la pantalla de notas con
 *  el boletín vacío. */
export function listingProblem(reason: "login" | "shape"): string {
  return reason === "login"
    ? "Google pidió iniciar sesión. Entra a drive.google.com con tu cuenta del instituto y vuelve a intentarlo."
    : "No pude leer el contenido de esta carpeta. O está vacía, o Google cambió la página y hay que actualizar la extensión.";
}
