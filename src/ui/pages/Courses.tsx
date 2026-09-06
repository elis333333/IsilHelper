import { useQuery } from "@tanstack/react-query";
import { ask } from "../lib/messaging";
import { CourseCard } from "../components/CourseCard";
import { FailureNotice } from "../components/FailureNotice";
import { Notice } from "../components/Notice";
import { Cargando } from "../components/Puntos";
import { useNavigation } from "../store/navigation";

export default function Courses() {
  const go = useNavigation((state) => state.go);

  const courses = useQuery({
    queryKey: ["courses"],
    queryFn: () => ask({ type: "courses" }),
  });

  if (courses.isPending) return <Cargando que="Estoy cargando tus cursos." />;

  if (courses.isError || courses.data?.state === "failed") {
    const reason = courses.data?.state === "failed" ? courses.data.reason : "unexpected";
    return (
      <FailureNotice
        reason={reason}
        onRetry={() => void courses.refetch()}
        retrying={courses.isFetching}
      />
    );
  }

  const items = courses.data.value;

  if (items.length === 0) {
    return (
      <Notice
        symbol="·"
        title="No apareces matriculado en ningún curso"
        detail="La plataforma respondió sin errores, pero devolvió una lista vacía."
        hint="Si deberías tener cursos este ciclo, revísalo en la plataforma: puede
              que la matrícula todavía no esté procesada."
      />
    );
  }

  return (
    <div className="grilla">
      {items.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onOpen={() =>
            go({ name: "course", courseId: course.id, courseName: course.fullname })
          }
        />
      ))}
    </div>
  );
}
