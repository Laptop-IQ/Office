import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Stable, long-cacheable vendor chunks – app code changes don't
        // invalidate React / router / icon libraries in the browser cache.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react";
          if (/node_modules\/(react-router|react-router-dom|@remix-run)\//.test(id)) return "router";
          if (/node_modules\/(lucide-react|@heroicons|react-icons)\//.test(id)) return "icons";
          return undefined;
        },
      },
    },
  },
  // Forward frontend /api requests to the Express backend during local development.
  // Override with VITE_API_PROXY_TARGET when the backend runs on another host/port.
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
