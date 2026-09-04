type Props = { fullname: string; onDisconnect: () => void };

export function SessionHeader({ fullname, onDisconnect }: Props) {
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
        <div className="acciones" style={{ marginTop: "var(--space-3)" }}>
          <button type="button" className="btn btn--secundario" onClick={onDisconnect}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
