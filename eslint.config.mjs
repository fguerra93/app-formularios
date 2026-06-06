import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // El proyecto usa de forma intencional el patrón "hidratar estado
      // cliente-only tras el montaje" (leer localStorage, hora local o estado
      // de sesión en un useEffect con deps []). Un inicializador lazy de
      // useState rompería SSR / causaría hydration mismatch, así que el effect
      // es el patrón correcto aquí. La regla (era React Compiler, RC) lo marca
      // como error; lo dejamos en "warn" para no bloquear el build sin ocultar
      // del todo posibles renders en cascada reales.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
