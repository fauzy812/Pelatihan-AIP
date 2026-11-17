export type UserRole =
  | 'Admin / Pranata Komputer'
  | 'Pengurus Barang'
  | 'Teknisi'
  | 'Pemakai (PIC)'
  | 'Pimpinan';

export type AssetCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';

export type AssetUsageStatus = 'Dipakai PIC' | 'Tersedia';

export type TicketStatus = 'Menunggu Perbaikan' | 'Dalam Perbaikan' | 'Selesai';

export interface AssetTypeField {
  key: string;
  label: string;
  placeholder: string;
  unit?: string;
}

export interface AssetCategory {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  fields: AssetTypeField[];
}

export interface UnitKerjaItem {
  id: string;
  kode: string;
  nama: string;
  kepalaUnit: string;
  lokasiKantor: string;
}

export type EmploymentStatus =
  | 'PNS'
  | 'PPPK Penuh Waktu'
  | 'PPPK Paruh Waktu'
  | 'Non ASN';

export interface Employee {
  id: string;
  nip: string;
  nama: string;
  jabatan: string;
  unitKerja: string;
  statusKepegawaian: EmploymentStatus;
  kontak: string;
}

export interface PicHistoryEntry {
  id: string;
  assetId: string;
  employeeId: string;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  nomorBast: string;
  kondisiSerahTerima: AssetCondition;
  catatan: string;
  fileBastUrl?: string;
  fileBastNama?: string;
  tteValidated?: boolean;
  tteTimestamp?: string;
  tteVerificationCode?: string;
  tteEmployeeQrPayload?: string;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  tanggalLapor: string;
  pelaporId: string;
  pelaporNama: string;
  tingkatKerusakan: 'Rusak Ringan' | 'Rusak Berat';
  deskripsiKerusakan: string;
  fotoKerusakanUrl?: string;
  fotoKerusakanNama?: string;
  statusTiket: TicketStatus;
  tanggalPerbaikan: string | null;
  tindakanPerbaikan: string;
  teknisiVendor: string;
  biayaServis: number;
  kondisiAkhir: AssetCondition | null;
  fotoPerbaikanUrl?: string;
  fotoPerbaikanNama?: string;
}

export interface Asset {
  id: string;
  kodeBarangBmd: string;
  nup: string;
  nama: string;
  merkTipe: string;
  categoryId: string;
  tahunPerolehan: number;
  nilaiPerolehan: number;
  nomorSeriRangka: string;
  unitKerja: string;
  lokasiPenempatan: string;
  kondisi: AssetCondition;
  statusPemakaian: AssetUsageStatus;
  picAktifId: string | null;
  spesifikasi: Record<string, string>;
  fotoAsetUrl?: string;
  fotoAsetNama?: string;
  terakhirDiinspeksi?: string;
  createdAt: string;
}

export type AuditEntityType =
  | 'Aset'
  | 'Jenis Aset'
  | 'Bidang'
  | 'Pegawai'
  | 'Serah Terima PIC'
  | 'Pemeliharaan'
  | 'Sistem';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorRole: UserRole;
  actorName: string;
  aksi: string;
  entitas: AuditEntityType;
  entitasId: string;
  detailPerubahan: string;
}

export interface AppStateData {
  categories: AssetCategory[];
  units: UnitKerjaItem[];
  employees: Employee[];
  assets: Asset[];
  picHistory: PicHistoryEntry[];
  maintenance: MaintenanceRecord[];
  auditLogs: AuditLogEntry[];
}

export type ActiveMenu =
  | 'dashboard'
  | 'assets'
  | 'master-employees'
  | 'master-units'
  | 'master-categories'
  | 'handover'
  | 'maintenance'
  | 'reports'
  | 'audit-backup';
