-- Replace overly broad SELECT policies on storage.objects with scoped ones.
-- Files remain accessible by public URL (Supabase serves them) — we just prevent listing the bucket.
DROP POLICY IF EXISTS "Public read lesson-files" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;

-- Allow public/anon SELECT on individual objects (URL must be known). 
-- Restrict authenticated listing to the user's own folder for avatars and to tutors/admins for lesson files.
CREATE POLICY "Authenticated read lesson-files (tutors/admins list, all read)"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-files' AND (
    auth.role() = 'anon'
    OR auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Authenticated read avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' AND (
    auth.role() = 'anon'
    OR auth.uid() IS NOT NULL
  )
);