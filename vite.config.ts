import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base relative → fonctionne aussi bien en local que sur GitHub Pages (/verbo/)
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});
