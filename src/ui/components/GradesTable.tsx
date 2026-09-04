import type { GradesReport } from "../../lib/messages";
import { percentage } from "../lib/format";

/** Todas las notas en una tabla. El curso que no se pudo leer se marca en su
 *  fila: se muestra lo que sí cargó en vez de esconder la tabla entera. */

const SOURCE_NOTE = {
  total: "",
  weighted: "calculado",
  none: "",
} as const;

export function GradesTable({ report }: { report: GradesReport }) {
  return (
    <table className="tabla">
      <thead>
        <tr>
          <th scope="col">Curso</th>
          <th scope="col" style={{ textAlign: "right" }}>Calificadas</th>
          <th scope="col" style={{ textAlign: "right" }}>Nota</th>
        </tr>
      </thead>
      <tbody>
        {report.rows.map((row) => (
          <tr key={row.courseId}>
            <td>{row.courseName}</td>
            <td className="cifra" style={{ color: "var(--color-text-muted)" }}>
              {row.failed ? "—" : row.graded}
            </td>
            <td className="cifra">
              {row.failed ? (
                <span style={{ color: "var(--color-error)" }}>
                  <span aria-hidden="true">✕</span> no se pudo leer
                </span>
              ) : row.percentage === null ? (
                <span style={{ color: "var(--color-text-subtle)" }}>sin notas aún</span>
              ) : (
                <>
                  {percentage(row.percentage)}
                  {SOURCE_NOTE[row.source] && (
                    <span
                      style={{
                        color: "var(--color-text-subtle)",
                        fontSize: "var(--text-caption)",
                      }}
                    >
                      {" "}
                      {SOURCE_NOTE[row.source]}
                    </span>
                  )}
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
