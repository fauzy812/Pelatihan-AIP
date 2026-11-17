import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Paperclip,
  Play,
} from 'lucide-react';
import type { AppStateData, MaintenanceRecord, UserRole } from '../types/asset';
import {
  formatDateId,
  formatRupiah,
  getRolePermissions,
} from '../utils/assetLogic';
import { ConditionBadge, TicketStatusBadge } from './StatusBadge';

interface MaintenanceViewProps {
  data: AppStateData;
  userRole: UserRole;
  onOpenReportDamage: () => void;
  onOpenResolveModal: (ticket: MaintenanceRecord) => void;
  onStartProgress: (ticketId: string) => void;
  onOpenAssetDetail: (assetId: string) => void;
}

export function MaintenanceView({
  data,
  userRole,
  onOpenReportDamage,
  onOpenResolveModal,
  onStartProgress,
  onOpenAssetDetail,
}: MaintenanceViewProps) {
  const [filterTab, setFilterTab] = useState<'ALL' | 'OPEN' | 'DONE'>('ALL');
  const assetMap = new Map(data.assets.map((a) => [a.id, a]));
  const permissions = getRolePermissions(userRole);

  const openTickets = data.maintenance.filter(
    (m) => m.statusTiket !== 'Selesai',
  );
  const completedTickets = data.maintenance.filter(
    (m) => m.statusTiket === 'Selesai',
  );

  const displayedTickets = data.maintenance
    .filter((m) => {
      if (filterTab === 'OPEN') return m.statusTiket !== 'Selesai';
      if (filterTab === 'DONE') return m.statusTiket === 'Selesai';
      return true;
    })
    .slice()
    .sort((a, b) => {
      if (a.statusTiket !== 'Selesai' && b.statusTiket === 'Selesai') return -1;
      if (a.statusTiket === 'Selesai' && b.statusTiket !== 'Selesai') return 1;
      return b.tanggalLapor.localeCompare(a.tanggalLapor);
    });

  const totalCost = completedTickets.reduce(
    (sum, m) => sum + (m.biayaServis || 0),
    0,
  );

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">
            Manajemen Tiket Kerusakan & Riwayat Servis
          </h2>
          <p className="text-xs text-slate-500">
            {openTickets.length} tiket aktif dalam penanganan ·{' '}
            {completedTickets.length} perbaikan selesai · Total biaya pemeliharaan{' '}
            <span className="font-mono font-semibold text-slate-800 tabular-nums">
              {formatRupiah(totalCost)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filterTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({data.maintenance.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('OPEN')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filterTab === 'OPEN'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tiket Aktif ({openTickets.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('DONE')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filterTab === 'DONE'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Selesai ({completedTickets.length})
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenReportDamage}
            disabled={!permissions.canReportDamage}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Laporkan Kerusakan</span>
          </button>
        </div>
      </div>

      {/* Maintenance Tickets Table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="px-5 py-3">Tgl Lapor & Pelapor</th>
                <th className="px-4 py-3">Aset & Tingkat Kerusakan</th>
                <th className="px-4 py-3">Deskripsi & Tindakan</th>
                <th className="px-4 py-3">Teknisi / Vendor</th>
                <th className="px-4 py-3 text-right">Biaya Servis</th>
                <th className="px-4 py-3">Status Tiket</th>
                <th className="px-5 py-3 text-right">Aksi Teknisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedTickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    Tidak ada tiket kerusakan pada kategori tampilan ini.
                  </td>
                </tr>
              ) : (
                displayedTickets.map((ticket) => {
                  const asset = assetMap.get(ticket.assetId);
                  const isOpen = ticket.statusTiket !== 'Selesai';
                  const hasAttachment = Boolean(
                    ticket.fotoKerusakanUrl || ticket.fotoPerbaikanUrl,
                  );
                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-5 py-3.5 align-top text-xs">
                        <p className="font-mono font-semibold text-slate-900">
                          {formatDateId(ticket.tanggalLapor)}
                        </p>
                        <p className="mt-0.5 text-slate-600">
                          {ticket.pelaporNama}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <p className="font-semibold text-slate-900">
                          {asset?.nama ?? '-'}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                          {asset?.kodeBarangBmd ?? '-'} · NUP {asset?.nup ?? '-'}
                        </p>
                        <div className="mt-1.5">
                          <ConditionBadge condition={ticket.tingkatKerusakan} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-top text-xs max-w-xs">
                        <p className="font-medium text-slate-900">
                          {ticket.deskripsiKerusakan}
                        </p>
                        {ticket.tindakanPerbaikan && (
                          <p className="mt-1 text-slate-600">
                            Tindakan: {ticket.tindakanPerbaikan}
                          </p>
                        )}
                        {hasAttachment && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#1E3A8A]">
                            <Paperclip className="h-3 w-3" />
                            Lampiran foto/nota tersedia
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-top text-xs text-slate-700">
                        <p className="font-medium text-slate-900">
                          {ticket.teknisiVendor}
                        </p>
                        {ticket.tanggalPerbaikan && (
                          <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                            Selesai: {formatDateId(ticket.tanggalPerbaikan)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-top text-right font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatRupiah(ticket.biayaServis)}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <TicketStatusBadge status={ticket.statusTiket} />
                      </td>
                      <td className="px-5 py-3.5 align-top text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {ticket.statusTiket === 'Menunggu Perbaikan' &&
                            permissions.canResolveMaintenance && (
                              <button
                                type="button"
                                onClick={() => onStartProgress(ticket.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 whitespace-nowrap"
                              >
                                <Play className="h-3 w-3" />
                                <span>Proses Servis</span>
                              </button>
                            )}
                          {isOpen && permissions.canResolveMaintenance && (
                            <button
                              type="button"
                              onClick={() => onOpenResolveModal(ticket)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 whitespace-nowrap"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Selesaikan</span>
                            </button>
                          )}
                          {asset && (
                            <button
                              type="button"
                              onClick={() => onOpenAssetDetail(asset.id)}
                              aria-label={`Detail 360 ${asset.nama}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-[#1E3A8A] hover:border-[#1E3A8A]"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Detail</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
