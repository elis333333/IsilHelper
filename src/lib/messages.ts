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

/**
 * Un archivo de Moodle tal como lo ve la interfaz.
 *
 * `path` es a la vez el destino en disco y la **identidad** del archivo: es lo
 * que dice si algo ya se bajó. La `url` viaja **sin el token**; se compone al
 * lanzar la descarga y no cruza nunca hacia la interfaz.
 */
export type FileView = {
  path: string;
  name: string;
  url: string;
  size: number | null;
};

export type ModuleView = {
  id: number;
  name: string;
  kind: string | null;
  /** `null` si el curso no lleva seguimiento de completado. */
  completed: boolean | null;
  url: string | null;
  /** Lo descargable con el token. Vacío en los enlaces a Drive. */
  files: FileView[];
  /** Enlaces que el token no abre: Drive, Zoom, formularios. Se cuentan para
   *  poder decir por qué un módulo no tiene botón de descarga. */
  externalCount: number;
};

export type SectionView = {
  id: number;
  name: string;
  modules: ModuleView[];
};

/** Un enlace que el token no abre. Se lleva a la interfaz para poder
 *  exportar el inventario del curso, que es de donde saldrá la Fase 3. */
export type ExternalLinkView = {
  url: string;
  moduleName: string;
  sectionName: string;
  kind: string | null;
};

export type CourseDetail = {
  courseId: number;
  courseName: string;
  sections: SectionView[];
  /** Todo lo descargable del curso, ya con su ruta de destino. */
  files: FileView[];
  links: ExternalLinkView[];
  /** Los adjuntos de las tareas se piden aparte y pueden fallar solos. Cuando
   *  fallan se dice, en vez de enseñar un curso al que le faltan archivos sin
   *  avisar de que faltan. */
  attachmentsFailed: boolean;
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

// --------------------------------------------------------------------------
// Cola de descargas
// --------------------------------------------------------------------------

/**
 * De dónde sale el archivo, que decide **cómo se autentica la descarga**:
 *
 * - `moodle`: la URL es un `pluginfile.php` y necesita el token pegado
 *   (`domain.md` §4).
 * - `drive`: la URL ya está lista y se baja con la sesión de Google del
 *   navegador. Pegarle el token de Moodle no solo no serviría: lo mandaría a
 *   un tercero, que es exactamente lo que la regla 4 impide.
 */
export type FileSource = "moodle" | "drive";

/** Lo que la interfaz encola. Sale tal cual del detalle de curso, que es
 *  donde el service worker ya calculó la ruta de destino. */
export type QueuedFile = {
  path: string;
  name: string;
  url: string;
  size: number | null;
  courseName: string;
  sectionName: string;
  source: FileSource;
};

/**
 * Estado de un archivo en la cola.
 *
 * `skipped` no es un fallo: es "esto ya estaba bajado". Se distingue de `done`
 * a propósito, porque son dos respuestas distintas a la misma pregunta —¿lo
 * tengo?— y mezclarlas haría que una tanda entera de omitidos pareciera una
 * descarga que nunca ocurrió.
 */
export type QueueStatus = "pending" | "active" | "done" | "skipped" | "failed";

export type QueueItem = QueuedFile & {
  status: QueueStatus;
  /** Qué pasó y qué puede hacer el estudiante. `null` mientras no falle. */
  error: string | null;
  attempts: number;
  /** Bytes ya escritos. Solo tiene valor mientras el archivo está activo. */
  received: number;
};

export type QueueSnapshot = {
  items: QueueItem[];
  paused: boolean;
  /** Queda trabajo por hacer. La interfaz solo refresca mientras sea cierto. */
  running: boolean;
};

// --------------------------------------------------------------------------
// Drive
// --------------------------------------------------------------------------

/** Algo que no se pudo leer al explorar Drive. Se enseña **aunque la descarga
 *  vaya bien**: una lista corta que parece completa es peor que un error. */
export type DriveProblemView = {
  /** Dónde pasó, en lenguaje del estudiante: `T01 - Introducción / Anexos`. */
  where: string;
  detail: string;
};

export type DriveExploration = {
  files: QueuedFile[];
  problems: DriveProblemView[];
  /** Se alcanzó un tope del recorrido, así que **puede faltar material**. */
  truncated: boolean;
  foldersRead: number;
};

export type BackgroundRequest =
  | { type: "session" }
  | { type: "connect" }
  | { type: "disconnect" }
  | { type: "pending" }
  | { type: "courses" }
  | { type: "contents"; courseId: number; courseName: string }
  | { type: "grades" }
  | { type: "enqueue"; files: QueuedFile[] }
  | { type: "queue" }
  | { type: "pauseQueue" }
  | { type: "resumeQueue" }
  | { type: "clearQueue" }
  | { type: "retryQueue" }
  /** Cuáles de estas rutas ya están descargadas. Se pregunta una vez por
   *  pantalla, no en cada refresco: el registro entero son cientos de rutas. */
  | { type: "stored"; paths: string[] }
  /** Olvida el registro para volver a bajar lo que ya estaba. */
  | { type: "forgetStored"; paths: string[] }
  /** Explora los enlaces de Drive de un curso. No encola: solo mira, porque
   *  con un recorrido que puede tardar minutos conviene enseñar antes qué se
   *  encontró y qué no se pudo leer. */
  | { type: "exploreDrive"; courseId: number; courseName: string };

export type ResponseMap = {
  session: SessionSnapshot;
  connect: SessionSnapshot;
  disconnect: SessionSnapshot;
  pending: Loaded<PendingList>;
  courses: Loaded<CourseSummary[]>;
  contents: Loaded<CourseDetail>;
  grades: Loaded<GradesReport>;
  enqueue: QueueSnapshot;
  queue: QueueSnapshot;
  pauseQueue: QueueSnapshot;
  resumeQueue: QueueSnapshot;
  clearQueue: QueueSnapshot;
  retryQueue: QueueSnapshot;
  stored: string[];
  forgetStored: string[];
  exploreDrive: Loaded<DriveExploration>;
};

export type ResponseFor<K extends BackgroundRequest["type"]> = ResponseMap[K];
