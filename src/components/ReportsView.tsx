import { useState } from 'react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import type { AppStateData } from '../types/asset';
import {
  computeDashboardMetrics,
  formatDateId,
  formatRupiah,
  generateAssetsCsv,
} from '../utils/assetLogic';
import { ConditionBadge } from './StatusBadge';

interface ReportsViewProps {
  data: AppStateData;
}

export function ReportsView({ data }: ReportsViewProps) {
  const [reportMode, setReportMode] = useState<'brief' | 'kartu'>('brief');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    data.assets[0]?.id ?? '',
  );
  const [exportStatus, setExportStatus] = useState('');

  const metrics = computeDashboardMetrics(data);
  const categoryMap = new Map(data.categories.map((c) => [c.id, c.nama]));
  const employeeMap = new Map(data.employees.map((e) => [e.id, e]));

  const selectedAsset = data.assets.find((a) => a.id === selectedAssetId);
  const selectedPicHistory = selectedAsset
    ? data.picHistory
        .filter((h) => h.assetId === selectedAsset.id)
        .slice()
        .sort((a, b) => a.tanggalMulai.localeCompare(b.tanggalMulai))
    : [];
  const selectedMaintHistory = selectedAsset
    ? data.maintenance
        .filter((m) => m.assetId === selectedAsset.id)
        .slice()
        .sort((a, b) => a.tanggalLapor.localeCompare(b.tanggalLapor))
    : [];

  const handleDownloadCsv = () => {
    const csv = generateAssetsCsv(
      data.assets,
      data.categories,
      data.employees,
      data.maintenance,
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `Rekap_Aset_BMD_DPUBMSDA_Sidoarjo_${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportStatus(
      `File Rekap_Aset_BMD_DPUBMSDA_Sidoarjo_${dateStamp}.csv berhasil diunduh.`,
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setReportMode('brief')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                reportMode === 'brief'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Management Brief (Rekap Dinas)
            </button>
            <button
              type="button"
              onClick={() => setReportMode('kartu')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                reportMode === 'kartu'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kartu Kendali Aset (Per Unit)
            </button>
          </div>

          {reportMode === 'kartu' && (
            <select
              aria-label="Pilih unit aset untuk Kartu Kendali"
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
            >
              {data.assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama} ({a.kodeBarangBmd} · NUP {a.nup})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 whitespace-nowrap"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Ekspor CSV / Excel</span>
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 whitespace-nowrap"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {exportStatus && (
        <div className="no-print rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800">
          {exportStatus}
        </div>
      )}

      {/* Printable Document Surface */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 print:border-0 print:p-0">
        {/* Formal Kop Surat Header */}
        <div className="border-b-2 border-slate-900 pb-4 text-center">
          <p className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
            Pemerintah Kabupaten Sidoarjo
          </p>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900 uppercase">
            Dinas Pekerjaan Umum Bina Marga dan Sumber Daya Air
          </h2>
          <p className="text-xs text-slate-600">
            Jl. Sultan Agung No. 25, Sidoarjo · Sistem Informasi Manajemen Aset Terpadu (SI-ASET SMART)
          </p>
        </div>

        {reportMode === 'brief' ? (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">
                MANAGEMENT BRIEF: REKAPITULASI KONDISI & PEMELIHARAAN BMD
              </h3>
              <span className="font-mono text-xs text-slate-500">
                Tanggal Cetak: {formatDateId(new Date().toISOString().slice(0, 10))}
              </span>
            </div>

            {/* Summary KPI Table */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-[11px] text-slate-500">Total Unit Aset</p>
                <p className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                  {metrics.totalAssets} Unit
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-[11px] text-slate-500">Kondisi Baik</p>
                <p className="mt-1 font-mono text-lg font-bold text-emerald-700 tabular-nums">
                  {metrics.baikCount} ({metrics.baikPercentage}%)
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-[11px] text-slate-500">Rusak Ringan / Berat</p>
                <p className="mt-1 font-mono text-lg font-bold text-amber-700 tabular-nums">
                  {metrics.rusakRinganCount} / {metrics.rusakBeratCount}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-[11px] text-slate-500">Total Biaya Servis</p>
                <p className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                  {formatRupiah(metrics.totalMaintenanceCost)}
                </p>
              </div>
            </div>

            {/* Full Asset Register Table */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                Lampiran Daftar Inventaris Barang Milik Daerah
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-semibold text-slate-800">
                      <th className="border border-slate-300 px-3 py-2">No</th>
                      <th className="border border-slate-300 px-3 py-2">Kode BMD / NUP</th>
                      <th className="border border-slate-300 px-3 py-2">Nama Aset & Merk</th>
                      <th className="border border-slate-300 px-3 py-2">Jenis</th>
                      <th className="border border-slate-300 px-3 py-2">Unit Kerja / PIC Aktif</th>
                      <th className="border border-slate-300 px-3 py-2 text-right">Nilai Perolehan</th>
                      <th className="border border-slate-300 px-3 py-2">Kondisi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assets.map((asset, idx) => {
                      const pic = asset.picAktifId
                        ? employeeMap.get(asset.picAktifId)
                        : undefined;
                      return (
                        <tr key={asset.id}>
                          <td className="border border-slate-300 px-3 py-2 font-mono tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 font-mono tabular-nums">
                            {asset.kodeBarangBmd} / {asset.nup}
                          </td>
                          <td className="border border-slate-300 px-3 py-2">
                            <span className="font-semibold text-slate-900">
                              {asset.nama}
                            </span>
                            <br />
                            <span className="text-slate-600">{asset.merkTipe}</span>
                          </td>
                          <td className="border border-slate-300 px-3 py-2">
                            {categoryMap.get(asset.categoryId) ?? '-'}
                          </td>
                          <td className="border border-slate-300 px-3 py-2">
                            <span>{asset.unitKerja}</span>
                            <br />
                            <span className="font-medium text-slate-900">
                              {pic ? pic.nama : 'Tersedia di Gudang'}
                            </span>
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right font-mono tabular-nums">
                            {formatRupiah(asset.nilaiPerolehan)}
                          </td>
                          <td className="border border-slate-300 px-3 py-2">
                            <ConditionBadge condition={asset.kondisi} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : selectedAsset ? (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">
                KARTU KENDALI ASET & RIWAYAT PEMELIHARAAN UNIT
              </h3>
              <span className="font-mono text-xs font-semibold text-[#1E3A8A]">
                {selectedAsset.kodeBarangBmd} · NUP {selectedAsset.nup}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-300 p-4 text-xs sm:grid-cols-2">
              <div className="space-y-1.5">
                <p>
                  <span className="text-slate-500">Nama Aset:</span>{' '}
                  <span className="font-bold text-slate-900">{selectedAsset.nama}</span>
                </p>
                <p>
                  <span className="text-slate-500">Merk / Tipe:</span>{' '}
                  <span className="font-medium text-slate-900">{selectedAsset.merkTipe}</span>
                </p>
                <p>
                  <span className="text-slate-500">Jenis Aset:</span>{' '}
                  <span className="font-medium text-slate-900">
                    {categoryMap.get(selectedAsset.categoryId) ?? '-'}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Nomor Seri / Rangka:</span>{' '}
                  <span className="font-mono text-slate-900">{selectedAsset.nomorSeriRangka}</span>
                </p>
              </div>
              <div className="space-y-1.5">
                <p>
                  <span className="text-slate-500">Tahun / Nilai Perolehan:</span>{' '}
                  <span className="font-mono font-semibold text-slate-900">
                    {selectedAsset.tahunPerolehan} · {formatRupiah(selectedAsset.nilaiPerolehan)}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Unit Kerja / Lokasi:</span>{' '}
                  <span className="font-medium text-slate-900">
                    {selectedAsset.unitKerja} — {selectedAsset.lokasiPenempatan}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Kondisi Terkini:</span>
                  <ConditionBadge condition={selectedAsset.kondisi} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                A. Histori Penanggung Jawab (PIC)
              </h4>
              <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 font-semibold">
                    <th className="border border-slate-300 px-3 py-2">Nomor BAST</th>
                    <th className="border border-slate-300 px-3 py-2">Nama Pegawai / NIP</th>
                    <th className="border border-slate-300 px-3 py-2">Periode</th>
                    <th className="border border-slate-300 px-3 py-2">Kondisi</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPicHistory.map((h) => {
                    const emp = employeeMap.get(h.employeeId);
                    return (
                      <tr key={h.id}>
                        <td className="border border-slate-300 px-3 py-2 font-mono">
                          {h.nomorBast}
                        </td>
                        <td className="border border-slate-300 px-3 py-2">
                          <span className="font-semibold">{emp?.nama ?? '-'}</span>
                          <br />
                          <span className="font-mono text-slate-500">{emp?.nip ?? '-'}</span>
                        </td>
                        <td className="border border-slate-300 px-3 py-2 font-mono">
                          {formatDateId(h.tanggalMulai)} s/d {formatDateId(h.tanggalSelesai)}
                        </td>
                        <td className="border border-slate-300 px-3 py-2">
                          {h.kondisiSerahTerima}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                B. Riwayat Kerusakan & Pemeliharaan
              </h4>
              <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 font-semibold">
                    <th className="border border-slate-300 px-3 py-2">Tgl Lapor</th>
                    <th className="border border-slate-300 px-3 py-2">Kerusakan & Tindakan</th>
                    <th className="border border-slate-300 px-3 py-2">Vendor / Teknisi</th>
                    <th className="border border-slate-300 px-3 py-2 text-right">Biaya</th>
                    <th className="border border-slate-300 px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMaintHistory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="border border-slate-300 px-3 py-4 text-center text-slate-500"
                      >
                        Belum ada catatan pemeliharaan untuk unit ini.
                      </td>
                    </tr>
                  ) : (
                    selectedMaintHistory.map((m) => (
                      <tr key={m.id}>
                        <td className="border border-slate-300 px-3 py-2 font-mono">
                          {formatDateId(m.tanggalLapor)}
                        </td>
                        <td className="border border-slate-300 px-3 py-2">
                          <span className="font-semibold">{m.deskripsiKerusakan}</span>
                          {m.tindakanPerbaikan && (
                            <>
                              <br />
                              <span className="text-slate-600">
                                Tindakan: {m.tindakanPerbaikan}
                              </span>
                            </>
                          )}
                        </td>
                        <td className="border border-slate-300 px-3 py-2">
                          {m.teknisiVendor}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right font-mono tabular-nums">
                          {formatRupiah(m.biayaServis)}
                        </td>
                        <td className="border border-slate-300 px-3 py-2">
                          {m.statusTiket}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Signature Block */}
        <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-semibold text-slate-900">
              Kepala Dinas PUBMSDA Kab. Sidoarjo
            </p>
            <div className="h-16" />
            <p className="font-semibold underline text-slate-900">
              Dr. Ir. Dwi Eko Saptono, M.M., M.T.
            </p>
            <p className="font-mono text-[11px] text-slate-600">
              Pembina Utama Muda
            </p>
          </div>
          <div>
            <p className="text-slate-600">Sidoarjo, {formatDateId(new Date().toISOString().slice(0, 10))}</p>
            <p className="font-semibold text-slate-900">
              Pengurus Barang Pengguna
            </p>
            <div className="h-16" />
            <p className="font-semibold underline text-slate-900">
              Dina Kartikasari, S.E.
            </p>
            <p className="font-mono text-[11px] text-slate-600">
              NIP. 19910822 201903 2 011
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
