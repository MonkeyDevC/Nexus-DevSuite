import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, repoRoot, "");
  const devApiOrigin =
    process.env.NEXUS_DEV_API_ORIGIN ||
    rootEnv.NEXUS_DEV_API_ORIGIN ||
    process.env.VITE_DEV_API_PROXY ||
    "http://localhost:3000";

  return {
    appType: "spa",
    plugins: [react()],
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    /**
     * Cliente HTTP: base relativa /api/v1 (requestConfig.js). Mismo origen en prod.
     * En dev, Vite reenvía /api al backend para no usar URLs absolutas en el código.
     * /uploads: evidencia y estáticos bajo public/uploads en Express; sin proxy el preview
     * pediría /uploads al origen de Vite y las imágenes fallarían (solo se vería el alt).
     */
    server: {
      proxy: {
        "/api": {
          target: devApiOrigin,
          changeOrigin: true,
        },
        "/uploads": {
          target: devApiOrigin,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "../public/react-app",
      emptyOutDir: true,
      assetsDir: "assets",
      lib: {
        entry: "./src/main.jsx",
        formats: ["es"],
        fileName: () => "index.js",
      },
      rollupOptions: {
        output: {
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
    },
  };
});
