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
      // Usar generateSW para maior compatibilidade
      strategies: "generateSW",
      registerType: "autoUpdate",
      injectRegister: "auto", // Registro automático no HTML
      
      // Assets para incluir no precache
      includeAssets: [
        "favicon.png",
        "icon-72.png",
        "icon-96.png",
        "icon-128.png",
        "icon-144.png",
        "icon-152.png",
        "icon-192.png",
        "icon-384.png",
        "icon-512.png",
        "icon-maskable-192.png",
        "icon-maskable-512.png",
        "logo SR.png"
      ],
      
      // Configuração do Workbox
      workbox: {
        // Glob patterns para precache
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        
        // Limites de tamanho
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        
        // Não cachear requisições de navegação para SPAs
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/auth/],
        
        // Runtime caching - estratégias por tipo de requisição
        runtimeCaching: [
          // NUNCA cachear Supabase
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "supabase-no-cache",
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.in\/.*/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "supabase-no-cache",
            },
          },
          // Imagens - Cache First
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
              },
            },
          },
          // Fontes - Cache First
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 ano
              },
            },
          },
          // JS/CSS - Stale While Revalidate
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
              },
            },
          },
        ],
        
        // Limpar caches antigos
        cleanupOutdatedCaches: true,
        
        // Skip waiting automático
        skipWaiting: true,
        clientsClaim: true,
      },
      
      // Manifest do PWA
      manifest: {
        id: "/",
        name: "SR Vistorias - Sistema de Gerenciamento",
        short_name: "SR Vistorias",
        description: "Sistema completo para gerenciamento de vistorias veiculares",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        lang: "pt-BR",
        dir: "ltr",
        categories: ["business", "productivity"],
        prefer_related_applications: false,
        icons: [
          {
            src: "/icon-72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-128.png",
            sizes: "128x128",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-152.png",
            sizes: "152x152",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      
      // Opções de desenvolvimento
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "/index.html",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações para compatibilidade
    target: "es2015",
    cssTarget: "chrome61",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
}));
