/** Estado inicial: aún no hay permiso. Lo que más importa aquí es dejar claro
 *  que no se piden credenciales, porque es la duda razonable de cualquiera. */

type Props = { onConnect: () => void; connecting: boolean };

export function ConnectPanel({ onConnect, connecting }: Props) {
  return (
    <div className="tarjeta">
      <h2 className="subtitulo">Conecta tu cuenta</h2>
      <p className="parrafo">
        Uso la sesión que ya tienes abierta en la plataforma. No te pido usuario
        ni contraseña, y no vuelvo a pasar por el captcha ni por el código.
      </p>
      <p className="parrafo parrafo--apagado">
        Antes de empezar, entra en platform.ecala.net como lo haces siempre.
      </p>
      <div className="acciones">
        <button
          type="button"
          className="btn btn--principal"
          onClick={onConnect}
          disabled={connecting}
        >
          {connecting ? "Conectando" : "Conectar"}
        </button>
      </div>
    </div>
  );
}
