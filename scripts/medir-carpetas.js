/*
 * Medición: ¿se puede ENUMERAR una carpeta de Drive con la sesión del
 * navegador, sin OAuth y sin `client_id`?
 *
 * Es la mitad que decide la Fase 3. La descarga por sesión ya está medida y
 * funciona (`context/fase-3.md` §8), pero los enlaces de los cursos son
 * carpetas, no archivos: sin enumerar no hay nada que bajar.
 *
 * NO ES CÓDIGO DEL PRODUCTO. No se compila y no entra en `dist/`.
 *
 * ---------------------------------------------------------------------------
 * DÓNDE SE CORRE — y por qué NO en el service worker
 *
 * Esta sonda va en la consola de una PESTAÑA ABIERTA EN drive.google.com, no
 * en la del service worker. El motivo importa y conviene no olvidarlo:
 *
 *   Un `fetch` con `credentials: "include"` desde el service worker hacia
 *   drive.google.com es CROSS-ORIGIN. Sin `host_permissions` para ese origen,
 *   CORS bloquea la LECTURA de la respuesta, y el síntoma —una excepción de
 *   red— se parece demasiado a "Google lo rechazó", que es una conclusión
 *   distinta y equivocada.
 *
 * Desde una pestaña de drive.google.com la petición es del mismo origen: las
 * cookies van solas, no hace falta ningún permiso y no hay que tocar el
 * manifest ni compilar nada. Si la vía se confirma, en producción habrá que
 * añadir `https://drive.google.com/*` a `host_permissions`; eso es una
 * decisión conocida, no una incógnita, y por eso no bloquea la medición.
 *
 *   1. Abre una pestaña en https://drive.google.com con la cuenta institucional.
 *   2. F12 → Consola.
 *   3. Pega este archivo entero y pulsa Intro.
 *   4. Corre:  await medirCarpeta("<ID DE CARPETA>")
 *
 * QUÉ CONTESTA
 *
 *   1. Si el HTML trae los ids y los nombres de lo que hay dentro
 *   2. Con qué forma vienen, y en qué estructura embebida
 *   3. Si hay una ruta más estable que parsear el HTML de la página completa
 *   4. Qué pasa con las subcarpetas
 *
 * Imprime un informe y devuelve el objeto entero, con muestras de HTML
 * alrededor de cada hallazgo para poder escribir el parser de verdad después.
 */

globalThis.medirCarpeta = async function medirCarpeta(carpetaId) {
  if (!carpetaId) {
    console.log('Falta el id. Ejemplo: await medirCarpeta("1AbC...")');
    return null;
  }

  /*
   * Dos rutas candidatas, en orden de estabilidad esperada.
   *
   * `embeddedfolderview` es la vista que Drive sirve para incrustar una
   * carpeta en otra página. Devuelve un HTML mucho más pequeño y plano que la
   * aplicación completa, pensado para que lo lea otra página: si funciona, es
   * bastante más estable que raspar la interfaz de Drive, que es una
   * aplicación entera y cambia sin avisar.
   *
   * NO VERIFICADO contra una carpeta privada con sesión. Es justo lo que esta
   * sonda viene a averiguar.
   */
  const RUTAS = [
    {
      nombre: "embeddedfolderview (vista para incrustar)",
      url: `https://drive.google.com/embeddedfolderview?id=${carpetaId}#list`,
      porque: "HTML plano y pequeño, pensado para ser leído por otra página",
    },
    {
      nombre: "página completa de la carpeta",
      url: `https://drive.google.com/drive/folders/${carpetaId}`,
      porque: "la interfaz de Drive; los datos van en blobs JS embebidos",
    },
  ];

  /** Los ids de Drive son cadenas largas sin puntuación. Sirve para contar
   *  cuántos aparecen antes de saber cómo están estructurados. */
  const ID_SUELTO = /[0-9A-Za-z_-]{25,45}/g;

  /* Formas conocidas de embeber datos en una página de Google. Ninguna está
   * confirmada para esta página hoy: la sonda dice cuáles aparecen. */
  const PATRONES = [
    { nombre: "AF_initDataCallback", regex: /AF_initDataCallback\(/g },
    { nombre: "_DRIVE_ivd", regex: /_DRIVE_ivd/g },
    { nombre: "flip-entry (filas de embeddedfolderview)", regex: /flip-entry/g },
    { nombre: 'data-id="..."', regex: /data-id="/g },
    { nombre: "ds:N (bloques de datos)", regex: /'ds:\d+'/g },
    { nombre: "mimeType de carpeta", regex: /application\/vnd\.google-apps\.folder/g },
    { nombre: "mimeType de documento nativo", regex: /application\/vnd\.google-apps\.(document|spreadsheet|presentation)/g },
  ];

  /** Un trozo de HTML alrededor de la primera aparición, para poder escribir
   *  el parser mirando la forma real y no de memoria. */
  function muestra(html, indice, ancho = 400) {
    const desde = Math.max(0, indice - ancho / 4);
    return html.slice(desde, desde + ancho).replace(/\s+/g, " ");
  }

  async function sondear(ruta) {
    let respuesta;
    try {
      respuesta = await fetch(ruta.url, { credentials: "include" });
    } catch (causa) {
      return { ...ruta, fallo: `no se pudo pedir: ${String(causa)}` };
    }

    const html = await respuesta.text();
    const informe = {
      ...ruta,
      estado: respuesta.status,
      tipo: respuesta.headers.get("Content-Type"),
      bytes: html.length,
      // Si redirigió al login, la página no es la carpeta.
      pideLogin: /accounts\.google\.com\/(v3\/)?signin|ServiceLogin/.test(html),
      patrones: {},
      muestras: {},
    };

    for (const patron of PATRONES) {
      const encontrados = html.match(patron.regex);
      if (encontrados === null) continue;
      informe.patrones[patron.nombre] = encontrados.length;
      const donde = html.search(patron.regex);
      if (donde >= 0) informe.muestras[patron.nombre] = muestra(html, donde);
    }

    // ¿Aparece algún id que no sea el de la propia carpeta? Esa es la
    // pregunta 1, y se contesta sin depender de ninguna estructura.
    const ids = [...new Set(html.match(ID_SUELTO) ?? [])].filter(
      (id) => id !== carpetaId && /[0-9]/.test(id) && /[A-Za-z]/.test(id),
    );
    informe.idsCandidatos = ids.length;
    informe.idsMuestra = ids.slice(0, 8);

    // Y los nombres: si el HTML trae extensiones de archivo, trae nombres.
    const nombres = [...new Set(html.match(/[\w \-.()]{3,80}\.(pdf|pptx?|docx?|xlsx?|zip|sql|csv|txt|jpg|png|mp4)/gi) ?? [])];
    informe.nombresCandidatos = nombres.length;
    informe.nombresMuestra = nombres.slice(0, 8);

    // Guardado aparte para poder inspeccionarlo a mano sin volver a pedirlo.
    informe.html = html;
    return informe;
  }

  console.log(`Midiendo la carpeta ${carpetaId}\n`);
  const resultados = [];

  for (const ruta of RUTAS) {
    console.log(`▸ ${ruta.nombre}\n  ${ruta.porque}`);
    const informe = await sondear(ruta);
    resultados.push(informe);

    if (informe.fallo) {
      console.log("  ✗", informe.fallo);
    } else {
      console.log("  ", {
        estado: informe.estado,
        bytes: informe.bytes,
        pideLogin: informe.pideLogin,
        ids: informe.idsCandidatos,
        nombres: informe.nombresCandidatos,
      });
      if (informe.nombresMuestra.length > 0) {
        console.log("   nombres:", informe.nombresMuestra);
      }
      if (Object.keys(informe.patrones).length > 0) {
        console.log("   estructuras:", informe.patrones);
      }
    }
    console.log("");
  }

  // --- Veredicto ----------------------------------------------------------
  const util = resultados.find(
    (informe) => !informe.fallo && !informe.pideLogin && informe.nombresCandidatos > 0,
  );

  console.log("=== Veredicto ===");
  if (util === undefined) {
    console.log(
      "NINGUNA ruta devolvió nombres de archivo.\n" +
        "Puede ser que no haya sesión en esta pestaña, que la carpeta no sea\n" +
        "accesible con esta cuenta, o que Drive ya no embeba el contenido.\n" +
        "Mira `resultado[0].html` y `resultado[1].html` a mano antes de concluir.",
    );
  } else {
    console.log(
      `SÍ se puede enumerar. La ruta que funciona: ${util.nombre}\n` +
        `  ${util.nombresCandidatos} nombres y ${util.idsCandidatos} ids candidatos\n` +
        "  Estructuras encontradas:",
      util.patrones,
    );
    console.log(
      "\nPega las muestras para escribir el parser:\n" +
        "  copy(JSON.stringify(resultado.map(r => ({ruta: r.nombre, patrones: r.patrones, muestras: r.muestras, nombres: r.nombresMuestra, ids: r.idsMuestra})), null, 2))",
    );
  }

  console.log(
    "\n=== Subcarpetas ===\n" +
      "Si arriba aparece `mimeType de carpeta` con cuenta > 0, la carpeta tiene\n" +
      "subcarpetas y hay que recorrerlas. Coge un id de `idsMuestra` que\n" +
      "corresponda a una subcarpeta y vuelve a correr:\n" +
      "  await medirCarpeta(\"<ID DE LA SUBCARPETA>\")\n" +
      "Si el resultado es igual de bueno, la enumeración recursiva funciona.",
  );

  console.log(
    "\n=== Documentos nativos ===\n" +
      "Los Docs, Sheets y Slides NO se bajan: se exportan. Eso se mide con la\n" +
      "otra sonda, `scripts/medir-drive.js`, en la consola del service worker.",
  );

  return resultados;
};


/*
 * Deja el HTML listo para guardarlo como fixture del parser.
 *
 * La medición se hizo con la cuenta personal y el HTML de Drive lleva el
 * correo de quien mira la carpeta, además de nombres y fotos de perfil. Un
 * fixture con eso dentro acaba en el repositorio, y de ahí no se saca.
 *
 *   const limpio = anonimizarHtml(resultado[0].html)
 *   copy(limpio)          // al portapapeles, listo para pegar
 */
const SUSTITUTO = "estudiante@ejemplo.edu";

globalThis.anonimizarHtml = function anonimizarHtml(html) {
  if (typeof html !== "string") {
    console.log("Pásale el `html` de un resultado: anonimizarHtml(resultado[0].html)");
    return "";
  }

  const limpio = html
    // Correos, que es lo que más importa.
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, SUSTITUTO)
    // Fotos de perfil y avatares de Google.
    .replace(/https:\/\/lh\d+\.googleusercontent\.com\/[^"' <)]+/g, "https://ejemplo/avatar")
    // Los identificadores de `id="entry-<ID>"` van primero y aparte, porque el
    // patrón genérico incluye el guion y se llevaría por delante el prefijo
    // `entry-` junto con el identificador. Pasó en la primera captura: el
    // fixture salió con `id="ID39_NJqK"` en vez de `id="entry-ID33_NJqK"`.
    .replace(
      /id="entry-([0-9A-Za-z_-]{20,45})"/g,
      (_, id) => `id="entry-ID${id.length}_${id.slice(-4)}"`,
    )
    // El resto de identificadores: no son secretos, pero tampoco hacen falta
    // en un fixture.
    .replace(/[0-9A-Za-z_-]{25,45}/g, (id) => `ID${id.length}_${id.slice(-4)}`);

  // Un recuento de lo que se sustituyó, que es información de verdad. No hay
  // comprobación de "¿queda algún correo?" porque usaría el mismo patrón que
  // la sustitución y nunca podría fallar: un chequeo que no puede disparar da
  // falsa seguridad, que es peor que no tenerlo.
  const correos = (html.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? []).length;
  const avatares = (html.match(/lh\d+\.googleusercontent\.com/g) ?? []).length;

  console.log(
    `Sustituidos: ${correos} correos, ${avatares} avatares e identificadores.`,
  );
  console.log(
    [
      "REVÍSALO ANTES DE PEGARLO en el repositorio.",
      "Esto quita lo que sabe buscar: correos, avatares e identificadores.",
      "NO detecta nombres de personas, que en Drive aparecen en",
      "`flip-entry-last-writer` (quién subió el archivo).",
    ].join(" "),
  );

  return limpio;
};

console.log(
  [
    'Sonda de carpetas cargada.',
    'Corre:  const resultado = await medirCarpeta("<ID>")',
    'Y para guardar un fixture:  copy(anonimizarHtml(resultado[0].html))',
  ].join("\n"),
);
