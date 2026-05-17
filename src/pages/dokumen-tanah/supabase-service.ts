import { supabase } from '@/integrations/supabase/client';

export interface PengajuanRow {
  id: string;
  user_id: string;
  jenis_surat: string;
  status: string;
  is_serikat: boolean;
  serikat_keterangan: string | null;
  harga_jual: string | null;
  harga_keterangan: string | null;
  catatan_verifikasi: string | null;
  catatan_approval: string | null;
  verified_by: string | null;
  verified_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  sempadan_data: any;
  ahli_waris_data: any;
  serikat_penjual_data: any;
  serikat_pembeli_data: any;
  created_at: string;
  updated_at: string;
}

export interface FileRow {
  id: string;
  pengajuan_id: string;
  kategori: string;
  slot_id: string | null;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  sort_order: number;
}

export async function createPengajuan(data: {
  jenis_surat: string;
  is_serikat: boolean;
  serikat_keterangan?: string;
  harga_jual?: string;
  harga_keterangan?: string;
  sempadan_data?: any;
  ahli_waris_data?: any;
  serikat_penjual_data?: any;
  serikat_pembeli_data?: any;
  status?: string;
}) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data: row, error } = await supabase
    .from('dokumen_tanah_pengajuan')
    .insert({ ...data, user_id: user.user.id, status: data.status || 'draft' })
    .select()
    .single();

  if (error) throw error;
  return row as PengajuanRow;
}

export async function updatePengajuan(id: string, data: Partial<PengajuanRow>) {
  const { error } = await supabase
    .from('dokumen_tanah_pengajuan')
    .update(data)
    .eq('id', id);
  if (error) throw error;
}

export async function fetchMyPengajuan() {
  const { data, error } = await supabase
    .from('dokumen_tanah_pengajuan')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as PengajuanRow[];
}

export async function fetchAllPengajuan(statusFilter?: string) {
  let query = supabase.from('dokumen_tanah_pengajuan').select('*').order('created_at', { ascending: false });
  if (statusFilter) query = query.eq('status', statusFilter);
  const { data, error } = await query;
  if (error) throw error;
  return data as PengajuanRow[];
}

export async function fetchPengajuanById(id: string) {
  const { data, error } = await supabase
    .from('dokumen_tanah_pengajuan')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as PengajuanRow;
}

export async function fetchFilesByPengajuan(pengajuanId: string) {
  const { data, error } = await supabase
    .from('dokumen_tanah_files')
    .select('*')
    .eq('pengajuan_id', pengajuanId)
    .order('sort_order');
  if (error) throw error;
  return data as FileRow[];
}

export async function uploadDokumenFile(
  pengajuanId: string,
  kategori: string,
  file: File,
  slotId?: string,
  sortOrder?: number
): Promise<FileRow> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const ext = file.name.split('.').pop();
  const path = `${user.user.id}/${pengajuanId}/${kategori}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('dokumen-tanah')
    .upload(path, file, { cacheControl: '3600' });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('dokumen-tanah').getPublicUrl(path);

  const { data: row, error } = await supabase
    .from('dokumen_tanah_files')
    .insert({
      pengajuan_id: pengajuanId,
      kategori,
      slot_id: slotId || null,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      file_type: file.type,
      sort_order: sortOrder || 0,
    })
    .select()
    .single();

  if (error) throw error;
  return row as FileRow;
}

export async function deleteFile(fileId: string) {
  const { error } = await supabase.from('dokumen_tanah_files').delete().eq('id', fileId);
  if (error) throw error;
}

export async function verifyPengajuan(id: string, catatan: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');
  await updatePengajuan(id, {
    status: 'diverifikasi',
    catatan_verifikasi: catatan,
    verified_by: user.user.id,
    verified_at: new Date().toISOString(),
  } as any);
}

export async function approvePengajuan(id: string, catatan: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');
  await updatePengajuan(id, {
    status: 'disetujui',
    catatan_approval: catatan,
    approved_by: user.user.id,
    approved_at: new Date().toISOString(),
  } as any);
}

export async function rejectPengajuan(id: string, catatan: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');
  await updatePengajuan(id, {
    status: 'ditolak',
    catatan_approval: catatan,
    approved_by: user.user.id,
    approved_at: new Date().toISOString(),
  } as any);
}
