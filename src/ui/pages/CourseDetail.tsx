import { useQuery } from "@tanstack/react-query";
import { ask } from "../lib/messaging";
import { SectionBlock } from "../components/SectionBlock";
import { FailureNotice } from "../components/FailureNotice";
import { Loading, Notice } from "../components/Notice";
import { useNavigation } from "../store/navigation";

type Props = { courseId: number; courseName: string };

export default function CourseDetail({ courseId, courseName }: Props) {
  const go = useNavigation((state) => state.go);

  const contents = useQuery({
    queryKey: ["contents", courseId],
    queryFn: () => ask({ type: "contents", courseId, courseName }),
  });

  const back = (
    <div className="acciones" style={{ marginTop: 0, marginBottom: "var(--space-6)" }}>
      <button
        type="button"
        className="btn btn--secundario"
        onClick={() => go({ name: "courses" })}
      >
        Volver a cursos
      </button>
    </div>
  );

  return (
    <>
      {back}
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

      {contents.data?.state === "ok" &&
        (contents.data.value.sections.length === 0 ? (
          <Notice
            symbol="·"
            title="Este curso no tiene contenido publicado"
            detail="La plataforma respondió sin errores, pero el curso no devolvió
                    ninguna sección."
            hint="Puede que el profesor aún no haya publicado material."
          />
        ) : (
          contents.data.value.sections.map((section) => (
            <SectionBlock key={section.id} section={section} />
          ))
        ))}
    </>
  );
}
