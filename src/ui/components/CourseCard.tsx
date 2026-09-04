import type { CourseSummary } from "../../lib/messages";
import { percentage } from "../lib/format";

/** Tarjeta de curso. La barra de avance nunca va sola: siempre lleva el
 *  porcentaje escrito, porque una barra es color y forma, no información. */

type Props = { course: CourseSummary; onOpen: () => void };

export function CourseCard({ course, onOpen }: Props) {
  const value = percentage(course.progress);

  return (
    <button type="button" className="curso" onClick={onOpen}>
      <span className="curso__nombre">{course.fullname}</span>

      {course.progress === null ? (
        <span className="pendiente__curso">Este curso no lleva seguimiento de avance</span>
      ) : (
        <>
          <span className="pendiente__fecha">{value} completado</span>
          <span
            className="barra"
            role="progressbar"
            aria-valuenow={Math.round(course.progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Avance de ${course.fullname}`}
          >
            <span className="barra__relleno" style={{ width: `${course.progress}%` }} />
          </span>
        </>
      )}
    </button>
  );
}
