import { useMutation } from "@tanstack/react-query";
import { ask } from "../lib/messaging";
import { useQueueAction } from "../lib/downloads";
import { plural } from "../lib/format";
import { Notice } from "./Notice";
import { Cargando } from "./Puntos";
import { FailureNotice } from "./FailureNotice";
import type {
  CourseDetail,
  DriveDiagnosticsView,
  DriveExploration,
} from "../../lib/messages";

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
        <div style={{ marginTop: "var(--space-4)" }}>
          <Cargando que="Estoy abriendo cada carpeta y sus subcarpetas." />
          <p className="parrafo parrafo--apagado" style={{ marginTop: "var(--space-3)" }}>
            Con muchos temas puede tardar un par de minutos.
          </p>
        </div>
      )}

      {/* Un fallo al cargar el curso SÍ es de la plataforma del instituto. */}
      {explore.data?.state === "course-failed" && (
        <FailureNotice
          reason={explore.data.reason}
          onRetry={() => explore.mutate()}
          retrying={explore.isPending}
        />
      )}

      {/* Uno al leer las carpetas es de Google, y se dice así. */}
      {explore.data?.state === "drive-failed" && (
        <Notice
          tone="error"
          symbol="✕"
          title="No pude leer tus carpetas de Drive"
          detail="La extensión pidió el contenido a Google y no obtuvo lo que esperaba.
                  Esto no tiene que ver con la plataforma del instituto."
          hint="Comprueba que tienes sesión de Google en este navegador."
        >
          <DiagnosticsBlock
            diagnostics={explore.data.diagnostics}
            failure={explore.data.detail}
          />
        </Notice>
      )}

      {explore.isError && (
        <Notice
          tone="error"
          symbol="✕"
          title="La extensión no respondió"
          detail="El proceso que explora Drive se cortó antes de contestar."
          hint="Vuelve a intentarlo. Si se repite, recarga la extensión desde chrome://extensions."
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
        >
          <DiagnosticsBlock diagnostics={result.diagnostics} failure="" />
        </Notice>
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

      {result.diagnostics !== null && result.problems.length > 0 && (
        <DiagnosticsBlock diagnostics={result.diagnostics} failure="" />
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

/**
 * DIAGNÓSTICO TEMPORAL — 6 de septiembre de 2026.
 *
 * La enumeración funciona desde una pestaña de Drive y falla desde la
 * extensión. La diferencia es que desde la pestaña la petición es del mismo
 * origen y desde la extensión no, y esa diferencia no se había medido. Esto
 * enseña lo medido para descartar las tres causas posibles **por medición y no
 * por deducción**:
 *
 * - `credenciales` distinto de `include` → la cookie de Google no viaja.
 * - `permiso` en falso → `host_permissions` declarado pero no concedido,
 *   normalmente porque la extensión no se recargó tras añadirlo.
 * - `estado 200` con bytes y sin `flip-entries` → Google le da a la extensión
 *   un HTML distinto del que le da a una pestaña.
 *
 * **Se quita en cuanto la causa esté encontrada.**
 */
function DiagnosticsBlock({
  diagnostics,
  failure,
}: {
  diagnostics: DriveDiagnosticsView | null;
  failure: string;
}) {
  if (diagnostics === null && failure === "") return null;

  const rows = diagnostics === null
    ? []
    : [
        ["permiso de host concedido", String(diagnostics.permissionGranted)],
        ["credenciales", diagnostics.credentials],
        ["estado HTTP", String(diagnostics.status)],
        ["bytes recibidos", String(diagnostics.bytes)],
        ["contiene flip-entries", String(diagnostics.hasFlipEntries)],
        ["parece pantalla de acceso", String(diagnostics.looksLikeLogin)],
        ["fallo", diagnostics.failure === "" ? "—" : diagnostics.failure],
      ];

  return (
    <div className="diagnostico">
      <p className="diagnostico__titulo">Diagnóstico (temporal)</p>
      <ul className="lista dato-tecnico">
        {rows.map(([label, value]) => (
          <li key={label} className="diagnostico__fila">
            <span className="diagnostico__clave">{label}</span>
            <span className="diagnostico__valor">{value}</span>
          </li>
        ))}
        {failure !== "" && (
          <li className="diagnostico__fila">
            <span className="diagnostico__clave">excepción</span>
            <span className="diagnostico__valor">{failure}</span>
          </li>
        )}
      </ul>
      {diagnostics?.head !== null && diagnostics?.head !== undefined && (
        <p className="dato-tecnico diagnostico__head">{diagnostics.head}</p>
      )}
    </div>
  );
}
