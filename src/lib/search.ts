/**
 * Buscador global sobre lo que la interfaz ya tiene cargado.
 *
 * No pide nada a la plataforma, y es una decisión, no una carencia: buscar de
 * verdad exigiría pedir el contenido de los 11 cursos en cada tecla, y el WAF
 * castiga las ráfagas. Lo que sí es obligatorio es que la pantalla diga hasta
 * dónde llega la búsqueda; si no, el estudiante concluirá que algo no existe
 * cuando lo único que pasa es que todavía no lo ha abierto.
 *
 * Todo aquí es puro: se prueba sin red y sin interfaz.
 */

export type SearchKind = "pending" | "course" | "module";

export type SearchEntry = {
  /** Único dentro de la lista; solo lo usa React para las claves. */
  key: string;
  kind: SearchKind;
  name: string;
  courseId: number | null;
  courseName: string | null;
  /** Dónde vive: la sección del curso, el tipo de actividad, la fecha. */
  context: string | null;
  url: string | null;
};

export type SearchHit = SearchEntry & { score: number };

/** Minúsculas y sin tildes: nadie escribe "sílabo" con tilde en un buscador. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

const EXACT = 4;
const PREFIX = 3;
const WORD = 2;
const CONTAINS = 1;

function words(text: string): string[] {
  return text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

/** Cuánto de bien encaja un término. 0 es que no encaja. */
function scoreTerm(haystack: string, term: string): number {
  if (haystack === term) return EXACT;
  if (haystack.startsWith(term)) return PREFIX;
  if (words(haystack).some((word) => word.startsWith(term))) return WORD;
  return haystack.includes(term) ? CONTAINS : 0;
}

/** Los pendientes primero: son los que tienen fecha encima. */
const KIND_ORDER: Record<SearchKind, number> = { pending: 0, course: 1, module: 2 };

/**
 * Busca `query` sobre `entries`. Varias palabras se exigen todas, en cualquier
 * orden: "t01 base" encuentra "Base de datos T01" igual que "T01 - Bases".
 */
export function search(entries: SearchEntry[], query: string, limit = 60): SearchHit[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const hits: SearchHit[] = [];

  for (const entry of entries) {
    const haystack = normalize(entry.name);
    let total = 0;

    for (const term of terms) {
      const score = scoreTerm(haystack, term);
      if (score === 0) {
        total = 0;
        break;
      }
      total += score;
    }

    if (total > 0) hits.push({ ...entry, score: total });
  }

  return hits
    .sort(
      (a, b) =>
        b.score - a.score ||
        KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
        a.name.localeCompare(b.name, "es"),
    )
    .slice(0, limit);
}
