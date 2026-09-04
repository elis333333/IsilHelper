import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Fuera del lint: lo que no es código nuestro.
  {
    ignores: [
      "dist",
      "node_modules",
      ".venv",
      "downloads",
      ".claude",
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
