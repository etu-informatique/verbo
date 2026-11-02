import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base relative → fonctionne aussi bien en local que sur GitHub Pages (/verbo/)
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  // En dev sous Windows (app Claude installée via le Store), le chemin réel du projet diffère :
  // on autorise Vite à servir le Web Worker de l'IA locale.
  server: { fs: { strict: false } },
});
