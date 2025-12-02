import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/lib/supabase';
import { authenticateUser } from '@/lib/supabase-queries';

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
      // Authenticate user with password hash verification
      const authenticatedUser = await authenticateUser(email.toLowerCase(), password);
      
      // Create full user object with timestamps
      const fullUser: User = {
        ...authenticatedUser,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser(fullUser);
      localStorage.setItem('sr-auth-user', JSON.stringify(fullUser));
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
