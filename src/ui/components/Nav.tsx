import { useNavigation, type View } from "../store/navigation";

const TABS: Array<{ name: View["name"]; label: string }> = [
  { name: "pending", label: "Pendientes" },
  { name: "courses", label: "Cursos" },
  { name: "grades", label: "Notas" },
  { name: "search", label: "Buscar" },
  { name: "downloads", label: "Descargas" },
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
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
