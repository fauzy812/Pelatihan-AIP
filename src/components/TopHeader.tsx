import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  Menu,
  Plus,
  RotateCcw,
  UserCog,
} from 'lucide-react';
import type { ActiveMenu, Employee, MaintenanceRecord, UserRole } from '../types/asset';
import { getRolePermissions, type SmartInsightItem } from '../utils/assetLogic';

interface TopHeaderProps {
  activeMenu: ActiveMenu;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  employees: Employee[];
  activePicEmployeeId: string;
  onChangeActivePicEmployeeId: (empId: string) => void;
  openTickets: MaintenanceRecord[];
  smartInsights: SmartInsightItem[];
  assetNameById: Map<string, string>;
  onOpenAssetDetail: (assetId: string) => void;
  onNavigateToMaintenance: () => void;
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
  'audit-backup': {
    title: 'Audit Trail & Backup Database',
    subtitle: 'Rekam jejak aktivitas append-only dan pencadangan/pemulihan JSON BMD',
  },
};

const ROLES: UserRole[] = [
  'Admin / Pranata Komputer',
  'Pengurus Barang',
  'Teknisi',
  'Pemakai (PIC)',
  'Pimpinan',
];

export function TopHeader({
  activeMenu,
  userRole,
  onChangeRole,
  employees,
  activePicEmployeeId,
  onChangeActivePicEmployeeId,
  openTickets,
  smartInsights,
  assetNameById,
  onOpenAssetDetail,
  onNavigateToMaintenance,
  onOpenMobileMenu,
  onOpenAddAsset,
  onOpenHandover,
  onOpenReportDamage,
  onResetSimulation,
}: TopHeaderProps) {
  const [showNotif, setShowNotif] = useState(false);
  const pageInfo = PAGE_TITLES[activeMenu];
  const permissions = getRolePermissions(userRole);
  const highInsights = smartInsights.filter((i) => i.priority === 'Tinggi');
  const alertCount = openTickets.length + highInsights.length;

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
          {/* Quick Actions with RBAC enforcement */}
          <button
            type="button"
            onClick={onOpenAddAsset}
            disabled={!permissions.canCrudAssets}
            title={
              permissions.canCrudAssets
                ? 'Daftarkan aset baru'
                : 'Hanya Admin / Pengurus Barang yang dapat menambah aset'
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-900 transition-colors disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Aset</span>
          </button>
          <button
            type="button"
            onClick={onOpenHandover}
            disabled={!permissions.canHandover}
            title={
              permissions.canHandover
                ? 'Proses serah terima / mutasi PIC'
                : 'Hanya Admin / Pengurus Barang yang dapat memproses mutasi PIC'
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-[#1E3A8A]" />
            <span>Serah Terima PIC</span>
          </button>
          <button
            type="button"
            onClick={onOpenReportDamage}
            disabled={!permissions.canReportDamage}
            title={
              permissions.canReportDamage
                ? 'Laporkan kerusakan unit aset'
                : 'Peran Pimpinan bersifat baca-saja (Viewer)'
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Laporkan Kerusakan</span>
          </button>

          {/* Notification Bell Popover (PRD Section 9 & 10.2) */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowNotif((prev) => !prev)}
              aria-label={`Notifikasi sistem (${alertCount} peringatan)`}
              className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Bell className="h-3.5 w-3.5" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[10px] font-bold text-white tabular-nums">
                  {alertCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-40">
                <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-900">
                    Peringatan & Tiket Aktif ({alertCount})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNotif(false)}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                  >
                    Tutup
                  </button>
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {openTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => {
                        setShowNotif(false);
                        onNavigateToMaintenance();
                      }}
                      className="w-full rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-left text-xs hover:bg-amber-100/70"
                    >
                      <p className="font-semibold text-amber-950">
                        {assetNameById.get(ticket.assetId) ?? 'Unit Aset'}
                      </p>
                      <p className="mt-0.5 text-amber-800 line-clamp-2">
                        {ticket.statusTiket}: {ticket.deskripsiKerusakan}
                      </p>
                    </button>
                  ))}

                  {highInsights.map((ins) => (
                    <button
                      key={ins.asset.id}
                      type="button"
                      onClick={() => {
                        setShowNotif(false);
                        onOpenAssetDetail(ins.asset.id);
                      }}
                      className="w-full rounded-lg border border-red-200 bg-red-50/70 p-2.5 text-left text-xs hover:bg-red-100/70"
                    >
                      <p className="font-semibold text-red-900">
                        Prioritas Tinggi: {ins.asset.nama}
                      </p>
                      <p className="mt-0.5 text-red-800">{ins.reasons.join(' · ')}</p>
                    </button>
                  ))}

                  {alertCount === 0 && (
                    <p className="py-4 text-center text-xs text-slate-500">
                      Tidak ada tiket aktif atau peringatan kritis.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

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

          {userRole === 'Pemakai (PIC)' && (
            <div className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 shrink-0">
              <label htmlFor="pic-actor-selector" className="sr-only">
                Pilih Pegawai Pemakai Aktif
              </label>
              <select
                id="pic-actor-selector"
                value={activePicEmployeeId}
                onChange={(e) => onChangeActivePicEmployeeId(e.target.value)}
                className="max-w-[150px] truncate bg-transparent text-xs font-semibold text-[#1E3A8A] focus:outline-none"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    PIC: {emp.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

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
