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

export async function authenticateUser(email: string, password: string) {
  const { data, error } = await supabase.rpc('authenticate_user', {
    input_email: email,
    input_password: password,
  });

  if (error) throw error;
  
  if (!data || data.length === 0) {
    throw new Error('Invalid email or password');
  }

  // Verificar se o usuário está ativo
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('is_active')
    .eq('id', data[0].user_id)
    .single();

  if (userError) throw userError;

  if (!userData.is_active) {
    throw new Error('User account is deactivated');
  }

  return {
    id: data[0].user_id,
    name: data[0].user_name,
    email: data[0].user_email,
    role: data[0].user_role,
    is_active: userData.is_active,
  };
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role: 'vendedor' | 'gerente';
}) {
  // Check if email already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', userData.email)
    .single();

  if (existing) {
    throw new Error('Email already registered');
  }

  // Insert user - password will be hashed automatically by trigger
  const { data, error } = await supabase
    .from('users')
    .insert({
      name: userData.name,
      email: userData.email,
      password_hash: userData.password, // Will be hashed by trigger
      role: userData.role,
      is_active: true, // Novo usuário sempre começa ativo
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deactivateUser(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function activateUser(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUser(userId: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
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
  
  // Sanitizar o label removendo caracteres especiais
  const sanitizedLabel = label
    .normalize('NFD') // Normalizar caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiais exceto letras, números, espaços e hífens
    .replace(/\s+/g, '_') // Substituir espaços por underscore
    .replace(/_+/g, '_') // Remover underscores duplicados
    .replace(/^_|_$/g, ''); // Remover underscores no início e fim
  
  const fileName = stepOrder 
    ? `${stepOrder}-${sanitizedLabel}.${fileExt}`
    : `${sanitizedLabel}-${Date.now()}.${fileExt}`;
  
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

// ============================================
// INSPECTION ACTIVITIES QUERIES
// ============================================

export interface InspectionActivity {
  id: string;
  inspection_id: string;
  type: 'livre' | 'guiada';
  vehicle_model?: VehicleModel;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionActivityPhoto {
  id: string;
  activity_id: string;
  label: string;
  step_order?: number;
  photo_url: string;
  thumbnail_url?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  exif_data?: any;
  created_at: string;
}

export async function getActivitiesByInspectionId(inspectionId: string) {
  const { data, error } = await supabase
    .from('inspection_activities')
    .select('*')
    .eq('inspection_id', inspectionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as InspectionActivity[];
}

export async function createInspectionActivity(
  activity: Omit<InspectionActivity, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('inspection_activities')
    .insert(activity)
    .select()
    .single();

  if (error) throw error;
  return data as InspectionActivity;
}

export async function getActivityPhotos(activityId: string) {
  const { data, error } = await supabase
    .from('inspection_activity_photos')
    .select('*')
    .eq('activity_id', activityId)
    .order('step_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as InspectionActivityPhoto[];
}

export async function createActivityPhoto(
  photo: Omit<InspectionActivityPhoto, 'id' | 'created_at'>
) {
  const { data, error } = await supabase
    .from('inspection_activity_photos')
    .insert(photo)
    .select()
    .single();

  if (error) throw error;
  return data as InspectionActivityPhoto;
}

export async function uploadAndSaveActivityPhoto(
  inspectionId: string,
  activityId: string,
  file: File,
  label: string,
  stepOrder?: number
): Promise<InspectionActivityPhoto> {
  // Upload to storage (usando o mesmo bucket)
  const fileExt = file.name.split('.').pop();
  
  // Sanitizar o label removendo caracteres especiais
  const sanitizedLabel = label
    .normalize('NFD') // Normalizar caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiais exceto letras, números, espaços e hífens
    .replace(/\s+/g, '_') // Substituir espaços por underscore
    .replace(/_+/g, '_') // Remover underscores duplicados
    .replace(/^_|_$/g, ''); // Remover underscores no início e fim
  
  const fileName = stepOrder 
    ? `activity-${activityId}-${stepOrder}-${sanitizedLabel}.${fileExt}`
    : `activity-${activityId}-${sanitizedLabel}-${Date.now()}.${fileExt}`;
  
  const filePath = `inspections/${inspectionId}/activities/${fileName}`;

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

  const photoUrl = data.publicUrl;

  // Get image dimensions
  const img = new Image();
  const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = URL.createObjectURL(file);
  });

  // Create database record
  const photoData: Omit<InspectionActivityPhoto, 'id' | 'created_at'> = {
    activity_id: activityId,
    label,
    step_order: stepOrder,
    photo_url: photoUrl,
    file_size: file.size,
    mime_type: file.type,
    width: dimensions.width,
    height: dimensions.height,
  };

  return await createActivityPhoto(photoData);
}

// ============================================
// INSPECTION COMMENTS QUERIES
// ============================================

export interface InspectionComment {
  id: string;
  inspection_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionCommentWithUser extends InspectionComment {
  user_name: string;
  user_role: string;
}

export async function getCommentsByInspectionId(inspectionId: string) {
  const { data, error } = await supabase
    .from('inspection_comments')
    .select(`
      *,
      users (
        name,
        role
      )
    `)
    .eq('inspection_id', inspectionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Transform data to include user info
  return data.map(comment => ({
    ...comment,
    user_name: (comment.users as any)?.name || 'Usuário',
    user_role: (comment.users as any)?.role || 'vendedor',
  })) as InspectionCommentWithUser[];
}

export async function createInspectionComment(
  comment: Omit<InspectionComment, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('inspection_comments')
    .insert(comment)
    .select()
    .single();

  if (error) throw error;
  return data as InspectionComment;
}

export async function updateInspectionComment(commentId: string, content: string) {
  const { data, error } = await supabase
    .from('inspection_comments')
    .update({ content })
    .eq('id', commentId)
    .select()
    .single();

  if (error) throw error;
  return data as InspectionComment;
}

export async function deleteInspectionComment(commentId: string) {
  const { error } = await supabase
    .from('inspection_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

// ============================================
// COMMENT LIKES QUERIES
// ============================================

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export async function getCommentLikes(commentId: string) {
  const { data, error } = await supabase
    .from('inspection_comment_likes')
    .select('*')
    .eq('comment_id', commentId);

  if (error) throw error;
  return data as CommentLike[];
}

export async function toggleCommentLike(commentId: string, userId: string) {
  // Check if already liked
  const { data: existing } = await supabase
    .from('inspection_comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from('inspection_comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);

    if (error) throw error;
    return { liked: false };
  } else {
    // Like
    const { error } = await supabase
      .from('inspection_comment_likes')
      .insert({ comment_id: commentId, user_id: userId });

    if (error) throw error;
    return { liked: true };
  }
}

export async function getCommentLikesCount(commentId: string) {
  const { count, error } = await supabase
    .from('inspection_comment_likes')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', commentId);

  if (error) throw error;
  return count || 0;
}

export async function hasUserLikedComment(commentId: string, userId: string) {
  const { data, error } = await supabase
    .from('inspection_comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

// ============================================
// DELETE INSPECTION ACTIVITY
// ============================================

export async function deleteInspectionActivity(activityId: string) {
  // 1. Get all photos to delete from storage
  const photos = await getActivityPhotos(activityId);
  
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
      
      if (storageError) console.error('Error deleting activity photos from storage:', storageError);
    }
  }

  // 3. Delete activity (photos will be deleted by CASCADE)
  const { error } = await supabase
    .from('inspection_activities')
    .delete()
    .eq('id', activityId);

  if (error) throw error;
}
