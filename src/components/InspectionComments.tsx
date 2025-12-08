import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, ThumbsUp, Edit2, Trash2, X, Check } from 'lucide-react';
import { 
  getCommentsByInspectionId, 
  createInspectionComment, 
  updateInspectionComment,
  deleteInspectionComment, 
  toggleCommentLike,
  getCommentLikesCount,
  hasUserLikedComment,
  InspectionCommentWithUser 
} from '../lib/supabase-queries';
import { useAuth } from '../contexts/AuthContext';

interface InspectionCommentsProps {
  inspectionId: string;
}

interface CommentWithLikes extends InspectionCommentWithUser {
  likesCount: number;
  isLikedByUser: boolean;
}

export function InspectionComments({ inspectionId }: InspectionCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithLikes[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showActions, setShowActions] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [inspectionId]);

  async function loadComments() {
    try {
      setLoading(true);
      const data = await getCommentsByInspectionId(inspectionId);
      
      // Carregar curtidas para cada comentário
      const commentsWithLikes = await Promise.all(
        data.map(async (comment) => {
          const likesCount = await getCommentLikesCount(comment.id);
          const isLikedByUser = user ? await hasUserLikedComment(comment.id, user.id) : false;
          return { ...comment, likesCount, isLikedByUser };
        })
      );
      
      setComments(commentsWithLikes);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      setSubmitting(true);
      await createInspectionComment({
        inspection_id: inspectionId,
        user_id: user.id,
        content: newComment.trim(),
      });
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      alert('Erro ao adicionar comentário');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(commentId: string) {
    if (!user) return;

    try {
      await toggleCommentLike(commentId, user.id);
      await loadComments();
    } catch (error) {
      console.error('Erro ao curtir comentário:', error);
    }
  }

  async function handleStartEdit(comment: CommentWithLikes) {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setShowActions(null);
  }

  async function handleSaveEdit(commentId: string) {
    if (!editContent.trim()) return;

    try {
      await updateInspectionComment(commentId, editContent.trim());
      setEditingId(null);
      setEditContent('');
      await loadComments();
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
      alert('Erro ao editar comentário');
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditContent('');
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Deseja excluir este comentário?')) return;

    try {
      await deleteInspectionComment(commentId);
      setShowActions(null);
      await loadComments();
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      alert('Erro ao excluir comentário');
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-red-600" />
        <h3 className="text-lg font-semibold text-gray-900">Comentários</h3>
        <span className="text-sm text-gray-500">({comments.length})</span>
      </div>

      {/* Lista de comentários */}
      <div className="space-y-4 mb-6">
        {loading ? (
          <p className="text-gray-500 text-center py-4">Carregando comentários...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhum comentário ainda. Seja o primeiro!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="py-2">
              <div className="flex items-start gap-2 sm:gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-semibold text-xs sm:text-sm">
                    {comment.user_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">{comment.user_name}</span>
                    <span className="text-xs text-gray-500">
                      {comment.user_role === 'gerente' ? '(Gerente)' : '(Vendedor)'}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                  </div>

                  {/* Content */}
                  {editingId === comment.id ? (
                    <div className="mb-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none text-base"
                        style={{ fontSize: '16px' }}
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSaveEdit(comment.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span className="hidden sm:inline">Salvar</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs sm:text-sm hover:bg-gray-300 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span className="hidden sm:inline">Cancelar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap mb-2 text-sm sm:text-base">{comment.content}</p>
                  )}

                  {/* Actions */}
                  {editingId !== comment.id && (
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                      <button
                        onClick={() => handleLike(comment.id)}
                        className={`flex items-center gap-1 hover:text-red-600 transition-colors ${
                          comment.isLikedByUser ? 'text-red-600 font-semibold' : 'text-gray-600'
                        }`}
                      >
                        <ThumbsUp className={`w-3 h-3 sm:w-4 sm:h-4 ${comment.isLikedByUser ? 'fill-current' : ''}`} />
                        <span>Curtir</span>
                        {comment.likesCount > 0 && (
                          <span className="text-xs">({comment.likesCount})</span>
                        )}
                      </button>

                      {user && user.id === comment.user_id && (
                        <>
                          <button
                            onClick={() => handleStartEdit(comment)}
                            className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
                          >
                            <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Excluir</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Formulário de novo comentário */}
      <form onSubmit={handleSubmitComment} className="flex flex-col sm:flex-row gap-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicione um comentário..."
          className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-base"
          style={{ fontSize: '16px' }}
          rows={3}
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:h-fit text-sm sm:text-base"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Enviando...' : 'Comentar'}
        </button>
      </form>
    </div>
  );
}
