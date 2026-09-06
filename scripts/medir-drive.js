/*
 * Medición: ¿se puede bajar de Google Drive con la sesión del navegador,
 * sin OAuth y sin `client_id`?
 *
 * Es la pregunta que decide la Fase 3 entera (`context/fase-3.md` §8). Si la
 * respuesta es sí, el muro del OAuth cae para los archivos con enlace directo
 * y el permiso de Google quedaría —como mucho— para enumerar carpetas.
 *
 * NO ES CÓDIGO DEL PRODUCTO. No se compila, no entra en `dist/` y no lo importa
 * nadie: se pega a mano en la consola del service worker. Por eso vive en
 * `scripts/` y no en `src/`.
 *
 * ---------------------------------------------------------------------------
 * CÓMO SE CORRE
 *
 *   1. Inicia sesión en Google con la cuenta institucional, en el mismo perfil
 *      de Brave donde está cargada la extensión.
 *   2. chrome://extensions → IsilHelper → "service worker" (abre su consola).
 *   3. Pega este archivo entero en la consola y pulsa Intro.
 *   4. Corre la medición con los tres identificadores:
 *
 *        await medirDrive({ archivo: "<ID>", documento: "<ID>",
 *                           hojaCalculo: "<ID>", presentacion: "<ID>" })
 *
 *      Todos son opcionales: con solo `archivo` ya contesta la pregunta
 *      principal.
 *
 * DE DÓNDE SALEN LOS IDENTIFICADORES
 *
 *   archivo       drive.google.com/file/d/<ID>/view
 *   documento     docs.google.com/document/d/<ID>/edit
 *   hojaCalculo   docs.google.com/spreadsheets/d/<ID>/edit
 *   presentacion  docs.google.com/presentation/d/<ID>/edit
 *
 * La enumeración de CARPETAS se mide con la otra sonda,
 * `scripts/medir-carpetas.js`, desde la consola de una pestaña de Drive.
 *
 * El índice que exporta la extensión (metadata.json, campo "drive") los tiene
 * todos. Ninguno de los tres es un secreto y pueden pegarse en la bitácora;
 * las cookies de Google y el contenido de .env, no.
 *
 * QUÉ SE MIRA
 *
 *   complete + mime binario + bytes parecidos al tamaño real  → FUNCIONA
 *   complete + text/html + unos pocos KB                      → bajó una página
 *   interrupted + SERVER_FORBIDDEN                            → Google lo rechazó
 *
 * Ojo con el caso de en medio: para archivos grandes Drive intercala una
 * página de confirmación de antivirus. Si el HTML que baja lleva un formulario
 * con `confirm=`, la respuesta no es "no funciona" sino "funciona con un paso
 * más". Por eso los archivos NO se borran: hay que abrirlos y mirarlos.
 */

globalThis.medirDrive = async function medirDrive(
  { archivo, documento, hojaCalculo, presentacion, carpeta } = {},
) {
  const CARPETA = "IsilHelper/_medicion";
  const PAUSA_MS = 1500;

  const pruebas = [];

  if (archivo) {
    pruebas.push({
      nombre: "archivo · usercontent (la ruta que usa el botón de Drive)",
      url: `https://drive.usercontent.google.com/download?id=${archivo}&export=download`,
      destino: `${CARPETA}/archivo-usercontent.bin`,
      espero: "un binario: application/pdf y el peso real del archivo",
    });
    pruebas.push({
      nombre: "archivo · uc (la ruta antigua, redirige)",
      url: `https://drive.google.com/uc?export=download&id=${archivo}`,
      destino: `${CARPETA}/archivo-uc.bin`,
      espero: "lo mismo que la anterior, o una redirección que acabe igual",
    });
  }

  // Los documentos nativos de Google no son binarios: no se bajan, se
  // exportan, y cada tipo tiene su propia ruta. Un `usercontent/download`
  // sobre uno de ellos no devuelve el documento.
  if (documento) {
    pruebas.push({
      nombre: "documento nativo · Docs a PDF",
      url: `https://docs.google.com/document/d/${documento}/export?format=pdf`,
      destino: `${CARPETA}/documento.pdf`,
      espero: "application/pdf. Es la ruta de exportación por sesión",
    });
    pruebas.push({
      nombre: "documento nativo · Docs a DOCX",
      url: `https://docs.google.com/document/d/${documento}/export?format=docx`,
      destino: `${CARPETA}/documento.docx`,
      espero: "un DOCX. Interesa saber si hay más de un formato disponible",
    });
    // La misma prueba por la ruta genérica: si funciona, no hace falta saber
    // de qué tipo es el documento antes de exportarlo, que simplifica mucho.
    pruebas.push({
      nombre: "documento nativo · ruta genérica de Drive",
      url: `https://drive.google.com/uc?export=download&id=${documento}`,
      destino: `${CARPETA}/documento-generico.bin`,
      espero:
        "probablemente HTML: los nativos no se bajan por esta ruta. Si acierta, " +
        "es que Drive redirige solo a la exportación",
    });
  }

  if (hojaCalculo) {
    pruebas.push({
      nombre: "hoja de cálculo nativa · Sheets a XLSX",
      url: `https://docs.google.com/spreadsheets/d/${hojaCalculo}/export?format=xlsx`,
      destino: `${CARPETA}/hoja.xlsx`,
      espero: "un XLSX",
    });
  }

  if (presentacion) {
    pruebas.push({
      nombre: "presentación nativa · Slides a PDF",
      url: `https://docs.google.com/presentation/d/${presentacion}/export/pdf`,
      destino: `${CARPETA}/presentacion.pdf`,
      espero: "application/pdf. Ojo: la ruta de Slides no lleva `?format=`",
    });
  }

  if (carpeta) {
    // La enumeración no se puede medir desde aquí: un fetch a
    // drive.google.com desde el service worker es cross-origin, y sin
    // host_permissions para ese origen CORS bloquea la lectura.
    console.log(
      [
        "La enumeración de carpetas NO se mide aquí.",
        "Un fetch a drive.google.com desde el service worker es cross-origin",
        "y CORS bloquea la lectura sin host_permissions para ese origen.",
        "Usa scripts/medir-carpetas.js en la consola de una pestaña de",
        "drive.google.com, donde la petición es del mismo origen.",
      ].join(" "),
    );
  }

  if (pruebas.length === 0) {
    console.log("Hace falta al menos un identificador. Ver la cabecera de este archivo.");
    return [];
  }

  const espera = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /** Lanza una descarga y espera a que termine, sin tocar la cola del producto. */
  async function correr(prueba) {
    let id;
    try {
      id = await chrome.downloads.download({
        url: prueba.url,
        filename: prueba.destino,
        conflictAction: "overwrite",
        saveAs: false,
      });
    } catch (causa) {
      return { ...prueba, resultado: "el navegador no aceptó la descarga", detalle: String(causa) };
    }

    // Sondeo hasta que deje de estar en curso, con tope: un archivo grande
    // tarda, pero algo colgado no puede bloquear la medición entera.
    for (let intento = 0; intento < 120; intento++) {
      const [descarga] = await chrome.downloads.search({ id });
      if (descarga === undefined) break;
      if (descarga.state !== "in_progress") {
        return {
          ...prueba,
          estado: descarga.state,
          mime: descarga.mime,
          bytes: descarga.bytesReceived,
          error: descarga.error ?? null,
          archivo: descarga.filename,
        };
      }
      await espera(1000);
    }

    return { ...prueba, resultado: "no terminó en dos minutos" };
  }

  const salida = [];
  for (const prueba of pruebas) {
    console.log(`\n▸ ${prueba.nombre}\n  espero: ${prueba.espero}`);
    const resultado = await correr(prueba);
    salida.push(resultado);
    console.log("  ", {
      estado: resultado.estado,
      mime: resultado.mime,
      bytes: resultado.bytes,
      error: resultado.error,
    });
    await espera(PAUSA_MS);
  }

  console.log("\n=== Resumen ===");
  console.table(
    salida.map((fila) => ({
      prueba: fila.nombre,
      estado: fila.estado ?? fila.resultado,
      mime: fila.mime ?? "",
      bytes: fila.bytes ?? "",
      error: fila.error ?? "",
    })),
  );
  console.log(
    "\nLos archivos están en Descargas/IsilHelper/_medicion/ y NO se borran.\n" +
      "Ábrelos: si el PDF abre de verdad, la respuesta es que sí funciona.\n" +
      "Si pesa pocos KB y es HTML, ábrelo en un editor y busca `confirm=`.",
  );

  return salida;
};

console.log(
  'Sonda cargada. Corre:  await medirDrive({ archivo: "<ID>", documento: "<ID>" })',
);
