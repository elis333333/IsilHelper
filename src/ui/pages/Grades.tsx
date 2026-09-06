import { useQuery } from "@tanstack/react-query";
import { ask } from "../lib/messaging";
import { GradesTable } from "../components/GradesTable";
import { FailureNotice } from "../components/FailureNotice";
import { Notice } from "../components/Notice";
import { Cargando } from "../components/Puntos";
import { percentage } from "../lib/format";

export default function Grades() {
  const grades = useQuery({
    queryKey: ["grades"],
    queryFn: () => ask({ type: "grades" }),
  });

  // Son once llamadas con pausa de 600 ms entre ellas: decir qué está pasando
  // no es cortesía, es lo que evita que parezca colgado.
  if (grades.isPending) {
    return <Cargando que="Estoy pidiendo las notas curso por curso. Tarda unos segundos." />;
  }

  if (grades.isError || grades.data?.state === "failed") {
    const reason = grades.data?.state === "failed" ? grades.data.reason : "unexpected";
    return (
      <FailureNotice
        reason={reason}
        onRetry={() => void grades.refetch()}
        retrying={grades.isFetching}
      />
    );
  }

  const report = grades.data.value;

  if (report.rows.length === 0) {
    return (
      <Notice
        symbol="·"
        title="No hay ningún curso del que leer notas"
        detail="La plataforma respondió sin errores, pero no devolvió cursos."
      />
    );
  }

  // El boletín entero vacío no es una tabla llena de guiones: es una pregunta
  // abierta. El 5 de septiembre de 2026 los 11 cursos respondieron sin errores
  // y sin una sola nota puesta, y todavía no se sabe si es que el ciclo acaba
  // de empezar o si ISIL no usa el libro de calificaciones de Moodle.
  const nothingGraded = report.rows.every((row) => !row.failed && row.graded === 0);

  if (nothingGraded) {
    return (
      <Notice
        symbol="·"
        title="Todavía no hay ninguna nota puesta"
        detail={`Tus ${report.rows.length} cursos respondieron sin errores y en ninguno hay calificaciones. No es un fallo de la extensión ni de tu cuenta.`}
        hint="Puede ser que el ciclo acabe de empezar, o que ISIL no use el libro
              de calificaciones de Moodle y tus notas vivan en otro sistema. No lo
              sé todavía, y prefiero decírtelo a enseñarte una tabla vacía."
      />
    );
  }

  const average = percentage(report.average);

  return (
    <>
      <div className="resumen">
        <div className="resumen__dato" style={{ borderLeftColor: "var(--acento)" }}>
          <span className="resumen__cifra">{average ?? "—"}</span>
          <span className="resumen__etiqueta">Promedio</span>
        </div>
      </div>

      <p className="parrafo parrafo--apagado">
        Es la media simple de los cursos que ya tienen nota. No está ponderada
        por créditos porque la plataforma no los expone, así que no coincide
        necesariamente con el promedio de tu récord académico.
      </p>

      {report.failedCount > 0 && (
        <p className="estado estado--advertencia" style={{ marginBottom: "var(--space-6)" }}>
          <span aria-hidden="true">▲</span>
          <span>
            {report.failedCount === 1
              ? "Un curso no se pudo leer y queda fuera del promedio."
              : `${report.failedCount} cursos no se pudieron leer y quedan fuera del promedio.`}
          </span>
        </p>
      )}

      <GradesTable report={report} />
    </>
  );
}
