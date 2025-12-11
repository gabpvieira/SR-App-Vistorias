import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker, setupInstallPrompt, getBrowserSupport } from "./utils/polyfills";

/**
 * Inicialização da aplicação com suporte a navegadores legados (Chrome 109+)
 */

// Log de suporte do navegador (apenas em dev)
if (import.meta.env.DEV) {
  console.log('[App] Browser support:', getBrowserSupport());
}

// Configurar prompt de instalação PWA
setupInstallPrompt();

// Registrar Service Worker com fallback
registerServiceWorker()
  .then((registration) => {
    if (registration) {
      if (import.meta.env.DEV) {
        console.log('[App] PWA ready');
      }
    }
  })
  .catch((error) => {
    // Erro silencioso em produção
    if (import.meta.env.DEV) {
      console.error('[App] PWA init error:', error);
    }
  });

// Renderizar aplicação
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error('[App] Root element not found');
}
