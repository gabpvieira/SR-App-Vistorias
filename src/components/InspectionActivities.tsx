import React, { useState, useEffect } from 'react';
import { Plus, ClipboardList, CheckCircle, Image as ImageIcon, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActivitiesByInspectionId, getActivityPhotos, createInspectionActivity, getInspectionById, deleteInspectionActivity, InspectionActivity, InspectionActivityPhoto } from '../lib/supabase-queries';
import { useAuth } from '../contexts/AuthContext';
import { VehicleModel, Inspection } from '../lib/supabase';

interface InspectionActivitiesProps {
  inspectionId: string;
}

interface ActivityWithPhotos extends InspectionActivity {
  photos: InspectionActivityPhoto[];
}

export function InspectionActivities({ inspectionId }: InspectionActivitiesProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [activities, setActivities] = useState<ActivityWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewActivityForm, setShowNewActivityForm] = useState(false);
  const [newActivityType, setNewActivityType] = useState<'livre' | 'guiada'>('livre');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [inspectionId]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Carregar vistoria pai
      const inspectionData = await getInspectionById(inspectionId);
      setInspection(inspectionData);
      
      // Carregar atividades
      const activitiesData = await getActivitiesByInspectionId(inspectionId);
      
      // Carregar fotos de cada atividade
      const activitiesWithPhotos = await Promise.all(
        activitiesData.map(async (activity) => {
          const photos = await getActivityPhotos(activity.id);
          return { ...activity, photos };
        })
      );
      
      setActivities(activitiesWithPhotos);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateActivity() {
    if (!user || !inspection) return;

    try {
      setCreating(true);
      
      // Usar o vehicle_model da vistoria pai
      const vehicleModel = newActivityType === 'guiada' 
        ? (inspection.vehicle_model || 'livre')
        : 'livre';
      
      const activity = await createInspectionActivity({
        inspection_id: inspectionId,
        type: newActivityType,
        vehicle_model: vehicleModel,
        created_by: user.id,
      });

      // Redirecionar para a página apropriada
      if (newActivityType === 'livre') {
        navigate(`/inspection-activity/${activity.id}/free`);
      } else {
        navigate(`/inspection-activity/${activity.id}/guided`);
      }
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      alert('Erro ao criar atividade');
    } finally {
      setCreating(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getVehicleModelLabel(model?: string) {
    const labels: Record<string, string> = {
      cavalo: 'Cavalo Mecânico',
      rodotrem_basculante: 'Rodotrem Basculante',
      rodotrem_graneleiro: 'Rodotrem Graneleiro',
      livre: 'Livre',
    };
    return labels[model || 'livre'] || 'Livre';
  }

  async function handleDeleteActivity(activityId: string) {
    if (!confirm('Deseja excluir esta atividade? Todas as fotos serão removidas permanentemente.')) {
      return;
    }

    try {
      setDeletingId(activityId);
      await deleteInspectionActivity(activityId);
      await loadData(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir atividade:', error);
      alert('Erro ao excluir atividade. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Registros da Vistoria</h3>
          <span className="text-sm text-gray-500">({activities.length})</span>
        </div>
        <button
          onClick={() => setShowNewActivityForm(!showNewActivityForm)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm sm:text-base"
        >
          <Plus className="w-4 h-4" />
          Nova Atividade
        </button>
      </div>

      {/* Formulário de nova atividade */}
      {showNewActivityForm && inspection && (
        <div className="mb-6 p-3 sm:p-4 border border-red-200 rounded-lg bg-red-50">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Adicionar Nova Atividade</h4>
          
          <div className="space-y-3">
            {/* Informações da vistoria pai */}
            <div className="p-3 bg-white rounded border border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Veículo da vistoria:</p>
              <p className="font-medium text-gray-900 text-sm sm:text-base">
                {inspection.vehicle_plate} - {inspection.vehicle_model_name}
              </p>
              {inspection.vehicle_model && inspection.vehicle_model !== 'livre' && (
                <p className="text-xs text-gray-500 mt-1">
                  Modelo: {getVehicleModelLabel(inspection.vehicle_model)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Tipo de Vistoria
              </label>
              <select
                value={newActivityType}
                onChange={(e) => setNewActivityType(e.target.value as 'livre' | 'guiada')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
              >
                <option value="livre">Vistoria Livre (fotos personalizadas)</option>
                <option value="guiada">
                  Vistoria Guiada (etapas do {getVehicleModelLabel(inspection.vehicle_model)})
                </option>
              </select>
            </div>

            {newActivityType === 'guiada' && (!inspection.vehicle_model || inspection.vehicle_model === 'livre') && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs sm:text-sm text-yellow-800">
                  ⚠️ A vistoria original não possui modelo definido. Não é possível criar vistoria guiada.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCreateActivity}
                disabled={creating || (newActivityType === 'guiada' && (!inspection.vehicle_model || inspection.vehicle_model === 'livre'))}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {creating ? 'Criando...' : 'Iniciar Atividade'}
              </button>
              <button
                onClick={() => setShowNewActivityForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de atividades */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-500 text-center py-4">Carregando atividades...</p>
        ) : activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Nenhum registro adicional. Clique em "Nova Atividade" para adicionar.
          </p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-red-300 transition-colors">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Capa da primeira foto */}
                {activity.photos.length > 0 && (
                  <div className="sm:w-48 flex-shrink-0 p-3 sm:p-4 flex items-center justify-center">
                    <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden w-full">
                      <img
                        src={activity.photos[0].photo_url}
                        alt="Capa da atividade"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Conteúdo */}
                <div className="flex-1 p-3 sm:p-4 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      activity.type === 'guiada' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {activity.type === 'guiada' ? 'Vistoria Guiada' : 'Vistoria Livre'}
                    </span>
                    {activity.type === 'guiada' && (
                      <span className="text-xs text-gray-600">
                        {getVehicleModelLabel(activity.vehicle_model)}
                      </span>
                    )}
                  </div>

                  {/* Observações */}
                  {activity.notes && (
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {activity.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      {activity.photos.length} {activity.photos.length === 1 ? 'foto' : 'fotos'}
                    </span>
                    <span>{formatDate(activity.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/inspection-activity/${activity.id}/view`)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-lg whitespace-nowrap"
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      Ver Detalhes
                    </button>
                    {user && (user.id === activity.created_by || user.role === 'gerente') && (
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        disabled={deletingId === activity.id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        title="Excluir atividade"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
