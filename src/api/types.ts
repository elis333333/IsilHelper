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
