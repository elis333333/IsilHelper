/**
 * Clasificación de un enlace de Drive por su forma.
 *
 * Es la pieza que decide **qué hacer con cada cosa**: una carpeta se recorre,
 * un binario se baja, un documento nativo se exporta. Sin el tipo no se puede
 * ni recorrer un árbol ni elegir la ruta de descarga.
 *
 * Las formas salen de `domain.md` §6, medidas sobre los 202 enlaces del
 * inventario, más las variantes con prefijo de cuenta (`/drive/u/0/…`) que
 * aparecen cuando el navegador tiene varias sesiones de Google abiertas.
 *
 * **Todo esto es puro y sin DOM a propósito.** El service worker de MV3 no
 * tiene `DOMParser` —igual que no tiene `URL.createObjectURL`—, así que un
 * parser que dependa del DOM solo funcionaría en la pestaña. Con expresiones
 * regulares funciona en los dos sitios y se prueba sin navegador.
 */

/** Los tres tipos de documento nativo que hay que exportar en vez de bajar. */
export type NativeApp = "document" | "spreadsheet" | "presentation";

export type DriveTarget =
  /** Carpeta: se enumera y se recorre. */
  | { kind: "folder"; id: string }
  /** Archivo binario: se baja tal cual. */
  | { kind: "file"; id: string }
  /** Documento de Google: no se baja, se exporta. */
  | { kind: "native"; id: string; app: NativeApp }
  /** `?id=` a secas: puede ser carpeta o archivo y hay que preguntarlo. */
  | { kind: "ambiguous"; id: string }
  /** No es Drive, o es una forma que no conocemos. **No se adivina.** */
  | { kind: "unknown" };

const DRIVE_HOSTS = new Set(["drive.google.com", "docs.google.com"]);

/** Los identificadores de Drive no llevan puntuación. */
const ID = "[A-Za-z0-9_-]+";

/** El prefijo `/u/<n>/` aparece cuando hay varias cuentas de Google abiertas.
 *  Es opcional en todas las rutas y olvidarlo hace fallar la clasificación
 *  justo en el navegador de quien más lo necesita. */
const ACCOUNT = "(?:u/\\d+/)?";

const FOLDER = new RegExp(`^/(?:drive/)?${ACCOUNT}folders/(${ID})`);
const FILE = new RegExp(`^/(?:drive/)?${ACCOUNT}file/d/(${ID})`);
const NATIVE = new RegExp(`^/(document|spreadsheets|presentation)/${ACCOUNT}d/(${ID})`);

/** El nombre de la ruta y el del tipo no coinciden: la ruta de las hojas de
 *  cálculo va en plural y el mime en singular. */
const APPS: Record<string, NativeApp> = {
  document: "document",
  spreadsheets: "spreadsheet",
  presentation: "presentation",
};

export function classifyDriveUrl(raw: string): DriveTarget {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: "unknown" };
  }

  if (!DRIVE_HOSTS.has(url.host)) return { kind: "unknown" };

  const path = url.pathname;

  const folder = FOLDER.exec(path);
  if (folder?.[1] !== undefined) return { kind: "folder", id: folder[1] };

  const file = FILE.exec(path);
  if (file?.[1] !== undefined) return { kind: "file", id: file[1] };

  const native = NATIVE.exec(path);
  if (native?.[1] !== undefined && native[2] !== undefined) {
    const app = APPS[native[1]];
    if (app !== undefined) return { kind: "native", id: native[2], app };
  }

  // `/open?id=`, `/uc?id=` y compañía. Se sabe el identificador pero no qué
  // hay detrás; tratarlo como archivo por defecto falla (`domain.md` §6).
  const id = url.searchParams.get("id");
  if (id !== null && new RegExp(`^${ID}$`).test(id)) return { kind: "ambiguous", id };

  return { kind: "unknown" };
}

/**
 * La URL de descarga o de exportación, según el tipo.
 *
 * Las tres salen medidas de `fase-3.md` §8: bajan con la sesión del navegador,
 * sin OAuth. La de las presentaciones es la irregular —lleva el formato en la
 * ruta y no en la query—, y es el tipo de detalle que se descubre probando.
 */
export function downloadUrl(target: DriveTarget): string | null {
  switch (target.kind) {
    case "file":
    case "ambiguous":
      return `https://drive.usercontent.google.com/download?id=${target.id}&export=download`;
    case "native":
      switch (target.app) {
        case "document":
          return `https://docs.google.com/document/d/${target.id}/export?format=pdf`;
        case "spreadsheet":
          return `https://docs.google.com/spreadsheets/d/${target.id}/export?format=xlsx`;
        case "presentation":
          return `https://docs.google.com/presentation/d/${target.id}/export/pdf`;
      }
    // eslint-disable-next-line no-fallthrough -- el switch de arriba es exhaustivo
    case "folder":
    case "unknown":
      return null;
  }
}

/** La extensión que tendrá el archivo exportado. Un PDF sin `.pdf` no abre con
 *  doble clic, y el nombre que da Drive no la trae. */
export function exportExtension(app: NativeApp): string {
  switch (app) {
    case "document":
      return ".pdf";
    case "spreadsheet":
      return ".xlsx";
    case "presentation":
      return ".pdf";
  }
}

/** La vista que Drive sirve para incrustar una carpeta en otra página. Es la
 *  fuente de la enumeración: HTML plano, sin blobs JS (`fase-3.md` §8b). */
export function folderViewUrl(folderId: string): string {
  return `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
}
