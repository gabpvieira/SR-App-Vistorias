import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InspectionTypeBadge } from './InspectionTypeBadge';
import { Inspection } from '@/lib/supabase';
import { formatShortDate } from '@/lib/date-utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { getPhotosByInspectionId } from '@/lib/supabase-queries';
import { supabase } from '@/lib/supabase';

interface InspectionCardProps {
  inspection: Inspection;
}

export function InspectionCard({ inspection }: InspectionCardProps) {
  const { user } = useAuth();
  const isManager = user?.role === 'gerente';
  const [photoCount, setPhotoCount] = useState(0);
  const [firstPhoto, setFirstPhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        // Load photos
        const photos = await getPhotosByInspectionId(inspection.id);
        setPhotoCount(photos.length);
        if (photos.length > 0) {
          setFirstPhoto(photos[0].photo_url);
        }

        // Load user name if manager
        if (isManager) {
          const { data } = await supabase
            .from('users')
            .select('name')
            .eq('id', inspection.user_id)
            .single();
          if (data) setUserName(data.name);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    }
    loadData();
  }, [inspection.id, inspection.user_id, isManager]);

  return (
    <Card className="overflow-hidden hover:border-primary/30 transition-colors animate-fade-in">
      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
        {firstPhoto ? (
          <img
            src={firstPhoto}
            alt={`Vistoria ${inspection.vehicle_plate}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <InspectionTypeBadge type={inspection.type} size="sm" />
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-bold text-foreground">{inspection.vehicle_plate || 'Sem placa'}</h3>
            <p className="text-sm text-muted-foreground uppercase">{inspection.vehicle_model_name}</p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Camera className="h-4 w-4" />
            <span className="text-sm">{photoCount}</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-1">
          {inspection.vehicle_year} • {inspection.vehicle_status === 'novo' ? 'Novo' : 'Seminovo'}
        </p>
        
        <p className="text-sm text-muted-foreground mb-1">
          {formatShortDate(inspection.created_at)}
        </p>
        
        {isManager && userName && (
          <p className="text-sm text-muted-foreground mb-3">
            {userName}
          </p>
        )}

        <Button asChild variant="outline" className="w-full mt-2">
          <Link to={`/vistoria/${inspection.id}`}>Ver detalhes</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
