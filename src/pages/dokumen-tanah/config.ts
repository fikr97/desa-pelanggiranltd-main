import { DocVisibility, JenisSurat } from './types';

type DocKey = 'alasDasar' | 'ktpPenjual' | 'ktpPembeli' | 'ktpSempadan' | 'ktpAhliWaris' | 'suratKematian' | 'fotoDokumentasi' | 'sketGambar' | 'titikKoordinat' | 'ktpSerikat' | 'hargaJual' | 'dokumenLainnya';

export const DOC_VISIBILITY: Record<DocKey, Record<JenisSurat, DocVisibility>> = {
  alasDasar:       { GR: 'wajib', HB: 'wajib', SKT: 'wajib', WR: 'wajib' },
  ktpPenjual:      { GR: 'wajib', HB: 'hidden', SKT: 'hidden', WR: 'hidden' },
  ktpPembeli:      { GR: 'wajib', HB: 'wajib', SKT: 'hidden', WR: 'hidden' },
  ktpSempadan:     { GR: 'wajib', HB: 'wajib', SKT: 'wajib', WR: 'wajib' },
  ktpAhliWaris:    { GR: 'hidden', HB: 'hidden', SKT: 'hidden', WR: 'wajib' },
  suratKematian:   { GR: 'hidden', HB: 'hidden', SKT: 'hidden', WR: 'wajib' },
  fotoDokumentasi: { GR: 'wajib', HB: 'wajib', SKT: 'wajib', WR: 'wajib' },
  sketGambar:      { GR: 'wajib', HB: 'wajib', SKT: 'wajib', WR: 'wajib' },
  titikKoordinat:  { GR: 'wajib', HB: 'wajib', SKT: 'wajib', WR: 'wajib' },
  ktpSerikat:      { GR: 'opsional', HB: 'opsional', SKT: 'hidden', WR: 'hidden' },
  hargaJual:       { GR: 'wajib', HB: 'hidden', SKT: 'hidden', WR: 'hidden' },
  dokumenLainnya:  { GR: 'opsional', HB: 'opsional', SKT: 'opsional', WR: 'opsional' },
};

export const JENIS_SURAT_LABELS: Record<JenisSurat, string> = {
  GR: 'Ganti Rugi',
  HB: 'Hibah',
  SKT: 'Surat Keterangan Tanah',
  WR: 'Waris',
};

export const KTP_PENJUAL_LABEL: Record<JenisSurat, string> = {
  GR: 'KTP Penjual',
  HB: 'KTP Pemberi',
  SKT: 'KTP Pemilik',
  WR: 'KTP Pewaris',
};

export const KTP_PEMBELI_LABEL: Record<JenisSurat, string> = {
  GR: 'KTP Pembeli',
  HB: 'KTP Penerima',
  SKT: 'KTP Penerima',
  WR: 'KTP Penerima',
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ACCEPTED_FORMATS_ALL = '.jpg,.jpeg,.png,.pdf';
export const ACCEPTED_FORMATS_IMAGE = '.jpg,.jpeg,.png';

export function isVisible(key: DocKey, jenis: JenisSurat): boolean {
  return DOC_VISIBILITY[key][jenis] !== 'hidden';
}

export function isRequired(key: DocKey, jenis: JenisSurat): boolean {
  return DOC_VISIBILITY[key][jenis] === 'wajib';
}
