import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

// Los permisos se declaran POR FASE, no de golpe. Un permiso pedido antes de
// que exista la función que lo usa es una advertencia de instalación que no se
// puede justificar, y los revisores de tienda preguntan.
//
//   Fase 0  storage, webRequest, host platform.ecala.net
//   Fase 2  + downloads                       ← concedido: la cola ya existe
//   Fase 3  + host drive.google.com           ← concedido: enumerar carpetas
//           + host drive.usercontent.google.com  ← leer la confirmación de
//             antivirus que Drive devuelve en vez de los archivos grandes
//
// La Fase 3 NO pide `identity` ni `googleapis.com`: no hay OAuth. Enumerar y
// descargar funcionan con la sesión de Google del navegador (`fase-3.md` §8).
// El único permiso que hace falta es leer drive.google.com desde el service
// worker, porque ese `fetch` es cross-origin y sin él CORS bloquea la lectura.
// Bajar los archivos no necesita permiso: `chrome.downloads` no lo exige.
// `defineManifest` acepta un objeto o una función de `(env) => objeto`
// (`ManifestV3Define`, en los tipos de `@crxjs/vite-plugin`). Aquí hace falta
// la función: Chrome y Firefox necesitan una forma **distinta** de
// `background`, y no hay forma de que un solo objeto estático sirva para las
// dos a la vez. Ver el comentario junto a `background` más abajo.
export default defineManifest((env) => ({
  manifest_version: 3,
  name: "IsilHelper",
  version: pkg.version,
  description: pkg.description,
  minimum_chrome_version: "116",

  // Chrome lee `service_worker`; Firefox, `scripts`. No es una preferencia:
  // Firefox tiene el service worker de MV3 detrás de un flag apagado por
  // defecto y no lo activa para el usuario final, así que sin `scripts` la
  // instalación falla entera, antes de correr una sola línea de `src/`, con
  // "background.service_worker is currently disabled. Add
  // background.scripts." — comprobado con Firefox 153 de verdad el 7 de
  // septiembre de 2026.
  //
  // Escribir los dos campos a la vez en un solo manifest **no funciona**: se
  // probó primero así, y aunque `defineManifest` deja pasar el objeto (con
  // un cast, porque su tipo no admite `service_worker` y `scripts` juntos),
  // el plugin lo descarta en el build de todas formas. `renderCrxManifest`,
  // en el plugin `crx:background-loader-file`
  // (`@crxjs/vite-plugin/dist/index.mjs`), **reemplaza `manifest.background`
  // entero** por una forma o la otra según la opción `browser` que recibe
  // `crx()` en `vite.config.ts`, nunca por las dos juntas; y para el caso
  // `"firefox"` lee el archivo de entrada de `manifest.background.scripts[0]`
  // —no de `service_worker`—, así que sin este campo el build de Firefox
  // directamente no encuentra qué empaquetar.
  //
  // La solución real son dos builds. `vite.config.ts` decide `browser` según
  // el modo de Vite (`chrome` por defecto, `firefox` con
  // `pnpm build:firefox`, que pasa `--mode firefox`) y aquí se refleja esa
  // misma decisión para que la forma de `background` y la carpeta de salida
  // vayan siempre de la mano: nunca un manifest de Chrome con salida de
  // Firefox, ni al revés.
  background:
    env.mode === "firefox"
      ? { scripts: ["src/background/index.ts"], type: "module" }
      : { service_worker: "src/background/index.ts", type: "module" },

  // Requisito de Firefox para cualquier manifest V3, no cosmético:
  // `web-ext lint` lo marca como ERROR (`ADDON_ID_REQUIRED`) sin él.
  //
  // El id NO necesita resolver a nada real —es un identificador, no una
  // dirección—, pero antes de escribir uno con forma de correo en un dominio
  // se comprobó que el dominio existiera. `suki.com.pe` **no existe**:
  // consultado el WHOIS oficial de NIC.PE el 7 de septiembre de 2026,
  // devuelve "Domain Status: No Object Found". Usar un id con esa forma
  // habría reclamado implícitamente un dominio que nadie tiene registrado, y
  // el día que alguien lo registre le llegarían correos de quien confunda el
  // id de la extensión con una dirección real. Se usa en su lugar un UUID,
  // el otro formato que Firefox acepta explícitamente para este campo: no
  // tiene forma de dominio, así que no puede insinuar que resuelve a nada.
  browser_specific_settings: {
    gecko: {
      id: "{16b473de-2512-4882-b610-319e856625d4}",
      // "none": no hay servidor propio que recoja nada de nadie
      // (`PRIVACY.md`). Firefox exige declarar esto para cualquier
      // extensión nueva (`MISSING_DATA_COLLECTION_PERMISSIONS` en
      // `web-ext lint`).
      data_collection_permissions: { required: ["none"] },
    },
  },

  // Sin default_popup a propósito: la interfaz vive en una pestaña, no en un
  // globo de 400 px. Sin popup, action.onClicked sí dispara.
  icons: {
    16: "iconos/icono-16.png",
    32: "iconos/icono-32.png",
    48: "iconos/icono-48.png",
    128: "iconos/icono-128.png",
  },

  action: {
    default_title: "Abrir IsilHelper",
    default_icon: {
      16: "iconos/icono-16.png",
      32: "iconos/icono-32.png",
    },
  },

  permissions: ["storage", "webRequest", "downloads"],
  host_permissions: [
    "https://platform.ecala.net/*",
    "https://drive.google.com/*",
    "https://drive.usercontent.google.com/*",
  ],
}));
