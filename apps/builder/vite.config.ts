import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/n8n-fork/",
  plugins: [react()],
  build: {
    assetsDir: "assets",
    emptyOutDir: true,
    sourcemap: false,
  },
});
