import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

// Los permisos se declaran POR FASE, no de golpe. Un permiso pedido antes de
// que exista la función que lo usa es una advertencia de instalación que no se
// puede justificar, y los revisores de tienda preguntan.
//
//   Fase 0  storage, webRequest, host platform.ecala.net
//   Fase 2  + downloads
//   Fase 3  + identity, host www.googleapis.com
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
  action: {
    default_title: "Abrir IsilHelper",
  },

  permissions: ["storage", "webRequest"],
  host_permissions: ["https://platform.ecala.net/*"],
});
