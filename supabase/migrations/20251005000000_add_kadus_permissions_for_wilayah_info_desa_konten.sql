-- Menambahkan permission baru untuk role 'kadus' terkait Wilayah, Info Desa, dan Kelola Website
INSERT INTO public.role_permissions (role, permission, description, is_enabled)
VALUES
  ('kadus', 'button:create:wilayah', 'Izin untuk menambah data wilayah baru', false),
  ('kadus', 'button:edit:wilayah', 'Izin untuk mengedit data wilayah', false),
  ('kadus', 'button:delete:wilayah', 'Izin untuk menghapus data wilayah', false),
  ('kadus', 'button:view:preview:wilayah', 'Izin untuk melihat pratinjau wilayah', false), -- Opsional
  ('kadus', 'button:edit:info_desa', 'Izin untuk mengedit informasi desa', false),
  ('kadus', 'button:create:struktur_perangkat_desa', 'Izin untuk menambah struktur perangkat desa', false),
  ('kadus', 'button:edit:struktur_perangkat_desa', 'Izin untuk mengedit struktur perangkat desa', false),
  ('kadus', 'button:delete:struktur_perangkat_desa', 'Izin untuk menghapus struktur perangkat desa', false),
  ('kadus', 'button:create:konten_website', 'Izin untuk menambah konten website', false);