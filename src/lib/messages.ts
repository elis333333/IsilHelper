/** Contrato entre la interfaz y el service worker, tipado en un solo sitio
 *  para que ninguno de los dos lados adivine la forma del otro.
 *
 *  El token nunca cruza por aquí: la interfaz sabe si hay sesión, no cuál es
 *  el token. */

import type { PendingItem } from "../api/pending";

export type CourseSummary = {
  id: number;
  fullname: string;
  progress: number | null;
};

/** Causas de fallo que la interfaz sabe explicar. Se traducen aquí desde los
 *  errores de la capa de API para que la UI no conozca sus detalles. */
export type FailureReason =
  | "waf"
  | "invalidtoken"
  | "nosession"
  | "network"
  | "unexpected";

/** Distingue "cargó y está vacío" de "no se pudo cargar". Una lista de
 *  pendientes vacía a mitad de ciclo casi siempre es lo segundo, y presentarla
 *  como lo primero es mentirle al estudiante. */
export type Loaded<T> =
  | { state: "ok"; value: T }
  | { state: "failed"; reason: FailureReason };

/** La lista de pendientes con la marca de si vino entera. Una lista
 *  truncada sin avisar es peor que un error: parece que hay menos trabajo. */
export type PendingList = {
  items: PendingItem[];
  complete: boolean;
};

export type SessionSnapshot =
  | { state: "disconnected" }
  | {
      state: "connected";
      fullname: string;
      sitename: string;
      /** Lo único que el perfil aporta y no se sabe de memoria. `null` cuando
       *  la plataforma no lo devuelve, que es un caso normal. */
      email: string | null;
      department: string | null;
      courses: CourseSummary[];
    }
  | { state: "failed"; reason: FailureReason };

export type ModuleView = {
  id: number;
  name: string;
  kind: string | null;
  /** `null` si el curso no lleva seguimiento de completado. */
  completed: boolean | null;
  url: string | null;
  fileCount: number;
};

export type SectionView = {
  id: number;
  name: string;
  modules: ModuleView[];
};

export type CourseDetail = {
  courseId: number;
  courseName: string;
  sections: SectionView[];
};

export type CourseGradeRow = {
  courseId: number;
  courseName: string;
  percentage: number | null;
  source: "total" | "weighted" | "none";
  graded: number;
  /** El curso no se pudo leer: se marca en su sitio, no se oculta la tabla. */
  failed: boolean;
};

export type GradesReport = {
  rows: CourseGradeRow[];
  average: number | null;
  failedCount: number;
};

export type BackgroundRequest =
  | { type: "session" }
  | { type: "connect" }
  | { type: "disconnect" }
  | { type: "pending" }
  | { type: "courses" }
  | { type: "contents"; courseId: number; courseName: string }
  | { type: "grades" };

export type ResponseMap = {
  session: SessionSnapshot;
  connect: SessionSnapshot;
  disconnect: SessionSnapshot;
  pending: Loaded<PendingList>;
  courses: Loaded<CourseSummary[]>;
  contents: Loaded<CourseDetail>;
  grades: Loaded<GradesReport>;
};

export type ResponseFor<K extends BackgroundRequest["type"]> = ResponseMap[K];
