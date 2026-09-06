import { useNavigation, type View } from "../store/navigation";

/**
 * Navegación por secciones.
 *
 * Cada pestaña lleva el color de la familia que le corresponde, como viñeta y
 * como relleno cuando está activa. Es un uso aprobado de los cinco puntos
 * —viñeta de lista con el color de su familia— y no la fila del logotipo, que
 * exigiría respetar el orden fijo de los verbos. Sirve además para que los
 * cinco colores estén presentes en cualquier pantalla, que es lo que impide
 * que el verde se coma la interfaz.
 *
 * El color del texto sobre el relleno **no es el mismo en las cinco**: sobre
 * el morado el oscuro da 3,46:1 y falla, así que ahí va blanco. La excepción
 * viaja con la pestaña para no tener que acordarse de ella.
 */

type Tab = {
  name: View["name"];
  label: string;
  /** Token del color de la familia. */
  token: string;
  /** Token del texto que va encima cuando está activa. */
  sobre: string;
};

const TABS: Tab[] = [
  // Integrar: lo que reclama atención.
  { name: "pending", label: "Pendientes", token: "--color-integrate", sobre: "--color-base" },
  // Adaptar, familia A: la estructura del ciclo. Único con texto blanco.
  { name: "courses", label: "Cursos", token: "--color-adapt", sobre: "--color-white" },
  // Escalar, familia D: datos e inteligencia.
  { name: "grades", label: "Notas", token: "--color-scale", sobre: "--color-base" },
  { name: "search", label: "Buscar", token: "--color-evolve", sobre: "--color-base" },
  // Construir, familia C: archivar es lo que construye, y es el propósito.
  { name: "downloads", label: "Descargas", token: "--color-action", sobre: "--color-base" },
];

export function Nav() {
  const view = useNavigation((state) => state.view);
  const go = useNavigation((state) => state.go);

  // El detalle de curso cuelga de Cursos: la pestaña sigue marcada allí.
  const active = view.name === "course" ? "courses" : view.name;

  return (
    <nav className="nav" aria-label="Secciones">
      {TABS.map((tab) => (
        <button
          key={tab.name}
          type="button"
          className="nav__item"
          aria-current={active === tab.name ? "page" : undefined}
          onClick={() => go({ name: tab.name } as View)}
          style={
            {
              "--acento-tab": `var(${tab.token})`,
              "--sobre-acento-tab": `var(${tab.sobre})`,
            } as React.CSSProperties
          }
        >
          <span className="nav__punto" style={{ background: `var(${tab.token})` }} />
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
