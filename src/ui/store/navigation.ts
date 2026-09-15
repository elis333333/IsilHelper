import { create } from "zustand";

/** Navegación entre las pantallas de la Fase 1a. Es lo único que guarda el
 *  estado global de la interfaz: el resto son datos de servidor y pertenecen
 *  a TanStack Query. */

export type View =
  | { name: "pending" }
  | { name: "courses" }
  | { name: "grades" }
  /** El calendario vive dentro de Buscar. `focus` lo trae la franja de
   *  evaluaciones para llevar la vista hasta la retícula en vez de dejar al
   *  estudiante arriba, delante del campo de búsqueda. */
  | { name: "search"; focus?: "calendar" }
  | { name: "downloads" }
  | { name: "course"; courseId: number; courseName: string };

type NavigationState = {
  view: View;
  go: (view: View) => void;
};

export const useNavigation = create<NavigationState>((set) => ({
  view: { name: "pending" },
  go: (view) => set({ view }),
}));
