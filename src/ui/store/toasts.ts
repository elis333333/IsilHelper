import { create } from "zustand";

/**
 * Avisos que no pueden quedar como texto perdido en la pantalla.
 *
 * Es para lo que **impide completar una acción** y puede pasar sin que el
 * estudiante esté mirando ese rincón de la interfaz —una descarga que sigue
 * corriendo en el fondo mientras está en otra pestaña de la extensión, por
 * ejemplo—. No es para todo fallo: lo informativo que no bloquea nada —una
 * carpeta de Drive que no se pudo leer entre otras que sí, los adjuntos de
 * una tarea que no llegaron— se queda como texto en su sitio, que es donde
 * tiene el contexto completo al lado. Convertir eso en un aviso encima de
 * todo lo demás lo haría más molesto que informativo.
 */

export type ToastTone = "error" | "warning" | "info";

export type Toast = {
  id: string;
  tone: ToastTone;
  title: string;
  detail?: string;
};

type ToastState = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) =>
    set((state) => ({ toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }] })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}));
