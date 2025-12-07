import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Inspection } from '@/lib/supabase';
import { getInspectionsByUserId, getAllInspections, createInspection, deleteInspection as deleteInspectionQuery } from '@/lib/supabase-queries';
import { useAuth } from './AuthContext';

interface InspectionContextType {
  inspections: Inspection[];
  isLoading: boolean;
  addInspection: (inspection: Omit<Inspection, 'id' | 'created_at' | 'updated_at'>) => Promise<Inspection>;
  deleteInspection: (inspectionId: string) => Promise<void>;
  getFilteredInspections: (filters: InspectionFilters) => Inspection[];
  getUserInspectionStats: () => { total: number; thisMonth: number; lastInspection: string | null };
  refreshInspections: () => Promise<void>;
}

interface InspectionFilters {
  search?: string;
  type?: 'troca' | 'manutencao' | 'all';
  userId?: string;
  period?: 'week' | 'month' | 'all';
}

const InspectionContext = createContext<InspectionContextType | undefined>(undefined);

export function InspectionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInspections = useCallback(async () => {
    if (!user) {
      setInspections([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Carregar todas as vistorias para todos os usuários
      const data = await getAllInspections();
      setInspections(data);
    } catch (error) {
      console.error('Erro ao carregar vistorias:', error);
      setInspections([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  // Recarregar vistorias quando a janela recebe foco
  useEffect(() => {
    const handleFocus = () => {
      loadInspections();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadInspections]);

  const addInspection = useCallback(async (inspectionData: Omit<Inspection, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Garantir que o user_id seja do usuário logado
      const dataWithUser = {
        ...inspectionData,
        user_id: user.id,
      };
      const newInspection = await createInspection(dataWithUser);
      setInspections(prev => [newInspection, ...prev]);
      return newInspection;
    } catch (error) {
      console.error('Erro ao criar vistoria:', error);
      throw error;
    }
  }, [user]);

  const deleteInspection = useCallback(async (inspectionId: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (user.role !== 'gerente') throw new Error('Apenas gerentes podem deletar vistorias');

    try {
      await deleteInspectionQuery(inspectionId);
      setInspections(prev => prev.filter(i => i.id !== inspectionId));
    } catch (error) {
      console.error('Erro ao deletar vistoria:', error);
      throw error;
    }
  }, [user]);

  const getFilteredInspections = useCallback((filters: InspectionFilters): Inspection[] => {
    if (!user) return [];

    let filtered = [...inspections];

    // Filter by user
    if (filters.userId) {
      filtered = filtered.filter(i => i.user_id === filters.userId);
    }

    // Search by plate
    if (filters.search) {
      const searchTerm = filters.search.toUpperCase().replace(/[^A-Z0-9]/g, '');
      filtered = filtered.filter(i => {
        const plate = (i.vehicle_plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        return plate.includes(searchTerm);
      });
    }

    // Filter by type
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(i => i.type === filters.type);
    }

    // Filter by period
    if (filters.period && filters.period !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      if (filters.period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      filtered = filtered.filter(i => new Date(i.created_at) >= startDate);
    }

    return filtered;
  }, [user, inspections]);

  const getUserInspectionStats = useCallback(() => {
    if (!user) return { total: 0, thisMonth: 0, lastInspection: null };

    const userInspections = inspections.filter(i => i.user_id === user.id);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonthInspections = userInspections.filter(
      i => new Date(i.created_at) >= startOfMonth
    );

    const lastInspection = userInspections.length > 0
      ? userInspections.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0].created_at
      : null;

    return {
      total: userInspections.length,
      thisMonth: thisMonthInspections.length,
      lastInspection,
    };
  }, [user, inspections]);

  return (
    <InspectionContext.Provider value={{ 
      inspections, 
      isLoading,
      addInspection,
      deleteInspection, 
      getFilteredInspections, 
      getUserInspectionStats,
      refreshInspections: loadInspections
    }}>
      {children}
    </InspectionContext.Provider>
  );
}

export function useInspections() {
  const context = useContext(InspectionContext);
  if (context === undefined) {
    throw new Error('useInspections must be used within an InspectionProvider');
  }
  return context;
}
