/**
 * La pantalla de confirmación de antivirus de Drive.
 *
 * Para los archivos que pasan de cierto tamaño, Google no devuelve el binario:
 * devuelve una página que dice que no ha podido analizarlo y pide confirmar la
 * descarga. Llega con estado 200 y `Content-Type: text/html`, así que
 * `chrome.downloads` la guardaría tan contenta con nombre de `.pptx`.
 *
 * Se anticipó al medir —está escrito en `scripts/medir-drive.js`— y se
 * confirmó en la primera tanda real: fallaron dos presentaciones y ningún PDF.
 * **Los PPTX pesan más, y por eso solo fallaban esos.** El síntoma engañaba:
 * parecía falta de sesión, pero el archivo siguiente bajaba bien con la misma
 * sesión un segundo después.
 *
 * Lo que hay que hacer es lo que haría el navegador: leer el formulario y
 * repetir la petición con sus campos, `confirm` incluido.
 */

/** Marcas de que esto es la página de confirmación y no el archivo. */
const CONFIRMATION = /virus scan warning|no se puede analizar|couldn't scan|download-form/i;

/** El formulario que hay que reenviar. */
const FORM = /<form[^>]*\bid="download-form"[^>]*>([\s\S]*?)<\/form>/i;
const FORM_ANY = /<form[^>]*>([\s\S]*?)<\/form>/i;
const ACTION = /\baction="([^"]+)"/i;
const INPUT = /<input\b[^>]*>/gi;
const NAME = /\bname="([^"]*)"/i;
const VALUE = /\bvalue="([^"]*)"/i;

const ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };

function decode(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (whole, name: string) => ENTITIES[name] ?? whole);
}

/** ¿Es la página de confirmación, y no el archivo ni la pantalla de acceso? */
export function isConfirmationPage(html: string): boolean {
  return CONFIRMATION.test(html);
}

/**
 * La URL con la que repetir la descarga, sacada del formulario.
 *
 * `null` cuando el HTML no es una confirmación o no trae formulario, que es lo
 * que hay que distinguir para no reintentar en bucle contra una página de
 * acceso.
 */
export function confirmationUrl(html: string, fallbackBase?: string): string | null {
  if (!isConfirmationPage(html)) return null;

  const form = FORM.exec(html) ?? FORM_ANY.exec(html);
  if (form === null) return null;

  const head = html.slice(form.index, form.index + (form[0]?.indexOf(">") ?? 0) + 1);
  const action = ACTION.exec(head)?.[1];
  const base = action === undefined ? fallbackBase : decode(action);
  if (base === undefined || base === "") return null;

  const params = new URLSearchParams();
  const body = form[1] ?? "";
  for (const raw of body.match(INPUT) ?? []) {
    const name = NAME.exec(raw)?.[1];
    if (name === undefined || name === "") continue;
    params.set(name, decode(VALUE.exec(raw)?.[1] ?? ""));
  }

  // Sin `confirm` no hay nada que confirmar, y repetir la misma petición
  // devolvería la misma página. Mejor decirlo que entrar en bucle.
  if (!params.has("confirm")) return null;

  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return null;
  }

  for (const [key, value] of params) url.searchParams.set(key, value);
  return url.toString();
}
