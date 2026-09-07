import { useEffect } from "react";
import { useToasts, type Toast } from "../store/toasts";

const SYMBOL: Record<Toast["tone"], string> = {
  error: "✕",
  warning: "▲",
  info: "ℹ",
};

const TONE_CLASS: Record<Toast["tone"], string> = {
  error: "estado--error",
  warning: "estado--advertencia",
  info: "estado--info",
};

/** Se queda en pantalla lo suficiente para leerlo con calma y desaparece
 *  solo; cerrarlo a mano no espera a esto. */
const AUTO_DISMISS_MS = 8000;

function ToastCard({ toast }: { toast: Toast }) {
  const dismiss = useToasts((state) => state.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, dismiss]);

  return (
    <div className="toast" role="alert">
      <p className={`estado ${TONE_CLASS[toast.tone]}`}>
        <span aria-hidden="true">{SYMBOL[toast.tone]}</span>
        <span>{toast.title}</span>
      </p>
      {toast.detail !== undefined && <p className="toast__detalle">{toast.detail}</p>}
      <button
        type="button"
        className="toast__cerrar"
        onClick={() => dismiss(toast.id)}
        aria-label="Cerrar aviso"
      >
        ✕
      </button>
    </div>
  );
}

/** Se monta una sola vez, en la raíz de la aplicación: un aviso tiene que
 *  poder aparecer sin importar en qué pantalla esté el estudiante en ese
 *  momento, no solo en la que disparó el fallo. */
export function ToastStack() {
  const toasts = useToasts((state) => state.toasts);
  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="region" aria-label="Avisos">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
