import { useState, useEffect } from 'react';
import {
  getPerformanceKPIs,
  getUserRanking,
  getInspectionsByDate,
  getTypeDistribution,
  getStatusDistribution,
  getRecentActivities,
  PerformanceKPIs,
  UserRanking,
  InspectionByDate,
  DistributionData,
  RecentActivity,
} from '@/lib/performance-queries';

export interface PerformanceData {
  kpis: PerformanceKPIs | null;
  userRanking: UserRanking[];
  inspectionsByDate: InspectionByDate[];
  typeDistribution: DistributionData[];
  statusDistribution: DistributionData[];
  recentActivities: RecentActivity[];
  isLoading: boolean;
  error: Error | null;
}

export function usePerformanceData(days: number = 30) {
  const [data, setData] = useState<PerformanceData>({
    kpis: null,
    userRanking: [],
    inspectionsByDate: [],
    typeDistribution: [],
    statusDistribution: [],
    recentActivities: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function loadData() {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));

        const [
          kpis,
          userRanking,
          inspectionsByDate,
          typeDistribution,
          statusDistribution,
          recentActivities,
        ] = await Promise.all([
          getPerformanceKPIs(),
          getUserRanking(),
          getInspectionsByDate(days),
          getTypeDistribution(),
          getStatusDistribution(),
          getRecentActivities(20),
        ]);

        setData({
          kpis,
          userRanking,
          inspectionsByDate,
          typeDistribution,
          statusDistribution,
          recentActivities,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error loading performance data:', error);
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
      }
    }

    loadData();
  }, [days]);

  return data;
}
