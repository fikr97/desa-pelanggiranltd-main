-- Add permissions for surat table to the role_permissions table
-- This migration adds the necessary permissions for creating, viewing, editing, and deleting surat

-- Insert permissions for surat management
INSERT INTO public.role_permissions (role, permission, description, is_enabled) VALUES
  -- Admin permissions
  ('admin', 'sidebar:view:surat', 'Melihat menu Surat di sidebar', true),
  ('admin', 'button:create:surat', 'Akses tombol Buat Surat', true),
  ('admin', 'button:edit:surat', 'Akses tombol Edit Surat', true),
  ('admin', 'button:delete:surat', 'Akses tombol Hapus Surat', true),
  
  -- Kadus permissions
  ('kadus', 'sidebar:view:surat', 'Melihat menu Surat di sidebar', true),
  ('kadus', 'button:create:surat', 'Akses tombol Buat Surat', true),
  ('kadus', 'button:edit:surat', 'Akses tombol Edit Surat', true),
  ('kadus', 'button:delete:surat', 'Akses tombol Hapus Surat', false); -- Kadus tidak bisa hapus surat