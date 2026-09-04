import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  build: {
    // La interfaz no está referenciada desde el manifest (se abre con
    // tabs.create), así que hay que declararla como entrada a mano.
    rollupOptions: {
      input: { interfaz: "src/ui/index.html" },
    },
  },
  server: { port: 5173, strictPort: true },
});
