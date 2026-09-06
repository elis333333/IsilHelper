/**
 * Tipos de las respuestas de Moodle.
 *
 * Los objetos que devuelve la API son grandes y los errores llegan como JSON
 * con estado 200, así que **nunca se accede a un campo sin tipo declarado
 * aquí**. Solo se declara lo que se usa: el resto del objeto existe, pero no
 * nos consta su forma y fingir que sí es cómo se cuelan los errores.
 */

/** Forma del error de Moodle. Llega con HTTP 200. */
export type MoodleException = {
  exception: string;
  errorcode: string;
  message: string;
  debuginfo?: string | null;
};

/** `core_webservice_get_site_info` */
export type SiteInfo = {
  sitename: string;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  userid: number;
  userpictureurl: string;
};

/** `core_enrol_get_users_courses` */
export type Course = {
  id: number;
  shortname: string;
  fullname: string;
  /** Porcentaje de completado. Puede no venir si el curso no lo tiene activo. */
  progress?: number | null;
  /** Marcas de tiempo Unix en segundos. */
  startdate?: number;
  enddate?: number;
};

/** Estrecha un `unknown` recién parseado a la excepción de Moodle. */
export function isMoodleException(data: unknown): data is MoodleException {
  return (
    typeof data === "object" &&
    data !== null &&
    "exception" in data &&
    "errorcode" in data
  );
}

// --------------------------------------------------------------------------
// Calendario · core_calendar_get_action_events_by_timesort
// --------------------------------------------------------------------------

/**
 * Un evento accionable del calendario.
 *
 * Solo `id`, `name` y `timesort` se declaran obligatorios: son los que la
 * función garantiza y los únicos sobre los que se puede construir sin
 * comprobar. El resto va opcional **a propósito**, porque no están verificados
 * contra la cuenta real y suponer su presencia es cómo se rompe la pantalla
 * entera por un campo que no vino.
 */
export type CalendarEvent = {
  id: number;
  name: string;
  /** Marca de tiempo Unix en segundos por la que se ordena. */
  timesort: number;
  timestart?: number;
  url?: string;
  viewurl?: string;
  modulename?: string;
  activityname?: string;
  /** Moodle lo marca cuando la entrega ya venció. */
  overdue?: boolean;
  course?: {
    id: number;
    fullname?: string;
    shortname?: string;
  };
  action?: {
    name?: string;
    url?: string;
    itemcount?: number;
    actionable?: boolean;
  };
};

export type ActionEventsResponse = {
  events: CalendarEvent[];
  firstid?: number;
  lastid?: number;
};

// --------------------------------------------------------------------------
// Contenidos de curso · core_course_get_contents
// --------------------------------------------------------------------------

export type ModuleContent = {
  type?: string;
  filename?: string;
  filesize?: number;
  fileurl?: string;
  mimetype?: string;
};

export type CourseModule = {
  id: number;
  name: string;
  modname?: string;
  url?: string;
  /** 0 = no completado, 1 = completado. Ausente si el curso no lo usa. */
  completiondata?: { state?: number };
  contents?: ModuleContent[];
};

export type CourseSection = {
  id: number;
  name: string;
  summary?: string;
  modules?: CourseModule[];
};

// --------------------------------------------------------------------------
// Perfil · core_user_get_users_by_field
// --------------------------------------------------------------------------

/**
 * Lo que devuelve el perfil, medido el 5 de septiembre de 2026 contra la
 * cuenta real: identidad y correo, y nada de matrícula. **No hay código de
 * alumno, ni carrera, ni ciclo** (`domain.md` §4), así que no hay carnet que
 * construir. Todo opcional menos `id`: que el instituto deje un campo vacío es
 * un caso normal, no un error.
 */
export type UserProfile = {
  id: number;
  fullname?: string;
  email?: string;
  department?: string;
  profileimageurl?: string;
};

// --------------------------------------------------------------------------
// Notas · gradereport_user_get_grade_items
// --------------------------------------------------------------------------

export type GradeItem = {
  id: number;
  itemname?: string | null;
  /** `course` marca el total del curso; el resto son actividades. */
  itemtype?: string;
  itemmodule?: string | null;
  graderaw?: number | null;
  grademin?: number | null;
  grademax?: number | null;
  gradeformatted?: string | null;
  percentageformatted?: string | null;
  /** Peso del ítem dentro del curso. Puede no venir. */
  weightraw?: number | null;
  feedback?: string | null;
};

export type UserGrades = {
  courseid: number;
  userid: number;
  gradeitems: GradeItem[];
};

export type GradeItemsResponse = {
  usergrades: UserGrades[];
};

// --------------------------------------------------------------------------
// Tareas · mod_assign_get_assignments
// --------------------------------------------------------------------------

/**
 * Solo los adjuntos, que es lo único que esta llamada aporta para archivar.
 * `cmid` es la clave: es el id con el que la tarea aparece en las secciones
 * que devuelve `core_course_get_contents`.
 */
export type Assignment = {
  id: number;
  cmid: number;
  name?: string;
  introattachments?: ModuleContent[];
  introfiles?: ModuleContent[];
};

export type AssignmentsResponse = {
  courses?: Array<{ id: number; assignments?: Assignment[] }>;
};
