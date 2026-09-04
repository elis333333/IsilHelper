import type { SectionView } from "../../lib/messages";
import { kindLabel } from "../lib/format";

/** Una sección del curso con sus módulos. El estado de completado va con
 *  símbolo y texto, no solo con color. */

function statusMark(completed: boolean | null): { symbol: string; label: string } {
  if (completed === null) return { symbol: "–", label: "sin seguimiento" };
  return completed
    ? { symbol: "✓", label: "hecho" }
    : { symbol: "○", label: "pendiente" };
}

export function SectionBlock({ section }: { section: SectionView }) {
  return (
    <section className="seccion">
      <h3 className="subtitulo">{section.name}</h3>

      {section.modules.length === 0 ? (
        <p className="parrafo parrafo--apagado">
          Esta sección no tiene material publicado.
        </p>
      ) : (
        <ul className="lista">
          {section.modules.map((module) => {
            const status = statusMark(module.completed);
            const kind = kindLabel(module.kind);
            return (
              <li key={module.id} className="modulo">
                <span
                  className="modulo__estado"
                  style={{
                    color:
                      module.completed === true
                        ? "var(--color-success)"
                        : "var(--color-text-subtle)",
                  }}
                >
                  <span aria-hidden="true">{status.symbol}</span> {status.label}
                </span>

                <span className="modulo__nombre">
                  {module.url ? (
                    <a href={module.url} target="_blank" rel="noreferrer">
                      {module.name}
                    </a>
                  ) : (
                    module.name
                  )}
                </span>

                <span className="modulo__meta">
                  {kind ?? ""}
                  {module.fileCount > 0
                    ? ` · ${module.fileCount} archivo${module.fileCount === 1 ? "" : "s"}`
                    : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
