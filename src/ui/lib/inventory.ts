import { ROOT, sanitizeSegment } from "../../lib/paths";
import type { CourseDetail } from "../../lib/messages";

/**
 * Exporta el inventario de un curso como `metadata.json`, junto al material.
 *
 * Es lo que hacía `isil_download.py` y sigue haciendo falta por dos motivos.
 * El primero, que una carpeta de PDFs sueltos dentro de un año no dice de qué
 * curso salió ni en qué orden iba; el segundo, que los enlaces externos —176
 * de Drive en el inventario de `domain.md` §7— son justo lo que la Fase 3 va a
 * necesitar, y hoy sirven ya para bajarlos con rclone.
 *
 * Se genera **en la pestaña y no en el service worker**: un worker de MV3 no
 * tiene `URL.createObjectURL`, así que ahí no hay forma de convertir un texto
 * en algo que `chrome.downloads` sepa guardar.
 */

const DRIVE_HOSTS = ["drive.google.com", "docs.google.com"];

function isDrive(url: string): boolean {
  try {
    return DRIVE_HOSTS.includes(new URL(url).host);
  } catch {
    return false;
  }
}

export function buildInventory(detail: CourseDetail) {
  return {
    curso: detail.courseName,
    cursoId: detail.courseId,
    exportado: new Date().toISOString(),
    secciones: detail.sections.map((section) => ({
      nombre: section.name,
      modulos: section.modules.map((module) => ({
        id: module.id,
        nombre: module.name,
        tipo: module.kind,
        completado: module.completed,
        archivos: module.files.map((file) => ({ nombre: file.name, ruta: file.path })),
        enlacesExternos: module.externalCount,
      })),
    })),
    archivos: detail.files.map((file) => ({
      nombre: file.name,
      ruta: file.path,
      bytes: file.size,
    })),
    enlacesExternos: detail.links.map((link) => ({
      url: link.url,
      modulo: link.moduleName,
      seccion: link.sectionName,
      tipo: link.kind,
    })),
    // Separado a propósito: es la lista que se le pasa a rclone hoy y la que
    // alimentará la descarga de Drive cuando exista.
    drive: [...new Set(detail.links.map((link) => link.url).filter(isDrive))],
  };
}

/** Devuelve la ruta donde quedó, para poder decirlo en pantalla. */
export async function exportInventory(detail: CourseDetail): Promise<string> {
  const json = JSON.stringify(buildInventory(detail), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const path = `${ROOT}/${sanitizeSegment(detail.courseName)}/metadata.json`;

  try {
    await chrome.downloads.download({
      url,
      filename: path,
      conflictAction: "overwrite",
      saveAs: false,
    });
    return path;
  } finally {
    // El blob se libera en cuanto la descarga arranca; retenerlo mantendría
    // el archivo entero en memoria mientras la pestaña siga abierta.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
