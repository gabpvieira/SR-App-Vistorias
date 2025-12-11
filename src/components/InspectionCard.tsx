import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { InspectionTypeBadge } from './InspectionTypeBadge';
import { Inspection } from '@/lib/supabase';
import { formatShortDate } from '@/lib/date-utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { getPhotosByInspectionId } from '@/lib/supabase-queries';
import { supabase } from '@/lib/supabase';
import { LazyImage } from '@/components/LazyImage';

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
    <Link to={`/vistoria/${inspection.id}`} className="group block">
      <Card className="overflow-hidden border-2 hover:border-primary/50 hover:shadow-xl transition-all duration-300 animate-fade-in bg-card h-full">
        {/* Image Container */}
        <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {firstPhoto ? (
            <LazyImage
              src={firstPhoto}
              alt={`Vistoria ${inspection.vehicle_plate}`}
              optimizedWidth={400}
              quality={70}
              aspectRatio="4/3"
              className="group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Badge Overlay */}
          <div className="absolute top-3 right-3">
            <InspectionTypeBadge type={inspection.type} size="sm" />
          </div>
          
          {/* Photo Count Badge */}
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium">
            <Camera className="h-3.5 w-3.5" />
            <span>{photoCount}</span>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-3">
          {/* Plate & Model */}
          <div>
            <h3 className="text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
              {inspection.vehicle_plate || 'SEM PLACA'}
            </h3>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mt-0.5">
              {inspection.vehicle_model_name}
            </p>
          </div>
          
          {/* Details */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{inspection.vehicle_year}</span>
            <span>•</span>
            <span className="capitalize">{inspection.vehicle_status === 'novo' ? 'Novo' : 'Seminovo'}</span>
          </div>
          
          {/* Date */}
          <div className="text-xs text-muted-foreground">
            {formatShortDate(inspection.created_at)}
          </div>
          
          {/* User Name (Manager only) */}
          {isManager && userName && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground font-medium">
                {userName}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
