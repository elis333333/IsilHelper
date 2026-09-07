import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Fuera del lint: lo que no es código nuestro.
  {
    ignores: [
      "dist",
      "dist-firefox",
      "node_modules",
      ".venv",
      "downloads",
      ".claude",
      // Sondas de medición: se pegan a mano en la consola del service worker,
      // no se compilan y no entran en `dist/`. Ahí `console` es la salida y
      // los globales del navegador no están declarados, así que las reglas del
      // producto no aplican.
      "scripts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Sin any: si algo es genuinamente desconocido, unknown y se estrecha.
      "@typescript-eslint/no-explicit-any": "error",
      // El guion bajo marca lo que se recibe pero deliberadamente no se usa.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // El token no se registra nunca, ni en desarrollo.
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
);
