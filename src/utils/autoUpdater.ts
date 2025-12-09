import { supabase } from '@/lib/supabase';

const isDev = import.meta.env.DEV;
const ROUTE_STORAGE_KEY = 'pwa_update_route';
const UPDATE_CHECK_INTERVAL = 45000; // 45 segundos

/**
 * Auto-updater silencioso para PWA com preservação de sessão Supabase
 * - Detecta atualizações automaticamente
 * - Recarrega a página silenciosamente
 * - Preserva sessão e rota do usuário
 */
export class PWAAutoUpdater {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckInterval: number | null = null;
  private isUpdating = false;

  /**
   * Inicializa o auto-updater
   */
  async init() {
    if (!('serviceWorker' in navigator)) {
      this.log('Service Worker não suportado');
      return;
    }

    // Restaurar rota após reload
    this.restoreRouteAfterUpdate();

    // Registrar service worker
    await this.registerServiceWorker();

    // Monitorar mudanças de controller
    this.monitorControllerChange();

    // Iniciar polling de updates
    this.startUpdatePolling();

    // Pausar polling quando aba não estiver visível
    this.handleVisibilityChange();
  }

  /**
   * Registra o service worker
   */
  private async registerServiceWorker() {
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      this.log('Service Worker registrado');

      // Verificar update imediatamente
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdateFound();
      });

      // Verificar se já existe update pendente
      if (this.registration.waiting) {
        this.log('Update já disponível');
        this.activateUpdate();
      }

    } catch (error) {
      this.log('Erro ao registrar Service Worker:', error);
    }
  }

  /**
   * Monitora mudanças no controller (novo SW ativado)
   */
  private monitorControllerChange() {
    navigator.serviceWorker.addEventListener('controllerchange', async () => {
      if (this.isUpdating) return;
      
      this.isUpdating = true;
      this.log('Novo Service Worker ativado - recarregando...');

      // Salvar rota atual antes do reload
      await this.saveCurrentRoute();

      // Verificar sessão antes de recarregar
      const hasSession = await this.checkSession();
      
      if (hasSession) {
        // Reload silencioso
        window.location.reload();
      } else {
        // Redirecionar para login
        window.location.href = '/login';
      }
    });
  }

  /**
   * Detecta nova versão disponível
   */
  private handleUpdateFound() {
    if (!this.registration) return;

    const newWorker = this.registration.installing;
    if (!newWorker) return;

    this.log('Nova versão detectada');

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        this.log('Nova versão instalada');
        // O skipWaiting() será chamado automaticamente pelo SW
      }
    });
  }

  /**
   * Ativa o update pendente
   */
  private activateUpdate() {
    if (!this.registration?.waiting) return;

    this.log('Ativando update...');
    
    // Enviar mensagem para o SW fazer skipWaiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * Inicia polling periódico de updates
   */
  private startUpdatePolling() {
    // Verificar imediatamente
    this.checkForUpdates();

    // Verificar periodicamente
    this.updateCheckInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates();
      }
    }, UPDATE_CHECK_INTERVAL);
  }

  /**
   * Verifica se há updates disponíveis
   */
  private async checkForUpdates() {
    if (!this.registration || this.isUpdating) return;

    try {
      this.log('Verificando updates...');
      await this.registration.update();
    } catch (error) {
      this.log('Erro ao verificar updates:', error);
    }
  }

  /**
   * Pausa/resume polling baseado na visibilidade da aba
   */
  private handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.log('Aba visível - verificando updates');
        this.checkForUpdates();
      }
    });
  }

  /**
   * Salva a rota atual antes do reload
   */
  private async saveCurrentRoute() {
    try {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      sessionStorage.setItem(ROUTE_STORAGE_KEY, currentPath);
      this.log('Rota salva:', currentPath);
    } catch (error) {
      this.log('Erro ao salvar rota:', error);
    }
  }

  /**
   * Restaura a rota após o reload
   */
  private async restoreRouteAfterUpdate() {
    try {
      const savedRoute = sessionStorage.getItem(ROUTE_STORAGE_KEY);
      
      if (savedRoute) {
        sessionStorage.removeItem(ROUTE_STORAGE_KEY);
        
        // Verificar sessão
        const hasSession = await this.checkSession();
        
        if (hasSession) {
          this.log('Restaurando rota:', savedRoute);
          
          // Só restaurar se não estiver já na rota
          const currentPath = window.location.pathname + window.location.search + window.location.hash;
          if (currentPath !== savedRoute && savedRoute !== '/login') {
            window.history.replaceState(null, '', savedRoute);
          }
        } else {
          // Sem sessão - redirecionar para login
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    } catch (error) {
      this.log('Erro ao restaurar rota:', error);
    }
  }

  /**
   * Verifica se há sessão ativa no Supabase
   */
  private async checkSession(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const hasSession = !!session;
      this.log('Sessão ativa:', hasSession);
      return hasSession;
    } catch (error) {
      this.log('Erro ao verificar sessão:', error);
      return false;
    }
  }

  /**
   * Log condicional (apenas em dev)
   */
  private log(...args: any[]) {
    if (isDev) {
      console.log('[PWA Auto-Updater]', ...args);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }
}

// Instância singleton
export const autoUpdater = new PWAAutoUpdater();
