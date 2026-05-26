-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('receipts', 'receipts', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/heic']),
  ('business-photos', 'business-photos', true, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('business-videos', 'business-videos', true, 104857600, ARRAY['video/mp4','video/quicktime','video/webm']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('resumes', 'resumes', false, 10485760, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for receipts bucket (private)
CREATE POLICY "receipts_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "receipts_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin_staff','admin_manager','super_admin'))
    )
  );

-- Storage RLS policies for business-photos (public read, owner write)
CREATE POLICY "biz_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'business-photos');

CREATE POLICY "biz_photos_owner_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'business-photos' AND
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id::text = (storage.foldername(name))[1] AND owner_id = auth.uid()
    )
  );

CREATE POLICY "biz_photos_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'business-photos' AND
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id::text = (storage.foldername(name))[1] AND owner_id = auth.uid()
    )
  );

-- Avatars: public read, user write own
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_own_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Resumes: private, own only
CREATE POLICY "resumes_own" ON storage.objects
  FOR ALL USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
