import { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRightLeft,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock,
  Eye,
  QrCode,
  UserCheck,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { AppStateData } from '../types/asset';
import { computeDashboardMetrics, formatDateId, formatRupiah } from '../utils/assetLogic';
import { ConditionBadge } from './StatusBadge';

interface DashboardViewProps {
  data: AppStateData;
  onOpenAssetDetail: (assetId: string) => void;
  onNavigateToAssetsByCategory: (categoryId: string) => void;
  onNavigateToMaintenance: () => void;
}

const DONUT_COLORS = [
  '#1E3A8A',
  '#2563EB',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#64748B',
];

export function DashboardView({
  data,
  onOpenAssetDetail,
  onNavigateToAssetsByCategory,
  onNavigateToMaintenance,
}: DashboardViewProps) {
  const metrics = computeDashboardMetrics(data);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(
    null,
  );
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null);

  const maxCategoryTotal = Math.max(
    1,
    ...metrics.categoryStats.map((c) => c.total),
  );

  const donutTotal = Math.max(1, metrics.totalAssets);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let cumulativeFraction = 0;

  const donutSegments = metrics.unitStats.map((unit, idx) => {
    const fraction = unit.total / donutTotal;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeFraction * circumference;
    cumulativeFraction += fraction;
    return {
      ...unit,
      color: DONUT_COLORS[idx % DONUT_COLORS.length],
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const hoveredUnitInfo = metrics.unitStats.find(
    (u) => u.unitKerja === hoveredUnit,
  );

  return (
    <div className="space-y-6">
      {/* 6 Primary KPI Cards */}
      <section aria-label="Ringkasan KPI Aset">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Total Aset Terdaftar</span>
              <Boxes className="h-4 w-4 text-[#1E3A8A]" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {metrics.totalAssets}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              Nilai {formatRupiah(metrics.totalAssetValue)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Kondisi Baik</span>
              <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {metrics.baikCount}
              </p>
              <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums">
                ({metrics.baikPercentage}%)
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Siap operasional dinas</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Kondisi Rusak Ringan</span>
              <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {metrics.rusakRinganCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">Perlu pemeliharaan</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Kondisi Rusak Berat</span>
              <AlertOctagon className="h-4 w-4 text-[#EF4444]" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-red-700 tabular-nums">
              {metrics.rusakBeratCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">Prioritas evaluasi BMD</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Aktif Dipakai PIC</span>
              <UserCheck className="h-4 w-4 text-[#3B82F6]" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {metrics.activePicCount}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {metrics.totalAssets - metrics.activePicCount} unit tersedia di gudang
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Dalam Perbaikan</span>
              <Wrench className="h-4 w-4 text-[#F59E0B]" />
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {metrics.inRepairCount}
            </p>
            <button
              type="button"
              onClick={onNavigateToMaintenance}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#1E3A8A] hover:underline"
            >
              <span>Lihat tiket servis</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </section>

      {/* Operational & SLA Strip (PRD Section 8.3 & 16) */}
      <section aria-label="Metrik Efisiensi Operasional Pemeliharaan">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Rata-rata Waktu Perbaikan (MTTR)
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                {metrics.mttrDays} hari
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#1E3A8A]">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Cakupan Pelabelan QR Inventaris
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-emerald-700 tabular-nums">
                {metrics.qrCoveragePercent}%
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <QrCode className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Akumulasi Biaya Pemeliharaan
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                {formatRupiah(metrics.totalMaintenanceCost)}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Kandidat Relokasi Menganggur (≥30h)
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-[#1E3A8A] tabular-nums">
                {metrics.idleAssets.length} unit
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Charts Row */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Stacked Bar Chart: Komposisi Kondisi Aset berdasarkan Jenis Aset Dinamis */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Komposisi Kondisi per Jenis Aset Dinamis
              </h2>
              <p className="text-xs text-slate-500">
                Klik batang kategori untuk memfilter daftar aset pada jenis tersebut
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#10B981]" />
                Baik
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#F59E0B]" />
                Rusak Ringan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#EF4444]" />
                Rusak Berat
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {metrics.categoryStats.map((stat) => {
              const isHovered = hoveredCategoryId === stat.categoryId;
              const baikWidth =
                stat.total > 0 ? (stat.baik / maxCategoryTotal) * 100 : 0;
              const ringanWidth =
                stat.total > 0 ? (stat.rusakRingan / maxCategoryTotal) * 100 : 0;
              const beratWidth =
                stat.total > 0 ? (stat.rusakBerat / maxCategoryTotal) * 100 : 0;

              return (
                <button
                  key={stat.categoryId}
                  type="button"
                  onMouseEnter={() => setHoveredCategoryId(stat.categoryId)}
                  onMouseLeave={() => setHoveredCategoryId(null)}
                  onClick={() => onNavigateToAssetsByCategory(stat.categoryId)}
                  className={`block w-full rounded-lg p-1.5 text-left transition-colors ${
                    isHovered ? 'bg-slate-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">
                      {stat.categoryName}{' '}
                      <span className="font-mono text-[11px] text-slate-400">
                        ({stat.kode})
                      </span>
                    </span>
                    <span className="font-mono text-xs text-slate-600 tabular-nums">
                      {stat.total} unit · {stat.baik} Baik / {stat.rusakRingan} R.Ringan /{' '}
                      {stat.rusakBerat} R.Berat
                    </span>
                  </div>
                  <div className="flex h-4 w-full overflow-hidden rounded-md bg-slate-100">
                    {stat.baik > 0 && (
                      <div
                        style={{ width: `${baikWidth}%` }}
                        className="h-full bg-[#10B981] transition-all duration-200"
                        title={`Baik: ${stat.baik}`}
                      />
                    )}
                    {stat.rusakRingan > 0 && (
                      <div
                        style={{ width: `${ringanWidth}%` }}
                        className="h-full bg-[#F59E0B] transition-all duration-200"
                        title={`Rusak Ringan: ${stat.rusakRingan}`}
                      />
                    )}
                    {stat.rusakBerat > 0 && (
                      <div
                        style={{ width: `${beratWidth}%` }}
                        className="h-full bg-[#EF4444] transition-all duration-200"
                        title={`Rusak Berat: ${stat.rusakBerat}`}
                      />
                    )}
                    {stat.total === 0 && (
                      <div className="flex h-full items-center px-2 text-[11px] text-slate-400">
                        Belum ada aset terdaftar
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Donut Chart: Distribusi Aset per Bidang / UPTD */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Distribusi Aset per Bidang / UPTD
            </h2>
            <p className="text-xs text-slate-500">
              Sebaran penempatan aset operasional di lingkungan DPUBMSDA
            </p>
          </div>

          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
              <svg
                viewBox="0 0 144 144"
                className="h-40 w-40 -rotate-90"
                role="img"
                aria-label="Grafik Donut Distribusi Aset per Bidang dan UPTD"
              >
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="22"
                />
                {donutSegments.map((seg) => {
                  const active = hoveredUnit === seg.unitKerja;
                  return (
                    <circle
                      key={seg.unitKerja}
                      cx="72"
                      cy="72"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={active ? 26 : 22}
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredUnit(seg.unitKerja)}
                      onMouseLeave={() => setHoveredUnit(null)}
                    />
                  );
                })}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                  {hoveredUnitInfo ? hoveredUnitInfo.total : metrics.totalAssets}
                </span>
                <span className="text-[11px] font-medium text-slate-500 leading-tight">
                  {hoveredUnitInfo ? hoveredUnitInfo.unitKerja : 'Total Unit'}
                </span>
              </div>
            </div>

            <div className="w-full flex-1 space-y-2">
              {donutSegments.map((seg) => (
                <div
                  key={seg.unitKerja}
                  onMouseEnter={() => setHoveredUnit(seg.unitKerja)}
                  onMouseLeave={() => setHoveredUnit(null)}
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
                    hoveredUnit === seg.unitKerja ? 'bg-slate-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="truncate font-medium text-slate-700">
                      {seg.unitKerja}
                    </span>
                  </div>
                  <div className="ml-2 flex items-center gap-2 font-mono text-slate-600 tabular-nums shrink-0">
                    <span className="font-semibold text-slate-900">
                      {seg.total}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({seg.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Smart Insight Table */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Peringatan & Rekomendasi Cerdas (Smart Insight)
            </h2>
            <p className="text-xs text-slate-500">
              Deteksi otomatis kerusakan berulang (≥2x), ≥3x dalam 6 bulan, biaya servis &gt;50% nilai perolehan, atau kondisi Rusak Berat
            </p>
          </div>
          <span className="font-mono text-xs font-medium text-slate-600 tabular-nums">
            {metrics.smartInsights.length} aset memerlukan perhatian
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="px-5 py-3">Kode BMD / Aset</th>
                <th className="px-4 py-3">Jenis & Lokasi</th>
                <th className="px-4 py-3">Kondisi & Prioritas</th>
                <th className="px-4 py-3 text-right">Frek. Kerusakan</th>
                <th className="px-4 py-3 text-right">Biaya Servis (% Nilai)</th>
                <th className="px-4 py-3">Alasan & Rekomendasi BMD</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {metrics.smartInsights.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-sm text-slate-500"
                  >
                    Seluruh aset dalam kondisi prima tanpa temuan kerusakan berulang.
                  </td>
                </tr>
              ) : (
                metrics.smartInsights.map((item) => (
                  <tr
                    key={item.asset.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-5 py-3.5 align-top">
                      <p className="font-semibold text-slate-900">
                        {item.asset.nama}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
                        {item.asset.kodeBarangBmd} · NUP {item.asset.nup}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top text-xs text-slate-600">
                      <p className="font-medium text-slate-800">
                        {item.categoryName}
                      </p>
                      <p className="mt-0.5">{item.asset.lokasiPenempatan}</p>
                    </td>
                    <td className="px-4 py-3.5 align-top space-y-1">
                      <ConditionBadge condition={item.asset.kondisi} />
                      <p
                        className={`text-[11px] font-semibold ${
                          item.priority === 'Tinggi'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}
                      >
                        Prioritas {item.priority}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                      <p>{item.repairCount}x total</p>
                      {item.recent6MonthCount > 0 && (
                        <p className="mt-0.5 text-[11px] font-normal text-slate-500">
                          ({item.recent6MonthCount}x / 6 bln)
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-top text-right font-mono text-xs font-medium text-slate-700 tabular-nums">
                      <p>{formatRupiah(item.totalRepairCost)}</p>
                      <p
                        className={`mt-0.5 text-[11px] font-semibold ${
                          item.costRatioPercent > 50
                            ? 'text-red-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.costRatioPercent}% nilai perolehan
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top text-xs">
                      <p className="font-semibold text-slate-800">
                        {item.reasons.join(' · ')}
                      </p>
                      <p className="mt-0.5 text-slate-600">
                        {item.recommendation}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 align-top text-right">
                      <button
                        type="button"
                        onClick={() => onOpenAssetDetail(item.asset.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-[#1E3A8A] hover:border-[#1E3A8A] hover:bg-blue-50 whitespace-nowrap"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Detail 360°</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Smart Relocation Card for Idle Assets (PRD Section 8.3) */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ArrowRightLeft className="h-4 w-4 text-[#1E3A8A]" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Rekomendasi Relokasi Aset Menganggur (Smart Relocation)
              </h2>
              <p className="text-xs text-slate-500">
                Aset berstatus Tersedia (tidak dipegang PIC) selama ≥30 hari yang layak direalokasikan antar-bidang/UPTD
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-semibold text-[#1E3A8A] tabular-nums">
            {metrics.idleAssets.length} kandidat relokasi
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {metrics.idleAssets.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs text-slate-500">
              Seluruh aset siap pakai telah terdistribusi ke PIC atau baru saja kembali ke gudang (&lt;30 hari).
            </p>
          ) : (
            metrics.idleAssets.map((item) => (
              <div
                key={item.asset.id}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/70 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {item.asset.nama}
                    </span>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {item.asset.kodeBarangBmd} · NUP {item.asset.nup}
                    </span>
                    <span className="rounded bg-sky-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-800 border border-sky-200 tabular-nums">
                      Menganggur {item.idleDays} hari
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {item.recommendation} (Terakhir aktif/tercatat: {formatDateId(item.lastUsedDate)})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAssetDetail(item.asset.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] hover:border-[#1E3A8A] hover:bg-blue-50 whitespace-nowrap"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Tinjau & Mutasi PIC</span>
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
