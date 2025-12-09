import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null, // Desabilitar registro automático (usaremos nosso custom)
      includeAssets: ["favicon.png", "icon-192.png", "icon-512.png", "logo SR.png"],
      strategies: "injectManifest",
      srcDir: "public",
      filename: "sw.js",
      manifest: {
        id: "/",
        name: "SR Vistorias - Sistema de Gerenciamento",
        short_name: "SR Vistorias",
        description: "Sistema completo para gerenciamento de vistorias veiculares da SR Caminhões",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        screenshots: [
          {
            src: "/logo SR.png",
            sizes: "2000x2000",
            type: "image/png",
            form_factor: "wide",
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
