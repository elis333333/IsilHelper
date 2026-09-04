import { useQuery } from "@tanstack/react-query";
import { ask } from "../lib/messaging";
import { GradesTable } from "../components/GradesTable";
import { FailureNotice } from "../components/FailureNotice";
import { Loading, Notice } from "../components/Notice";
import { percentage } from "../lib/format";

export default function Grades() {
  const grades = useQuery({
    queryKey: ["grades"],
    queryFn: () => ask({ type: "grades" }),
  });

  // Son once llamadas con pausa de 600 ms entre ellas: decir qué está pasando
  // no es cortesía, es lo que evita que parezca colgado.
  if (grades.isPending) {
    return <Loading what="Estoy pidiendo las notas curso por curso. Tarda unos segundos." />;
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
