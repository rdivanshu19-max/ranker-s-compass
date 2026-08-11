import { supabase } from '@/lib/supabase';

const BUCKET = 'course-posters';

/**
 * Uploads a file into the signed-in user's own folder and returns its public URL.
 * Storage policies only allow writes under `users/<uid>/`.
 */
export async function uploadUserFile(file: File, userId: string, folder = 'misc') {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `users/${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, cacheControl: '3600' });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Admin/moderator upload for shared assets (posters, product images). */
export async function uploadAdminFile(file: File, folder: string) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, cacheControl: '3600' });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
