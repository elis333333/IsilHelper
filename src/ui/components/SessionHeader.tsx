type Props = {
  fullname: string;
  email: string | null;
  department: string | null;
  onDisconnect: () => void;
};

/** Cabecera con la sesión y el poco perfil que la plataforma da.
 *
 *  No hay pantalla de perfil ni carnet: `core_user_get_users_by_field` no
 *  devuelve código de alumno, ni carrera, ni ciclo (`domain.md` §4). Lo único
 *  que el estudiante no sabe de memoria es su correo institucional y la unidad
 *  a la que figura adscrito, y eso cabe en dos líneas. Lo que no viene, no se
 *  enseña: ni un guion, ni un hueco con etiqueta. */
export function SessionHeader({ fullname, email, department, onDisconnect }: Props) {
  const details = [email, department].filter((value): value is string => value !== null);

  return (
    <header className="cabecera">
      <div>
        <p className="etiqueta" style={{ color: "var(--color-text-subtle)" }}>
          Tu información académica
        </p>
        <h1 className="titulo" style={{ margin: "var(--space-2) 0 0" }}>
          IsilHelper
        </h1>
      </div>

      <div>
        <p className="estado estado--exito">
          <span aria-hidden="true">✓</span>
          <span>Conectado como {fullname}</span>
        </p>

        {details.length > 0 && (
          <p
            className="parrafo parrafo--apagado"
            style={{ marginTop: "var(--space-2)", marginBottom: 0 }}
          >
            {details.join(" · ")}
          </p>
        )}

        <div className="acciones" style={{ marginTop: "var(--space-3)" }}>
          <button type="button" className="btn btn--secundario" onClick={onDisconnect}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
