/**
 * Qué de un curso se puede descargar con el token, y qué no.
 *
 * Es la pieza que sostiene el propósito del proyecto —archivar el material
 * antes de que el instituto revoque el acceso—, así que la regla es
 * **estructural y no por nombre**, igual que el filtro de ruido de `noise.ts`:
 *
 * - `contents[].type === "file"` y `fileurl` en la plataforma → se baja con el
 *   token pegado (`domain.md` §4).
 * - `type === "url"` o un `fileurl` a otro host → enlace externo. No se baja
 *   aquí: son los 176 enlaces de Drive del inventario (`domain.md` §7), y esa
 *   es la Fase 3.
 *
 * Todo esto es función pura sobre lo que ya devolvió `core_course_get_contents`.
 * No hace peticiones y no conoce el token.
 */

import { BASE } from "../lib/constants";
import { downloadPath } from "../lib/paths";
import type { CourseSection, ModuleContent } from "./types";

/** Un archivo de Moodle listo para encolar. */
export type CourseFile = {
  /** Ruta relativa de destino. Es además la identidad del archivo. */
  path: string;
  name: string;
  /** URL de `pluginfile.php` **sin** el token. Se compone al lanzar. */
  url: string;
  /** Bytes según Moodle, cuando los declara. */
  size: number | null;
  moduleId: number;
  moduleName: string;
  sectionName: string;
};

/** Un enlace que el token no abre: Drive, Zoom, formularios. Se inventaría
 *  para el archivo `metadata.json` y para la Fase 3. */
export type ExternalLink = {
  url: string;
  moduleId: number;
  moduleName: string;
  sectionName: string;
  kind: string | null;
};

export type CourseInventory = {
  files: CourseFile[];
  links: ExternalLink[];
};

/** Host de la plataforma, sin esquema. */
const HOST = new URL(BASE).host;

/** Un `fileurl` solo se baja con el token si vive en la plataforma. Cualquier
 *  otro host es un enlace externo por mucho que Moodle lo liste igual. */
export function isPlatformFile(url: string): boolean {
  try {
    return new URL(url).host === HOST;
  } catch {
    return false;
  }
}

/** Los `mod_url` traen el destino ya resuelto en `contents[0].fileurl`
 *  (`domain.md` §4), así que un `type: "url"` es siempre un enlace. */
function isFileEntry(entry: ModuleContent): boolean {
  return entry.type !== "url" && typeof entry.fileurl === "string";
}

/**
 * Inventario de un curso: lo que se baja y lo que no.
 *
 * `attachments` son los adjuntos del profesor en las tareas, que
 * `core_course_get_contents` no devuelve y hay que pedir aparte con
 * `mod_assign_get_assignments`. Van indexados por `cmid` del módulo.
 */
export function collectCourseFiles(
  courseName: string,
  sections: CourseSection[],
  attachments: Map<number, ModuleContent[]> = new Map(),
): CourseInventory {
  const files: CourseFile[] = [];
  const links: ExternalLink[] = [];
  const seen = new Set<string>();

  for (const section of sections) {
    const sectionName = section.name;

    for (const module of section.modules ?? []) {
      const entries = [...(module.contents ?? []), ...(attachments.get(module.id) ?? [])];
      const downloadable = entries.filter(isFileEntry);

      // La carpeta propia se decide por cuántos archivos trae el módulo, no
      // por su tipo: una carpeta de Moodle con un solo PDF no merece una
      // carpeta de más, y una tarea con tres adjuntos sí.
      const ownFolder = downloadable.length > 1;

      for (const entry of entries) {
        const url = entry.fileurl;
        if (typeof url !== "string" || url === "") continue;

        if (!isFileEntry(entry) || !isPlatformFile(url)) {
          links.push({
            url,
            moduleId: module.id,
            moduleName: module.name,
            sectionName,
            kind: module.modname ?? null,
          });
          continue;
        }

        const name = entry.filename ?? module.name;
        const path = downloadPath({
          courseName,
          sectionName,
          moduleName: module.name,
          filename: name,
          ownFolder,
        });

        // Dos entradas que caen en la misma ruta son el mismo archivo. Sin
        // esto, encolar el curso entero pediría dos veces lo mismo y el
        // segundo se guardaría como "guia (1).pdf".
        if (seen.has(path)) continue;
        seen.add(path);

        files.push({
          path,
          name,
          url,
          size: typeof entry.filesize === "number" ? entry.filesize : null,
          moduleId: module.id,
          moduleName: module.name,
          sectionName,
        });
      }
    }
  }

  return { files, links };
}
