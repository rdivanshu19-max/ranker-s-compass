import { supabase } from '@/lib/supabase';

const PUBLIC_CONTENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-content`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type PublicContentSource = 'live' | 'backup';

export const withRequestTimeout = async <T,>(request: PromiseLike<T>, timeoutMs = 8000): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve(request), timeout]);
  } finally {
    clearTimeout(timer!);
  }
};

const callPublicContentFunction = async (type: 'materials' | 'courses' | 'feedback') => {
  const response = await withRequestTimeout(fetch(`${PUBLIC_CONTENT_URL}?type=${type}`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  }));

  if (!response.ok) throw new Error(`Public content service failed: ${response.status}`);
  return response.json();
};

export const fetchPublicMaterials = async (): Promise<{ data: any[]; source: PublicContentSource }> => {
  try {
    const { data, error } = await withRequestTimeout(
      supabase.from('materials').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false })
    );
    if (error) throw error;
    return { data: data || [], source: 'live' };
  } catch {
    const payload = await callPublicContentFunction('materials');
    return { data: payload.materials || [], source: 'live' };
  }
};

export const fetchPublicCourses = async (): Promise<{ data: any[]; source: PublicContentSource }> => {
  try {
    const { data, error } = await withRequestTimeout(
      supabase.from('courses').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false })
    );
    if (error) throw error;
    return { data: data || [], source: 'live' };
  } catch {
    const payload = await callPublicContentFunction('courses');
    return { data: payload.courses || [], source: 'live' };
  }
};

export const fetchPublicFeedback = async (): Promise<any[]> => {
  try {
    const { data, error } = await withRequestTimeout(
      supabase.from('feedback').select('*').order('created_at', { ascending: false })
    );
    if (error) throw error;
    return data || [];
  } catch {
    const payload = await callPublicContentFunction('feedback');
    return payload.feedback || [];
  }
};

export const submitPublicFeedback = async (payload: { user_id: string | null; display_name: string; rating: number; review: string | null }) => {
  try {
    const { error } = await withRequestTimeout(supabase.from('feedback').insert(payload));
    if (!error) return { error: null };
  } catch {}

  const response = await withRequestTimeout(fetch(PUBLIC_CONTENT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ type: 'feedback', ...payload }),
  }));

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    return { error: new Error(body.error || 'Failed to submit feedback') };
  }

  return { error: null };
};