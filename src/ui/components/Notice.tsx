import type { ReactNode } from "react";

/** Bloque de estado: cargando, vacío o informativo.
 *
 *  Los estados vacíos no llevan ilustración: una composición tipográfica sobre
 *  el fondo base es mejor que un dibujo de relleno. Y el color nunca es el
 *  único portador — siempre hay símbolo y texto. */

export type Tone = "neutral" | "success" | "warning" | "error" | "info";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "",
  success: "estado--exito",
  warning: "estado--advertencia",
  error: "estado--error",
  info: "estado--info",
};

type Props = {
  tone?: Tone;
  symbol: string;
  title: string;
  detail?: string;
  hint?: string;
  children?: ReactNode;
};

export function Notice({ tone = "neutral", symbol, title, detail, hint, children }: Props) {
  return (
    <div className="tarjeta">
      <p className={`estado ${TONE_CLASS[tone]}`}>
        <span aria-hidden="true">{symbol}</span>
        <span>{title}</span>
      </p>
      {detail && (
        <p className="parrafo" style={{ marginTop: "var(--space-4)" }}>
          {detail}
        </p>
      )}
      {hint && <p className="parrafo parrafo--apagado">{hint}</p>}
      {children}
    </div>
  );
}

/** Cargando siempre dice qué está pasando: un giro sin texto no informa. */
export function Loading({ what }: { what: string }) {
  return <Notice symbol="·" title={what} />;
}
