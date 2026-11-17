import { useState } from 'react';
import { Edit2, Layers, Plus, Trash2 } from 'lucide-react';
import type {
  AppStateData,
  AssetCategory,
  AssetTypeField,
  UserRole,
} from '../types/asset';

interface DynamicCategoriesViewProps {
  data: AppStateData;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onUpsertCategory: (
    category: Omit<AssetCategory, 'id'> & { id?: string },
  ) => void;
}

export function DynamicCategoriesView({
  data,
  userRole,
  onChangeRole,
  onUpsertCategory,
}: DynamicCategoriesViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [fields, setFields] = useState<AssetTypeField[]>([
    { key: 'spesifikasiUtama', label: 'Spesifikasi Utama', placeholder: 'Masukkan detail teknis' },
  ]);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  const canManage =
    userRole === 'Admin / Pranata Komputer' || userRole === 'Pengurus Barang';

  const startEdit = (cat: AssetCategory) => {
    setEditingId(cat.id);
    setKode(cat.kode);
    setNama(cat.nama);
    setDeskripsi(cat.deskripsi);
    setFields(
      cat.fields.length > 0
        ? cat.fields.map((f) => ({ ...f }))
        : [{ key: 'spesifikasiUtama', label: 'Spesifikasi Utama', placeholder: 'Isi detail' }],
    );
    setErrorMsg('');
    setSavedNotice('');
  };

  const resetForm = () => {
    setEditingId(null);
    setKode('');
    setNama('');
    setDeskripsi('');
    setFields([
      { key: 'spesifikasiUtama', label: 'Spesifikasi Utama', placeholder: 'Masukkan detail teknis' },
    ]);
    setErrorMsg('');
  };

  const addFieldRow = () => {
    setFields((prev) => [
      ...prev,
      {
        key: `atribut_${prev.length + 1}`,
        label: '',
        placeholder: '',
      },
    ]);
  };

  const removeFieldRow = (idx: number) => {
    setFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateFieldRow = (
    idx: number,
    patch: Partial<AssetTypeField>,
  ) => {
    setFields((prev) =>
      prev.map((f, i) => {
        if (i !== idx) return f;
        const nextLabel = patch.label ?? f.label;
        const autoKey =
          patch.label !== undefined
            ? nextLabel
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_|_$/g, '') || `atribut_${i + 1}`
            : f.key;
        return {
          ...f,
          ...patch,
          key: patch.key ?? autoKey,
        };
      }),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode.trim() || !nama.trim()) {
      setErrorMsg('Kode Kategori dan Nama Jenis Aset wajib diisi.');
      return;
    }

    const cleanFields = fields
      .filter((f) => f.label.trim().length > 0)
      .map((f, index) => ({
        key:
          f.key.trim() ||
          f.label
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_') ||
          `field_${index + 1}`,
        label: f.label.trim(),
        placeholder: f.placeholder.trim() || `Isi ${f.label.trim()}`,
      }));

    onUpsertCategory({
      id: editingId ?? undefined,
      kode: kode.trim().toUpperCase(),
      nama: nama.trim(),
      deskripsi:
        deskripsi.trim() || `Kategori inventaris ${nama.trim()} DPUBMSDA.`,
      fields: cleanFields,
    });

    setSavedNotice(
      editingId
        ? `Jenis aset "${nama.trim()}" berhasil diperbarui.`
        : `Jenis aset baru "${nama.trim()}" berhasil ditambahkan dan langsung tersedia di Data Aset & Dashboard.`,
    );
    resetForm();
  };

  return (
    <div className="space-y-6">
      {!canManage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-xs text-amber-900">
          <p>
            Peran saat ini (<span className="font-semibold">{userRole}</span>) hanya
            memiliki akses baca pada Master Jenis Aset. Beralih ke{' '}
            <span className="font-semibold">Admin / Pranata Komputer</span> untuk
            menambah atau mengubah kategori dinamis.
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
        {/* Form Tambah / Edit Kategori Dinamis */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#1E3A8A]" />
              <h2 className="text-base font-semibold text-slate-900">
                {editingId ? 'Edit Jenis Aset' : 'Tambah Jenis Aset Baru'}
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
                  htmlFor="cat-kode"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Kode Singkat *
                </label>
                <input
                  id="cat-kode"
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
                  htmlFor="cat-nama"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Nama Jenis Aset *
                </label>
                <input
                  id="cat-nama"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Drone Pemetaan"
                  disabled={!canManage}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="cat-deskripsi"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Deskripsi Kategori
              </label>
              <textarea
                id="cat-deskripsi"
                rows={2}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Penjelasan ringkas cakupan aset dalam kategori ini..."
                disabled={!canManage}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">
                  Atribut Spesifikasi Kustom
                </span>
                <button
                  type="button"
                  onClick={addFieldRow}
                  disabled={!canManage}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-[#1E3A8A] hover:bg-blue-50 disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  <span>Tambah Atribut</span>
                </button>
              </div>

              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 items-center gap-2"
                  >
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) =>
                        updateFieldRow(idx, { label: e.target.value })
                      }
                      placeholder="Nama Atribut (mis. Resolusi Kamera)"
                      aria-label={`Nama atribut spesifikasi ${idx + 1}`}
                      disabled={!canManage}
                      className="col-span-6 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 disabled:bg-slate-100 focus:border-[#1E3A8A] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={field.placeholder}
                      onChange={(e) =>
                        updateFieldRow(idx, { placeholder: e.target.value })
                      }
                      placeholder="Contoh nilai"
                      aria-label={`Contoh nilai atribut ${idx + 1}`}
                      disabled={!canManage}
                      className="col-span-5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 disabled:bg-slate-100 focus:border-[#1E3A8A] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeFieldRow(idx)}
                      disabled={!canManage || fields.length <= 1}
                      aria-label={`Hapus atribut ${idx + 1}`}
                      className="col-span-1 flex justify-center rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!canManage}
              className="w-full rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editingId ? 'Simpan Perubahan Jenis Aset' : 'Simpan Jenis Aset Baru'}
            </button>
          </form>
        </div>

        {/* Daftar Master Jenis Aset */}
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Daftar Jenis Aset Terdaftar
              </h2>
              <p className="text-xs text-slate-500">
                Kategori otomatis tersinkron ke filter Data Aset, Form Tambah Aset, dan Grafik Dashboard
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
              {data.categories.length} Kategori
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {data.categories.map((cat) => {
              const count = data.assets.filter(
                (a) => a.categoryId === cat.id,
              ).length;
              return (
                <div
                  key={cat.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#1E3A8A]">
                        [{cat.kode}]
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        {cat.nama}
                      </h3>
                      <span className="text-xs text-slate-500 tabular-nums">
                        · {count} unit aset
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{cat.deskripsi}</p>
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">
                        Atribut Spesifikasi:
                      </span>{' '}
                      {cat.fields.length > 0
                        ? cat.fields.map((f) => f.label).join(', ')
                        : 'Tidak ada atribut tambahan'}
                    </p>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#1E3A8A] hover:text-[#1E3A8A] shrink-0"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit Skema</span>
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
