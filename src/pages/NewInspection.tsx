import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/Header';
import { VehicleModelSelector } from '@/components/VehicleModelSelector';
import { useInspections } from '@/contexts/InspectionContext';
import { useToast } from '@/hooks/use-toast';
import { useWatermark } from '@/hooks/use-watermark';
import { Helmet } from 'react-helmet-async';
import { VehicleModel } from '@/types';
import { uploadAndSaveInspectionPhoto } from '@/lib/supabase-queries';

// Placeholder images for demo
const demoPhotos = [
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80',
  'https://images.unsplash.com/photo-1586191582066-1ec5e52f33b2?w=800&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
];

export default function NewInspection() {
  const [type, setType] = useState<'troca' | 'manutencao' | ''>('');
  const [vehicleModel, setVehicleModel] = useState<VehicleModel | null>(null);
  const [plate, setPlate] = useState('');
  const [modelName, setModelName] = useState('');
  const [fabricationYear, setFabricationYear] = useState('');
  const [modelYear, setModelYear] = useState('');
  const [vehicleStatus, setVehicleStatus] = useState<'novo' | 'seminovo' | ''>('');
  const [observations, setObservations] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addInspection } = useInspections();
  const { toast } = useToast();
  const { addWatermark, requestPermission, isLocationEnabled } = useWatermark({ autoRequestPermission: false });
  const navigate = useNavigate();

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [photoPreviewUrls]);

  const formatPlate = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
  };

  const validatePlate = (value: string) => {
    const cleaned = value.replace(/[^A-Z0-9]/gi, '');
    // Old format: ABC1234 or new format: ABC1D23
    const oldFormat = /^[A-Z]{3}[0-9]{4}$/i;
    const newFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/i;
    return oldFormat.test(cleaned) || newFormat.test(cleaned);
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPlate(e.target.value);
    setPlate(formatted);
    if (errors.plate) {
      setErrors(prev => ({ ...prev, plate: '' }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filesArray = Array.from(files);
    
    // Store actual File objects
    setPhotos(prev => [...prev, ...filesArray]);
    
    // Create preview URLs
    const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    
    if (errors.photos) {
      setErrors(prev => ({ ...prev, photos: '' }));
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    // Remove from photos array
    setPhotos(prev => prev.filter((_, i) => i !== index));
    
    // Remove from preview URLs and revoke object URL
    setPhotoPreviewUrls(prev => {
      const urlToRemove = prev[index];
      if (urlToRemove.startsWith('blob:')) {
        URL.revokeObjectURL(urlToRemove);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!type) {
      newErrors.type = 'Selecione o tipo de vistoria';
    }

    // Requirement 1.3: Vehicle model is required for "Troca" inspections
    if (type === 'troca' && !vehicleModel) {
      newErrors.vehicleModel = 'Selecione o modelo de vistoria guiada';
    }

    if (!plate) {
      newErrors.plate = 'Informe a placa do veículo';
    } else if (!validatePlate(plate)) {
      newErrors.plate = 'Formato de placa inválido';
    }

    if (!modelName.trim()) {
      newErrors.modelName = 'Informe o modelo do veículo';
    }

    if (!fabricationYear) {
      newErrors.fabricationYear = 'Informe o ano de fabricação';
    } else {
      const year = parseInt(fabricationYear);
      const currentYear = new Date().getFullYear();
      if (year < 2000 || year > currentYear) {
        newErrors.fabricationYear = `Ano deve estar entre 2000 e ${currentYear}`;
      }
    }

    if (!modelYear) {
      newErrors.modelYear = 'Informe o ano do modelo';
    }

    if (!vehicleStatus) {
      newErrors.vehicleStatus = 'Selecione o status do veículo';
    }

    // Photos are only required for non-guided inspections
    const isGuidedInspection = type === 'troca' && vehicleModel && vehicleModel !== 'livre';
    if (!isGuidedInspection && photos.length === 0) {
      newErrors.photos = 'Adicione pelo menos 1 foto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // If type is "troca" and model is not "livre", redirect to guided inspection
    if (type === 'troca' && vehicleModel && vehicleModel !== 'livre') {
      const params = new URLSearchParams({
        model: vehicleModel,
        plate: plate,
        modelName: modelName.toUpperCase(),
        fabricationYear: fabricationYear,
        modelYear: modelYear,
        vehicleStatus: vehicleStatus as string,
      });
      navigate(`/vistoria/guiada?${params.toString()}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Criar a vistoria
      const inspection = await addInspection({
        user_id: '', // Será preenchido pelo contexto
        vehicle_plate: plate,
        type: type as 'troca' | 'manutencao',
        vehicle_model_name: modelName.toUpperCase(),
        vehicle_year: parseInt(fabricationYear),
        vehicle_model_year: parseInt(modelYear),
        vehicle_status: vehicleStatus as 'novo' | 'seminovo',
        notes: observations || undefined,
        is_guided_inspection: false,
        guided_photos_complete: false,
        status: 'rascunho',
      });

      // Upload das fotos com marca d'água
      if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          
          // Aplicar marca d'água (data/hora + localização + coordenadas)
          const watermarkedFile = await addWatermark(file);
          
          // Upload da foto
          await uploadAndSaveInspectionPhoto(
            inspection.id,
            watermarkedFile,
            `Foto ${i + 1}`,
            i + 1
          );
        }
      }

      toast({
        title: 'Vistoria cadastrada!',
        description: `Vistoria da placa ${plate} registrada com sucesso.`,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao salvar vistoria:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a vistoria. Tente novamente.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Nova Vistoria - SR Caminhões</title>
        <meta name="description" content="Cadastre uma nova vistoria de veículo no sistema SR Caminhões." />
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <Header />

        <main className="container px-4 py-6 max-w-2xl">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Link>

          <div className="bg-card border border-border rounded-lg p-6">
            <h1 className="text-xl font-bold mb-6">Nova Vistoria</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type */}
              <div className="space-y-2">
                <Label className={errors.type ? 'text-destructive' : ''}>
                  Tipo de Vistoria *
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setType('troca');
                      if (errors.type) setErrors(prev => ({ ...prev, type: '' }));
                    }}
                    className={`h-11 px-4 rounded-md border-2 font-medium transition-all ${
                      type === 'troca'
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    Troca
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setType('manutencao');
                      setVehicleModel(null);
                      if (errors.type) setErrors(prev => ({ ...prev, type: '' }));
                      
                      // Solicitar permissão de localização para marca d'água
                      if (!isLocationEnabled) {
                        await requestPermission();
                      }
                    }}
                    className={`h-11 px-4 rounded-md border-2 font-medium transition-all ${
                      type === 'manutencao'
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    Manutenção
                  </button>
                </div>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type}</p>
                )}
              </div>

              {/* Vehicle Model Selector - Only for "Troca" inspections */}
              {type === 'troca' && (
                <div className="space-y-3">
                  <Label className={errors.vehicleModel ? 'text-destructive' : ''}>
                    Modelo de Vistoria Guiada *
                  </Label>
                  <RadioGroup
                    value={vehicleModel || ''}
                    onValueChange={(v) => {
                      setVehicleModel(v as VehicleModel);
                      if (errors.vehicleModel) {
                        setErrors(prev => ({ ...prev, vehicleModel: '' }));
                      }
                    }}
                    className="grid grid-cols-1 gap-3"
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                      <RadioGroupItem value="cavalo" id="cavalo" />
                      <Label htmlFor="cavalo" className="cursor-pointer font-normal flex-1">
                        <div>
                          <p className="font-semibold">Cavalo</p>
                          <p className="text-sm text-muted-foreground">13 etapas obrigatórias</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                      <RadioGroupItem value="rodotrem_basculante" id="rodotrem_basculante" />
                      <Label htmlFor="rodotrem_basculante" className="cursor-pointer font-normal flex-1">
                        <div>
                          <p className="font-semibold">Rodotrem Basculante</p>
                          <p className="text-sm text-muted-foreground">7 etapas obrigatórias</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                      <RadioGroupItem value="rodotrem_graneleiro" id="rodotrem_graneleiro" />
                      <Label htmlFor="rodotrem_graneleiro" className="cursor-pointer font-normal flex-1">
                        <div>
                          <p className="font-semibold">Rodotrem Graneleiro</p>
                          <p className="text-sm text-muted-foreground">7 etapas obrigatórias</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                      <RadioGroupItem value="livre" id="livre" />
                      <Label htmlFor="livre" className="cursor-pointer font-normal flex-1">
                        <div>
                          <p className="font-semibold">Livre</p>
                          <p className="text-sm text-muted-foreground">Upload livre de fotos</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.vehicleModel && (
                    <p className="text-sm text-destructive">{errors.vehicleModel}</p>
                  )}
                </div>
              )}

              {/* Plate */}
              <div className="space-y-2">
                <Label htmlFor="plate" className={errors.plate ? 'text-destructive' : ''}>
                  Placa do Veículo *
                </Label>
                <Input
                  id="plate"
                  placeholder="ABC-1234"
                  value={plate}
                  onChange={handlePlateChange}
                  maxLength={8}
                  className={errors.plate ? 'border-destructive' : ''}
                />
                {errors.plate && (
                  <p className="text-sm text-destructive">{errors.plate}</p>
                )}
              </div>

              {/* Model Name */}
              <div className="space-y-2">
                <Label htmlFor="modelName" className={errors.modelName ? 'text-destructive' : ''}>
                  Modelo do Veículo *
                </Label>
                <Input
                  id="modelName"
                  placeholder="FH 540 6X4 23/23"
                  value={modelName}
                  onChange={(e) => {
                    setModelName(e.target.value.toUpperCase());
                    if (errors.modelName) {
                      setErrors(prev => ({ ...prev, modelName: '' }));
                    }
                  }}
                  maxLength={100}
                  className={`uppercase ${errors.modelName ? 'border-destructive' : ''}`}
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.modelName && (
                  <p className="text-sm text-destructive">{errors.modelName}</p>
                )}
              </div>

              {/* Fabrication Year */}
              <div className="space-y-2">
                <Label htmlFor="fabricationYear" className={errors.fabricationYear ? 'text-destructive' : ''}>
                  Ano de Fabricação *
                </Label>
                <Input
                  id="fabricationYear"
                  type="number"
                  placeholder="2024"
                  value={fabricationYear}
                  onChange={(e) => {
                    const year = e.target.value;
                    setFabricationYear(year);
                    // Auto-set model year to fabrication year when changed
                    if (year && !modelYear) {
                      setModelYear(year);
                    }
                    if (errors.fabricationYear) {
                      setErrors(prev => ({ ...prev, fabricationYear: '' }));
                    }
                  }}
                  min={2000}
                  max={new Date().getFullYear()}
                  className={errors.fabricationYear ? 'border-destructive' : ''}
                />
                {errors.fabricationYear && (
                  <p className="text-sm text-destructive">{errors.fabricationYear}</p>
                )}
              </div>

              {/* Model Year */}
              <div className="space-y-2">
                <Label htmlFor="modelYear" className={errors.modelYear ? 'text-destructive' : ''}>
                  Ano do Modelo *
                </Label>
                <Select
                  value={modelYear}
                  onValueChange={(value) => {
                    setModelYear(value);
                    if (errors.modelYear) {
                      setErrors(prev => ({ ...prev, modelYear: '' }));
                    }
                  }}
                  disabled={!fabricationYear}
                >
                  <SelectTrigger className={`h-11 ${errors.modelYear ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Selecione o ano do modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {fabricationYear && (
                      <>
                        <SelectItem value={fabricationYear}>{fabricationYear}</SelectItem>
                        <SelectItem value={String(parseInt(fabricationYear) + 1)}>
                          {parseInt(fabricationYear) + 1}
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {!fabricationYear && (
                  <p className="text-xs text-muted-foreground">Selecione primeiro o ano de fabricação</p>
                )}
                {errors.modelYear && (
                  <p className="text-sm text-destructive">{errors.modelYear}</p>
                )}
              </div>

              {/* Vehicle Status */}
              <div className="space-y-2">
                <Label className={errors.vehicleStatus ? 'text-destructive' : ''}>
                  Status do Veículo *
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setVehicleStatus('novo');
                      if (errors.vehicleStatus) {
                        setErrors(prev => ({ ...prev, vehicleStatus: '' }));
                      }
                    }}
                    className={`h-11 px-4 rounded-md border-2 font-medium transition-all ${
                      vehicleStatus === 'novo'
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    Novo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVehicleStatus('seminovo');
                      if (errors.vehicleStatus) {
                        setErrors(prev => ({ ...prev, vehicleStatus: '' }));
                      }
                    }}
                    className={`h-11 px-4 rounded-md border-2 font-medium transition-all ${
                      vehicleStatus === 'seminovo'
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    Seminovo
                  </button>
                </div>
                {errors.vehicleStatus && (
                  <p className="text-sm text-destructive">{errors.vehicleStatus}</p>
                )}
              </div>

              {/* Observations - Only show for non-guided inspections */}
              {(type !== 'troca' || vehicleModel === 'livre' || !vehicleModel) && (
                <div className="space-y-2">
                  <Label htmlFor="observations">Observações (opcional)</Label>
                  <Textarea
                    id="observations"
                    placeholder="Descreva detalhes relevantes da vistoria..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    maxLength={500}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {observations.length}/500
                  </p>
                </div>
              )}

              {/* Photos - Only show for non-guided inspections */}
              {(type !== 'troca' || vehicleModel === 'livre' || !vehicleModel) && (
                <div className="space-y-3">
                <Label className={errors.photos ? 'text-destructive' : ''}>
                  Fotos *
                </Label>
                
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 ${
                    errors.photos ? 'border-destructive' : 'border-border'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Arraste fotos ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG ou HEIC (máx. 10MB cada)
                  </p>
                </div>

                {/* Mobile camera button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Tirar Foto
                </Button>

                {errors.photos && (
                  <p className="text-sm text-destructive">{errors.photos}</p>
                )}

                {/* Photo previews */}
                {photoPreviewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-[4/3]">
                        <img
                          src={url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {photos.length} foto{photos.length !== 1 ? 's' : ''} selecionada{photos.length !== 1 ? 's' : ''}
                  </p>
                )}
                </div>
              )}

              {/* Submit */}
              <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : type === 'troca' && vehicleModel && vehicleModel !== 'livre' ? (
                  'Iniciar Vistoria Guiada'
                ) : (
                  'Salvar Vistoria'
                )}
              </Button>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
