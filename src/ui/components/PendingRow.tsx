import type { PendingItem, Urgency } from "../../api/pending";
import { dueLabel, kindLabel } from "../lib/format";

/** Una fila de la lista de pendientes. La urgencia se marca con borde, color
 *  y **etiqueta de texto**: el color por sí solo no informa a quien no lo
 *  distingue. */

const MARK: Record<Urgency, string> = {
  overdue: "Vencido",
  today: "Hoy",
  week: "Esta semana",
  later: "Más adelante",
};

export function PendingRow({ item, now }: { item: PendingItem; now: Date }) {
  const kind = kindLabel(item.kind);

  return (
    <li className={`pendiente u-${item.urgency}`}>
      <span className="pendiente__marca">{MARK[item.urgency]}</span>

      <span className="pendiente__cuerpo">
        <span className="pendiente__nombre">
          {item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer">
              {item.name}
            </a>
          ) : (
            item.name
          )}
        </span>
        <br />
        <span className="pendiente__curso">
          {item.courseName ?? "Sin curso"}
          {kind ? ` · ${kind}` : ""}
        </span>
      </span>

      <span className="pendiente__fecha">{dueLabel(item.due, now)}</span>
    </li>
  );
}
