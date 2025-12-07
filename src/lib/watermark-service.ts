/**
 * Watermark Service
 * Adiciona marca d'água com timestamp e localização nas fotos
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  accuracy?: number;
}

export interface WatermarkData {
  timestamp: Date;
  location?: LocationData;
  formattedText: string[];
}

/**
 * Solicita permissão de localização e obtém coordenadas precisas
 */
export async function getLocation(): Promise<LocationData | null> {
  if (!navigator.geolocation) {
    console.warn('Geolocalização não suportada');
    return null;
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });

    const { latitude, longitude, accuracy } = position.coords;

    // Buscar informações de endereço usando API de geocoding reverso
    const locationData: LocationData = {
      latitude,
      longitude,
      accuracy,
    };

    try {
      const address = await reverseGeocode(latitude, longitude);
      Object.assign(locationData, address);
    } catch (error) {
      console.warn('Erro ao buscar endereço:', error);
    }

    return locationData;
  } catch (error) {
    console.error('Erro ao obter localização:', error);
    return null;
  }
}

/**
 * Geocoding reverso usando Nominatim (OpenStreetMap)
 */
async function reverseGeocode(lat: number, lon: number): Promise<Partial<LocationData>> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SR-Vistorias-App',
        },
      }
    );

    if (!response.ok) throw new Error('Erro na API de geocoding');

    const data = await response.json();
    const address = data.address || {};

    return {
      city: address.city || address.town || address.village || address.municipality,
      state: address.state,
      country: address.country,
      address: data.display_name,
    };
  } catch (error) {
    console.error('Erro no geocoding reverso:', error);
    return {};
  }
}

/**
 * Formata a data e hora para exibição
 */
function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Formata as coordenadas para exibição
 */
function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'L' : 'O';
  return `${Math.abs(lat).toFixed(6)}°${latDir} ${Math.abs(lon).toFixed(6)}°${lonDir}`;
}

/**
 * Prepara os dados da marca d'água
 */
export function prepareWatermarkData(location?: LocationData | null): WatermarkData {
  const timestamp = new Date();
  const formattedText: string[] = [];

  // Linha única: Data/hora + Localização + Coordenadas
  const parts: string[] = [];
  
  // Data e hora
  parts.push(formatDateTime(timestamp));

  // Localização (cidade, estado)
  if (location) {
    const locationParts: string[] = [];
    if (location.city) locationParts.push(location.city);
    if (location.state) locationParts.push(location.state);
    if (locationParts.length > 0) {
      parts.push(locationParts.join(', '));
    }

    // Coordenadas
    parts.push(formatCoordinates(location.latitude, location.longitude));
  }

  // Juntar tudo em uma linha separada por " | "
  formattedText.push(parts.join(' | '));

  return {
    timestamp,
    location: location || undefined,
    formattedText,
  };
}

/**
 * Adiciona marca d'água na imagem
 */
export async function addWatermarkToImage(
  file: File,
  watermarkData: WatermarkData
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Não foi possível criar contexto do canvas'));
      return;
    }

    img.onload = () => {
      try {
        // Configurar canvas com as dimensões da imagem
        canvas.width = img.width;
        canvas.height = img.height;

        // Desenhar a imagem original
        ctx.drawImage(img, 0, 0);

        // Configurar estilo da marca d'água - mais compacta
        const fontSize = Math.max(Math.floor(img.width / 60), 12);
        const padding = Math.floor(fontSize * 0.5);

        // Fundo semi-transparente
        const textLines = watermarkData.formattedText;
        ctx.font = `bold ${fontSize}px Arial`;
        const textWidth = ctx.measureText(textLines[0]).width;

        const boxWidth = textWidth + padding * 2;
        const boxHeight = fontSize + padding * 2;
        const x = img.width - boxWidth - padding;
        const y = padding;

        // Desenhar fundo preto com baixa opacidade
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x, y, boxWidth, boxHeight);

        // Desenhar texto com contorno (stroke)
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Contorno preto no texto
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(textLines[0], x + padding, y + padding);

        // Texto branco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(textLines[0], x + padding, y + padding);

        // Converter canvas para blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Erro ao converter canvas para blob'));
            }
          },
          file.type || 'image/jpeg',
          0.95
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem'));
    };

    // Carregar imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Processa foto com marca d'água completa
 */
export async function processPhotoWithWatermark(file: File): Promise<File> {
  try {
    // Obter localização
    const location = await getLocation();

    // Preparar dados da marca d'água
    const watermarkData = prepareWatermarkData(location);

    // Adicionar marca d'água
    const watermarkedBlob = await addWatermarkToImage(file, watermarkData);

    // Criar novo arquivo
    const watermarkedFile = new File(
      [watermarkedBlob],
      file.name,
      { type: file.type }
    );

    return watermarkedFile;
  } catch (error) {
    console.error('Erro ao processar foto com marca d\'água:', error);
    // Em caso de erro, retornar arquivo original
    return file;
  }
}

/**
 * Verifica se o navegador suporta geolocalização
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Solicita permissão de localização antecipadamente
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!isGeolocationSupported()) {
    return false;
  }

  try {
    const location = await getLocation();
    return location !== null;
  } catch (error) {
    console.error('Erro ao solicitar permissão de localização:', error);
    return false;
  }
}
