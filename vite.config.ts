import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Vite config with dev proxy; proxy target comes from BACKEND_URL env var
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Default to localhost:3003 but allow override via env var
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:3003";

  return {
    plugins: [react()],
    server: {
      // Set a relaxed CSP for the dev server so tools and dev extensions can connect
      headers: {
        "Content-Security-Policy": "default-src 'self' 'unsafe-inline' data: blob:; connect-src *"
      },
      port: 5173,
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
