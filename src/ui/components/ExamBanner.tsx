import { countUpcomingExams, type ExamCount, type PendingItem } from "../../api/pending";
import { KIND_COLOR } from "../../lib/eventKind";
import { plural } from "../lib/format";
import { useNavigation } from "../store/navigation";

/**
 * La franja de evaluaciones, encima de los contadores de urgencia.
 *
 * Lo que hay debajo está ordenado por fecha y trata igual a un foro que a una
 * integral. Esto no: separa lo que califica el ciclo del resto del ruido, y es
 * lo único de la pantalla que mira **qué** es cada cosa en vez de cuándo vence.
 *
 * Sin evaluaciones a la vista no se pinta nada. Una franja que dice «0
 * evaluaciones» ocupa el mismo sitio que una que dice algo.
 */

/**
 * El titular dice el tipo cuando solo hay uno.
 *
 * No es adorno: si dijera siempre «3 evaluaciones» y el desglose solo
 * apareciera al haber de los dos tipos, con solo integrales el color rojo sería
 * lo único que las distinguiría de unos procesos de aprendizaje. El color nunca
 * es el único portador.
 */
function headline(exams: ExamCount): string {
  if (exams.ei === 0) {
    return `${plural(exams.pa, "proceso de aprendizaje", "procesos de aprendizaje")} esta semana`;
  }
  if (exams.pa === 0) {
    return `${plural(exams.ei, "evaluación integral", "evaluaciones integrales")} esta semana`;
  }
  return `${plural(exams.total, "evaluación", "evaluaciones")} esta semana`;
}

/** El desglose solo tiene sentido cuando hay de los dos tipos. */
function breakdown(exams: ExamCount): string | null {
  if (exams.ei === 0 || exams.pa === 0) return null;
  return (
    `${plural(exams.ei, "evaluación integral", "evaluaciones integrales")} y ` +
    `${plural(exams.pa, "proceso de aprendizaje", "procesos de aprendizaje")}`
  );
}

export function ExamBanner({ items, now }: { items: PendingItem[]; now: Date }) {
  const go = useNavigation((state) => state.go);
  const exams = countUpcomingExams(items, now);

  if (exams.total === 0) return null;

  // Una integral pesa más que cualquier número de procesos, así que basta una
  // para que la franja entera se ponga en rojo.
  const kind = exams.ei > 0 ? "EI" : "PA";
  const detail = breakdown(exams);

  return (
    <button
      type="button"
      className="franja"
      // El color sale del mapa de `eventKind`, que es el único sitio donde vive
      // la correspondencia tipo → color. Mismo patrón que `--acento-tab`.
      style={{ "--color-tipo": `var(${KIND_COLOR[kind].color})` } as React.CSSProperties}
      onClick={() => go({ name: "search", focus: "calendar" })}
    >
      <span className="franja__marca" aria-hidden="true">
        ▲
      </span>

      <span className="franja__cuerpo">
        <span className="franja__titulo">{headline(exams)}</span>
        {detail !== null && <span className="franja__detalle">{detail}</span>}
      </span>

      <span className="franja__ir">Ver en el calendario</span>
    </button>
  );
}
