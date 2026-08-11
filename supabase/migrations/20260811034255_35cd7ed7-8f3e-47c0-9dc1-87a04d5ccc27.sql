CREATE POLICY "user_own_folder_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'course-posters'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND NOT public.is_banned(auth.uid())
);

CREATE POLICY "user_own_folder_update" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'course-posters'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'course-posters'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "user_own_folder_delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'course-posters'
  AND (storage.foldername(name))[1] = 'users'
  AND (storage.foldername(name))[2] = auth.uid()::text
);