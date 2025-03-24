insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'waivers',
  'waivers',
  true,
  104857600,
  ARRAY['application/pdf']::text[]
);