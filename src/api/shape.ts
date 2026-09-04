/**
 * Describe la **forma** de una respuesta: qué campos vienen, en cuántos
 * elementos y de qué tipo. Nunca incluye valores.
 *
 * Existe para cerrar las dudas sobre la API contra una cuenta real sin que el
 * estudiante tenga que enviar sus datos: el informe dice "el campo `course`
 * viene en 40 de 42 eventos y es un objeto", no qué curso es.
 */

export type FieldStat = {
  /** En cuántos elementos aparece la clave. */
  present: number;
  /** Tipos observados, ordenados. `null` cuenta como tipo: saber que un campo
   *  llega pero llega nulo es distinto de que no llegue. */
  types: string[];
};

export type ShapeReport = {
  count: number;
  fields: Record<string, FieldStat>;
};

export function typeName(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function record(fields: Record<string, FieldStat>, path: string, value: unknown): void {
  const stat = fields[path] ?? { present: 0, types: [] };
  stat.present += 1;
  const name = typeName(value);
  if (!stat.types.includes(name)) stat.types.push(name);
  fields[path] = stat;
}

function walk(
  value: unknown,
  prefix: string,
  depth: number,
  maxDepth: number,
  fields: Record<string, FieldStat>,
): void {
  if (depth > maxDepth) return;

  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (child === undefined) continue;
      const path = prefix === "" ? key : `${prefix}.${key}`;
      record(fields, path, child);
      walk(child, path, depth + 1, maxDepth, fields);
    }
    return;
  }

  // De los arrays se mira el primer elemento: basta para conocer la forma y
  // evita informes enormes.
  if (Array.isArray(value) && value.length > 0) {
    walk(value[0], `${prefix}[]`, depth + 1, maxDepth, fields);
  }
}

export function describeShape(items: unknown[], maxDepth = 3): ShapeReport {
  const fields: Record<string, FieldStat> = {};
  for (const item of items) walk(item, "", 0, maxDepth, fields);
  for (const stat of Object.values(fields)) stat.types.sort();
  return { count: items.length, fields };
}

/** Reparto de valores de un campo acotado (enums, banderas, contadores).
 *  Solo para campos cuyos valores no identifican a nadie. */
export function distribution(values: Array<string | number | boolean | null | undefined>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const key = value === undefined ? "(ausente)" : value === null ? "(null)" : String(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
