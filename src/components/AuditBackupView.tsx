import { useRef, useState } from 'react';
import {
  Download,
  History,
  Lock,
  Search,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import type { AppStateData, AuditEntityType, UserRole } from '../types/asset';
import { getRolePermissions } from '../utils/assetLogic';

interface AuditBackupViewProps {
  data: AppStateData;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onRestoreBackup: (rawPayload: unknown) => void;
}

const ENTITY_FILTERS: ('ALL' | AuditEntityType)[] = [
  'ALL',
  'Aset',
  'Serah Terima PIC',
  'Pemeliharaan',
  'Pegawai',
  'Bidang',
  'Jenis Aset',
  'Sistem',
];

function formatTimestampId(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function AuditBackupView({
  data,
  userRole,
  onChangeRole,
  onRestoreBackup,
}: AuditBackupViewProps) {
  const [entityFilter, setEntityFilter] = useState<'ALL' | AuditEntityType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [backupMessage, setBackupMessage] = useState('');
  const [backupError, setBackupError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const permissions = getRolePermissions(userRole);

  const filteredLogs = (data.auditLogs ?? []).filter((log) => {
    if (entityFilter !== 'ALL' && log.entitas !== entityFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return [log.aksi, log.actorName, log.actorRole, log.detailPerubahan, log.entitas]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const handleDownloadBackup = () => {
    const payload = JSON.stringify(data, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `Backup_SI-ASET_DPUBMSDA_${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBackupError('');
    setBackupMessage(
      `Backup lengkap JSON (${data.assets.length} aset, ${data.auditLogs.length} log audit) berhasil diunduh.`,
    );
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        onRestoreBackup(parsed);
        setBackupError('');
        setBackupMessage(
          `Database berhasil dipulihkan dari file "${file.name}".`,
        );
      } catch (err) {
        setBackupMessage('');
        setBackupError(
          err instanceof Error
            ? err.message
            : 'File JSON backup tidak valid atau rusak.',
        );
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Backup & Restore Card (PRD Section 12) */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#1E3A8A]" />
              <h2 className="text-base font-bold text-slate-900">
                Pencadangan & Pemulihan Database (Backup Berkala)
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              Ekspor seluruh data inventaris, histori PIC, riwayat perbaikan, dan audit trail ke berkas JSON terstruktur sesuai kebijakan ketahanan data BMD.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Backup JSON</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleRestoreFile}
              className="hidden"
              id="restore-backup-input"
              disabled={!permissions.canRestoreBackup}
            />
            <button
              type="button"
              disabled={!permissions.canRestoreBackup}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:border-[#1E3A8A] hover:text-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Pulihkan dari JSON</span>
            </button>
          </div>
        </div>

        {!permissions.canRestoreBackup && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Pemulihan backup database hanya diizinkan untuk Admin / Pranata Komputer.
            </span>
            <button
              type="button"
              onClick={() => onChangeRole('Admin / Pranata Komputer')}
              className="rounded-md bg-[#1E3A8A] px-3 py-1 text-xs font-semibold text-white hover:bg-blue-900"
            >
              Beralih ke Admin
            </button>
          </div>
        )}

        {backupMessage && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800">
            {backupMessage}
          </div>
        )}

        {backupError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
            {backupError}
          </div>
        )}
      </section>

      {/* Immutable Audit Trail Section */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-[#1E3A8A]" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Audit Trail Aktivitas Sistem (Append-Only)
                </h2>
                <p className="text-xs text-slate-500">
                  Rekam jejak otomatis setiap perubahan kondisi aset, serah terima PIC, perbaikan, dan data master demi akuntabilitas audit BMD
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
              {filteredLogs.length} catatan tercatat
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
              {ENTITY_FILTERS.map((ent) => (
                <button
                  key={ent}
                  type="button"
                  onClick={() => setEntityFilter(ent)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    entityFilter === ent
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ent === 'ALL' ? 'Semua Entitas' : ent}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari aktor, aksi, atau detail..."
                aria-label="Cari catatan audit trail"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="px-5 py-3">Waktu (Timestamp)</th>
                <th className="px-4 py-3">Pelaku & Role</th>
                <th className="px-4 py-3">Entitas</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-5 py-3">Detail Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    Tidak ada catatan audit yang sesuai dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 align-top font-mono text-xs text-slate-600 whitespace-nowrap tabular-nums">
                      {formatTimestampId(log.timestamp)}
                    </td>
                    <td className="px-4 py-3.5 align-top text-xs">
                      <p className="font-semibold text-slate-900">{log.actorName}</p>
                      <p className="mt-0.5 text-slate-500">{log.actorRole}</p>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <span className="inline-flex rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {log.entitas}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 align-top text-xs font-semibold text-[#1E3A8A]">
                      {log.aksi}
                    </td>
                    <td className="px-5 py-3.5 align-top text-xs text-slate-700">
                      {log.detailPerubahan}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
