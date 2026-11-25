import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// Windows : lettre de lecteur en majuscule. Lancé depuis `c:\...`, le bundler voit
// React sous deux chemins (`c:` et `C:`), l'embarque deux fois et l'appli reste
// blanche en production (« Cannot read properties of null (reading 'useState') »).
const root = import.meta.dirname.replace(/^[a-z]:/, (d) => d.toUpperCase());

// https://vite.dev/config/
export default defineConfig(async () => ({
  root,
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(root, "./src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
