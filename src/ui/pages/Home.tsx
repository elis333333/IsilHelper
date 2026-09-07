import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConnectPanel } from "../components/ConnectPanel";
import { FailureNotice } from "../components/FailureNotice";
import { SessionHeader } from "../components/SessionHeader";
import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { Cargando } from "../components/Puntos";
import { ToastStack } from "../components/ToastStack";
import { DonationModal } from "../components/DonationModal";
import { useDownloadFailureToasts } from "../lib/downloads";
import { ask } from "../lib/messaging";
import { useNavigation } from "../store/navigation";
import type { SessionSnapshot } from "../../lib/messages";
import Pending from "./Pending";
import Courses from "./Courses";
import CourseDetail from "./CourseDetail";
import Grades from "./Grades";
import Search from "./Search";
import Downloads from "./Downloads";

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

  // Se llama aquí y no en la pantalla de Descargas: una descarga puede
  // fallar mientras el estudiante está en cualquier otra pestaña de la
  // extensión, y el aviso tiene que poder aparecer igual.
  useDownloadFailureToasts();

  // El acento de la sección viaja por el DOM: cada pantalla tiene el color de
  // su familia, y los componentes de dentro lo usan sin saber cuál es.
  const shell = (children: React.ReactNode) => (
    <main className="pantalla" data-seccion={view.name}>
      <div className="pantalla__centro">
        {children}
        <Footer />
      </div>
      <ToastStack />
      <DonationModal connected={session.data?.state === "connected"} />
    </main>
  );

  if (session.isPending) {
    return shell(<Cargando que="Estoy comprobando si ya tienes la cuenta conectada." />);
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
        email={session.data.email}
        department={session.data.department}
        avatar={session.data.avatar}
        onDisconnect={() => act.mutate("disconnect")}
      />
      <Nav />
      {view.name === "pending" && <Pending />}
      {view.name === "courses" && <Courses />}
      {view.name === "grades" && <Grades />}
      {view.name === "search" && <Search />}
      {view.name === "downloads" && <Downloads />}
      {view.name === "course" && (
        <CourseDetail courseId={view.courseId} courseName={view.courseName} />
      )}
    </>,
  );
}
