import type { PendingItem } from "../../api/pending";
import { countByUrgency } from "../../api/pending";

/** Resumen de cabecera. Solo muestra los grupos que tienen algo: un cero
 *  grande en pantalla pesa lo mismo que un dato y no lo es. */

const LABEL = {
  overdue: "Vencido",
  today: "Hoy",
  week: "Esta semana",
} as const;

export function PendingSummary({ items }: { items: PendingItem[] }) {
  const counts = countByUrgency(items);
  const groups = (["overdue", "today", "week"] as const).filter((key) => counts[key] > 0);

  if (groups.length === 0) return null;

  return (
    <div className="resumen">
      {groups.map((key) => (
        <div key={key} className={`resumen__dato u-${key}`}>
          <span className="resumen__cifra">{counts[key]}</span>
          <span className="resumen__etiqueta">{LABEL[key]}</span>
        </div>
      ))}
    </div>
  );
}
