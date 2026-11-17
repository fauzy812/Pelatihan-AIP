import { useState } from 'react';
import {
  AlertCircle,
  Download,
  FileSpreadsheet,
  Loader2,
  Printer,
  Sparkles,
} from 'lucide-react';
import type { AppStateData } from '../types/asset';
import {
  computeDashboardMetrics,
  formatDateId,
  formatRupiah,
  generateAssetsCsv,
} from '../utils/assetLogic';
import { ConditionBadge, TicketStatusBadge } from './StatusBadge';

interface ReportsViewProps {
  data: AppStateData;
}

interface AiManagementBrief {
  ringkasanEksekutif: string;
  sorotanKritis: string[];
  rekomendasiAnggaran: string;
  rencanaTindakLanjut: string[];
}

export function ReportsView({ data }: ReportsViewProps) {
  const [reportMode, setReportMode] = useState<'brief' | 'kartu'>('brief');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    data.assets[0]?.id ?? '',
  );
  const [exportStatus, setExportStatus] = useState('');

  // Gemini AI Management Brief State
  const [aiBrief, setAiBrief] = useState<AiManagementBrief | null>(null);
  const [aiGeneratedAt, setAiGeneratedAt] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const metrics = computeDashboardMetrics(data);
  const categoryMap = new Map(data.categories.map((c) => [c.id, c.nama]));
  const employeeMap = new Map(data.employees.map((e) => [e.id, e]));
  const assetMap = new Map(data.assets.map((a) => [a.id, a]));

  const openTickets = data.maintenance.filter(
    (m) => m.statusTiket !== 'Selesai',
  );

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

  const handleGenerateAiBrief = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const payload = {
        metricsSummary: {
          totalAssets: metrics.totalAssets,
          baikCount: metrics.baikCount,
          baikPercentage: metrics.baikPercentage,
          rusakRinganCount: metrics.rusakRinganCount,
          rusakBeratCount: metrics.rusakBeratCount,
          activePicCount: metrics.activePicCount,
          inRepairCount: metrics.inRepairCount,
          totalAssetValue: metrics.totalAssetValue,
          totalMaintenanceCost: metrics.totalMaintenanceCost,
          mttrDays: metrics.mttrDays,
        },
        categoryStats: metrics.categoryStats.map((c) => ({
          categoryName: c.categoryName,
          total: c.total,
          baik: c.baik,
          rusakRingan: c.rusakRingan,
          rusakBerat: c.rusakBerat,
        })),
        smartInsights: metrics.smartInsights.map((i) => ({
          assetName: i.asset.nama,
          kodeBarangBmd: i.asset.kodeBarangBmd,
          kondisi: i.asset.kondisi,
          repairCount: i.repairCount,
          totalRepairCost: i.totalRepairCost,
          nilaiPerolehan: i.asset.nilaiPerolehan,
          reasons: i.reasons,
          recommendation: i.recommendation,
        })),
        idleAssets: metrics.idleAssets.map((idle) => ({
          assetName: idle.asset.nama,
          unitKerja: idle.asset.unitKerja,
          idleDays: idle.idleDays,
        })),
      };

      const res = await fetch('/api/ai/management-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = (await res.json().catch(() => ({}))) as {
        brief?: AiManagementBrief;
        generatedAt?: string;
        error?: string;
      };

      if (!res.ok || !body.brief) {
        throw new Error(
          body.error ||
            `Layanan AI gagal merespons (HTTP ${res.status}).`,
        );
      }

      setAiBrief(body.brief);
      setAiGeneratedAt(body.generatedAt ?? new Date().toISOString());
    } catch (err) {
      setAiBrief(null);
      setAiError(
        err instanceof Error
          ? err.message
          : 'Gagal terhubung ke server AI Management Brief.',
      );
    } finally {
      setAiLoading(false);
    }
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
          {reportMode === 'brief' && (
            <button
              type="button"
              onClick={handleGenerateAiBrief}
              disabled={aiLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-[#1E3A8A] hover:bg-blue-100 disabled:cursor-wait disabled:opacity-60 whitespace-nowrap"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>
                {aiLoading
                  ? 'Menyusun Narasi AI...'
                  : 'Buat Narasi Analisis AI'}
              </span>
            </button>
          )}
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

      {aiError && (
        <div
          role="alert"
          className="no-print flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold">Penyusunan Analisis AI Tidak Tersedia</p>
            <p className="mt-0.5">{aiError}</p>
          </div>
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
                MANAGEMENT BRIEF: REKAPITULASI KONDISI, SLA &amp; PEMELIHARAAN BMD
              </h3>
              <span className="font-mono text-xs text-slate-500">
                Tanggal Cetak: {formatDateId(new Date().toISOString().slice(0, 10))}
              </span>
            </div>

            {/* Summary KPI + Operational Metrics (PRD Lampiran D) */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
                <p className="text-[11px] text-slate-500">MTTR Pemeliharaan</p>
                <p className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                  {metrics.mttrDays} Hari
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-[11px] text-slate-500">Cakupan Label QR</p>
                <p className="mt-1 font-mono text-lg font-bold text-emerald-700 tabular-nums">
                  {metrics.qrCoveragePercent}%
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-[11px] text-slate-500">Total Biaya Servis</p>
                <p className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                  {formatRupiah(metrics.totalMaintenanceCost)}
                </p>
              </div>
            </div>

            {/* AI Generated Narrative Brief (when generated via /api/ai/management-brief) */}
            {aiBrief && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 pb-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1E3A8A]">
                    <Sparkles className="h-4 w-4" />
                    <span>Narasi Analisis Eksekutif (Gemini AI)</span>
                  </div>
                  {aiGeneratedAt && (
                    <span className="font-mono text-[11px] text-slate-500">
                      Disusun: {new Date(aiGeneratedAt).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    1. Ringkasan Eksekutif
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-800">
                    {aiBrief.ringkasanEksekutif}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                      2. Sorotan Aset Kritis
                    </h4>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-slate-800">
                      {aiBrief.sorotanKritis.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                      3. Rencana Tindak Lanjut Operasional
                    </h4>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-slate-800">
                      {aiBrief.rencanaTindakLanjut.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    4. Rekomendasi Kebijakan Anggaran &amp; BMD
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-800">
                    {aiBrief.rekomendasiAnggaran}
                  </p>
                </div>
              </div>
            )}

            {/* Monitoring Kerusakan & Perbaikan Aktif (Lampiran D) */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                1. Monitoring Tiket Kerusakan &amp; Perbaikan Aktif ({openTickets.length} Tiket)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-semibold text-slate-800">
                      <th className="border border-slate-300 px-3 py-2">Tgl Lapor</th>
                      <th className="border border-slate-300 px-3 py-2">Nama Aset &amp; Kode BMD</th>
                      <th className="border border-slate-300 px-3 py-2">Keluhan Kerusakan</th>
                      <th className="border border-slate-300 px-3 py-2">Teknisi / Vendor</th>
                      <th className="border border-slate-300 px-3 py-2">Status Tiket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openTickets.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="border border-slate-300 px-3 py-3 text-center text-slate-500"
                        >
                          Tidak ada tiket kerusakan terbuka saat ini.
                        </td>
                      </tr>
                    ) : (
                      openTickets.map((t) => {
                        const ast = assetMap.get(t.assetId);
                        return (
                          <tr key={t.id}>
                            <td className="border border-slate-300 px-3 py-2 font-mono">
                              {formatDateId(t.tanggalLapor)}
                            </td>
                            <td className="border border-slate-300 px-3 py-2">
                              <span className="font-semibold text-slate-900">
                                {ast?.nama ?? '-'}
                              </span>
                              <br />
                              <span className="font-mono text-slate-500">
                                {ast?.kodeBarangBmd ?? '-'}
                              </span>
                            </td>
                            <td className="border border-slate-300 px-3 py-2">
                              {t.deskripsiKerusakan}
                            </td>
                            <td className="border border-slate-300 px-3 py-2">
                              {t.teknisiVendor}
                            </td>
                            <td className="border border-slate-300 px-3 py-2">
                              <TicketStatusBadge status={t.statusTiket} />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Analisis Aset Kritis & Rekomendasi Relokasi (Lampiran D) */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                2. Analisis Aset Kritis (Smart Insight &amp; Rekomendasi BMD)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-semibold text-slate-800">
                      <th className="border border-slate-300 px-3 py-2">Nama Aset &amp; BMD</th>
                      <th className="border border-slate-300 px-3 py-2">Prioritas</th>
                      <th className="border border-slate-300 px-3 py-2 text-right">Biaya Servis (% Nilai)</th>
                      <th className="border border-slate-300 px-3 py-2">Temuan &amp; Rekomendasi BMD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.smartInsights.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="border border-slate-300 px-3 py-3 text-center text-slate-500"
                        >
                          Tidak ada temuan aset kritis.
                        </td>
                      </tr>
                    ) : (
                      metrics.smartInsights.map((ins) => (
                        <tr key={ins.asset.id}>
                          <td className="border border-slate-300 px-3 py-2">
                            <span className="font-semibold text-slate-900">
                              {ins.asset.nama}
                            </span>
                            <br />
                            <span className="font-mono text-slate-500">
                              {ins.asset.kodeBarangBmd} · NUP {ins.asset.nup}
                            </span>
                          </td>
                          <td className="border border-slate-300 px-3 py-2 font-semibold">
                            {ins.priority}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right font-mono tabular-nums">
                            {formatRupiah(ins.totalRepairCost)} ({ins.costRatioPercent}%)
                          </td>
                          <td className="border border-slate-300 px-3 py-2">
                            <span className="font-semibold text-slate-900">
                              {ins.reasons.join(' · ')}
                            </span>
                            <br />
                            <span className="text-slate-600">
                              {ins.recommendation}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Full Asset Register Table */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                3. Lampiran Daftar Inventaris Barang Milik Daerah ({data.assets.length} Unit)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-semibold text-slate-800">
                      <th className="border border-slate-300 px-3 py-2">No</th>
                      <th className="border border-slate-300 px-3 py-2">Kode BMD / NUP</th>
                      <th className="border border-slate-300 px-3 py-2">Nama Aset &amp; Merk</th>
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
                KARTU KENDALI ASET &amp; RIWAYAT PEMELIHARAAN UNIT
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
                B. Riwayat Kerusakan &amp; Pemeliharaan
              </h4>
              <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 font-semibold">
                    <th className="border border-slate-300 px-3 py-2">Tgl Lapor</th>
                    <th className="border border-slate-300 px-3 py-2">Kerusakan &amp; Tindakan</th>
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
