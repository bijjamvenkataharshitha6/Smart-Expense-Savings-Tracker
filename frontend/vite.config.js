import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": env.VITE_BACKEND_URL || "http://127.0.0.1:8001"
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("/node_modules/recharts/")) return "charts";
            if (id.includes("/node_modules/lucide-react/")) return "icons";
            if (id.includes("/node_modules/react/") || id.includes("/node_modules/react-dom/")) return "react-vendor";
          }
        }
      }
    }
  };
});
