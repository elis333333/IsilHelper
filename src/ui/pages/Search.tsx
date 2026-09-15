import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Notice } from "../components/Notice";
import { MonthCalendar } from "../components/MonthCalendar";
import { useNavigation } from "../store/navigation";
import { ask } from "../lib/messaging";
import { buildIndex, readCachedContents, scopeLine } from "../lib/cache-index";
import { search, type SearchKind } from "../../lib/search";

/**
 * Buscador global.
 *
 * La pantalla dice siempre qué alcance tiene la búsqueda. Un buscador que
 * calla lo que no mira convierte "no lo he cargado" en "no existe", y esa es
 * justo la confusión que esta extensión intenta quitarle de encima al
 * estudiante. Por eso el alcance se cuenta en cada render y no se memoriza:
 * un índice congelado en el primer montaje decía "0 cursos" con once cargados,
 * que es la peor forma posible de fallar en una pantalla que promete
 * honestidad.
 */

const KIND_LABEL: Record<SearchKind, string> = {
  pending: "Pendiente",
  course: "Curso",
  module: "Material",
};

export default function Search() {
  const client = useQueryClient();
  const go = useNavigation((state) => state.go);
  const view = useNavigation((state) => state.view);
  const [query, setQuery] = useState("");
  const calendarRef = useRef<HTMLDivElement>(null);

  // Quien llega desde la franja de evaluaciones viene a ver el calendario, no
  // a buscar: aterrizar arriba del todo le obligaría a desplazarse a mano.
  const toCalendar = view.name === "search" && view.focus === "calendar";
  useEffect(() => {
    if (!toCalendar) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    calendarRef.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }, [toCalendar]);

  // Las mismas claves que Cursos y Pendientes: si esas pantallas ya cargaron,
  // esto no cuesta ninguna petición. Si no, son dos, no once.
  const courses = useQuery({ queryKey: ["courses"], queryFn: () => ask({ type: "courses" }) });
  const pending = useQuery({ queryKey: ["pending"], queryFn: () => ask({ type: "pending" }) });

  // El material sale de la caché, tal cual esté en este render.
  const { entries, scope } = buildIndex(
    courses.data,
    pending.data,
    readCachedContents(client),
  );
  const hits = search(entries, query);

  const loading = courses.isPending || pending.isPending;
  const missing = [
    courses.isError || courses.data?.state === "failed" ? "los cursos" : null,
    pending.isError || pending.data?.state === "failed" ? "los pendientes" : null,
  ].filter((value): value is string => value !== null);

  return (
    <>
      <div className="campo">
        <label className="campo__etiqueta" htmlFor="buscador">
          Buscar en tus cursos
        </label>
        <input
          id="buscador"
          className="campo__control"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
          // Quien viene a ver el calendario no quiere el foco en el campo: el
          // navegador desplazaría hasta él y pelearía con el desplazamiento de
          // arriba.
          autoFocus={!toCalendar}
        />
      </div>

      {loading ? (
        <p className="parrafo parrafo--apagado">
          Estoy reuniendo lo que puedo buscar.
        </p>
      ) : (
        <p className="parrafo parrafo--apagado">
          {scopeLine(scope)} Abre un curso y su material entra también en la
          búsqueda.
        </p>
      )}

      {missing.length > 0 && (
        <p className="estado estado--advertencia">
          <span aria-hidden="true">▲</span>
          <span>
            No pude cargar {missing.join(" ni ")}, así que no {missing.length === 1 ? "está" : "están"} en
            la búsqueda.
          </span>
        </p>
      )}

      {query.trim() !== "" && hits.length === 0 && (
        <Notice
          symbol="·"
          title="No encontré nada con eso"
          detail="Ninguno de tus cursos, pendientes o materiales cargados coincide."
          hint="Si esperabas material de un curso concreto, ábrelo una vez desde
                Cursos: hasta entonces no está aquí para buscarlo."
        />
      )}

      {hits.length > 0 && (
        <ul className="lista">
          {hits.map((hit) => {
            // Constante propia para que TypeScript conserve el estrechamiento
            // dentro del `onClick`.
            const { courseId } = hit;
            const context = [hit.kind === "course" ? null : hit.courseName, hit.context]
              .filter(Boolean)
              .join(" · ");

            return (
              <li key={hit.key} className="resultado">
                <span className="resultado__tipo">{KIND_LABEL[hit.kind]}</span>

                <span className="resultado__cuerpo">
                  <span className="resultado__nombre">
                    {hit.kind === "course" && courseId !== null ? (
                      <button
                        type="button"
                        className="enlace"
                        onClick={() =>
                          go({ name: "course", courseId, courseName: hit.name })
                        }
                      >
                        {hit.name}
                      </button>
                    ) : hit.url ? (
                      <a href={hit.url} target="_blank" rel="noreferrer">
                        {hit.name}
                      </a>
                    ) : (
                      hit.name
                    )}
                  </span>

                  {context !== "" && (
                    <span className="resultado__contexto">{context}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* El calendario cierra la pantalla: el buscador se queda arriba y el pie
          con el QR queda debajo de la retícula, que es donde tiene que estar.
          Lee los mismos pendientes sin filtrar, así que no cuesta ninguna
          petición nueva. */}
      <div ref={calendarRef}>
        <MonthCalendar items={pending.data?.state === "ok" ? pending.data.value.items : []} />
      </div>
    </>
  );
}
