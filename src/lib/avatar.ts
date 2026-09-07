/**
 * La foto de perfil, en todo lo que se puede decidir sin tocar la red.
 *
 * Son dos preguntas, y las dos tienen respuesta pura:
 *
 *   1. ¿Merece la pena bajarla? Cuando el estudiante no subió ninguna, Moodle
 *      sirve el muñeco gris del tema. Ese muñeco no dice quién es nadie y
 *      además cuesta una petición, así que no se baja.
 *   2. ¿Qué se enseña cuando no hay foto? Las iniciales del nombre, que sí
 *      dicen algo, en vez del hueco o del muñeco.
 *
 * Aquí no hay red ni token: eso vive en `src/api/avatar.ts`.
 */

/**
 * ¿Es el avatar por defecto de Moodle?
 *
 * Se decide **por la ruta y no por el nombre del archivo**, igual que el
 * filtro de ruido de `noise.ts`: una foto subida por el estudiante sale de
 * `pluginfile.php`, y el muñeco gris sale de `theme/image.php`, que es una
 * imagen del sitio y no del usuario. La distinción es estructural y no
 * depende de cómo se llame el archivo.
 *
 * Una URL que no se puede leer cuenta como genérica: lo que no se entiende no
 * se descarga.
 */
export function isGenericAvatar(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return true;
  }

  // El muñeco gris es una imagen del tema, servida por el sitio.
  if (parsed.pathname.includes("/theme/image.php")) return true;

  // `.../u/f1`, `.../u/f2`: el marcador de «sin foto» del tema. Ojo con
  // confundirlo con `.../user/icon/<tema>/f1`, que sí es una foto real: lo que
  // distingue al genérico es el `/u/` de delante.
  if (/\/u\/f\d+(\.\w+)?$/.test(parsed.pathname)) return true;

  // Moodle marca con rev=-1 al usuario que nunca subió una.
  if (parsed.searchParams.get("rev") === "-1") return true;

  return false;
}

/**
 * Iniciales para cuando no hay foto.
 *
 * Primera letra de la primera palabra y primera de la última. Con nombres
 * peruanos —dos nombres y dos apellidos— la última inicial es la del segundo
 * apellido, que no es la que uno diría en voz alta. Se acepta a propósito: el
 * nombre completo está escrito justo al lado, así que las iniciales no tienen
 * que identificar a nadie. Solo tienen que llenar el hueco con algo que sea de
 * esta persona y no un muñeco gris igual para todos.
 */
export function initialsFrom(fullname: string): string {
  const words = fullname.split(/\s+/).filter((word) => /^\p{L}/u.test(word));

  const [first] = words;
  if (first === undefined) return "?";

  const last = words.length > 1 ? words[words.length - 1] : undefined;
  return `${first.charAt(0)}${last?.charAt(0) ?? ""}`.toLocaleUpperCase("es");
}
