import { REPO_URL } from "../../lib/constants";

/**
 * Pie de la aplicación: el apoyo económico, el repositorio y la firma.
 *
 * El apoyo se pide **una sola vez y abajo**, que es donde no estorba a lo que
 * el estudiante vino a hacer. Y se dice lo que es: un aporte voluntario a
 * quien mantiene esto, no un pago por usarlo. Sin esa frase, un código de pago
 * en una herramienta gratuita se lee como un peaje.
 */
export function Footer() {
  return (
    <footer className="pie">
      <section className="apoyo">
        <img
          className="apoyo__qr"
          src={chrome.runtime.getURL("apoyo/yape.png")}
          alt="Código QR de Yape para enviar un aporte"
          width={128}
          height={128}
        />

        <div>
          <p className="apoyo__titulo">Si te ahorró la tarde, invítame un café</p>
          <p className="parrafo parrafo--apagado" style={{ marginBottom: "var(--space-3)" }}>
            Escanea el código con Yape. Es un aporte voluntario a quien mantiene esto, no un
            pago por usarlo: IsilHelper es gratis y no deja de serlo si no lo haces.
          </p>
          <p className="parrafo" style={{ marginBottom: 0 }}>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              El código está abierto en GitHub
            </a>
          </p>
        </div>
      </section>

      {/* La firma de respaldo es el único vínculo obligatorio con la marca
          madre, y va aquí: la identidad de la cabecera es la del producto. */}
      <p className="firma">
        <img
          className="firma__logo"
          src={chrome.runtime.getURL("marca/suki-oscuro.png")}
          alt="Suki"
        />
        <span className="firma-labs">IsilHelper · un proyecto de Suki</span>
      </p>
    </footer>
  );
}
