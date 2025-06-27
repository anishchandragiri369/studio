-- Create profile photos storage bucket and set up policies
-- This should be run in your Supabase SQL editor

-- Create the storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow authenticated users to upload their own profile photos
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own profile photos
CREATE POLICY "Users can update their own profile photos" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own profile photos
CREATE POLICY "Users can delete their own profile photos" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to profile photos
CREATE POLICY "Public can view profile photos" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');
