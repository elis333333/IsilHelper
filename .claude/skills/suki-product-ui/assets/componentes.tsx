/* =========================================================
   SUKI — Componentes de referencia para producto propio
   React + Tailwind + Lucide. Dark-first, radio 0, sin sombras.

   Los nombres de utilidad corresponden a tailwind-v3.js de
   suki-brand-tokens. En v4 son los mismos sobre el bloque @theme.

   NO usar en software entregado a clientes: ver suki-client-ui.
   ========================================================= */

import { AlertCircle, Check, Info, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

/* --- Botón ------------------------------------------------ */
type BotonProps = {
  variante?: "principal" | "secundario" | "destructivo";
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variantes = {
  // Texto SIEMPRE oscuro sobre el verde: con blanco da 1,9:1
  principal:
    "h-12 px-8 bg-action text-base border border-action hover:bg-base hover:text-action",
  secundario:
    "h-10 px-6 bg-transparent text-ink border border-line hover:bg-elevated",
  destructivo:
    "h-10 px-6 bg-transparent text-error border border-error hover:bg-error hover:text-base",
};

export function Boton({ variante = "principal", children, ...props }: BotonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-none font-semibold
                  transition-colors duration-fast ease-suki
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-action
                  focus-visible:outline-offset-2
                  disabled:bg-disabled disabled:text-base disabled:cursor-not-allowed
                  ${variantes[variante]}`}
    >
      {children}
    </button>
  );
}

/* --- Campo ------------------------------------------------
   La etiqueta va siempre visible encima. Un placeholder que
   desaparece al escribir deja al usuario sin saber qué llena. */
type CampoProps = {
  id: string;
  etiqueta: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Campo({ id, etiqueta, error, ...props }: CampoProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-bodySm font-medium text-ink">
        {etiqueta}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
        className="h-10 px-4 bg-surface text-ink border border-line rounded-none
                   placeholder:text-disabled
                   focus:border-action focus:outline focus:outline-1 focus:outline-action
                   aria-[invalid=true]:border-error"
      />
      {/* El error lleva ícono y texto, no solo el borde en rojo */}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-2 text-bodySm text-error">
          <AlertCircle size={16} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/* --- Estado ------------------------------------------------
   El color nunca es el único portador: siempre ícono + texto. */
const iconos = { exito: Check, error: AlertCircle, advertencia: AlertTriangle, info: Info };
const colores = {
  exito: "text-action",
  error: "text-error",
  advertencia: "text-integrate",
  info: "text-evolve",
};

export function Estado({
  tipo,
  children,
}: {
  tipo: keyof typeof iconos;
  children: ReactNode;
}) {
  const Icono = iconos[tipo];
  return (
    <p className={`inline-flex items-center gap-2 text-bodySm ${colores[tipo]}`}>
      <Icono size={16} aria-hidden="true" />
      {children}
    </p>
  );
}

/* --- Tarjeta ----------------------------------------------
   Profundidad por superficie y borde. Sin sombra. */
export function Tarjeta({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface border border-line rounded-none p-6 hover:bg-elevated
                    transition-colors duration-fast ease-suki">
      {children}
    </div>
  );
}

/* --- Estado vacío ------------------------------------------
   Sin ilustración. Dice qué es la pantalla y qué hacer ahora. */
export function Vacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4 py-12 max-w-[65ch]">
      <h2 className="text-h3 font-semibold text-heading">{titulo}</h2>
      <p className="text-muted">{descripcion}</p>
      {accion}
    </div>
  );
}

/* --- Firma de respaldo -------------------------------------
   Único vínculo obligatorio de un producto propio con Suki. */
export function FirmaLabs({ producto }: { producto: string }) {
  return (
    <p className="text-caption text-subtle">{producto} · un proyecto de Suki Labs</p>
  );
}
