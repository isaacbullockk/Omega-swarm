import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    minify: "esbuild",
    target: "es2020",
    cssMinify: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 200,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("recharts")) return "vendor-charts";
          if (id.includes("lucide-react")) return "vendor-ui";
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) return "vendor-react";
            if (id.includes("@tanstack") || id.includes("@trpc")) return "vendor-query";
            if (id.includes("sonner")) return "vendor-ui";
            return "vendor";
          }
        },
      },
    },
    esbuild: {
      drop: ["console", "debugger"],
      legalComments: "none",
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
