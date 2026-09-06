import { describe, expect, it } from "vitest";
import { confirmationUrl, isConfirmationPage } from "./drive-confirm";

/**
 * La página que Drive devuelve en vez del archivo cuando pesa demasiado para
 * analizarlo. Reproduce la forma real: llega con estado 200 y `text/html`, y
 * lo que hay que reenviar es el formulario entero, no solo el `confirm`.
 */
const CONFIRMATION_HTML = `<!DOCTYPE html><html><head>
<title>Google Drive - Virus scan warning</title></head><body>
<div class="uc-main">
  <p>Google Drive no puede analizar este archivo en busca de virus.</p>
  <p>30628-S01-PRESENTACION.pptx (24 MB) supera el tamaño máximo que Google
     puede analizar. ¿Quieres descargarlo de todos modos?</p>
  <form id="download-form" action="https://drive.usercontent.google.com/download" method="get">
    <input type="hidden" name="id" value="1AbCdEf_123">
    <input type="hidden" name="export" value="download">
    <input type="hidden" name="confirm" value="t">
    <input type="hidden" name="uuid" value="9f8e7d6c-1234">
    <input type="submit" value="Descargar de todos modos">
  </form>
</div></body></html>`;

/** La pantalla de acceso, que NO es una confirmación: reintentarla daría lo
 *  mismo una y otra vez. */
const LOGIN_HTML = `<html><head><title>Sign in - Google Accounts</title></head>
<body><form action="https://accounts.google.com/v3/signin/identifier">
<input type="hidden" name="continue" value="https://drive.google.com/">
</form></body></html>`;

describe("isConfirmationPage", () => {
  it("reconoce la advertencia de antivirus", () => {
    expect(isConfirmationPage(CONFIRMATION_HTML)).toBe(true);
  });

  it("no confunde la pantalla de acceso con una confirmación", () => {
    expect(isConfirmationPage(LOGIN_HTML)).toBe(false);
  });

  it("no ve confirmaciones donde no las hay", () => {
    expect(isConfirmationPage("<html><body>cualquier cosa</body></html>")).toBe(false);
  });
});

describe("confirmationUrl", () => {
  it("compone la URL con todos los campos del formulario, no solo confirm", () => {
    const url = confirmationUrl(CONFIRMATION_HTML);
    expect(url).not.toBeNull();

    const parsed = new URL(url ?? "");
    expect(parsed.origin + parsed.pathname).toBe(
      "https://drive.usercontent.google.com/download",
    );
    expect(parsed.searchParams.get("confirm")).toBe("t");
    expect(parsed.searchParams.get("id")).toBe("1AbCdEf_123");
    expect(parsed.searchParams.get("export")).toBe("download");
    // El uuid es de la sesión de descarga: sin él, Google vuelve a preguntar.
    expect(parsed.searchParams.get("uuid")).toBe("9f8e7d6c-1234");
  });

  it("decodifica las entidades de la acción y de los valores", () => {
    const html = CONFIRMATION_HTML.replace(
      'action="https://drive.usercontent.google.com/download"',
      'action="https://drive.usercontent.google.com/download?a=1&amp;b=2"',
    );
    const url = confirmationUrl(html);
    expect(new URL(url ?? "").searchParams.get("b")).toBe("2");
  });

  it("devuelve null en la pantalla de acceso, para no reintentar en bucle", () => {
    expect(confirmationUrl(LOGIN_HTML)).toBeNull();
  });

  it("devuelve null si el formulario no trae confirm", () => {
    // Sin `confirm` no hay nada que confirmar y repetir daría la misma página.
    const sinConfirm = CONFIRMATION_HTML.replace(
      '<input type="hidden" name="confirm" value="t">',
      "",
    );
    expect(confirmationUrl(sinConfirm)).toBeNull();
  });

  it("devuelve null cuando no hay formulario", () => {
    expect(
      confirmationUrl("<html><body>Virus scan warning sin formulario</body></html>"),
    ).toBeNull();
  });

  it("usa la URL de respaldo cuando el formulario no declara action", () => {
    const sinAction = CONFIRMATION_HTML.replace(
      ' action="https://drive.usercontent.google.com/download"',
      "",
    );
    const url = confirmationUrl(sinAction, "https://drive.usercontent.google.com/download");
    expect(new URL(url ?? "").searchParams.get("confirm")).toBe("t");
  });
});
