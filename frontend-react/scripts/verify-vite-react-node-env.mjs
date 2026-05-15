/**
 * Verificación objetiva: `define.process.env.NODE_ENV` en vite.config.js debe seguir el `mode`.
 *
 * Regresión corregida: fijar siempre `"production"` en dev hace que React opere en modo producción
 * bajo `vite` (5173), sin overlay ante errores de render → pantalla en blanco sin diagnóstico.
 *
 * Uso (desde frontend-react): node scripts/verify-vite-react-node-env.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfigFromFile } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, "..", "vite.config.js");

const scenarios = [
  { command: "serve", mode: "development", expected: '"development"' },
  { command: "build", mode: "production", expected: '"production"' },
];

let failed = false;
for (const { command, mode, expected } of scenarios) {
  const resolved = await loadConfigFromFile({ command, mode }, configPath);
  const value = resolved?.config?.define?.["process.env.NODE_ENV"];
  const ok = value === expected;
  console.log(
    `[verify-vite-react-node-env] ${command}/${mode} → ${JSON.stringify(value)} (esperado ${expected}) ${ok ? "OK" : "FAIL"}`
  );
  if (!ok) failed = true;
}

if (failed) {
  console.error("[verify-vite-react-node-env] Falló.");
  process.exit(1);
}
console.log("[verify-vite-react-node-env] OK.");
