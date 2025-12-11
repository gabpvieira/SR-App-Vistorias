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
import { getThumbnailUrl } from '@/lib/image-utils';

interface InspectionCardProps {
  inspection: Inspection;
}

// Cache global para evitar requisições duplicadas
const photoCache = new Map<string, { count: number; url: string | null }>();
const userCache = new Map<string, string>();

export function InspectionCard({ inspection }: InspectionCardProps) {
  const { user } = useAuth();
  const isManager = user?.role === 'gerente';
  const [photoCount, setPhotoCount] = useState(0);
  const [firstPhoto, setFirstPhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // Verificar cache de fotos
        const cachedPhotos = photoCache.get(inspection.id);
        if (cachedPhotos) {
          if (isMounted) {
            setPhotoCount(cachedPhotos.count);
            setFirstPhoto(cachedPhotos.url);
          }
        } else {
          // Carregar fotos
          const photos = await getPhotosByInspectionId(inspection.id);
          const photoData = {
            count: photos.length,
            url: photos.length > 0 ? photos[0].photo_url : null,
          };
          photoCache.set(inspection.id, photoData);
          
          if (isMounted) {
            setPhotoCount(photoData.count);
            setFirstPhoto(photoData.url);
          }
        }

        // Carregar nome do usuário (apenas gerente)
        if (isManager) {
          const cachedName = userCache.get(inspection.user_id);
          if (cachedName) {
            if (isMounted) setUserName(cachedName);
          } else {
            const { data } = await supabase
              .from('users')
              .select('name')
              .eq('id', inspection.user_id)
              .single();
            
            if (data) {
              userCache.set(inspection.user_id, data.name);
              if (isMounted) setUserName(data.name);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [inspection.id, inspection.user_id, isManager]);

  // Gerar URL do thumbnail (400px, qualidade 60%)
  const thumbnailUrl = firstPhoto ? getThumbnailUrl(firstPhoto, 400, 60) : null;

  return (
    <Link to={`/vistoria/${inspection.id}`} className="group block">
      <Card className="overflow-hidden border-2 hover:border-primary/50 hover:shadow-xl transition-all duration-300 bg-card h-full">
        {/* Image Container */}
        <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {thumbnailUrl && !imageError ? (
            <>
              {/* Skeleton enquanto carrega */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
              )}
              <img
                src={thumbnailUrl}
                alt={`Vistoria ${inspection.vehicle_plate}`}
                className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                decoding="async"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Badge Overlay */}
          <div className="absolute top-3 right-3 z-10">
            <InspectionTypeBadge type={inspection.type} size="sm" />
          </div>
          
          {/* Photo Count Badge */}
          <div className="absolute bottom-3 right-3 z-10 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium">
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
