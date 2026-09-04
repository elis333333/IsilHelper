import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConnectPanel } from "../components/ConnectPanel";
import { FailureNotice } from "../components/FailureNotice";
import { SessionHeader } from "../components/SessionHeader";
import { Nav } from "../components/Nav";
import { Loading } from "../components/Notice";
import { ask } from "../lib/messaging";
import { useNavigation } from "../store/navigation";
import type { SessionSnapshot } from "../../lib/messages";
import Pending from "./Pending";
import Courses from "./Courses";
import CourseDetail from "./CourseDetail";
import Grades from "./Grades";

/** Armazón de la aplicación: primero la sesión, y solo con sesión válida se
 *  monta la navegación y la vista actual. */
export default function Home() {
  const client = useQueryClient();
  const view = useNavigation((state) => state.view);

  const session = useQuery({
    queryKey: ["session"],
    queryFn: () => ask({ type: "session" }),
  });

  const act = useMutation({
    mutationFn: (type: "connect" | "disconnect") => ask({ type }),
    onSuccess: (snapshot: SessionSnapshot) => {
      client.setQueryData(["session"], snapshot);
      // Los datos de la sesión anterior ya no valen para la nueva.
      void client.invalidateQueries({ queryKey: ["pending"] });
      void client.invalidateQueries({ queryKey: ["courses"] });
      void client.invalidateQueries({ queryKey: ["grades"] });
      void client.invalidateQueries({ queryKey: ["contents"] });
    },
  });

  const shell = (children: React.ReactNode) => (
    <main className="pantalla">
      <div className="pantalla__centro">
        {children}
        <footer className="pie">
          <p className="firma-labs">IsilHelper · un proyecto de Suki</p>
        </footer>
      </div>
    </main>
  );

  if (session.isPending) {
    return shell(<Loading what="Estoy comprobando si ya tienes la cuenta conectada." />);
  }

  if (session.isError) {
    return shell(
      <FailureNotice
        reason="unexpected"
        onRetry={() => void session.refetch()}
        retrying={session.isFetching}
      />,
    );
  }

  if (session.data.state === "disconnected") {
    return shell(
      <ConnectPanel onConnect={() => act.mutate("connect")} connecting={act.isPending} />,
    );
  }

  if (session.data.state === "failed") {
    return shell(
      <FailureNotice
        reason={session.data.reason}
        onRetry={() => act.mutate("connect")}
        retrying={act.isPending}
      />,
    );
  }

  return shell(
    <>
      <SessionHeader
        fullname={session.data.fullname}
        onDisconnect={() => act.mutate("disconnect")}
      />
      <Nav />
      {view.name === "pending" && <Pending />}
      {view.name === "courses" && <Courses />}
      {view.name === "grades" && <Grades />}
      {view.name === "course" && (
        <CourseDetail courseId={view.courseId} courseName={view.courseName} />
      )}
    </>,
  );
}
