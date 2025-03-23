insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'problem-images',
  'problem-images',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
);
