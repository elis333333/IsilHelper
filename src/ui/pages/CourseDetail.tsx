import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ask } from "../lib/messaging";
import { exportInventory } from "../lib/inventory";
import { plural } from "../lib/format";
import { SectionBlock } from "../components/SectionBlock";
import { DownloadAction } from "../components/DownloadAction";
import { FailureNotice } from "../components/FailureNotice";
import { Loading, Notice } from "../components/Notice";
import { useNavigation } from "../store/navigation";
import type { CourseDetail as Detail } from "../../lib/messages";

type Props = { courseId: number; courseName: string };

/** Barra de acciones del curso: bajarlo entero y guardar el inventario. Va
 *  arriba porque archivar es el propósito del proyecto, no una función que se
 *  busca al final de la página. */
function CourseActions({ detail }: { detail: Detail }) {
  const go = useNavigation((state) => state.go);
  const [saved, setSaved] = useState<string | null>(null);

  const exporting = useMutation({
    mutationFn: () => exportInventory(detail),
    onSuccess: (path) => setSaved(path),
  });

  return (
    <>
      <div className="acciones acciones--curso">
        <DownloadAction
          files={detail.files}
          courseId={detail.courseId}
          courseName={detail.courseName}
          sectionName=""
          what="todo el curso"
          variant="principal"
        />
        <button
          type="button"
          className="btn btn--secundario"
          onClick={() => exporting.mutate()}
          disabled={exporting.isPending}
        >
          Guardar el índice del curso
        </button>
        <button type="button" className="btn btn--secundario" onClick={() => go({ name: "downloads" })}>
          Ver descargas
        </button>
      </div>

      {saved !== null && (
        <p className="parrafo parrafo--apagado">
          El índice quedó en <span className="dato-tecnico">{saved}</span>, con la lista de
          archivos y los enlaces a Drive de este curso.
        </p>
      )}
      {exporting.isError && (
        <p className="estado estado--error">
          <span aria-hidden="true">!</span> No se pudo guardar el índice.
        </p>
      )}
    </>
  );
}

export default function CourseDetail({ courseId, courseName }: Props) {
  const go = useNavigation((state) => state.go);

  const contents = useQuery({
    queryKey: ["contents", courseId],
    queryFn: () => ask({ type: "contents", courseId, courseName }),
  });

  const detail = contents.data?.state === "ok" ? contents.data.value : null;

  return (
    <>
      <div className="acciones" style={{ marginTop: 0, marginBottom: "var(--space-6)" }}>
        <button
          type="button"
          className="btn btn--secundario"
          onClick={() => go({ name: "courses" })}
        >
          Volver a cursos
        </button>
      </div>

      <h2 className="subtitulo" style={{ marginBottom: "var(--space-6)" }}>
        {courseName}
      </h2>

      {contents.isPending && <Loading what="Estoy cargando el contenido del curso." />}

      {(contents.isError || contents.data?.state === "failed") && (
        <FailureNotice
          reason={contents.data?.state === "failed" ? contents.data.reason : "unexpected"}
          onRetry={() => void contents.refetch()}
          retrying={contents.isFetching}
        />
      )}

      {detail !== null && (
        <>
          {/* El índice tiene sentido aunque no haya nada que bajar: en un
              curso que solo tiene enlaces, es lo único que se lleva. */}
          {(detail.files.length > 0 || detail.links.length > 0) && (
            <CourseActions detail={detail} />
          )}

          {detail.attachmentsFailed && (
            <Notice
              tone="warning"
              symbol="!"
              title="Faltan los adjuntos de las tareas"
              detail="La plataforma no devolvió los archivos que el profesor colgó en las
                      evaluaciones, así que aquí no aparecen. El resto del material sí está."
              hint="Vuelve a cargar el curso en un rato."
            />
          )}

          {detail.sections.length === 0 ? (
            <Notice
              symbol="·"
              title="Este curso no tiene contenido publicado"
              detail="La plataforma respondió sin errores, pero el curso no devolvió
                      ninguna sección."
              hint="Puede que el profesor aún no haya publicado material."
            />
          ) : (
            <>
              {detail.files.length === 0 && (
                <Notice
                  symbol="·"
                  title="Aquí no hay nada que se pueda descargar todavía"
                  detail={`El curso tiene ${plural(
                    detail.links.length,
                    "enlace externo",
                    "enlaces externos",
                  )}, casi siempre a Google Drive, y esos aún no se bajan desde la extensión.`}
                  hint="Guarda el índice del curso para tener la lista de enlaces a mano."
                />
              )}
              {detail.sections.map((section) => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  courseId={detail.courseId}
                  courseName={detail.courseName}
                />
              ))}
            </>
          )}
        </>
      )}
    </>
  );
}
