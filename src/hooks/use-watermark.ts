import { useState, useCallback, useEffect } from 'react';
import {
  getLocation,
  prepareWatermarkData,
  addWatermarkToImage,
  processPhotoWithWatermark,
  isGeolocationSupported,
  requestLocationPermission,
  type LocationData,
  type WatermarkData,
} from '@/lib/watermark-service';

export interface UseWatermarkOptions {
  autoRequestPermission?: boolean;
}

export function useWatermark(options: UseWatermarkOptions = {}) {
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Solicitar permissão automaticamente ao montar
  useEffect(() => {
    if (options.autoRequestPermission && isGeolocationSupported()) {
      requestPermission();
    }
  }, [options.autoRequestPermission]);

  const requestPermission = useCallback(async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      const hasPermission = await requestLocationPermission();
      setIsLocationEnabled(hasPermission);

      if (hasPermission) {
        const location = await getLocation();
        setCurrentLocation(location);
      } else {
        setLocationError('Permissão de localização negada');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      setLocationError('Erro ao obter localização');
      setIsLocationEnabled(false);
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  const refreshLocation = useCallback(async () => {
    if (!isGeolocationSupported()) {
      setLocationError('Geolocalização não suportada');
      return null;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      const location = await getLocation();
      setCurrentLocation(location);
      setIsLocationEnabled(true);
      return location;
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      setLocationError('Erro ao obter localização');
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  const addWatermark = useCallback(
    async (file: File): Promise<File> => {
      try {
        // Usar localização atual ou obter nova
        let location = currentLocation;
        if (!location && isLocationEnabled) {
          location = await refreshLocation();
        }

        // Preparar dados da marca d'água
        const watermarkData = prepareWatermarkData(location);

        // Adicionar marca d'água
        const watermarkedBlob = await addWatermarkToImage(file, watermarkData);

        // Criar novo arquivo
        return new File([watermarkedBlob], file.name, { type: file.type });
      } catch (error) {
        console.error('Erro ao adicionar marca d\'água:', error);
        // Retornar arquivo original em caso de erro
        return file;
      }
    },
    [currentLocation, isLocationEnabled, refreshLocation]
  );

  const processPhoto = useCallback(async (file: File): Promise<File> => {
    return processPhotoWithWatermark(file);
  }, []);

  return {
    isLocationEnabled,
    currentLocation,
    isLoadingLocation,
    locationError,
    isGeolocationSupported: isGeolocationSupported(),
    requestPermission,
    refreshLocation,
    addWatermark,
    processPhoto,
  };
}
