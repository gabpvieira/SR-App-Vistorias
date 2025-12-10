/**
 * PWA Auto-Updater - SR Vistorias
 * 
 * Gerencia registro, atualização e ciclo de vida do Service Worker
 * Compatível com Chrome 109+, Edge, Firefox, Safari
 */

import { supabase } from '@/lib/supabase';

const isDev = import.meta.env.DEV;
const ROUTE_STORAGE_KEY = 'pwa_update_route';
const SESSION_STORAGE_KEY = 'pwa_session_backup';
const UPDATE_CHECK_INTERVAL = 60000; // 60 segundos
const SW_PATH = '/sw.js';

// Estados do Service Worker
type SWState = 'idle' | 'installing' | 'waiting' | 'activating' | 'active' | 'error';

/**
 * Classe para gerenciar o PWA Auto-Updater
 */
export class PWAAutoUpdater {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckInterval: ReturnType<typeof setInterval> | null = null;
  private isUpdating = false;
  private state: SWState = 'idle';
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Inicializa o auto-updater
   */
  async init(): Promise<boolean> {
    // Verificar suporte a Service Worker
    if (!this.isServiceWorkerSupported()) {
      this.log('Service Worker não suportado neste navegador');
      return false;
    }

    try {
      // Restaurar rota após reload (se houver)
      await this.restoreRouteAfterUpdate();

      // Registrar service worker
      const registered = await this.registerServiceWorker();
      
      if (registered) {
        // Monitorar mudanças de controller
        this.monitorControllerChange();
        
        // Iniciar polling de updates
        this.startUpdatePolling();
        
        // Pausar polling quando aba não estiver visível
        this.handleVisibilityChange();
        
        // Monitorar conexão de rede
        this.handleNetworkChange();
      }

      return registered;
    } catch (error) {
      this.log('Erro ao inicializar:', error);
      this.state = 'error';
      return false;
    }
  }

  /**
   * Verifica se Service Worker é suportado
   */
  private isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'caches' in window &&
           window.isSecureContext;
  }

  /**
   * Registra o service worker
   */
  private async registerServiceWorker(): Promise<boolean> {
    try {
      this.state = 'installing';
      
      // Verificar se já existe um SW registrado
      const existingReg = await navigator.serviceWorker.getRegistration('/');
      
      if (existingReg) {
        this.registration = existingReg;
        this.log('Service Worker já registrado');
      } else {
        // Registrar novo SW
        this.registration = await navigator.serviceWorker.register(SW_PATH, {
          scope: '/',
          updateViaCache: 'none' // Sempre buscar SW atualizado
        });
        this.log('Service Worker registrado com sucesso');
      }

      // Configurar listeners de estado
      this.setupRegistrationListeners();

      // Verificar estado atual
      if (this.registration.active) {
        this.state = 'active';
        this.log('Service Worker ativo');
      } else if (this.registration.waiting) {
        this.state = 'waiting';
        this.log('Service Worker aguardando ativação');
        // Ativar automaticamente
        this.activateWaitingWorker();
      } else if (this.registration.installing) {
        this.state = 'installing';
        this.log('Service Worker instalando');
      }

      return true;
    } catch (error) {
      this.state = 'error';
      this.logError('Erro ao registrar Service Worker:', error);
      return false;
    }
  }

  /**
   * Configura listeners no registration
   */
  private setupRegistrationListeners(): void {
    if (!this.registration) return;

    // Listener para nova versão encontrada
    this.registration.addEventListener('updatefound', () => {
      this.log('Nova versão do SW encontrada');
      this.handleUpdateFound();
    });
  }

  /**
   * Trata quando uma nova versão é encontrada
   */
  private handleUpdateFound(): void {
    if (!this.registration) return;

    const newWorker = this.registration.installing;
    if (!newWorker) return;

    this.state = 'installing';
    this.emit('updatefound');

    newWorker.addEventListener('statechange', () => {
      this.log('Estado do novo SW:', newWorker.state);

      switch (newWorker.state) {
        case 'installed':
          if (navigator.serviceWorker.controller) {
            // Há um SW antigo - nova versão disponível
            this.state = 'waiting';
            this.log('Nova versão instalada, aguardando ativação');
            this.emit('updateavailable');
            // Ativar automaticamente
            this.activateWaitingWorker();
          } else {
            // Primeira instalação
            this.state = 'active';
            this.log('Primeira instalação concluída');
            this.emit('installed');
          }
          break;

        case 'activating':
          this.state = 'activating';
          break;

        case 'activated':
          this.state = 'active';
          this.emit('activated');
          break;

        case 'redundant':
          this.log('SW marcado como redundante');
          break;
      }
    });
  }

  /**
   * Ativa o worker em espera
   */
  private activateWaitingWorker(): void {
    if (!this.registration?.waiting) return;

    this.log('Ativando worker em espera...');
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * Monitora mudanças no controller (novo SW ativado)
   */
  private monitorControllerChange(): void {
    navigator.serviceWorker.addEventListener('controllerchange', async () => {
      if (this.isUpdating) return;
      
      this.isUpdating = true;
      this.log('Novo Service Worker assumiu controle');

      try {
        // Salvar estado atual
        await this.saveCurrentState();

        // Verificar sessão
        const hasSession = await this.checkSession();
        
        if (hasSession) {
          // Reload silencioso mantendo a sessão
          this.log('Recarregando com sessão ativa...');
          window.location.reload();
        } else {
          // Sem sessão - verificar se está em rota protegida
          const currentPath = window.location.pathname;
          const publicRoutes = ['/login', '/landing', '/', '/offline'];
          
          if (!publicRoutes.includes(currentPath)) {
            this.log('Sem sessão em rota protegida - redirecionando para login');
            window.location.href = '/login';
          } else {
            window.location.reload();
          }
        }
      } catch (error) {
        this.logError('Erro ao processar mudança de controller:', error);
        // Reload de qualquer forma para garantir consistência
        window.location.reload();
      }
    });
  }

  /**
   * Inicia polling periódico de updates
   */
  private startUpdatePolling(): void {
    // Verificar imediatamente
    this.checkForUpdates();

    // Verificar periodicamente
    this.updateCheckInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.checkForUpdates();
      }
    }, UPDATE_CHECK_INTERVAL);
  }

  /**
   * Verifica se há updates disponíveis
   */
  async checkForUpdates(): Promise<void> {
    if (!this.registration || this.isUpdating) return;

    try {
      this.log('Verificando atualizações...');
      await this.registration.update();
    } catch (error) {
      // Ignorar erros de rede silenciosamente
      if (navigator.onLine) {
        this.log('Erro ao verificar updates:', error);
      }
    }
  }

  /**
   * Pausa/resume polling baseado na visibilidade da aba
   */
  private handleVisibilityChange(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.log('Aba visível - verificando updates');
        this.checkForUpdates();
      }
    });
  }

  /**
   * Monitora mudanças de conexão de rede
   */
  private handleNetworkChange(): void {
    window.addEventListener('online', () => {
      this.log('Conexão restaurada - verificando updates');
      this.checkForUpdates();
    });

    window.addEventListener('offline', () => {
      this.log('Conexão perdida');
    });
  }

  /**
   * Salva o estado atual antes do reload
   */
  private async saveCurrentState(): Promise<void> {
    try {
      // Salvar rota atual
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      sessionStorage.setItem(ROUTE_STORAGE_KEY, currentPath);
      
      this.log('Estado salvo:', currentPath);
    } catch (error) {
      this.logError('Erro ao salvar estado:', error);
    }
  }

  /**
   * Restaura a rota após o reload
   */
  private async restoreRouteAfterUpdate(): Promise<void> {
    try {
      const savedRoute = sessionStorage.getItem(ROUTE_STORAGE_KEY);
      
      if (!savedRoute) return;
      
      sessionStorage.removeItem(ROUTE_STORAGE_KEY);
      
      // Verificar sessão
      const hasSession = await this.checkSession();
      
      if (hasSession) {
        const currentPath = window.location.pathname + window.location.search + window.location.hash;
        
        // Só restaurar se diferente e não for login
        if (currentPath !== savedRoute && savedRoute !== '/login') {
          this.log('Restaurando rota:', savedRoute);
          window.history.replaceState(null, '', savedRoute);
        }
      } else {
        // Sem sessão - verificar se rota salva é protegida
        const publicRoutes = ['/login', '/landing', '/', '/offline'];
        
        if (!publicRoutes.includes(savedRoute) && window.location.pathname !== '/login') {
          this.log('Sem sessão - redirecionando para login');
          window.location.href = '/login';
        }
      }
    } catch (error) {
      this.logError('Erro ao restaurar rota:', error);
    }
  }

  /**
   * Verifica se há sessão ativa no Supabase
   */
  private async checkSession(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      this.logError('Erro ao verificar sessão:', error);
      return false;
    }
  }

  /**
   * Força atualização do SW
   */
  async forceUpdate(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      
      if (this.registration.waiting) {
        this.activateWaitingWorker();
      }
    } catch (error) {
      this.logError('Erro ao forçar update:', error);
    }
  }

  /**
   * Limpa todos os caches
   */
  async clearCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      this.log('Caches limpos');
    } catch (error) {
      this.logError('Erro ao limpar caches:', error);
    }
  }

  /**
   * Desregistra o Service Worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const success = await this.registration.unregister();
      if (success) {
        this.log('Service Worker desregistrado');
        this.registration = null;
        this.state = 'idle';
      }
      return success;
    } catch (error) {
      this.logError('Erro ao desregistrar SW:', error);
      return false;
    }
  }

  /**
   * Retorna o estado atual
   */
  getState(): SWState {
    return this.state;
  }

  /**
   * Verifica se o PWA está instalado
   */
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Adiciona listener de eventos
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove listener de eventos
   */
  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emite evento
   */
  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        this.logError('Erro em listener:', error);
      }
    });
  }

  /**
   * Log condicional (apenas em dev)
   */
  private log(...args: any[]): void {
    if (isDev) {
      console.log('[PWA]', ...args);
    }
  }

  /**
   * Log de erro (sempre)
   */
  private logError(...args: any[]): void {
    console.error('[PWA Error]', ...args);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
    this.listeners.clear();
  }
}

// Instância singleton
export const autoUpdater = new PWAAutoUpdater();

// Exportar também como default
export default autoUpdater;
