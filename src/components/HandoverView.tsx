import { useState } from 'react';
import { ArrowLeftRight, Eye, FileText, Plus, Printer } from 'lucide-react';
import type { AppStateData, PicHistoryEntry, UserRole } from '../types/asset';
import { formatDateId, getRolePermissions } from '../utils/assetLogic';
import { BastPrintModal } from './BastPrintModal';
import { ConditionBadge } from './StatusBadge';

interface HandoverViewProps {
  data: AppStateData;
  userRole: UserRole;
  onOpenHandoverModal: (assetId?: string) => void;
  onOpenAssetDetail: (assetId: string) => void;
}

export function HandoverView({
  data,
  userRole,
  onOpenHandoverModal,
  onOpenAssetDetail,
}: HandoverViewProps) {
  const [printEntry, setPrintEntry] = useState<PicHistoryEntry | null>(null);
  const permissions = getRolePermissions(userRole);
  const assetMap = new Map(data.assets.map((a) => [a.id, a]));
  const categoryMap = new Map(data.categories.map((c) => [c.id, c.nama]));
  const empMap = new Map(data.employees.map((e) => [e.id, e]));

  const sortedHistory = data.picHistory
    .slice()
    .sort((a, b) => {
      if (a.tanggalSelesai === null && b.tanggalSelesai !== null) return -1;
      if (a.tanggalSelesai !== null && b.tanggalSelesai === null) return 1;
      return b.tanggalMulai.localeCompare(a.tanggalMulai);
    });

  const printAsset = printEntry ? assetMap.get(printEntry.assetId) : undefined;
  const printEmp = printEntry ? empMap.get(printEntry.employeeId) : undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Log Transaksi Serah Terima & Mutasi PIC
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Setiap serah terima baru otomatis menutup tanggal selesai PIC sebelumnya
            dan mencatat Nomor BAST tanpa menghapus histori lama.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenHandoverModal()}
          disabled={!permissions.canHandover}
          title={
            permissions.canHandover
              ? 'Catat serah terima PIC baru'
              : 'Hanya Admin / Pengurus Barang yang dapat memproses serah terima'
          }
          className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>Catat Serah Terima Baru</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <ArrowLeftRight className="h-4 w-4 text-[#1E3A8A]" />
            <span>Total {sortedHistory.length} Riwayat Berita Acara Serah Terima (BAST)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="px-5 py-3">Nomor BAST</th>
                <th className="px-4 py-3">Aset & Kode BMD</th>
                <th className="px-4 py-3">Pegawai Pemakai (PIC)</th>
                <th className="px-4 py-3">Periode Pemakaian</th>
                <th className="px-4 py-3">Kondisi Serah Terima</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedHistory.map((entry) => {
                const asset = assetMap.get(entry.assetId);
                const emp = empMap.get(entry.employeeId);
                const isActive = entry.tanggalSelesai === null;
                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-5 py-3.5 align-top font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                      <p>{entry.nomorBast}</p>
                      {entry.fileBastUrl && (
                        <a
                          href={entry.fileBastUrl}
                          download={entry.fileBastNama ?? `${entry.nomorBast}.pdf`}
                          className="mt-1 inline-flex items-center gap-1 font-sans text-[11px] font-medium text-[#1E3A8A] hover:underline"
                        >
                          <FileText className="h-3 w-3" />
                          <span>Unduh Scan BAST</span>
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <p className="font-semibold text-slate-900">
                        {asset?.nama ?? '-'}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
                        {asset?.kodeBarangBmd ?? '-'} · NUP {asset?.nup ?? '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top text-xs">
                      <p className="font-semibold text-slate-900">
                        {emp?.nama ?? '-'}
                      </p>
                      <p className="mt-0.5 text-slate-500">
                        {emp?.jabatan ?? '-'} · {emp?.unitKerja ?? '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top font-mono text-xs text-slate-700 whitespace-nowrap">
                      <p>{formatDateId(entry.tanggalMulai)}</p>
                      <p className="text-slate-500">
                        s/d {formatDateId(entry.tanggalSelesai)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <ConditionBadge condition={entry.kondisiSerahTerima} />
                    </td>
                    <td className="px-4 py-3.5 align-top text-xs">
                      {isActive ? (
                        <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#1E3A8A]">
                          Aktif Dipegang
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Selesai / Dimutasi
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 align-top text-right">
                      {asset && (
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPrintEntry(entry)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-[#1E3A8A] hover:text-[#1E3A8A] whitespace-nowrap"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Cetak BAST</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenAssetDetail(asset.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-[#1E3A8A] hover:border-[#1E3A8A] hover:bg-blue-50 whitespace-nowrap"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Detail 360°</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {printEntry && printAsset && (
        <BastPrintModal
          asset={printAsset}
          categoryName={categoryMap.get(printAsset.categoryId) ?? 'Umum'}
          historyEntry={printEntry}
          recipient={printEmp}
          onClose={() => setPrintEntry(null)}
        />
      )}
    </div>
  );
}
