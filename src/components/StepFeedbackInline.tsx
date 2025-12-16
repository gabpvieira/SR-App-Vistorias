/**
 * Inline Step Feedback Component
 * Botões de aprovação/reprovação diretamente nas etapas de vistoria
 * Visível apenas em produção para validação do cliente
 */

import { useState, useEffect } from 'react';
import { Check, X, Loader2, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface StepFeedbackInlineProps {
  userId: string;
  vistoriaTipo: string;
  etapaId: string;
  etapaLabel: string;
  stepOrder: number;
}

type FeedbackStatus = 'approved' | 'rejected' | null;

interface FeedbackData {
  id?: string;
  status: FeedbackStatus;
  observacao: string;
}

export function StepFeedbackInline({
  userId,
  vistoriaTipo,
  etapaId,
  etapaLabel,
  stepOrder
}: StepFeedbackInlineProps) {
  const [feedback, setFeedback] = useState<FeedbackData>({ status: null, observacao: '' });
  const [showObservacao, setShowObservacao] = useState(false);
  const [loading, setLoading] = useState<'approved' | 'rejected' | 'save' | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Carregar feedback existente
  useEffect(() => {
    async function loadFeedback() {
      try {
        const { data, error } = await supabase
          .from('feature_feedback')
          .select('*')
          .eq('user_id', userId)
          .eq('vistoria_tipo', vistoriaTipo)
          .eq('etapa_id', etapaId)
          .single();

        if (data && !error) {
          setFeedback({
            id: data.id,
            status: data.status as FeedbackStatus,
            observacao: data.comentario || ''
          });
          if (data.status === 'rejected' && data.comentario) {
            setShowObservacao(true);
          }
        }
      } catch {
        // Sem feedback existente
      } finally {
        setInitialLoading(false);
      }
    }

    if (userId && vistoriaTipo && etapaId) {
      loadFeedback();
    }
  }, [userId, vistoriaTipo, etapaId]);

  const saveFeedback = async (status: 'approved' | 'rejected', observacao?: string) => {
    setLoading(status);
    
    try {
      const feedbackData = {
        user_id: userId,
        feature_type: 'vistoria_etapa',
        vistoria_tipo: vistoriaTipo,
        etapa_id: etapaId,
        etapa_label: etapaLabel,
        status,
        comentario: observacao || feedback.observacao || null,
        ambiente: import.meta.env.PROD ? 'production' : 'development',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('feature_feedback')
        .upsert(feedbackData, {
          onConflict: 'user_id,feature_type,vistoria_tipo,etapa_id'
        })
        .select()
        .single();

      if (error) throw error;

      setFeedback({
        id: data.id,
        status,
        observacao: observacao || feedback.observacao
      });

      // Se reprovou, mostrar campo de observação
      if (status === 'rejected') {
        setShowObservacao(true);
      }
    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleApprove = () => {
    saveFeedback('approved');
    setShowObservacao(false);
  };

  const handleReject = () => {
    setShowObservacao(true);
    if (!feedback.observacao) {
      // Não salva ainda, espera a observação
      setFeedback(prev => ({ ...prev, status: 'rejected' }));
    } else {
      saveFeedback('rejected');
    }
  };

  const handleSaveObservacao = () => {
    if (!feedback.observacao.trim()) return;
    setLoading('save');
    saveFeedback('rejected', feedback.observacao);
  };

  if (initialLoading) {
    return (
      <div className="mt-4 p-3 bg-muted/50 rounded-lg animate-pulse">
        <div className="h-8 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="mt-4 border-t pt-4">
      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
        <MessageSquare className="h-3 w-3" />
        Avalie esta etapa:
      </p>
      
      <div className="flex gap-2">
        {/* Botão Aprovado */}
        <Button
          size="sm"
          variant={feedback.status === 'approved' ? 'default' : 'outline'}
          className={cn(
            'flex-1',
            feedback.status === 'approved' && 'bg-green-600 hover:bg-green-700 text-white'
          )}
          onClick={handleApprove}
          disabled={loading !== null}
        >
          {loading === 'approved' ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-1" />
          )}
          Aprovado
        </Button>

        {/* Botão Desaprovado */}
        <Button
          size="sm"
          variant={feedback.status === 'rejected' ? 'default' : 'outline'}
          className={cn(
            'flex-1',
            feedback.status === 'rejected' && 'bg-red-600 hover:bg-red-700 text-white'
          )}
          onClick={handleReject}
          disabled={loading !== null}
        >
          {loading === 'rejected' ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <X className="h-4 w-4 mr-1" />
          )}
          Desaprovado
        </Button>
      </div>

      {/* Campo de observação (aparece ao desaprovar) */}
      {showObservacao && (
        <div className="mt-3 space-y-2">
          <Textarea
            placeholder="Descreva o problema ou sugestão de melhoria... (obrigatório)"
            value={feedback.observacao}
            onChange={(e) => setFeedback(prev => ({ ...prev, observacao: e.target.value }))}
            rows={2}
            className="text-sm resize-none"
          />
          {feedback.status === 'rejected' && !feedback.id && (
            <Button
              size="sm"
              onClick={handleSaveObservacao}
              disabled={!feedback.observacao.trim() || loading === 'save'}
              className="w-full"
            >
              {loading === 'save' ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              Enviar Feedback
            </Button>
          )}
          {feedback.id && feedback.status === 'rejected' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => saveFeedback('rejected', feedback.observacao)}
              disabled={loading === 'save'}
              className="w-full"
            >
              {loading === 'save' ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              Atualizar Observação
            </Button>
          )}
        </div>
      )}

      {/* Status salvo */}
      {feedback.id && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          ✓ Feedback registrado
        </p>
      )}
    </div>
  );
}
