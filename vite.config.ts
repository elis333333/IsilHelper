import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config.ts";

// Dos navegadores, dos builds. Chrome lee `background.service_worker` de MV3
// sin problema; Firefox lo tiene detrás de un flag apagado por defecto y
// exige `background.scripts` en su lugar (comprobado con Firefox 153 de
// verdad, `context/session.md` 7 de septiembre de 2026). Un solo manifest no
// puede llevar los dos a la vez —`@crxjs/vite-plugin` reescribe
// `background` entero según a cuál build apunte—, así que tampoco puede
// haber una sola carpeta de salida: cada build tiene su propio manifest y su
// propio `service-worker-loader.js`.
//
//   pnpm build           → dist/          (browser: "chrome")
//   pnpm build:firefox    → dist-firefox/  (browser: "firefox", --mode firefox)
//
// `mode` es el mecanismo propio de Vite para esto —lo que cambia `--mode` en
// la línea de órdenes— y es lo mismo que lee `manifest.config.ts` para
// decidir la forma de `background`: las dos decisiones viven de la misma
// fuente para que nunca salga un manifest de un navegador con la carpeta del
// otro.
export default defineConfig(({ mode }) => {
  const browser = mode === "firefox" ? "firefox" : "chrome";

  return {
    plugins: [react(), tailwindcss(), crx({ manifest, browser })],
    build: {
      outDir: browser === "firefox" ? "dist-firefox" : "dist",
      // La interfaz no está referenciada desde el manifest (se abre con
      // tabs.create), así que hay que declararla como entrada a mano.
      rollupOptions: {
        input: { interfaz: "src/ui/index.html" },
      },
    },
    server: { port: 5173, strictPort: true },
  };
});
