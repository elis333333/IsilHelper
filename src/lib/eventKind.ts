/**
 * Clasificación de los eventos del calendario por lo que son.
 *
 * `core_calendar_get_action_events_by_timesort` devuelve el tipo de actividad
 * en `modulename`, y **no alcanza**: en ISIL hay evaluaciones que llegan como
 * `quiz` y otras como `assign`, así que fiarse del `modname` mezcla una
 * Evaluación Integral con una tarea cualquiera. El nombre del evento sí las
 * distingue, porque el instituto lo escribe siempre con su etiqueta delante.
 *
 * De ahí la regla que ordena todo este módulo: **el nombre manda sobre el
 * `modname`**. El `modname` es el respaldo para lo que el nombre no nombra.
 *
 * Es el sitio único donde vive la correspondencia tipo → color. Ningún
 * componente escribe un color a mano: todos leen `KIND_COLOR` de aquí.
 *
 * Todo es puro y se prueba sin red ni reloj.
 */

import { normalize } from "./search";

export type EventKind = "EI" | "PA" | "TAREA" | "QUIZ" | "FORO" | "OTRO";

/**
 * Las dos formas en que ISIL fecha un Proceso de Aprendizaje. No son lo mismo
 * para el estudiante —una es cuándo hay que entregarlo y la otra cuándo deja
 * de admitirse—, así que se guardan aparte y el modal las dice con su palabra.
 */
export type PaPhase = "vencimiento" | "cierre";

/** Lo que se sabe de un PA además de que lo es. `null` en lo que no vino. */
export type PaDetail = {
  /** PA1..PA5. `null` si el nombre no lo numera. */
  number: number | null;
  phase: PaPhase | null;
};

export type EventClass = {
  kind: EventKind;
  /** Mayor es más urgente. Sirve para ordenar dentro de un día. */
  priority: number;
  /** Solo en los PA; `null` en el resto. */
  pa: PaDetail | null;
};

/**
 * Urgencia por tipo, que **no es la urgencia por fecha** de `api/pending.ts`.
 * Aquella dice cuánto falta; esta, cuánto pesa. Una EI a diez días importa más
 * que un foro de mañana, y una celda del calendario con cuatro cosas tiene que
 * enseñar las que más pesan.
 */
export const KIND_PRIORITY: Record<EventKind, number> = {
  EI: 5,
  PA: 4,
  TAREA: 3,
  QUIZ: 3,
  FORO: 2,
  OTRO: 1,
};

/**
 * Tipo → color, en tokens y nunca en hexadecimal: el valor vive en
 * `tokens.css` y aquí solo se nombra.
 *
 * `over` es el texto que va **encima** de ese color cuando el tipo se usa como
 * relleno. Sale oscuro en los cinco, y eso no es casualidad ni pereza: está
 * medido con `contraste.py` sobre cada color, y el blanco falla o se queda en
 * texto grande en todos. A diferencia de las pestañas de `Nav.tsx`, aquí no
 * hay excepción que recordar.
 *
 *   #FF3B30  rojo   texto oscuro 5,48:1 · blanco 3,55  → oscuro
 *   #FFBE0B  ámbar  texto oscuro 11,68  · blanco 1,66  → oscuro
 *   #3A86FF  azul   texto oscuro 5,58   · blanco 3,48  → oscuro
 *   #FF006E  rosa   texto oscuro 5,07   · blanco 3,83  → oscuro
 *   #999999  gris   texto oscuro 6,82   · blanco 2,85  → oscuro
 *
 * Como texto sobre fondo, los cinco pasan AA sobre la base #0D0D0D y sobre la
 * superficie #1A1A1A. Sobre #242424 —la superficie elevada— el rojo cae a
 * 4,38, el azul a 4,46 y el rosa a 4,05: ahí el color va en punto o barra y el
 * texto en neutro.
 *
 * **El morado #8338EC no está en esta tabla a propósito.** Da 3,46:1 sobre la
 * base y 2,77 sobre #242424, donde falla hasta como elemento de interfaz, así
 * que el foro se lleva el rosa de Escalar. Decisión de Elis, 14 de septiembre
 * de 2026.
 */
export const KIND_COLOR: Record<EventKind, { color: string; over: string }> = {
  EI: { color: "--color-error", over: "--color-base" },
  PA: { color: "--color-integrate", over: "--color-base" },
  TAREA: { color: "--color-evolve", over: "--color-base" },
  QUIZ: { color: "--color-evolve", over: "--color-base" },
  FORO: { color: "--color-scale", over: "--color-base" },
  OTRO: { color: "--color-text-subtle", over: "--color-base" },
};

/** Cómo se llama cada tipo delante del estudiante. */
export const KIND_LABEL: Record<EventKind, string> = {
  EI: "Evaluación integral",
  PA: "Proceso de aprendizaje",
  TAREA: "Tarea",
  QUIZ: "Cuestionario",
  FORO: "Foro",
  OTRO: "Otro",
};

/** Versión corta, para donde no cabe la larga: chips y celdas del calendario. */
export const KIND_SHORT: Record<EventKind, string> = {
  EI: "EI",
  PA: "PA",
  TAREA: "Tarea",
  QUIZ: "Quiz",
  FORO: "Foro",
  OTRO: "Otro",
};

/**
 * Cómo se nombra un evento concreto, ya con su fase si es un PA.
 *
 * «Se cierra PA 3» y «Vencimiento PA 3» son hitos distintos del mismo proceso,
 * y el estudiante no tiene por qué deducir cuál es cuál a partir de la fecha.
 * Por eso la fase entra en la etiqueta y no se queda solo en el dato.
 */
export function eventTypeLabel(kind: EventKind, pa: PaDetail | null): string {
  if (kind !== "PA" || pa === null) return KIND_LABEL[kind];

  const numbered = pa.number === null ? KIND_LABEL.PA : `PA ${pa.number}`;
  if (pa.phase === "vencimiento") return `Vencimiento ${numbered}`;
  if (pa.phase === "cierre") return `Se cierra ${numbered}`;
  return numbered;
}

/**
 * La misma idea en corto, para la línea de una celda: `PA 1`, `EI`, `Tarea`.
 *
 * Aquí la fase **no** entra. En la celda solo caben tres o cuatro líneas y lo
 * que distingue una celda de otra es de qué PA se trata, no si es el
 * vencimiento o el cierre; eso lo dice el panel, que tiene sitio.
 */
export function eventShortLabel(kind: EventKind, pa: PaDetail | null): string {
  if (kind === "PA" && pa?.number != null) return `PA ${pa.number}`;
  return KIND_SHORT[kind];
}

/** `modname` de Moodle → tipo, cuando el nombre no dice nada. El valor va
 *  opcional porque la mayoría de los `modname` no están aquí: `zoom`, `url` y
 *  `resource` caen todos en OTRO, y eso es un acierto del índice, no un fallo. */
const BY_MODNAME: Record<string, EventKind | undefined> = {
  assign: "TAREA",
  quiz: "QUIZ",
  forum: "FORO",
};

/**
 * Las etiquetas por nombre, ya normalizadas —sin tildes y en minúsculas—
 * porque con eso se comparan. Se prueban en orden, así que la EI va primera:
 * es la de máxima urgencia y gana si un nombre nombrara las dos.
 *
 * **Lo que el ciclo 202620 escribe de verdad**, medido sobre el ciclo completo
 * el 14 de septiembre de 2026:
 *
 *   Vencimiento de Proceso de Aprendizaje 1..5   assign
 *   Se cierra Proceso de Aprendizaje 3 · 6       quiz
 *   Vencimiento de Evaluación Integral           assign, siempre sin numerar
 *
 * La sigla `PA` suelta **no aparece en esos datos**: se acepta igual porque es
 * el vocabulario con el que el instituto y el estudiante la nombran, y porque
 * un falso positivo solo puede subir algo de tarea a PA. `EI` suelta, en
 * cambio, salió de aquí: es la máxima urgencia, y dos letras que empujan algo a
 * lo más urgente por casualidad es un error más caro que no reconocerlas.
 */
const BY_NAME: Array<{ kind: EventKind; patterns: RegExp[] }> = [
  { kind: "EI", patterns: [/evaluacion integral/] },
  {
    kind: "PA",
    patterns: [/proceso de aprendizaje/, /\bpa\s*-?\s*[1-9](?!\d)/, /\bpa\b/],
  },
];

/**
 * "Vencimiento de …" y "Se cierra …", las dos formas de fechar un PA, y las
 * dos únicas que existen en el ciclo 202620. No hay tolerancia a variantes
 * —"vence", "cierre"— a propósito: no están medidas, y una redacción nueva se
 * degrada sola a `phase: null`, que es callar en vez de adivinar.
 */
const PA_PHASE: Array<{ phase: PaPhase; pattern: RegExp }> = [
  { phase: "vencimiento", pattern: /\bvencimiento\b/ },
  { phase: "cierre", pattern: /\bse cierra\b/ },
];

/**
 * El número del PA.
 *
 * Llega hasta 9 y no hasta 5: los dos cursos VIR —Desarrollo de Resiliencia y
 * Dirección de Personas— tienen **seis** PA, y "Se cierra Proceso de
 * Aprendizaje 6" existe. Lo que protege de leer "Proceso de aprendizaje 2026"
 * como PA 2026 no es el rango, es el lookahead de que no siga otro dígito.
 *
 * Un nombre sin numerar devuelve `null`, que es lo honesto: la Evaluación
 * Integral nunca se numera, y el modal calla en vez de inventarse un "PA 1".
 */
const PA_NUMBER = /(?:\bpa\s*-?\s*|proceso de aprendizaje\s+)([1-9])(?!\d)/;

function paDetail(text: string): PaDetail {
  const match = PA_NUMBER.exec(text);
  const phase = PA_PHASE.find((entry) => entry.pattern.test(text))?.phase ?? null;
  return { number: match ? Number(match[1]) : null, phase };
}

/**
 * De un evento a su tipo.
 *
 * `name` es el nombre tal como lo devuelve la API y `modname` su `modulename`,
 * que puede no venir. Se reciben sueltos y no como objeto para que sirva igual
 * a un `CalendarEvent` —que lo llama `modulename`— y a un `PendingItem` —que
 * lo llama `kind`—, sin que este módulo tenga que conocer a ninguno de los dos.
 */
export function classifyEvent(name: string, modname?: string | null): EventClass {
  const text = normalize(name);

  for (const entry of BY_NAME) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      return {
        kind: entry.kind,
        priority: KIND_PRIORITY[entry.kind],
        pa: entry.kind === "PA" ? paDetail(text) : null,
      };
    }
  }

  const kind = (modname ? BY_MODNAME[modname] : undefined) ?? "OTRO";
  return { kind, priority: KIND_PRIORITY[kind], pa: null };
}

/**
 * Orden descendente por urgencia de tipo, con la fecha como desempate.
 *
 * El desempate no es un detalle: dentro de un día caben varias cosas del mismo
 * tipo, y sin él el orden lo decidiría el azar del array.
 */
export function compareByPriority(
  a: { priority: number; due: number },
  b: { priority: number; due: number },
): number {
  return b.priority - a.priority || a.due - b.due;
}
