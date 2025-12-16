/**
 * Feedback Panel - Development view for all feedbacks
 * Only accessible by managers/developers
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Filter,
  RefreshCw,
  Check,
  X,
  EyeOff,
  Clock,
  MessageSquare,
  BarChart3,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllFeedbacks,
  getFeedbackStats
} from '../lib/feedback-service';
import type {
  FeatureFeedback,
  FeedbackFilters,
  FeedbackStats,
  FeedbackStatus,
  VistoriaTipo
} from '../types/feedback';
import { cn } from '../lib/utils';

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; icon: typeof Check }> = {
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800', icon: Check },
  rejected: { label: 'Reprovado', color: 'bg-red-100 text-red-800', icon: X },
  hidden: { label: 'Oculto', color: 'bg-gray-100 text-gray-800', icon: EyeOff },
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
};

const VISTORIA_LABELS: Record<VistoriaTipo, string> = {
  cavalo: 'Cavalo Mecânico',
  rodotrem_basculante: 'Rodotrem Basculante',
  rodotrem_graneleiro: 'Rodotrem Graneleiro',
  livre: 'Livre',
  troca: 'Troca',
  manutencao: 'Manutenção'
};

export default function FeedbackPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeatureFeedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FeedbackFilters>({});

  // Check if user is manager
  useEffect(() => {
    if (user && user.role !== 'gerente') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [feedbackData, statsData] = await Promise.all([
        getAllFeedbacks(filters),
        getFeedbackStats(filters)
      ]);
      setFeedbacks(feedbackData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading feedback data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleFilterChange = (key: keyof FeedbackFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user || user.role !== 'gerente') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Painel de Feedback</h1>
                <p className="text-sm text-muted-foreground">
                  Visualize todos os feedbacks de produção
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Aprovados</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-muted-foreground">Reprovados</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-muted-foreground">Ocultos</span>
                </div>
                <p className="text-2xl font-bold text-gray-600">{stats.hidden}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-muted-foreground">Pendentes</span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <label className="text-sm text-muted-foreground mb-1 block">
                  Tipo de Vistoria
                </label>
                <Select
                  value={filters.vistoria_tipo || 'all'}
                  onValueChange={(v) => handleFilterChange('vistoria_tipo', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(VISTORIA_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-40">
                <label className="text-sm text-muted-foreground mb-1 block">
                  Status
                </label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(v) => handleFilterChange('status', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-40">
                <label className="text-sm text-muted-foreground mb-1 block">
                  Ambiente
                </label>
                <Select
                  value={filters.ambiente || 'all'}
                  onValueChange={(v) => handleFilterChange('ambiente', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                    <SelectItem value="development">Desenvolvimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Feedbacks ({feedbacks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum feedback encontrado
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((feedback) => {
                  const statusConfig = STATUS_CONFIG[feedback.status];
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div
                      key={feedback.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={cn('text-xs', statusConfig.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            {feedback.vistoria_tipo && (
                              <Badge variant="outline" className="text-xs">
                                {VISTORIA_LABELS[feedback.vistoria_tipo]}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {feedback.ambiente === 'production' ? 'Produção' : 'Dev'}
                            </Badge>
                          </div>
                          
                          <p className="font-medium mt-2">
                            {feedback.etapa_label || feedback.etapa_id || 'Funcionalidade Geral'}
                          </p>
                          
                          {feedback.comentario && (
                            <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                              <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <p>{feedback.comentario}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          <p>{formatDate(feedback.created_at)}</p>
                          {feedback.updated_at !== feedback.created_at && (
                            <p className="mt-1">
                              Atualizado: {formatDate(feedback.updated_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
