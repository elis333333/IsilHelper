import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Última red de seguridad de la interfaz.
 *
 * Sin ella, cualquier fallo al pintar deja **la página en blanco**, que es el
 * peor resultado posible: el estudiante no sabe si la extensión se rompió, si
 * no tiene datos o si la plataforma cayó. Degrada, no revienta.
 *
 * No registra el error en consola a propósito: por aquí pasan respuestas de la
 * API y no se vuelca nada que pueda arrastrar datos de sesión.
 */

type Props = { children: ReactNode };
type State = { failed: boolean };

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Intencionadamente vacío: ver la nota de arriba.
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="pantalla">
        <div className="pantalla__centro">
          <div className="tarjeta">
            <p className="estado estado--error">
              <span aria-hidden="true">✕</span>
              <span>Algo se rompió al dibujar esta pantalla</span>
            </p>
            <p className="parrafo" style={{ marginTop: "var(--space-4)" }}>
              La extensión recibió algo que no supo interpretar. No es culpa de
              lo que hiciste.
            </p>
            <p className="parrafo parrafo--apagado">
              Vuelve a cargar la pestaña. Si se repite, puede que la plataforma
              haya cambiado y haya que actualizar la extensión.
            </p>
            <div className="acciones">
              <button
                type="button"
                className="btn btn--principal"
                onClick={() => location.reload()}
              >
                Volver a cargar
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }
}
