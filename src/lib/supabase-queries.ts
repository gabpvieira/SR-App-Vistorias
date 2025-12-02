import { supabase, Inspection, InspectionPhoto, InspectionStepTemplate, VehicleModel } from './supabase';

// ============================================
// USER QUERIES
// ============================================

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// INSPECTION QUERIES
// ============================================

export async function getInspectionsByUserId(userId: string) {
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Inspection[];
}

export async function getAllInspections() {
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Inspection[];
}

export async function getInspectionById(inspectionId: string) {
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('id', inspectionId)
    .single();

  if (error) throw error;
  return data as Inspection;
}

export async function createInspection(inspection: Omit<Inspection, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('inspections')
    .insert(inspection)
    .select()
    .single();

  if (error) throw error;
  return data as Inspection;
}

export async function updateInspection(inspectionId: string, updates: Partial<Inspection>) {
  const { data, error } = await supabase
    .from('inspections')
    .update(updates)
    .eq('id', inspectionId)
    .select()
    .single();

  if (error) throw error;
  return data as Inspection;
}

// ============================================
// INSPECTION PHOTO QUERIES
// ============================================

export async function getPhotosByInspectionId(inspectionId: string) {
  const { data, error } = await supabase
    .from('inspection_photos')
    .select('*')
    .eq('inspection_id', inspectionId)
    .order('step_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as InspectionPhoto[];
}

export async function createInspectionPhoto(photo: Omit<InspectionPhoto, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('inspection_photos')
    .insert(photo)
    .select()
    .single();

  if (error) throw error;
  return data as InspectionPhoto;
}

export async function deleteInspectionPhoto(photoId: string) {
  const { error } = await supabase
    .from('inspection_photos')
    .delete()
    .eq('id', photoId);

  if (error) throw error;
}

// ============================================
// INSPECTION STEP TEMPLATE QUERIES
// ============================================

export async function getStepsByVehicleModel(vehicleModel: Exclude<VehicleModel, 'livre'>) {
  const { data, error } = await supabase
    .from('inspection_steps_template')
    .select('*')
    .eq('vehicle_model', vehicleModel)
    .order('step_order', { ascending: true });

  if (error) throw error;
  return data as InspectionStepTemplate[];
}

export async function getAllStepTemplates() {
  const { data, error } = await supabase
    .from('inspection_steps_template')
    .select('*')
    .order('vehicle_model', { ascending: true })
    .order('step_order', { ascending: true });

  if (error) throw error;
  return data as InspectionStepTemplate[];
}

// ============================================
// STORAGE QUERIES
// ============================================

export async function uploadInspectionPhoto(
  inspectionId: string,
  file: File,
  label: string,
  stepOrder?: number
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = stepOrder 
    ? `${stepOrder}-${label.replace(/\s+/g, '_')}.${fileExt}`
    : `${label.replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`;
  
  const filePath = `inspections/${inspectionId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('inspection-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('inspection-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Upload photo and create database record
 */
export async function uploadAndSaveInspectionPhoto(
  inspectionId: string,
  file: File,
  label: string,
  stepOrder?: number
): Promise<InspectionPhoto> {
  // Upload to storage
  const photoUrl = await uploadInspectionPhoto(inspectionId, file, label, stepOrder);

  // Get image dimensions
  const img = new Image();
  const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = URL.createObjectURL(file);
  });

  // Create database record
  const photoData: Omit<InspectionPhoto, 'id' | 'created_at'> = {
    inspection_id: inspectionId,
    label,
    step_order: stepOrder,
    photo_url: photoUrl,
    file_size: file.size,
    mime_type: file.type,
    width: dimensions.width,
    height: dimensions.height,
  };

  return await createInspectionPhoto(photoData);
}

export async function deleteInspectionPhotoFromStorage(photoUrl: string) {
  // Extract file path from URL
  const urlParts = photoUrl.split('/inspection-photos/');
  if (urlParts.length < 2) return;
  
  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('inspection-photos')
    .remove([filePath]);

  if (error) throw error;
}

/**
 * Delete entire inspection with all photos
 */
export async function deleteInspection(inspectionId: string) {
  // 1. Get all photos to delete from storage
  const photos = await getPhotosByInspectionId(inspectionId);
  
  // 2. Delete photos from storage
  if (photos.length > 0) {
    const filePaths = photos
      .map(photo => {
        const urlParts = photo.photo_url.split('/inspection-photos/');
        return urlParts.length >= 2 ? urlParts[1] : null;
      })
      .filter(Boolean) as string[];

    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('inspection-photos')
        .remove(filePaths);
      
      if (storageError) console.error('Error deleting photos from storage:', storageError);
    }
  }

  // 3. Delete inspection (photos will be deleted by CASCADE)
  const { error } = await supabase
    .from('inspections')
    .delete()
    .eq('id', inspectionId);

  if (error) throw error;
}
