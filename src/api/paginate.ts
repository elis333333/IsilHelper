/**
 * Paginación por cursor de las funciones que la usan.
 *
 * `core_calendar_get_action_events_by_timesort` devuelve como mucho `limitnum`
 * eventos y espera que se pida la página siguiente con `aftereventid`. Sin
 * paginar, la lista sale corta y **parece que el estudiante tiene menos
 * pendientes de los que tiene**, que es el peor fallo posible en esta pantalla:
 * no avisa de nada, simplemente miente por omisión.
 */

import type { ApiError } from "./errors";
import type { Result } from "./result";

export type Page<T> = { items: T[]; lastId: number | undefined };

export type Collected<T> = {
  items: T[];
  pages: number;
  /** `false` si se cortó por error o por el tope de páginas: lo que hay es
   *  parcial y quien llama debe poder decirlo. */
  complete: boolean;
  error?: ApiError;
};

export async function collectPages<T>(
  fetchPage: (after: number | undefined) => Promise<Result<Page<T>, ApiError>>,
  pageSize: number,
  maxPages: number,
): Promise<Collected<T>> {
  const items: T[] = [];
  let after: number | undefined;
  let pages = 0;

  while (pages < maxPages) {
    const result = await fetchPage(after);
    if (!result.ok) {
      return { items, pages, complete: false, error: result.error };
    }

    pages += 1;
    items.push(...result.value.items);

    // Página incompleta: ya no hay más.
    if (result.value.items.length < pageSize) {
      return { items, pages, complete: true };
    }

    const lastId = result.value.lastId;
    // Sin cursor nuevo, o repetido: parar antes que girar en el sitio.
    if (lastId === undefined || lastId === after) {
      return { items, pages, complete: true };
    }
    after = lastId;
  }

  // Se agotó el tope de páginas: puede quedar más sin traer.
  return { items, pages, complete: false };
}
