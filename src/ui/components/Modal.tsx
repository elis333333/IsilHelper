import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Ventana modal reutilizable.
 *
 * Sale de `DonationModal`, que era el único modal del proyecto y llevaba dentro
 * todo esto escrito a mano. Cumple lo que pide la skill de producto: cierra con
 * Escape, cierra al pulsar fuera, lleva un botón de cerrar visible, y devuelve
 * el foco a donde estaba al abrirse.
 *
 * `DonationModal` **no se ha migrado** a este componente: funciona, está
 * probado contra el navegador, y cambiarlo cae fuera de lo que se pidió.
 */

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ title, onClose, children }: Props) {
  const titleId = useId();
  const closeButton = useRef<HTMLButtonElement>(null);
  const previous = useRef<Element | null>(null);

  // `onClose` se guarda en una referencia en vez de ponerse en las
  // dependencias. Si estuviera, un padre que pase una función en línea —que es
  // lo normal— volvería a ejecutar el efecto en cada render: el foco saltaría
  // otra vez al botón de cerrar a mitad de lectura, y `previous` acabaría
  // guardando el propio botón del modal en lugar de la celda de origen.
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    previous.current = document.activeElement;
    closeButton.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close.current();
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Solo si sigue en el documento: devolver el foco a un nodo que ya no
      // existe no hace nada y deja el foco perdido en el `body`.
      const target = previous.current;
      if (target instanceof HTMLElement && document.contains(target)) target.focus();
    };
  }, []);

  return (
    <div className="velo" onClick={() => close.current()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // Sin esto, cualquier clic dentro burbujea al velo y cierra el modal:
        // no se podría ni seleccionar el texto sin que desapareciera.
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="subtitulo">
          {title}
        </h2>

        {children}

        <div className="acciones">
          <button
            type="button"
            className="btn btn--secundario"
            onClick={() => close.current()}
            ref={closeButton}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
