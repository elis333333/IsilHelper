import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConnectPanel } from "../components/ConnectPanel";
import { FailureNotice } from "../components/FailureNotice";
import { SessionSummary } from "../components/SessionSummary";
import { ask } from "../lib/messaging";
import type { SessionSnapshot } from "../../lib/messages";

/** Pantalla de la Fase 0. Tres estados: sin conectar, conectado, o un fallo
 *  que dice qué pasó y qué hacer. */
export default function Home() {
  const client = useQueryClient();

  const session = useQuery({
    queryKey: ["session"],
    queryFn: () => ask({ type: "session" }),
  });

  const act = useMutation({
    mutationFn: (type: "connect" | "disconnect") => ask({ type }),
    onSuccess: (snapshot: SessionSnapshot) => {
      client.setQueryData(["session"], snapshot);
    },
  });

  const connect = () => act.mutate("connect");
  const busy = act.isPending || session.isFetching;

  return (
    <main className="pantalla">
      <div className="pantalla__centro">
        <p className="etiqueta" style={{ color: "var(--color-text-subtle)" }}>
          Tu información académica
        </p>
        <h1 className="titulo">IsilHelper</h1>

        {session.isPending && (
          <p className="estado">
            <span aria-hidden="true">·</span>
            <span>Estoy comprobando si ya tienes la cuenta conectada.</span>
          </p>
        )}

        {session.isError && (
          <FailureNotice
            reason="unexpected"
            onRetry={() => void session.refetch()}
            retrying={busy}
          />
        )}

        {session.data?.state === "disconnected" && (
          <ConnectPanel onConnect={connect} connecting={act.isPending} />
        )}

        {session.data?.state === "connected" && (
          <SessionSummary
            fullname={session.data.fullname}
            courses={session.data.courses}
            onDisconnect={() => act.mutate("disconnect")}
          />
        )}

        {session.data?.state === "failed" && (
          <FailureNotice
            reason={session.data.reason}
            onRetry={connect}
            retrying={busy}
          />
        )}

        <footer className="pie">
          <p className="firma-labs">IsilHelper · un proyecto de Suki</p>
        </footer>
      </div>
    </main>
  );
}
