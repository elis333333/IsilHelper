import { useEffect, useRef } from "react";
import { useDonationPrompt } from "../store/donation";
import { useDonationTriggers } from "../lib/donation";
import { modalCopy } from "../copy/donacion";
import { REPO_URL } from "../../lib/constants";

/**
 * El aviso de apoyo económico, como ventana emergente.
 *
 * Es el mismo QR y la misma idea del pie de página, pero en un momento
 * puntual —tras usar la extensión un rato, o justo al terminar de bajar
 * algo— y no como una franja que hay que desplazarse hasta encontrar. No se
 * repite en esta sesión: `useDonationPrompt` ya lo garantiza.
 *
 * El texto sale de `copy/donacion.ts` y rota: una variante por apertura de la
 * pestaña, no una por render. El botón «Ahora no» y el enlace al repositorio
 * no rotan, porque no son la petición.
 */
export function DonationModal({ connected }: { connected: boolean }) {
  useDonationTriggers(connected);

  const open = useDonationPrompt((state) => state.open);
  const close = useDonationPrompt((state) => state.close);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const anteriorRef = useRef<Element | null>(null);

  // Foco al botón de cerrar al abrir, y de vuelta a donde estaba al cerrar
  // —la skill de producto lo pide para todo modal—. Aquí no hay un botón que
  // lo abra (dispara solo, por tiempo o por descarga), así que "donde
  // estaba" es lo que tuviera el foco en ese instante, casi siempre nada en
  // particular.
  useEffect(() => {
    if (!open) return;
    anteriorRef.current = document.activeElement;
    cerrarRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (anteriorRef.current instanceof HTMLElement) anteriorRef.current.focus();
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="velo" onClick={close}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="donacion-titulo"
        // Sin esto, el clic en cualquier parte del modal burbujea al velo y
        // lo cierra: el estudiante no podría ni leer el texto sin que se le
        // cerrara al tocarlo.
        onClick={(event) => event.stopPropagation()}
      >
        <div className="donacion">
          <img
            className="donacion__qr"
            src={chrome.runtime.getURL("apoyo/yape.png")}
            alt="Código QR de Yape para enviar un aporte"
            width={160}
            height={160}
          />

          <div className="donacion__cuerpo">
            <h2 id="donacion-titulo" className="subtitulo">
              {modalCopy.titulo}
            </h2>
            <p className="parrafo parrafo--apagado">{modalCopy.cuerpo}</p>
            <p className="parrafo" style={{ marginBottom: 0 }}>
              <a href={REPO_URL} target="_blank" rel="noreferrer">
                El código está abierto en GitHub
              </a>
            </p>
          </div>
        </div>

        <div className="acciones donacion__acciones">
          <button type="button" className="btn btn--secundario" onClick={close} ref={cerrarRef}>
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
