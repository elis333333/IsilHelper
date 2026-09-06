/**
 * Fase 3: explorar los enlaces de Drive de un curso y encolar lo que hay
 * dentro.
 *
 * Es lo que motivó el proyecto. Los contenidos T01–T15 y los sílabos no están
 * en Moodle: son enlaces a carpetas de Drive —176 de los 202 del inventario,
 * `domain.md` §7—, y hasta ahora la extensión los enseñaba pero no los bajaba.
 *
 * La descarga en sí no añade nada nuevo: **reutiliza la cola de la Fase 2**.
 * Lo único que cambia es de dónde sale la URL y cómo se autentica, y eso lo
 * dice el campo `source` de cada archivo. Progreso, pausa, reanudación, saltar
 * lo ya bajado y borrar la entrada del historial funcionan igual.
 *
 * **La rotura legible manda sobre el diseño de la respuesta.** Explorar puede
 * salir a medias —una carpeta que Google no deja ver, un árbol más hondo que
 * el tope—, y eso no puede acabar en una lista corta que parezca completa. Por
 * eso `exploreCourseDrive` devuelve siempre los problemas junto a lo
 * encontrado, y la interfaz los enseña aunque la descarga vaya bien.
 */

import { classifyDriveUrl, downloadUrl, exportExtension } from "../api/drive-links";
import { fetchFolder, explainDriveError } from "../api/drive";
import { walkFolder, type FoundFile, type WalkResult } from "../api/drive-walk";
import { drivePath } from "../lib/paths";
import type { DriveExploration, DriveProblemView, QueuedFile } from "../lib/messages";

/** Un enlace de Drive de un curso, tal como lo ve el detalle de curso. */
export type DriveLinkInput = {
  url: string;
  moduleName: string;
  sectionName: string;
};

/**
 * El nombre con el que se guarda un archivo de Drive.
 *
 * Los documentos nativos no traen extensión en su nombre —un Google Doc se
 * llama «Apuntes», sin más— y se exportan a PDF o XLSX, así que hay que
 * ponérsela: un PDF sin `.pdf` no abre con doble clic. Los binarios ya la
 * traen en el nombre.
 */
export function driveFileName(found: FoundFile): string {
  const base = found.name ?? found.id;
  if (found.kind !== "native" || found.app === null) return base;

  const extension = exportExtension(found.app);
  return base.toLowerCase().endsWith(extension) ? base : `${base}${extension}`;
}

/** Traduce los problemas del recorrido a algo que la interfaz sabe enseñar. */
function toProblemViews(result: WalkResult, moduleName: string): DriveProblemView[] {
  return result.problems.map((problem) => ({
    where: [moduleName, ...problem.trail].join(" / "),
    detail: explainDriveError(problem.error),
  }));
}

/**
 * Explora los enlaces de Drive de un curso y devuelve lo descargable.
 *
 * No encola nada: solo mira. Encolar es una decisión del estudiante, y con un
 * recorrido que puede tardar minutos conviene enseñarle antes qué se encontró
 * y qué no se pudo leer.
 */
export async function exploreCourseDrive(
  courseName: string,
  links: DriveLinkInput[],
): Promise<DriveExploration> {
  const files: QueuedFile[] = [];
  const problems: DriveProblemView[] = [];
  let truncated = false;
  let foldersRead = 0;

  for (const link of links) {
    const target = classifyDriveUrl(link.url);

    // Un enlace suelto a un archivo o a un documento se encola sin recorrer
    // nada: no toda entrada de Drive es una carpeta.
    if (target.kind === "file" || target.kind === "native" || target.kind === "ambiguous") {
      const single = toQueuedFile(
        {
          id: target.id,
          name: null,
          kind: target.kind === "ambiguous" ? "unknown" : target.kind,
          app: target.kind === "native" ? target.app : null,
          trail: [],
        },
        courseName,
        link,
      );
      if (single !== null) files.push(single);
      continue;
    }

    if (target.kind !== "folder") {
      // No es Drive, o es una forma que no conocemos. No se adivina.
      problems.push({
        where: link.moduleName,
        detail: "Este enlace no tiene una forma de Drive que sepa reconocer.",
      });
      continue;
    }

    const walk = await walkFolder(target.id, (id) => fetchFolder(id));
    foldersRead += walk.foldersRead;
    truncated = truncated || walk.truncated;
    problems.push(...toProblemViews(walk, link.moduleName));

    for (const found of walk.files) {
      const queued = toQueuedFile(found, courseName, link);
      if (queued !== null) files.push(queued);
    }
  }

  return { files, problems, truncated, foldersRead };
}

/** `null` cuando no se sabe cómo bajarlo: un tipo desconocido no se adivina. */
function toQueuedFile(
  found: FoundFile,
  courseName: string,
  link: DriveLinkInput,
): QueuedFile | null {
  const target =
    found.kind === "native" && found.app !== null
      ? ({ kind: "native", id: found.id, app: found.app } as const)
      : ({ kind: "file", id: found.id } as const);

  // Un `unknown` se deja fuera a propósito: bajarlo por la ruta de binario
  // podría traer una página en vez del archivo, y eso ensucia el destino.
  if (found.kind === "unknown") return null;

  const url = downloadUrl(target);
  if (url === null) return null;

  const filename = driveFileName(found);
  return {
    path: drivePath({
      courseName,
      sectionName: link.sectionName,
      moduleName: link.moduleName,
      trail: found.trail,
      filename,
    }),
    name: filename,
    url,
    // Drive no declara el tamaño por esta vía. `null` es «no lo sé», y la cola
    // ya sabe bajar sin él: simplemente no enseña porcentaje.
    size: null,
    courseName,
    sectionName: link.sectionName,
    source: "drive",
  };
}
