import { useMutation } from "@tanstack/react-query";
import { ask } from "../lib/messaging";
import { useQueueAction } from "../lib/downloads";
import { plural } from "../lib/format";
import { Notice } from "./Notice";
import { FailureNotice } from "./FailureNotice";
import type { CourseDetail, DriveExploration } from "../../lib/messages";

/**
 * Descarga del material que vive en Google Drive.
 *
 * Va en dos pasos —explorar y luego encolar— y no en uno, a propósito. El
 * recorrido de las carpetas puede tardar y puede salir a medias, así que
 * primero se enseña qué se encontró y **qué no se pudo leer**, y encolar es
 * una decisión que el estudiante toma con eso delante. Un botón único que
 * bajara lo que pudiera dejaría la sensación de haberlo archivado todo.
 */
export function DrivePanel({ detail }: { detail: CourseDetail }) {
  const action = useQueueAction();

  const explore = useMutation({
    mutationFn: () =>
      ask({
        type: "exploreDrive",
        courseId: detail.courseId,
        courseName: detail.courseName,
      }),
  });

  if (detail.links.length === 0) return null;

  const result = explore.data?.state === "ok" ? explore.data.value : null;

  return (
    <section className="tarjeta" style={{ marginBottom: "var(--space-8)" }}>
      <h3 className="subtitulo">Contenidos en Google Drive</h3>
      <p className="parrafo parrafo--apagado">
        Los temas y el sílabo no están en la plataforma: son{" "}
        {plural(detail.links.length, "enlace", "enlaces")} a Drive. Se bajan con tu sesión de
        Google, sin configurar nada.
      </p>

      <div className="acciones">
        <button
          type="button"
          className="btn btn--secundario"
          onClick={() => explore.mutate()}
          disabled={explore.isPending}
        >
          {explore.isPending ? "Explorando las carpetas…" : "Ver qué hay en Drive"}
        </button>

        {result !== null && result.files.length > 0 && (
          <button
            type="button"
            className="btn btn--principal"
            disabled={action.isPending}
            onClick={() => action.mutate({ type: "enqueue", files: result.files })}
          >
            Descargar {plural(result.files.length, "archivo", "archivos")}
          </button>
        )}
      </div>

      {explore.isPending && (
        <p className="parrafo parrafo--apagado">
          Estoy abriendo cada carpeta y sus subcarpetas. Con muchos temas puede tardar un par
          de minutos.
        </p>
      )}

      {(explore.isError || explore.data?.state === "failed") && (
        <FailureNotice
          reason={explore.data?.state === "failed" ? explore.data.reason : "unexpected"}
          onRetry={() => explore.mutate()}
          retrying={explore.isPending}
        />
      )}

      {result !== null && <ExplorationReport result={result} />}
    </section>
  );
}

/**
 * Lo que se encontró y lo que no.
 *
 * Los problemas se enseñan **siempre**, también cuando hay archivos de sobra.
 * Es la condición de rotura legible aplicada a la pantalla: si dos carpetas no
 * se pudieron leer, saberlo hoy es lo que permite ir a buscarlas a mano
 * mientras todavía hay acceso.
 */
function ExplorationReport({ result }: { result: DriveExploration }) {
  const nothing = result.files.length === 0 && result.problems.length === 0;

  return (
    <>
      {nothing ? (
        <Notice
          symbol="·"
          title="No encontré archivos en esas carpetas"
          detail="Puede que estén vacías, o que Google haya cambiado la página que la
                  extensión lee para mirar dentro."
          hint="Si crees que debería haber material, abre la carpeta en Drive para comprobarlo."
        />
      ) : (
        <p className="parrafo">
          Encontré <strong>{plural(result.files.length, "archivo", "archivos")}</strong> en{" "}
          {plural(result.foldersRead, "carpeta", "carpetas")}.
        </p>
      )}

      {result.truncated && (
        <Notice
          tone="warning"
          symbol="!"
          title="Paré antes de llegar al fondo"
          detail="El árbol de carpetas era más hondo o más grande de lo que recorro de una
                  vez, así que puede faltar material."
          hint="Baja lo encontrado y vuelve a explorar: lo que ya esté no se repite."
        />
      )}

      {result.problems.length > 0 && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <p className="estado estado--advertencia">
            <span aria-hidden="true">!</span>
            <span>
              {plural(result.problems.length, "carpeta que no pude leer", "carpetas que no pude leer")}
            </span>
          </p>
          <ul className="lista" style={{ marginTop: "var(--space-3)" }}>
            {result.problems.map((problem) => (
              <li key={`${problem.where}-${problem.detail}`} className="problema">
                <span className="problema__donde">{problem.where}</span>
                <span className="problema__causa">{problem.detail}</span>
              </li>
            ))}
          </ul>
          <p className="parrafo parrafo--apagado" style={{ marginTop: "var(--space-4)" }}>
            El resto sí se puede bajar. Estas conviene abrirlas a mano en Drive antes de que
            cierren el ciclo.
          </p>
        </div>
      )}
    </>
  );
}
