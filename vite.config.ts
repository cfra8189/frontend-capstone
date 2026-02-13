import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Vite config with dev proxy; proxy target comes from BACKEND_URL env var
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Default to localhost:61234 (backend dev server) but allow override via env var
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:61234";

  return {
    plugins: [react()],
    server: {
      // Very permissive Content-Security-Policy for local development only.
      // Allows loading images, fonts, scripts, media, and frames from common CDN/providers.
      headers: {
        "Content-Security-Policy": [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *;",
          "img-src * data: blob: 'unsafe-inline';",
          "media-src * data: blob:;",
          "font-src * data:;",
          "script-src * 'unsafe-inline' 'unsafe-eval' blob:;",
          "style-src * 'unsafe-inline' data:;",
          "connect-src *;",
          "frame-src *;"
        ].join(' ')
      },
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
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
