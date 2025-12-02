import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/lib/supabase';
import { getUserByEmail } from '@/lib/supabase-queries';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('sr-auth-user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Buscar usuário no Supabase
      const foundUser = await getUserByEmail(email.toLowerCase());
      
      if (!foundUser) {
        return { success: false, error: 'E-mail ou senha incorretos' };
      }

      // Mock password check (qualquer senha com 8+ chars funciona)
      // Em produção, você implementaria hash de senha real
      if (password.length < 8) {
        return { success: false, error: 'E-mail ou senha incorretos' };
      }

      setUser(foundUser);
      localStorage.setItem('sr-auth-user', JSON.stringify(foundUser));
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro ao conectar com o servidor' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('sr-auth-user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
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
