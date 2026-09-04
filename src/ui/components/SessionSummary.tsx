import type { CourseSummary } from "../../lib/messages";

/** El criterio de terminado de la Fase 0: conectado como X, con N cursos. */

type Props = {
  fullname: string;
  courses: CourseSummary[];
  onDisconnect: () => void;
};

function courseWord(total: number): string {
  return total === 1 ? "curso" : "cursos";
}

function progressLabel(progress: number | null): string {
  return progress === null ? "sin seguimiento" : `${Math.round(progress)} %`;
}

export function SessionSummary({ fullname, courses, onDisconnect }: Props) {
  return (
    <>
      <div className="tarjeta">
        <p className="estado estado--exito">
          <span aria-hidden="true">✓</span>
          <span>Conectado como {fullname}</span>
        </p>
        <p className="cifra" style={{ marginTop: "var(--space-4)" }}>
          {courses.length} {courseWord(courses.length)}
        </p>
        <div className="acciones">
          <button type="button" className="btn btn--secundario" onClick={onDisconnect}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {courses.length > 0 && (
        <div className="bloque">
          <table className="tabla">
            <caption className="etiqueta" style={{ textAlign: "left", paddingBottom: "var(--space-3)", color: "var(--color-text-subtle)" }}>
              Tus cursos
            </caption>
            <thead>
              <tr>
                <th scope="col">Curso</th>
                <th scope="col" style={{ textAlign: "right" }}>Avance</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.fullname}</td>
                  <td className="cifra" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-text-muted)" }}>
                    {progressLabel(course.progress)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
