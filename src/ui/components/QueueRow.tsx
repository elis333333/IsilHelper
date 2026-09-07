import { fileSize } from "../lib/format";
import type { QueueItem, QueueStatus } from "../../lib/messages";

/**
 * Una línea de la cola de descargas.
 *
 * Cada estado lleva símbolo, etiqueta de texto y color: los tres. El verde de
 * "descargado" es el mismo verde de la acción, así que sin la palabra no se
 * distingue de un botón, y con solo el color no lo distingue quien no ve la
 * diferencia entre este verde y este rojo.
 */

const STATUS: Record<QueueStatus, { symbol: string; label: string; tone: string }> = {
  pending: { symbol: "·", label: "En cola", tone: "" },
  active: { symbol: "↓", label: "Bajando", tone: "estado--info" },
  // Pausado es de este archivo, no de la cola entera: los demás siguen su
  // curso mientras este espera a que lo reanuden a mano.
  paused: { symbol: "‖", label: "En pausa", tone: "estado--advertencia" },
  done: { symbol: "✓", label: "Descargado", tone: "estado--exito" },
  skipped: { symbol: "=", label: "Ya lo tenías", tone: "estado--exito" },
  failed: { symbol: "!", label: "Falló", tone: "estado--error" },
};

export function QueueRow({ item }: { item: QueueItem }) {
  const status = STATUS[item.status];
  const size = fileSize(item.size);

  // El porcentaje solo se enseña cuando Moodle declaró el tamaño. Una barra
  // que avanza a ojo miente sobre lo que falta.
  const percent =
    item.status === "active" && item.size !== null && item.size > 0
      ? Math.min(100, Math.round((item.received / item.size) * 100))
      : null;

  return (
    <li className="cola">
      <span className={`cola__estado ${status.tone}`}>
        <span aria-hidden="true">{status.symbol}</span> {status.label}
      </span>

      <span className="cola__cuerpo">
        <span className="cola__nombre">{item.name}</span>
        <span className="cola__contexto">
          {item.courseName}
          {item.sectionName === "" ? "" : ` · ${item.sectionName}`}
        </span>
        {item.error !== null && (
          <span className="cola__error estado estado--error">{item.error}</span>
        )}
        {percent !== null && (
          <span className="barra" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <span className="barra__relleno" style={{ width: `${percent}%` }} />
          </span>
        )}
      </span>

      <span className="cola__meta">
        {percent !== null ? `${percent} %` : (size ?? "")}
      </span>
    </li>
  );
}
