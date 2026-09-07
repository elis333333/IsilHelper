import { create } from "zustand";

/**
 * Si ya se pidió el aporte en esta apertura de la extensión.
 *
 * Vive en memoria y no en `storage.local` a propósito: es una pregunta que
 * solo importa mientras dura esta sesión de uso —la pestaña abierta—, no un
 * dato que tenga sentido guardar junto al token o la cola de descargas. Al
 * cerrar la pestaña y volver a abrir la extensión, `shown` empieza en falso
 * de nuevo, que es justo "no más de una vez por sesión del navegador".
 */

type DonationPromptState = {
  open: boolean;
  shown: boolean;
  /** Pide mostrar el aviso. No hace nada si ya se mostró esta sesión. */
  trigger: () => void;
  close: () => void;
};

export const useDonationPrompt = create<DonationPromptState>((set, get) => ({
  open: false,
  shown: false,
  trigger: () => {
    if (get().shown) return;
    set({ open: true, shown: true });
  },
  close: () => set({ open: false }),
}));
