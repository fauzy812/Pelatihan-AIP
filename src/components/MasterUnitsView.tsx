import { useState } from 'react';
import { Building2, Edit2 } from 'lucide-react';
import type {
  AppStateData,
  UnitKerjaItem,
  UserRole,
} from '../types/asset';

interface MasterUnitsViewProps {
  data: AppStateData;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onUpsertUnit: (unit: Omit<UnitKerjaItem, 'id'> & { id?: string }) => void;
}

export function MasterUnitsView({
  data,
  userRole,
  onChangeRole,
  onUpsertUnit,
}: MasterUnitsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [kepalaUnit, setKepalaUnit] = useState('');
  const [lokasiKantor, setLokasiKantor] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  const canManage =
    userRole === 'Admin / Pranata Komputer' || userRole === 'Pengurus Barang';

  const startEdit = (unit: UnitKerjaItem) => {
    setEditingId(unit.id);
    setKode(unit.kode);
    setNama(unit.nama);
    setKepalaUnit(unit.kepalaUnit);
    setLokasiKantor(unit.lokasiKantor);
    setErrorMsg('');
    setSavedNotice('');
  };

  const resetForm = () => {
    setEditingId(null);
    setKode('');
    setNama('');
    setKepalaUnit('');
    setLokasiKantor('');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode.trim() || !nama.trim()) {
      setErrorMsg('Kode Singkat dan Nama Bidang / UPTD wajib diisi.');
      return;
    }

    onUpsertUnit({
      id: editingId ?? undefined,
      kode: kode.trim().toUpperCase(),
      nama: nama.trim(),
      kepalaUnit: kepalaUnit.trim() || '-',
      lokasiKantor: lokasiKantor.trim() || '-',
    });

    setSavedNotice(
      editingId
        ? `Data bidang "${nama.trim()}" berhasil diperbarui dan disinkronkan ke seluruh aset & pegawai.`
        : `Bidang baru "${nama.trim()}" berhasil ditambahkan ke Master Bidang.`,
    );
    resetForm();
  };

  return (
    <div className="space-y-6">
      {!canManage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-xs text-amber-900">
          <p>
            Peran saat ini (<span className="font-semibold">{userRole}</span>) hanya
            memiliki akses baca pada Master Bidang. Beralih ke{' '}
            <span className="font-semibold">Admin / Pranata Komputer</span> untuk
            menambah atau mengubah data bidang.
          </p>
          <button
            type="button"
            onClick={() => onChangeRole('Admin / Pranata Komputer')}
            className="rounded-lg bg-[#1E3A8A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-900 whitespace-nowrap"
          >
            Beralih ke Admin / Pranata Komputer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Tambah / Edit Bidang */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#1E3A8A]" />
              <h2 className="text-base font-semibold text-slate-900">
                {editingId ? 'Edit Data Bidang / UPTD' : 'Tambah Bidang / UPTD Baru'}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Batal Edit
              </button>
            )}
          </div>

          {savedNotice && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
              {savedNotice}
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="unit-kode"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Kode Bidang *
                </label>
                <input
                  id="unit-kode"
                  type="text"
                  value={kode}
                  onChange={(e) => setKode(e.target.value)}
                  placeholder="DRN"
                  disabled={!canManage}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm uppercase text-slate-900 disabled:bg-slate-100 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="unit-nama"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Nama Bidang / UPTD *
                </label>
                <input
                  id="unit-nama"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Bidang Drainase Perkotaan"
                  disabled={!canManage}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="unit-kepala"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Kepala Bidang / Koordinator
              </label>
              <input
                id="unit-kepala"
                type="text"
                value={kepalaUnit}
                onChange={(e) => setKepalaUnit(e.target.value)}
                placeholder="Nama pejabat / koordinator unit"
                disabled={!canManage}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="unit-lokasi"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Lokasi Kantor / Pos Lapangan
              </label>
              <textarea
                id="unit-lokasi"
                rows={2}
                value={lokasiKantor}
                onChange={(e) => setLokasiKantor(e.target.value)}
                placeholder="Gedung, lantai, atau lokasi pos UPTD..."
                disabled={!canManage}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!canManage}
              className="w-full rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editingId ? 'Simpan Perubahan Bidang' : 'Simpan Bidang Baru'}
            </button>
          </form>
        </div>

        {/* Daftar Master Bidang */}
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Daftar Bidang & UPTD DPUBMSDA
              </h2>
              <p className="text-xs text-slate-500">
                Data bidang terhubung otomatis ke form inventaris aset, pegawai, dan grafik dashboard
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
              {data.units.length} Bidang/UPTD
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {data.units.map((unit) => {
              const assetCount = data.assets.filter(
                (a) => a.unitKerja === unit.nama,
              ).length;
              const empCount = data.employees.filter(
                (e) => e.unitKerja === unit.nama,
              ).length;
              return (
                <div
                  key={unit.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1E3A8A]">
                        [{unit.kode}]
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        {unit.nama}
                      </h3>
                      <span className="text-xs text-slate-500 tabular-nums">
                        · {assetCount} aset · {empCount} pegawai
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Pimpinan/Koordinator:{' '}
                      <span className="font-medium text-slate-800">
                        {unit.kepalaUnit || '-'}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">{unit.lokasiKantor}</p>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => startEdit(unit)}
                      aria-label={`Edit bidang ${unit.nama}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#1E3A8A] hover:text-[#1E3A8A] shrink-0"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit Bidang</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
