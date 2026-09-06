/**
 * Recorrido de una carpeta de Drive y de todo lo que cuelga de ella.
 *
 * La pieza que hace falta porque **los enlaces de los cursos son carpetas, no
 * archivos**: sin recorrerlas no hay ids que bajar.
 *
 * El recorrido recibe el lector como argumento, así que es comprobable entero
 * sin red. No conoce `chrome`, ni `fetch`, ni la cola.
 *
 * **La condición de rotura legible manda sobre el diseño del resultado.** Una
 * carpeta que no se pudo leer no se omite: se devuelve en `problems`, con su
 * nombre y su causa. Un recorrido que descarta en silencio lo que falla
 * devuelve una lista corta que parece completa, y el estudiante se entera de
 * lo que le falta cuando ya no tiene acceso a la plataforma. Lo mismo vale
 * para los topes: si se alcanzan, se dice.
 */

import type { Result } from "./result";
import type { DriveError } from "./drive";
import type { DriveEntry } from "./drive-folder";
import type { FolderListing } from "./drive-folder";

/** Lo que el recorrido necesita saber leer. */
export type FolderReader = (
  folderId: string,
) => Promise<Result<FolderListing & { ok: true }, DriveError>>;

/** Un archivo encontrado, con el camino de subcarpetas hasta él. */
export type FoundFile = {
  id: string;
  name: string | null;
  kind: "file" | "native" | "unknown";
  app: DriveEntry["app"];
  /** Subcarpetas desde la carpeta raíz del recorrido, de fuera hacia dentro. */
  trail: string[];
};

/** Una carpeta que no se pudo leer. Se cuenta, no se calla. */
export type WalkProblem = {
  folderId: string;
  /** Cómo se llamaba, si se supo antes de fallar. */
  name: string | null;
  /** Ruta hasta la carpeta, **incluyéndola**. En un archivo el `trail` son sus
   *  carpetas contenedoras; en una carpeta es su propia ruta, que es lo que
   *  hace falta para ir a mirarla a mano. */
  trail: string[];
  error: DriveError;
};

export type WalkResult = {
  files: FoundFile[];
  problems: WalkProblem[];
  /** Se alcanzó uno de los topes, así que **puede faltar material**. */
  truncated: boolean;
  /** Carpetas leídas con éxito. Sirve para decir el alcance de lo mirado. */
  foldersRead: number;
};

export type WalkLimits = {
  /** Profundidad máxima de subcarpetas. */
  maxDepth: number;
  /** Tope de carpetas a leer, para que un árbol enorme no se coma la tanda. */
  maxFolders: number;
};

/** Topes por defecto, holgados para el material de un ciclo: el inventario son
 *  166 carpetas en total, repartidas entre once cursos. */
export const DEFAULT_LIMITS: WalkLimits = { maxDepth: 8, maxFolders: 120 };

/**
 * Recorre una carpeta y devuelve todo lo descargable que hay debajo.
 *
 * En anchura y no en profundidad, a propósito: si se alcanza el tope, lo que
 * falta son las ramas más hondas y no media carpeta de primer nivel, que es
 * mucho más fácil de explicar y de reanudar.
 */
export async function walkFolder(
  rootId: string,
  read: FolderReader,
  limits: WalkLimits = DEFAULT_LIMITS,
): Promise<WalkResult> {
  const files: FoundFile[] = [];
  const problems: WalkProblem[] = [];

  // Drive permite atajos, así que un árbol puede tener ciclos. Sin esto, un
  // atajo a una carpeta antecesora deja el recorrido dando vueltas.
  const visited = new Set<string>([rootId]);
  const seenFiles = new Set<string>();

  type Pending = { id: string; name: string | null; trail: string[]; depth: number };
  let queue: Pending[] = [{ id: rootId, name: null, trail: [], depth: 0 }];
  let foldersRead = 0;
  let truncated = false;

  while (queue.length > 0) {
    const next: Pending[] = [];

    for (const folder of queue) {
      if (foldersRead >= limits.maxFolders) {
        truncated = true;
        break;
      }

      const listing = await read(folder.id);
      if (!listing.ok) {
        problems.push({
          folderId: folder.id,
          name: folder.name,
          trail: folder.trail,
          error: listing.error,
        });
        continue;
      }
      foldersRead += 1;

      for (const entry of listing.value.entries) {
        if (entry.kind === "folder") {
          if (folder.depth + 1 > limits.maxDepth) {
            truncated = true;
            continue;
          }
          if (visited.has(entry.id)) continue;
          visited.add(entry.id);
          next.push({
            id: entry.id,
            name: entry.name,
            // El nombre de la carpeta hija es un segmento del camino. Sin
            // nombre no se puede nombrar la carpeta, así que se usa su id:
            // feo, pero recuperable, y mejor que agrupar bajo "sin nombre"
            // todo lo que Drive no supo nombrar.
            trail: [...folder.trail, entry.name ?? entry.id],
            depth: folder.depth + 1,
          });
          continue;
        }

        // El mismo archivo enlazado desde dos sitios es un archivo.
        if (seenFiles.has(entry.id)) continue;
        seenFiles.add(entry.id);

        files.push({
          id: entry.id,
          name: entry.name,
          kind: entry.kind,
          app: entry.app,
          trail: folder.trail,
        });
      }
    }

    // Alcanzado el tope de carpetas, lo que quedaba por visitar se queda sin
    // visitar, y eso se dice.
    if (foldersRead >= limits.maxFolders && next.length > 0) {
      truncated = true;
      queue = [];
    } else {
      queue = next;
    }
  }

  return { files, problems, truncated, foldersRead };
}

/**
 * Lo que la interfaz dice del recorrido, en una frase.
 *
 * Nunca calla un problema: si algo no se pudo leer o se alcanzó un tope, sale
 * en el texto. Es la diferencia entre «te bajé 40 archivos» y «te bajé 40, y
 * de dos carpetas no pude leer nada».
 */
export function walkSummary(result: WalkResult): string {
  const parts = [
    result.files.length === 1
      ? "Encontré 1 archivo"
      : `Encontré ${result.files.length} archivos`,
  ];

  if (result.problems.length > 0) {
    parts.push(
      result.problems.length === 1
        ? "y hay 1 carpeta que no pude leer"
        : `y hay ${result.problems.length} carpetas que no pude leer`,
    );
  }

  if (result.truncated) {
    parts.push("y paré antes de llegar al fondo, así que puede faltar material");
  }

  return `${parts.join(", ")}.`;
}
