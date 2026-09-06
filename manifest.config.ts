import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

// Los permisos se declaran POR FASE, no de golpe. Un permiso pedido antes de
// que exista la función que lo usa es una advertencia de instalación que no se
// puede justificar, y los revisores de tienda preguntan.
//
//   Fase 0  storage, webRequest, host platform.ecala.net
//   Fase 2  + downloads                       ← concedido: la cola ya existe
//   Fase 3  + host drive.google.com           ← concedido: enumerar carpetas
//
// La Fase 3 NO pide `identity` ni `googleapis.com`: no hay OAuth. Enumerar y
// descargar funcionan con la sesión de Google del navegador (`fase-3.md` §8).
// El único permiso que hace falta es leer drive.google.com desde el service
// worker, porque ese `fetch` es cross-origin y sin él CORS bloquea la lectura.
// Bajar los archivos no necesita permiso: `chrome.downloads` no lo exige.
export default defineManifest({
  manifest_version: 3,
  name: "IsilHelper",
  version: pkg.version,
  description: pkg.description,
  minimum_chrome_version: "116",

  background: {
    service_worker: "src/background/index.ts",
    type: "module",
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
  host_permissions: ["https://platform.ecala.net/*", "https://drive.google.com/*"],
});
