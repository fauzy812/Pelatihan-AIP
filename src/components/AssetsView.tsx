import { useState } from 'react';
import { CheckCircle2, Eye, Image as ImageIcon, Plus, Search, UserCheck } from 'lucide-react';
import type { AppStateData, UserRole } from '../types/asset';
import { filterAssets, formatDateId, getRolePermissions } from '../utils/assetLogic';
import { ConditionBadge, UsageStatusBadge } from './StatusBadge';

interface AssetsViewProps {
  data: AppStateData;
  userRole: UserRole;
  activePicEmployeeId: string;
  selectedCategoryId: string;
  onSelectCategoryId: (id: string) => void;
  selectedCondition: string;
  onSelectCondition: (cond: string) => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  onOpenAssetDetail: (assetId: string) => void;
  onOpenAddAsset: () => void;
  onConfirmConditionBaik: (assetId: string) => void;
}

export function AssetsView({
  data,
  userRole,
  activePicEmployeeId,
  selectedCategoryId,
  onSelectCategoryId,
  selectedCondition,
  onSelectCondition,
  searchQuery,
  onChangeSearchQuery,
  onOpenAssetDetail,
  onOpenAddAsset,
  onConfirmConditionBaik,
}: AssetsViewProps) {
  const [onlyMyAssets, setOnlyMyAssets] = useState(false);
  const permissions = getRolePermissions(userRole);
  const isPicMode = userRole === 'Pemakai (PIC)';

  const baseFilteredAssets = filterAssets(data.assets, data.employees, {
    categoryId: selectedCategoryId,
    condition: selectedCondition,
    searchQuery,
  });

  const filteredAssets =
    isPicMode && onlyMyAssets
      ? baseFilteredAssets.filter((a) => a.picAktifId === activePicEmployeeId)
      : baseFilteredAssets;

  const myAssignedCount = data.assets.filter(
    (a) => a.picAktifId === activePicEmployeeId,
  ).length;

  const categoryMap = new Map(data.categories.map((c) => [c.id, c]));
  const employeeMap = new Map(data.employees.map((e) => [e.id, e]));
  const activePicEmp = employeeMap.get(activePicEmployeeId);
  const activeRepairAssetIds = new Set(
    data.maintenance
      .filter((m) => m.statusTiket !== 'Selesai')
      .map((m) => m.assetId),
  );

  return (
    <div className="space-y-5">
      {/* Pemakai (PIC) Focused Context Banner (PRD Section 2 & FR-04) */}
      {isPicMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-xs">
          <div className="flex items-center gap-2 text-[#1E3A8A]">
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>
              Mode Pemakai (PIC):{' '}
              <span className="font-bold">
                {activePicEmp?.nama ?? 'Pegawai'}
              </span>{' '}
              memegang{' '}
              <span className="font-mono font-bold tabular-nums">
                {myAssignedCount}
              </span>{' '}
              aset operasional aktif.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOnlyMyAssets((prev) => !prev)}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              onlyMyAssets
                ? 'bg-[#1E3A8A] text-white'
                : 'border border-blue-300 bg-white text-[#1E3A8A] hover:bg-blue-100'
            }`}
          >
            {onlyMyAssets
              ? `Menampilkan Aset Saya (${myAssignedCount}) · Lihat Semua`
              : `Filter: Aset dalam Tanggung Jawab Saya (${myAssignedCount})`}
          </button>
        </div>
      )}

      {/* Dynamic Category Filter Tabs */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Filter Jenis Aset Dinamis"
            className="flex flex-wrap items-center gap-1.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategoryId === 'ALL'}
              onClick={() => onSelectCategoryId('ALL')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedCategoryId === 'ALL'
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua Jenis ({data.assets.length})
            </button>
            {data.categories.map((cat) => {
              const count = data.assets.filter(
                (a) => a.categoryId === cat.id,
              ).length;
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectCategoryId(cat.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.nama} ({count})
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenAddAsset}
            disabled={!permissions.canCrudAssets}
            title={
              permissions.canCrudAssets
                ? 'Daftarkan unit aset BMD baru'
                : 'Hanya Admin / Pengurus Barang yang dapat menambah aset'
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Aset Baru</span>
          </button>
        </div>

        {/* Search & Condition Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <label htmlFor="asset-search-input" className="sr-only">
              Cari Kode Barang BMD, NUP, Nama Aset, Lokasi, atau PIC
            </label>
            <input
              id="asset-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="Cari Kode Barang BMD, NUP, Nama Aset, Lokasi, atau Nama PIC..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E3A8A] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="condition-filter-select"
              className="text-xs font-medium text-slate-600 whitespace-nowrap"
            >
              Filter Kondisi:
            </label>
            <select
              id="condition-filter-select"
              value={selectedCondition}
              onChange={(e) => onSelectCondition(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#1E3A8A] focus:outline-none"
            >
              <option value="ALL">Semua Kondisi</option>
              <option value="Baik">Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <p className="text-xs font-medium text-slate-600 tabular-nums">
            Menampilkan <span className="font-bold text-slate-900">{filteredAssets.length}</span> dari{' '}
            {data.assets.length} aset terdaftar
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="px-5 py-3">Kode Barang BMD & NUP</th>
                <th className="px-4 py-3">Nama & Merk Aset</th>
                <th className="px-4 py-3">Jenis Aset</th>
                <th className="px-4 py-3">Lokasi Penempatan</th>
                <th className="px-4 py-3">PIC Aktif Saat Ini</th>
                <th className="px-4 py-3">Kondisi Terkini</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      Tidak ada aset yang sesuai dengan kriteria pencarian atau filter.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Ubah kata kunci pencarian, matikan filter &quot;Aset Saya&quot;, atau tambahkan unit aset baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const cat = categoryMap.get(asset.categoryId);
                  const pic = asset.picAktifId
                    ? employeeMap.get(asset.picAktifId)
                    : undefined;
                  const inRepair = activeRepairAssetIds.has(asset.id);
                  const isMine = isPicMode && asset.picAktifId === activePicEmployeeId;
                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-5 py-3.5 align-top">
                        <p className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                          {asset.kodeBarangBmd}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
                          NUP {asset.nup} · {asset.tahunPerolehan}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900">
                            {asset.nama}
                          </p>
                          {asset.fotoAsetUrl && (
                            <span
                              title="Foto fisik aset tersedia"
                              className="text-[#1E3A8A]"
                            >
                              <ImageIcon className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {asset.merkTipe}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top text-xs text-slate-700">
                        <p className="font-medium text-slate-900">
                          {cat?.nama ?? 'Tidak Terkategori'}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                          {cat?.kode ?? '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top text-xs text-slate-600">
                        <p className="font-medium text-slate-800">
                          {asset.unitKerja}
                        </p>
                        <p className="mt-0.5">{asset.lokasiPenempatan}</p>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        {pic ? (
                          <div>
                            <p className="text-xs font-semibold text-slate-900">
                              {pic.nama}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {pic.jabatan}
                            </p>
                          </div>
                        ) : (
                          <UsageStatusBadge status="Tersedia" />
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-top space-y-1">
                        <ConditionBadge
                          condition={asset.kondisi}
                          inRepair={inRepair}
                        />
                        {asset.terakhirDiinspeksi && (
                          <p className="font-mono text-[10px] text-slate-400">
                            Cek: {formatDateId(asset.terakhirDiinspeksi)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 align-top text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {isMine && !inRepair && (
                            <button
                              type="button"
                              onClick={() => onConfirmConditionBaik(asset.id)}
                              title="Konfirmasi aset masih dalam kondisi Baik saat ini"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 whitespace-nowrap"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Konfirmasi Baik</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenAssetDetail(asset.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] hover:border-[#1E3A8A] hover:bg-blue-50 whitespace-nowrap"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Detail 360°</span>
                          </button>
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
