import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { autoUpdater } from "./utils/autoUpdater";

/**
 * Inicialização do PWA Auto-Updater
 * - Registra o Service Worker
 * - Configura auto-update silencioso
 * - Preserva sessão durante atualizações
 */
const initPWA = async () => {
  try {
    const success = await autoUpdater.init();
    
    if (import.meta.env.DEV) {
      console.log('[App] PWA inicializado:', success ? 'OK' : 'Falhou');
      
      // Listeners de debug em desenvolvimento
      autoUpdater.on('updatefound', () => {
        console.log('[App] Nova versão encontrada');
      });
      
      autoUpdater.on('updateavailable', () => {
        console.log('[App] Atualização disponível');
      });
      
      autoUpdater.on('activated', () => {
        console.log('[App] Service Worker ativado');
      });
    }
  } catch (error) {
    // Erro silencioso em produção
    if (import.meta.env.DEV) {
      console.error('[App] Erro ao inicializar PWA:', error);
    }
  }
};

// Inicializar PWA (não bloqueia renderização)
initPWA();

// Renderizar aplicação
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error('[App] Elemento root não encontrado');
}
