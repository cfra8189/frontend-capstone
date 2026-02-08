import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config with dev proxy to backend on localhost:3000
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3003",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
