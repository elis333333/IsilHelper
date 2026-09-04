import type { FailureReason } from "../../lib/messages";

/** Cada fallo dice qué pasó y qué puede hacer el estudiante. El color nunca
 *  es el único portador: siempre hay símbolo y texto. */

type Props = { reason: FailureReason; onRetry: () => void; retrying: boolean };

type Presentation = {
  tone: string;
  symbol: string;
  title: string;
  what: string;
  todo: string;
  retryLabel: string;
};

const PRESENTATIONS: Record<FailureReason, Presentation> = {
  waf: {
    tone: "estado--advertencia",
    symbol: "▲",
    title: "El filtro de seguridad de la plataforma me está bloqueando",
    what: "La petición no llegó a la plataforma: la cortó antes el filtro del instituto.",
    todo: "Espera un minuto y vuelve a intentarlo.",
    retryLabel: "Reintentar",
  },
  invalidtoken: {
    tone: "estado--advertencia",
    symbol: "▲",
    title: "La conexión con tu cuenta ya no vale",
    what: "El permiso que me diste dejó de ser válido, normalmente porque lo revocaste.",
    todo: "Vuelve a conectar. Es un clic y no te pide contraseña.",
    retryLabel: "Conectar de nuevo",
  },
  nosession: {
    tone: "estado--advertencia",
    symbol: "▲",
    title: "No tienes la sesión abierta en la plataforma",
    what: "Para darme permiso necesito que ya estés dentro de la plataforma.",
    todo: "Entra en platform.ecala.net como siempre y vuelve a esta pestaña.",
    retryLabel: "Ya entré, reintentar",
  },
  network: {
    tone: "estado--error",
    symbol: "✕",
    title: "No pude comunicarme con la plataforma",
    what: "La petición no llegó a salir o se quedó sin respuesta.",
    todo: "Revisa tu conexión a internet y vuelve a intentarlo.",
    retryLabel: "Reintentar",
  },
  unexpected: {
    tone: "estado--advertencia",
    symbol: "▲",
    title: "La plataforma respondió algo que no esperaba",
    what: "Contestó, pero no con lo que pide la aplicación.",
    todo: "Suele pasar cuando el instituto cambia algo. Prueba más tarde.",
    retryLabel: "Reintentar",
  },
};

export function FailureNotice({ reason, onRetry, retrying }: Props) {
  const p = PRESENTATIONS[reason];

  return (
    <div className="tarjeta">
      <p className={`estado ${p.tone}`}>
        <span aria-hidden="true">{p.symbol}</span>
        <span>{p.title}</span>
      </p>
      <p className="parrafo" style={{ marginTop: "var(--space-4)" }}>
        {p.what}
      </p>
      <p className="parrafo parrafo--apagado">{p.todo}</p>
      <div className="acciones">
        <button
          type="button"
          className="btn btn--principal"
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying ? "Comprobando" : p.retryLabel}
        </button>
      </div>
    </div>
  );
}
