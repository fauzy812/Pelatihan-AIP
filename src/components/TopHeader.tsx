import {
  AlertTriangle,
  ArrowLeftRight,
  Menu,
  Plus,
  RotateCcw,
  UserCog,
} from 'lucide-react';
import type { ActiveMenu, UserRole } from '../types/asset';

interface TopHeaderProps {
  activeMenu: ActiveMenu;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onOpenMobileMenu: () => void;
  onOpenAddAsset: () => void;
  onOpenHandover: () => void;
  onOpenReportDamage: () => void;
  onResetSimulation: () => void;
}

const PAGE_TITLES: Record<ActiveMenu, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Eksekutif',
    subtitle: 'Ringkasan kondisi, distribusi unit kerja, dan pemantauan aset BMD terpadu',
  },
  assets: {
    title: 'Data Aset Terpadu',
    subtitle: 'Daftar inventaris barang milik daerah terkelompok berdasarkan jenis dinamis',
  },
  'master-employees': {
    title: 'Master Pegawai (PIC)',
    subtitle: 'Pengelolaan data pegawai PNS, PPPK Penuh Waktu, PPPK Paruh Waktu, dan Non ASN DPUBMSDA',
  },
  'master-units': {
    title: 'Master Bidang & UPTD',
    subtitle: 'Pengaturan unit kerja, bidang teknis, kepala unit, dan lokasi operasional DPUBMSDA',
  },
  'master-categories': {
    title: 'Master Jenis Aset (Dinamis)',
    subtitle: 'Pengaturan kategori aset dan skema atribut spesifikasi teknis',
  },
  handover: {
    title: 'Serah Terima & Mutasi PIC',
    subtitle: 'Pencatatan BAST penanggung jawab pegawai dan riwayat pemakaian aset',
  },
  maintenance: {
    title: 'Kerusakan & Perbaikan',
    subtitle: 'Manajemen tiket kerusakan aktif, tindakan servis teknisi, dan riwayat biaya',
  },
  reports: {
    title: 'Laporan & Ekspor BMD',
    subtitle: 'Unduh data CSV/Excel dan cetak Kartu Kendali Aset / Management Brief',
  },
};

const ROLES: UserRole[] = [
  'Admin / Pranata Komputer',
  'Pengurus Barang',
  'Teknisi',
  'Pimpinan',
];

export function TopHeader({
  activeMenu,
  userRole,
  onChangeRole,
  onOpenMobileMenu,
  onOpenAddAsset,
  onOpenHandover,
  onOpenReportDamage,
  onResetSimulation,
}: TopHeaderProps) {
  const pageInfo = PAGE_TITLES[activeMenu];

  return (
    <header className="no-print border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:z-30">
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Buka menu navigasi"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">
              {pageInfo.title}
            </h1>
            <p className="hidden truncate text-xs text-slate-500 sm:block">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 xl:flex-nowrap">
          {/* Quick Actions */}
          <button
            type="button"
            onClick={onOpenAddAsset}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-900 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Aset</span>
          </button>
          <button
            type="button"
            onClick={onOpenHandover}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-[#1E3A8A]" />
            <span>Serah Terima PIC</span>
          </button>
          <button
            type="button"
            onClick={onOpenReportDamage}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Laporkan Kerusakan</span>
          </button>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 shrink-0">
            <UserCog className="h-3.5 w-3.5 shrink-0 text-[#1E3A8A]" />
            <label htmlFor="role-selector" className="sr-only">
              Pilih Peran Pengguna
            </label>
            <select
              id="role-selector"
              value={userRole}
              onChange={(e) => onChangeRole(e.target.value as UserRole)}
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onResetSimulation}
            title="Kembalikan data simulasi awal"
            aria-label="Reset data simulasi awal"
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
