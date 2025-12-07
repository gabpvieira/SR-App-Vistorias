import { supabase } from './supabase';

// ============================================
// PERFORMANCE STATISTICS
// ============================================

export interface PerformanceKPIs {
  totalInspections: number;
  thisMonthInspections: number;
  lastMonthInspections: number;
  monthGrowth: number;
  dailyAverage: number;
  completionRate: number;
  totalPhotos: number;
  totalComments: number;
}

export interface UserRanking {
  id: string;
  name: string;
  email: string;
  totalInspections: number;
  monthInspections: number;
  lastInspection: string | null;
  completedCount: number;
  completionRate: number;
}

export interface InspectionByDate {
  date: string;
  count: number;
  trocaCount: number;
  manutencaoCount: number;
}

export interface DistributionData {
  type: string;
  count: number;
  percentage: number;
}

export interface RecentActivity {
  activityType: 'inspection_created' | 'inspection_completed' | 'comment_added' | 'activity_added';
  referenceId: string;
  timestamp: string;
  userName: string;
  details: string;
}

// ============================================
// GET PERFORMANCE KPIs
// ============================================
export async function getPerformanceKPIs(): Promise<PerformanceKPIs> {
  // Get total inspections and status counts
  const { data: inspections, error: inspError } = await supabase
    .from('inspections')
    .select('id, created_at, status');

  if (inspError) throw inspError;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const total = inspections?.length || 0;
  const thisMonth = inspections?.filter(i => new Date(i.created_at) >= startOfMonth).length || 0;
  const lastMonth = inspections?.filter(i => 
    new Date(i.created_at) >= startOfLastMonth && new Date(i.created_at) <= endOfLastMonth
  ).length || 0;

  const monthGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
  
  const daysInMonth = now.getDate();
  const dailyAverage = daysInMonth > 0 ? thisMonth / daysInMonth : 0;

  const completed = inspections?.filter(i => i.status === 'concluida').length || 0;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  // Get total photos
  const { count: photoCount } = await supabase
    .from('inspection_photos')
    .select('*', { count: 'exact', head: true });

  // Get total comments
  const { count: commentCount } = await supabase
    .from('inspection_comments')
    .select('*', { count: 'exact', head: true });

  return {
    totalInspections: total,
    thisMonthInspections: thisMonth,
    lastMonthInspections: lastMonth,
    monthGrowth: Math.round(monthGrowth * 10) / 10,
    dailyAverage: Math.round(dailyAverage * 10) / 10,
    completionRate: Math.round(completionRate * 10) / 10,
    totalPhotos: photoCount || 0,
    totalComments: commentCount || 0,
  };
}

// ============================================
// GET USER RANKING
// ============================================
export async function getUserRanking(): Promise<UserRanking[]> {
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('role', 'vendedor');

  if (usersError) throw usersError;

  const { data: inspections, error: inspError } = await supabase
    .from('inspections')
    .select('id, user_id, created_at, status');

  if (inspError) throw inspError;

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const ranking: UserRanking[] = users?.map(user => {
    const userInspections = inspections?.filter(i => i.user_id === user.id) || [];
    const monthInspections = userInspections.filter(i => new Date(i.created_at) >= startOfMonth);
    const completedInspections = userInspections.filter(i => i.status === 'concluida');
    
    const lastInspection = userInspections.length > 0
      ? userInspections.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null;

    const completionRate = userInspections.length > 0
      ? (completedInspections.length / userInspections.length) * 100
      : 0;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      totalInspections: userInspections.length,
      monthInspections: monthInspections.length,
      lastInspection,
      completedCount: completedInspections.length,
      completionRate: Math.round(completionRate * 10) / 10,
    };
  }) || [];

  return ranking.sort((a, b) => b.totalInspections - a.totalInspections);
}

// ============================================
// GET INSPECTIONS BY DATE
// ============================================
export async function getInspectionsByDate(days: number = 30): Promise<InspectionByDate[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('inspections')
    .select('created_at, type')
    .gte('created_at', startDate.toISOString());

  if (error) throw error;

  // Group by date
  const grouped = new Map<string, { count: number; troca: number; manutencao: number }>();

  data?.forEach(inspection => {
    const date = new Date(inspection.created_at).toISOString().split('T')[0];
    const current = grouped.get(date) || { count: 0, troca: 0, manutencao: 0 };
    
    current.count++;
    if (inspection.type === 'troca') current.troca++;
    if (inspection.type === 'manutencao') current.manutencao++;
    
    grouped.set(date, current);
  });

  // Fill missing dates with 0
  const result: InspectionByDate[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const data = grouped.get(dateStr) || { count: 0, troca: 0, manutencao: 0 };
    result.push({
      date: dateStr,
      count: data.count,
      trocaCount: data.troca,
      manutencaoCount: data.manutencao,
    });
  }

  return result;
}

// ============================================
// GET DISTRIBUTION DATA
// ============================================
export async function getTypeDistribution(): Promise<DistributionData[]> {
  const { data, error } = await supabase
    .from('inspections')
    .select('type');

  if (error) throw error;

  const total = data?.length || 0;
  const troca = data?.filter(i => i.type === 'troca').length || 0;
  const manutencao = data?.filter(i => i.type === 'manutencao').length || 0;

  return [
    {
      type: 'Troca',
      count: troca,
      percentage: total > 0 ? Math.round((troca / total) * 100) : 0,
    },
    {
      type: 'Manutenção',
      count: manutencao,
      percentage: total > 0 ? Math.round((manutencao / total) * 100) : 0,
    },
  ];
}

export async function getStatusDistribution(): Promise<DistributionData[]> {
  const { data, error } = await supabase
    .from('inspections')
    .select('status');

  if (error) throw error;

  const total = data?.length || 0;
  const statusCounts = {
    rascunho: data?.filter(i => i.status === 'rascunho').length || 0,
    concluida: data?.filter(i => i.status === 'concluida').length || 0,
    aprovada: data?.filter(i => i.status === 'aprovada').length || 0,
    rejeitada: data?.filter(i => i.status === 'rejeitada').length || 0,
  };

  return Object.entries(statusCounts)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      type: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}

// ============================================
// GET RECENT ACTIVITIES
// ============================================
export async function getRecentActivities(limit: number = 20): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];

  // Get recent inspections created
  const { data: newInspections } = await supabase
    .from('inspections')
    .select('id, created_at, vehicle_plate, user_id, users(name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  newInspections?.forEach(insp => {
    activities.push({
      activityType: 'inspection_created',
      referenceId: insp.id,
      timestamp: insp.created_at,
      userName: (insp.users as any)?.name || 'Usuário',
      details: `Vistoria criada - ${insp.vehicle_plate}`,
    });
  });

  // Get recent completed inspections
  const { data: completedInspections } = await supabase
    .from('inspections')
    .select('id, completed_at, vehicle_plate, user_id, users(name)')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(limit);

  completedInspections?.forEach(insp => {
    if (insp.completed_at) {
      activities.push({
        activityType: 'inspection_completed',
        referenceId: insp.id,
        timestamp: insp.completed_at,
        userName: (insp.users as any)?.name || 'Usuário',
        details: `Vistoria concluída - ${insp.vehicle_plate}`,
      });
    }
  });

  // Get recent comments
  const { data: comments } = await supabase
    .from('inspection_comments')
    .select('id, inspection_id, created_at, content, user_id, users(name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  comments?.forEach(comment => {
    activities.push({
      activityType: 'comment_added',
      referenceId: comment.inspection_id,
      timestamp: comment.created_at,
      userName: (comment.users as any)?.name || 'Usuário',
      details: `Comentário: ${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}`,
    });
  });

  // Get recent activities
  const { data: activityData } = await supabase
    .from('inspection_activities')
    .select('id, inspection_id, created_at, type, created_by, users(name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  activityData?.forEach(activity => {
    activities.push({
      activityType: 'activity_added',
      referenceId: activity.inspection_id,
      timestamp: activity.created_at,
      userName: (activity.users as any)?.name || 'Usuário',
      details: `Atividade ${activity.type} adicionada`,
    });
  });

  // Sort all activities by timestamp and limit
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
