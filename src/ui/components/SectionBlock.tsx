import type { SectionView } from "../../lib/messages";
import { kindLabel, plural } from "../lib/format";
import { DownloadAction } from "./DownloadAction";
import { FileRow } from "./FileRow";

/** Una sección del curso con sus módulos. El estado de completado va con
 *  símbolo y texto, no solo con color. */

function statusMark(completed: boolean | null): { symbol: string; label: string } {
  if (completed === null) return { symbol: "–", label: "sin seguimiento" };
  return completed
    ? { symbol: "✓", label: "hecho" }
    : { symbol: "○", label: "pendiente" };
}

type Props = {
  section: SectionView;
  courseId: number;
  courseName: string;
};

export function SectionBlock({ section, courseId, courseName }: Props) {
  const files = section.modules.flatMap((module) => module.files);

  return (
    <section className="seccion">
      <div className="seccion__cabecera">
        <h3 className="subtitulo">{section.name}</h3>
        <DownloadAction
          files={files}
          courseId={courseId}
          courseName={courseName}
          sectionName={section.name}
          what="esta sección"
        />
      </div>

      {section.modules.length === 0 ? (
        <p className="parrafo parrafo--apagado">
          Esta sección no tiene material publicado.
        </p>
      ) : (
        <ul className="lista">
          {section.modules.map((module) => {
            const status = statusMark(module.completed);
            const kind = kindLabel(module.kind);
            // Con un solo archivo el botón va en la fila del módulo: abrir una
            // sublista para una línea sería ruido.
            const inline = module.files.length === 1;

            return (
              <li key={module.id}>
                <div className="modulo">
                  <span
                    className="modulo__estado"
                    style={{
                      color:
                        module.completed === true
                          ? "var(--color-success)"
                          : "var(--color-text-subtle)",
                    }}
                  >
                    <span aria-hidden="true">{status.symbol}</span> {status.label}
                  </span>

                  <span className="modulo__nombre">
                    {module.url ? (
                      <a href={module.url} target="_blank" rel="noreferrer">
                        {module.name}
                      </a>
                    ) : (
                      module.name
                    )}
                  </span>

                  <span className="modulo__meta">
                    {kind ?? ""}
                    {module.files.length > 1
                      ? ` · ${plural(module.files.length, "archivo", "archivos")}`
                      : ""}
                    {/* Los enlaces a Drive se dicen, para que quede claro por
                        qué ese módulo no tiene botón de descarga. */}
                    {module.files.length === 0 && module.externalCount > 0
                      ? " · enlace externo"
                      : ""}
                  </span>

                  {module.files.length > 0 && (
                    <DownloadAction
                      files={module.files}
                      courseId={courseId}
                      courseName={courseName}
                      sectionName={section.name}
                    />
                  )}
                </div>

                {!inline && module.files.length > 0 && (
                  <ul className="lista archivos">
                    {module.files.map((file) => (
                      <FileRow
                        key={file.path}
                        file={file}
                        courseId={courseId}
                        courseName={courseName}
                        sectionName={section.name}
                      />
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
