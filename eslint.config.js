import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", ".gitignore", ".claude"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Sin any: si algo es genuinamente desconocido, unknown y se estrecha.
      "@typescript-eslint/no-explicit-any": "error",
      // El token no se registra nunca, ni en desarrollo.
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
);
