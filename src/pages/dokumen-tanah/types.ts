export type JenisSurat = 'GR' | 'HB' | 'SKT' | 'WR';

export type DocVisibility = 'wajib' | 'opsional' | 'hidden';

export type AcceptedFormat = 'image' | 'image+pdf';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  progress: number;
  error?: string;
}

export interface SempadanSlot {
  id: string;
  nama: string;
  arah: string;
  isFasilitasUmum: boolean;
  files: UploadedFile[];
}

export interface AhliWarisSlot {
  id: string;
  nama: string;
  hubungan: string;
  files: UploadedFile[];
}

export interface SerikatMember {
  id: string;
  nama: string;
  files: UploadedFile[];
}

export interface HargaJualData {
  harga: string;
  keterangan: string;
  buktiFiles: UploadedFile[];
}

export interface DocumentState {
  jenisSurat: JenisSurat;
  alasDasar: UploadedFile[];
  ktpPenjual: UploadedFile[];
  ktpPembeli: UploadedFile[];
  sempadan: SempadanSlot[];
  ktpAhliWaris: AhliWarisSlot[];
  suratKematian: UploadedFile[];
  fotoDokumentasi: UploadedFile[];
  sketGambar: UploadedFile[];
  titikKoordinat: UploadedFile[];
  hargaJual: HargaJualData;
  isSerikat: boolean;
  serikatKeterangan: string;
  serikatPenjual: SerikatMember[];
  serikatPembeli: SerikatMember[];
  dokumenLainnya: UploadedFile[];
}
