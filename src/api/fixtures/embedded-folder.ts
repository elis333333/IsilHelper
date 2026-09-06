/**
 * Fixtures del HTML de `embeddedfolderview`.
 *
 * `REAL_HTML` es **capturado**: sale de una carpeta de «Compartidos conmigo»
 * abierta con la cuenta institucional el 6 de septiembre de 2026, que es el
 * caso que de verdad importa —así es como el instituto comparte el material—.
 * Está anonimizado con `anonimizarHtml()` de `scripts/medir-carpetas.js`.
 *
 * Los demás son **sintéticos**, y están solo para los casos que la captura no
 * contenía: subcarpetas, documentos nativos, varias sesiones de Google
 * abiertas, la pantalla de acceso y un HTML que cambió de forma. Se distinguen
 * por el nombre a propósito: un fixture que parece real sin serlo es peor que
 * no tener ninguno.
 *
 * Cuando se capture material real con esos casos, sustituyen al sintético.
 */

/**
 * Carpeta real, un PDF.
 *
 * **Ojo con el `id` del div: le falta el prefijo `entry-`.** No es así en el
 * HTML de Drive; se lo comió el anonimizador, cuyo patrón de identificadores
 * incluía el guion y se llevó por delante `entry-` junto con el id. Se
 * conserva tal cual vino en vez de «arreglarlo» a mano, por dos razones: es lo
 * que se capturó, y **prueba que el parser no depende de ese atributo**, que
 * es justamente el motivo por el que se dejó de usar como ancla. La sonda ya
 * está corregida para las capturas siguientes.
 */
export const REAL_HTML = `<div class="flip-entries"><div class="flip-entry" id="ID39_NJqK" tabindex="0" role="link"><div class="flip-entry-info"><a href="https://drive.google.com/file/d/ID33_NJqK/view?usp=drive_web" target="_blank"><div class="flip-entry-visual"><div class="flip-entry-visual-card"><div class="flip-entry-thumb"><img src="https://ejemplo/avatar" alt="PDF"/></div></div></div><div class="flip-entry-list-icon"><img src="https://drive-thirdparty.googleusercontent.com/16/type/application/pdf" alt=""/></div><div class="flip-entry-title">30628-SILABO.pdf</div></a></div><div class="flip-entry-last-modified"><div>17 ago</div><div class="flip-entry-last-writer">Contenidos Educativos</div></div></div></div>`;

/** La misma estructura real, con el `<head>` que la captura no incluyó. El
 *  `<title>` es el nombre de la carpeta y sirve para el directorio destino. */
export const REAL_HTML_WITH_TITLE = `<html><head><title>T01 - Introducci&oacute;n</title></head><body>${REAL_HTML}</body></html>`;

/**
 * SINTÉTICO. Los tipos que la captura no traía: subcarpeta, documento nativo y
 * presentación. Copia la estructura real, con `entry-` como sí lo emite Drive.
 */
export const SYNTHETIC_TYPES_HTML = `
<div class="flip-entries">
  <div class="flip-entry" id="entry-2BcDeFgHiJkLmNoPqRsTuVwXyZ02" tabindex="0" role="link">
    <div class="flip-entry-info">
      <a href="https://drive.google.com/drive/folders/2BcDeFgHiJkLmNoPqRsTuVwXyZ02" target="_blank">
        <div class="flip-entry-list-icon"><img src="https://drive-thirdparty.googleusercontent.com/16/type/application/vnd.google-apps.folder" alt=""/></div>
        <div class="flip-entry-title">T02 - Modelo entidad relaci&#243;n</div>
      </a>
    </div>
  </div>
  <div class="flip-entry" id="entry-3CdEfGhIjKlMnOpQrStUvWxYzA03" tabindex="0" role="link">
    <div class="flip-entry-info">
      <a href="https://docs.google.com/document/d/3CdEfGhIjKlMnOpQrStUvWxYzA03/edit" target="_blank">
        <div class="flip-entry-title">Gu&iacute;a &amp; taller</div>
      </a>
    </div>
  </div>
  <div class="flip-entry" id="entry-4DeFgHiJkLmNoPqRsTuVwXyZaB04" tabindex="0" role="link">
    <div class="flip-entry-info">
      <a href="https://docs.google.com/presentation/d/4DeFgHiJkLmNoPqRsTuVwXyZaB04/edit" target="_blank">
        <div class="flip-entry-title">Sesi&#243;n 1.pptx</div>
      </a>
    </div>
  </div>
</div>`;

/** SINTÉTICO. El prefijo de cuenta que aparece cuando el navegador tiene
 *  varias sesiones de Google abiertas: el caso de un estudiante con cuenta
 *  personal y cuenta del instituto. */
export const MULTI_ACCOUNT_HTML = `
<div class="flip-entries">
  <div class="flip-entry" id="entry-5EfGhIjKlMnOpQrStUvWxYzaBc05">
    <a href="https://drive.google.com/drive/u/2/folders/5EfGhIjKlMnOpQrStUvWxYzaBc05">
      <div class="flip-entry-title">Complementario</div>
    </a>
  </div>
  <div class="flip-entry" id="entry-6FgHiJkLmNoPqRsTuVwXyZaBcD06">
    <a href="https://drive.google.com/u/2/file/d/6FgHiJkLmNoPqRsTuVwXyZaBcD06/view">
      <div class="flip-entry-title">practica.pdf</div>
    </a>
  </div>
</div>`;

/** SINTÉTICO. Lo que Drive devuelve sin sesión. */
export const LOGIN_HTML = `
<html><head><title>Sign in - Google Accounts</title></head>
<body><form action="https://accounts.google.com/v3/signin/identifier"></form></body></html>`;

/** SINTÉTICO. Un HTML que llega bien pero ya no tiene la forma que el parser
 *  conoce: el día que Google cambie la página, esto es lo que se recibirá. */
export const CHANGED_HTML = `
<html><body><div class="drive-items">
  <span data-target="file-x1">30628-SILABO.pdf</span>
</div></body></html>`;
