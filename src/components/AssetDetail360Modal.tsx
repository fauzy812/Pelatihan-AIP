import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  PackageCheck,
  Printer,
  ScanLine,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import type {
  AppStateData,
  MaintenanceRecord,
} from '../types/asset';
import { formatDateId, formatRupiah } from '../utils/assetLogic';
import { AssetQrSvg, QrStickerPrintModal } from './QrCodeDisplay';
import {
  ConditionBadge,
  TicketStatusBadge,
  UsageStatusBadge,
} from './StatusBadge';

interface AssetDetail360ModalProps {
  assetId: string;
  data: AppStateData;
  onClose: () => void;
  onOpenHandoverForAsset: (assetId: string) => void;
  onReturnAssetToPool: (assetId: string) => void;
  onOpenReportDamageForAsset: (assetId: string) => void;
  onOpenResolveMaintenance: (ticket: MaintenanceRecord) => void;
  onOpenQrScanner: (assetId: string) => void;
}

type DetailTab = 'info' | 'pic' | 'maintenance';

export function AssetDetail360Modal({
  assetId,
  data,
  onClose,
  onOpenHandoverForAsset,
  onReturnAssetToPool,
  onOpenReportDamageForAsset,
  onOpenResolveMaintenance,
  onOpenQrScanner,
}: AssetDetail360ModalProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [showQrSticker, setShowQrSticker] = useState(false);

  const asset = data.assets.find((a) => a.id === assetId);
  if (!asset) return null;

  const category = data.categories.find((c) => c.id === asset.categoryId);
  const activePic = asset.picAktifId
    ? data.employees.find((e) => e.id === asset.picAktifId)
    : undefined;
  const employeeMap = new Map(data.employees.map((e) => [e.id, e]));

  const picTimeline = data.picHistory
    .filter((h) => h.assetId === asset.id)
    .slice()
    .sort((a, b) => b.tanggalMulai.localeCompare(a.tanggalMulai));

  const maintenanceTimeline = data.maintenance
    .filter((m) => m.assetId === asset.id)
    .slice()
    .sort((a, b) => b.tanggalLapor.localeCompare(a.tanggalLapor));

  const openTicket = maintenanceTimeline.find(
    (m) => m.statusTiket !== 'Selesai',
  );
  const totalServiceCost = maintenanceTimeline.reduce(
    (sum, m) => sum + (m.biayaServis || 0),
    0,
  );

  const qrPayload = `SI-ASET|DPUBMSDA-SDA|${asset.kodeBarangBmd}|NUP:${asset.nup}|${asset.id}`;

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-360-title"
      >
        <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          {/* Header Profil 360° */}
          <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="font-mono font-semibold text-[#1E3A8A] tabular-nums">
                    {asset.kodeBarangBmd}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-semibold text-slate-800 tabular-nums">
                    NUP {asset.nup}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-700">
                    {category?.nama ?? 'Lainnya'}
                  </span>
                </div>

                <h2
                  id="detail-360-title"
                  className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
                >
                  {asset.nama}
                </h2>
                <p className="text-sm text-slate-600">
                  {asset.merkTipe} · {asset.unitKerja} · {asset.lokasiPenempatan}
                </p>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <ConditionBadge
                    condition={asset.kondisi}
                    inRepair={Boolean(openTicket)}
                  />
                  <UsageStatusBadge status={asset.statusPemakaian} />
                  {activePic && (
                    <span className="text-xs text-slate-700">
                      PIC Aktif:{' '}
                      <span className="font-semibold text-slate-900">
                        {activePic.nama}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* QR Code Aset & Actions */}
              <div className="flex items-start gap-4 shrink-0">
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                  <AssetQrSvg value={qrPayload} size={84} />
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-800">
                      Label QR Inventaris
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowQrSticker(true)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:border-[#1E3A8A] hover:text-[#1E3A8A] whitespace-nowrap"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Cetak Stiker QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenQrScanner(asset.id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-[#1E3A8A] hover:bg-blue-100 whitespace-nowrap"
                    >
                      <ScanLine className="h-3.5 w-3.5" />
                      <span>Mode Scan QR</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup detail aset 360"
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 3 Tab Navigation */}
            <div
              role="tablist"
              aria-label="Tab Informasi Detail Aset 360"
              className="mt-5 flex flex-wrap gap-1 border-b border-slate-200 -mb-5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'info'}
                onClick={() => setActiveTab('info')}
                className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'info'
                    ? 'border-[#1E3A8A] text-[#1E3A8A]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Informasi Umum & Spesifikasi
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'pic'}
                onClick={() => setActiveTab('pic')}
                className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'pic'
                    ? 'border-[#1E3A8A] text-[#1E3A8A]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Histori Pemakai / PIC ({picTimeline.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'maintenance'}
                onClick={() => setActiveTab('maintenance')}
                className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'maintenance'
                    ? 'border-[#1E3A8A] text-[#1E3A8A]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Riwayat Kerusakan & Perbaikan ({maintenanceTimeline.length})
              </button>
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Identitas & Nilai Barang Milik Daerah
                  </h3>
                  <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                    <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                      <dt className="text-slate-500">Kode Barang BMD</dt>
                      <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                        {asset.kodeBarangBmd}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                      <dt className="text-slate-500">NUP</dt>
                      <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                        {asset.nup}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                      <dt className="text-slate-500">Merk / Tipe</dt>
                      <dd className="font-medium text-slate-900 text-right">
                        {asset.merkTipe}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                      <dt className="text-slate-500">Nomor Seri / Rangka</dt>
                      <dd className="font-mono font-medium text-slate-900">
                        {asset.nomorSeriRangka}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                      <dt className="text-slate-500">Tahun Perolehan</dt>
                      <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                        {asset.tahunPerolehan}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                      <dt className="text-slate-500">Nilai Perolehan</dt>
                      <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatRupiah(asset.nilaiPerolehan)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                      <dt className="text-slate-500">Total Biaya Pemeliharaan</dt>
                      <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatRupiah(totalServiceCost)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Spesifikasi Teknis ({category?.nama ?? 'Umum'})
                  </h3>
                  <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                    {category && category.fields.length > 0 ? (
                      category.fields.map((field) => (
                        <div
                          key={field.key}
                          className="flex justify-between gap-4 px-4 py-2.5 text-xs"
                        >
                          <dt className="text-slate-500">{field.label}</dt>
                          <dd className="font-medium text-slate-900 text-right">
                            {asset.spesifikasi[field.key] || '-'}
                          </dd>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">
                        Tidak ada atribut spesifikasi khusus untuk kategori ini.
                      </div>
                    )}
                    <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                      <dt className="text-slate-500">Bidang / UPTD</dt>
                      <dd className="font-medium text-slate-900 text-right">
                        {asset.unitKerja}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                      <dt className="text-slate-500">Lokasi Penempatan</dt>
                      <dd className="font-medium text-slate-900 text-right">
                        {asset.lokasiPenempatan}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {activeTab === 'pic' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Timeline Kronologis Pemakai (PIC)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Rekam jejak lengkap seluruh pegawai yang pernah memegang unit aset ini
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {asset.picAktifId && (
                      <button
                        type="button"
                        onClick={() => onReturnAssetToPool(asset.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <PackageCheck className="h-3.5 w-3.5 text-sky-600" />
                        <span>Kembalikan ke Gudang</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenHandoverForAsset(asset.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      <span>Serah Terima / Ganti PIC</span>
                    </button>
                  </div>
                </div>

                {picTimeline.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500">
                    Belum ada riwayat serah terima PIC untuk aset ini.
                  </div>
                ) : (
                  <ol className="space-y-3">
                    {picTimeline.map((entry) => {
                      const emp = employeeMap.get(entry.employeeId);
                      const isActive = entry.tanggalSelesai === null;
                      return (
                        <li
                          key={entry.id}
                          className={`rounded-lg border p-4 ${
                            isActive
                              ? 'border-blue-300 bg-blue-50/40'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">
                                  {emp?.nama ?? 'Pegawai Tidak Dikenal'}
                                </span>
                                {isActive && (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-[#1E3A8A]">
                                    <UserCheck className="h-3 w-3" />
                                    PIC Aktif Saat Ini
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-slate-600">
                                NIP/ID: <span className="font-mono">{emp?.nip ?? '-'}</span> ·{' '}
                                {emp?.jabatan ?? '-'} · {emp?.unitKerja ?? '-'}
                              </p>
                            </div>
                            <ConditionBadge condition={entry.kondisiSerahTerima} />
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-200/80 pt-3 text-xs sm:grid-cols-3">
                            <div>
                              <span className="text-slate-500">Tanggal Mulai Pakai:</span>
                              <p className="font-mono font-medium text-slate-900">
                                {formatDateId(entry.tanggalMulai)}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">Tanggal Selesai Pakai:</span>
                              <p
                                className={`font-mono font-medium ${
                                  isActive ? 'text-[#1E3A8A]' : 'text-slate-900'
                                }`}
                              >
                                {formatDateId(entry.tanggalSelesai)}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">Nomor BAST:</span>
                              <p className="font-mono font-semibold text-slate-900">
                                {entry.nomorBast}
                              </p>
                            </div>
                          </div>
                          {entry.catatan && (
                            <p className="mt-2 text-xs text-slate-600">
                              Catatan: {entry.catatan}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Timeline Riwayat Kerusakan & Perbaikan
                    </h3>
                    <p className="text-xs text-slate-500">
                      Seluruh kejadian kerusakan, tindakan teknis, vendor, dan biaya servis pada unit ini
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {openTicket && (
                      <button
                        type="button"
                        onClick={() => onOpenResolveMaintenance(openTicket)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Catat Penyelesaian Perbaikan</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenReportDamageForAsset(asset.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Laporkan Kerusakan</span>
                    </button>
                  </div>
                </div>

                {maintenanceTimeline.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500">
                    Belum ada catatan kerusakan maupun perbaikan pada unit aset ini.
                  </div>
                ) : (
                  <ol className="space-y-3">
                    {maintenanceTimeline.map((record) => {
                      const isResolved = record.statusTiket === 'Selesai';
                      return (
                        <li
                          key={record.id}
                          className={`rounded-lg border p-4 ${
                            isResolved
                              ? 'border-slate-200 bg-white'
                              : 'border-amber-300 bg-amber-50/40'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <TicketStatusBadge status={record.statusTiket} />
                                <ConditionBadge condition={record.tingkatKerusakan} />
                                <span className="font-mono text-xs text-slate-500">
                                  Lapor: {formatDateId(record.tanggalLapor)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-semibold text-slate-900">
                                {record.deskripsiKerusakan}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                Pelapor: <span className="font-medium text-slate-700">{record.pelaporNama}</span>
                              </p>
                            </div>

                            {!isResolved && (
                              <button
                                type="button"
                                onClick={() => onOpenResolveMaintenance(record)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shrink-0"
                              >
                                <Wrench className="h-3.5 w-3.5" />
                                <span>Selesaikan Perbaikan</span>
                              </button>
                            )}
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-200/80 pt-3 text-xs sm:grid-cols-4">
                            <div>
                              <span className="text-slate-500">Tanggal Perbaikan:</span>
                              <p className="font-mono font-medium text-slate-900">
                                {record.tanggalPerbaikan
                                  ? formatDateId(record.tanggalPerbaikan)
                                  : 'Belum selesai'}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">Teknisi / Vendor:</span>
                              <p className="font-medium text-slate-900">
                                {record.teknisiVendor}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">Biaya Servis:</span>
                              <p className="font-mono font-semibold text-slate-900 tabular-nums">
                                {formatRupiah(record.biayaServis)}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">Kondisi Akhir:</span>
                              <div className="mt-0.5">
                                {record.kondisiAkhir ? (
                                  <ConditionBadge condition={record.kondisiAkhir} />
                                ) : (
                                  <span className="text-slate-500">Menunggu selesai</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {record.tindakanPerbaikan && (
                            <p className="mt-2.5 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700">
                              <span className="font-semibold text-slate-900">Tindakan Perbaikan:</span>{' '}
                              {record.tindakanPerbaikan}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showQrSticker && (
        <QrStickerPrintModal
          asset={asset}
          categoryName={category?.nama ?? 'Umum'}
          onClose={() => setShowQrSticker(false)}
        />
      )}
    </>
  );
}
