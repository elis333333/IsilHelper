/**
 * Los textos del aporte voluntario.
 *
 * Están juntos y fuera de los componentes porque son lo único de la interfaz
 * que rota: el pie se ve en cada pantalla y el modal aparece solo, así que
 * repetir siempre la misma frase acaba leyéndose como una máquina insistiendo.
 *
 * **La regla de voz, que es la parte difícil.** Se empieza por lo que el
 * estudiante ganó, nunca por lo que cuesta mantener esto: arrancar por el
 * esfuerzo convierte un aporte voluntario en una deuda. Y que no pasa nada si
 * no da nada se dice en la misma frase o en la siguiente, jamás como posdata.
 * Fuera «apóyame», «ayúdame», «considera» y «si te gusta mi trabajo». El tono
 * es el seco del resto de la interfaz —«Busco en 11 cursos…», «No enseño 8
 * entregas que…»—, de igual a igual.
 */

export type DonationCopy = {
  titulo: string;
  cuerpo: string;
};

/** Para la ventana, que tiene sitio para dos líneas de cuerpo. */
export const MODAL_COPY: readonly DonationCopy[] = [
  {
    titulo: "Si te ahorró la tarde",
    cuerpo:
      "Escanea el código con Yape. Es un aporte voluntario a quien mantiene esto, no un pago por usarlo: IsilHelper es gratis y no deja de serlo si no lo haces.",
  },
  {
    titulo: "Por si te sirvió",
    cuerpo:
      "El Yape está aquí por si quieres dejar algo. No desbloquea nada, no quita nada, y la extensión funciona igual si cierras esta ventana.",
  },
  {
    titulo: "Sin letra chica",
    cuerpo:
      "Si el ciclo te salió más fácil con esto, el código de Yape es este. Y si no, cierra tranquilo: nunca va a haber una versión de pago.",
  },
  {
    titulo: "Lo que bajaste hoy",
    cuerpo:
      "Si valió la pena, aquí está el Yape. Si no, tampoco pasa nada: esto se hizo para usarlo, no para cobrarlo.",
  },
  {
    titulo: "Un café, si acaso",
    cuerpo:
      "Yape está abajo por si te provoca. IsilHelper no cambia en nada según lo que decidas, y esa es la idea.",
  },
] as const;

/** Para el pie, donde conviven con el enlace al repositorio y la firma. */
export const FOOTER_COPY: readonly DonationCopy[] = [
  {
    titulo: "Si te ahorró la tarde, invítame un café",
    cuerpo:
      "Escanea el código con Yape. Es un aporte voluntario a quien mantiene esto, no un pago por usarlo: IsilHelper es gratis y no deja de serlo si no lo haces.",
  },
  {
    titulo: "El Yape está aquí por si acaso",
    cuerpo: "Aporte voluntario, sin contraparte. La extensión hace lo mismo con o sin él.",
  },
  {
    titulo: "Gratis, y sigue gratis",
    cuerpo:
      "Si quieres dejar algo, escanea con Yape. Si no, ya está: no hay versión premium esperándote.",
  },
  {
    titulo: "Por si valió la pena",
    cuerpo: "Yape acepta lo que sea. Cero es también una respuesta válida.",
  },
] as const;

/**
 * Elige una variante.
 *
 * El azar entra como argumento —un número de 0 a 1— en vez de llamarse dentro:
 * así la función es pura y se prueba sin tocar `Math.random`.
 */
export function pickVariant<T>(variants: readonly T[], random: number): T {
  const index = Math.min(Math.floor(random * variants.length), variants.length - 1);
  return variants[index]!;
}

/**
 * Las elegidas para esta sesión.
 *
 * Se eligen **al cargar el módulo**, que es una vez por apertura de la pestaña.
 * Es más estable que elegirlas al montar cada componente: si el pie o la
 * ventana se remontaran —por un cambio de pantalla, por una recarga de datos—
 * el texto cambiaría a media interacción, que es justo lo que hay que evitar.
 * Y al no ser estado, no hay nada que sincronizar ni que puedan desincronizar
 * dos renders.
 */
export const modalCopy = pickVariant(MODAL_COPY, Math.random());
export const footerCopy = pickVariant(FOOTER_COPY, Math.random());
