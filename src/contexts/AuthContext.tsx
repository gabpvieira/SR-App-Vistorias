import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User } from '@/lib/supabase';
import { authenticateUser } from '@/lib/supabase-queries';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'sr-auth-user';
const SESSION_TIMESTAMP_KEY = 'sr-auth-timestamp';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 dias em milissegundos

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar e restaurar sessão ao iniciar
  useEffect(() => {
    const restoreSession = () => {
      try {
        const stored = localStorage.getItem(SESSION_KEY);
        const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
        
        if (stored && timestamp) {
          const sessionAge = Date.now() - parseInt(timestamp);
          
          // Se a sessão ainda é válida (menos de 30 dias)
          if (sessionAge < SESSION_DURATION) {
            const userData = JSON.parse(stored);
            setUser(userData);
            
            // Atualizar timestamp para estender a sessão
            localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
          } else {
            // Sessão expirada, limpar
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(SESSION_TIMESTAMP_KEY);
          }
        }
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_TIMESTAMP_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Atualizar timestamp periodicamente para manter sessão ativa
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    }, 60 * 60 * 1000); // Atualizar a cada 1 hora

    return () => clearInterval(interval);
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Authenticate user with password hash verification
      const authenticatedUser = await authenticateUser(email.toLowerCase(), password);
      
      // Create full user object with timestamps
      const fullUser: User = {
        ...authenticatedUser,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser(fullUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(fullUser));
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        error: error.message === 'Invalid email or password' 
          ? 'E-mail ou senha incorretos' 
          : 'Erro ao conectar com o servidor' 
      };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
