/**
 * Los cinco puntos de Suki.
 *
 * Es el elemento gráfico primario de la marca y lo único del sistema que puede
 * aparecer solo. **El orden y los colores son fijos**: cada posición
 * corresponde a un verbo y a una familia, así que no son cinco colores
 * bonitos sino un índice. Cambiarlos o reordenarlos rompe esa
 * correspondencia.
 *
 *   1 Construir · 2 Adaptar · 3 Integrar · 4 Escalar · 5 Evolucionar
 *
 * Los valores salen de `tokens.css`; aquí no hay ningún color escrito a mano.
 */

const PUNTOS = [
  { verbo: "Construir", token: "--color-action" },
  { verbo: "Adaptar", token: "--color-adapt" },
  { verbo: "Integrar", token: "--color-integrate" },
  { verbo: "Escalar", token: "--color-scale" },
  { verbo: "Evolucionar", token: "--color-evolve" },
] as const;

type Props = {
  /** Alto del punto en píxeles. El resto de la geometría se deriva de él. */
  size?: number;
  /** Anima el salto en secuencia. Se ignora con `prefers-reduced-motion`. */
  animado?: boolean;
};

export function Puntos({ size = 8, animado = false }: Props) {
  return (
    <span className={`puntos${animado ? " puntos--saltando" : ""}`} aria-hidden="true">
      {PUNTOS.map((punto, indice) => (
        <span
          key={punto.verbo}
          className="puntos__punto"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            background: `var(${punto.token})`,
            // Desfase de 60 ms entre uno y otro: es el de la animación firma.
            animationDelay: `${indice * 60}ms`,
          }}
        />
      ))}
    </span>
  );
}

/**
 * Indicador de carga del producto.
 *
 * Los cinco puntos dando un salto corto en secuencia. Va **siempre con texto**
 * que dice qué está pasando: un indicador sin texto no informa, y esa es una
 * regla del sistema, no una preferencia.
 */
export function Cargando({ que }: { que: string }) {
  return (
    <p className="cargando" role="status">
      <Puntos animado />
      <span>{que}</span>
    </p>
  );
}
