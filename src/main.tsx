import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { autoUpdater } from "./utils/autoUpdater";

// Inicializar auto-updater silencioso
autoUpdater.init().catch(error => {
  if (import.meta.env.DEV) {
    console.error('[PWA] Erro ao inicializar auto-updater:', error);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
