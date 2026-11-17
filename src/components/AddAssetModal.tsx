import { useState } from 'react';
import { Camera, Trash2, X } from 'lucide-react';
import type {
  Asset,
  AssetCategory,
  AssetCondition,
  Employee,
  UnitKerjaItem,
} from '../types/asset';
import { readAttachmentFile } from '../utils/fileHelper';

interface AddAssetModalProps {
  categories: AssetCategory[];
  units: UnitKerjaItem[];
  employees: Employee[];
  defaultCategoryId?: string;
  onSubmit: (
    assetInput: Omit<Asset, 'id' | 'createdAt'>,
    initialBast?: string,
  ) => void;
  onClose: () => void;
}

export function AddAssetModal({
  categories,
  units,
  employees,
  defaultCategoryId,
  onSubmit,
  onClose,
}: AddAssetModalProps) {
  const initialCategoryId =
    defaultCategoryId && defaultCategoryId !== 'ALL'
      ? defaultCategoryId
      : categories[0]?.id ?? '';

  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [kodeBarangBmd, setKodeBarangBmd] = useState('1.3.2.10.01.02.099');
  const [nup, setNup] = useState('0001');
  const [nama, setNama] = useState('');
  const [merkTipe, setMerkTipe] = useState('');
  const [tahunPerolehan, setTahunPerolehan] = useState(2026);
  const [nilaiPerolehan, setNilaiPerolehan] = useState(15000000);
  const [nomorSeriRangka, setNomorSeriRangka] = useState('');
  const [unitKerja, setUnitKerja] = useState<string>(units[0]?.nama ?? '');
  const [lokasiPenempatan, setLokasiPenempatan] = useState('');
  const [kondisi, setKondisi] = useState<AssetCondition>('Baik');
  const [picAktifId, setPicAktifId] = useState<string>('');
  const [nomorBast, setNomorBast] = useState('');
  const [spesifikasi, setSpesifikasi] = useState<Record<string, string>>({});
  const [fotoAsetUrl, setFotoAsetUrl] = useState<string>('');
  const [fotoAsetNama, setFotoAsetNama] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setErrorMsg('Pilih jenis aset terlebih dahulu.');
      return;
    }
    if (!kodeBarangBmd.trim() || !nup.trim() || !nama.trim()) {
      setErrorMsg('Kode Barang BMD, NUP, dan Nama Aset wajib diisi.');
      return;
    }
    if (!lokasiPenempatan.trim()) {
      setErrorMsg('Lokasi penempatan aset wajib diisi.');
      return;
    }

    onSubmit(
      {
        kodeBarangBmd: kodeBarangBmd.trim(),
        nup: nup.trim(),
        nama: nama.trim(),
        merkTipe: merkTipe.trim() || '-',
        categoryId,
        tahunPerolehan: Number(tahunPerolehan) || 2026,
        nilaiPerolehan: Number(nilaiPerolehan) || 0,
        nomorSeriRangka: nomorSeriRangka.trim() || '-',
        unitKerja,
        lokasiPenempatan: lokasiPenempatan.trim(),
        kondisi,
        statusPemakaian: picAktifId ? 'Dipakai PIC' : 'Tersedia',
        picAktifId: picAktifId || null,
        spesifikasi,
        fotoAsetUrl: fotoAsetUrl || undefined,
        fotoAsetNama: fotoAsetNama || undefined,
      },
      nomorBast,
    );
    onClose();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const encoded = await readAttachmentFile(file, false);
      setFotoAsetUrl(encoded.dataUrl);
      setFotoAsetNama(encoded.fileName);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal mengunggah foto aset.',
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-asset-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="add-asset-modal-title"
              className="text-base font-bold text-slate-900"
            >
              Tambah Aset Baru (Inventarisasi BMD)
            </h2>
            <p className="text-xs text-slate-500">
              Field spesifikasi teknis otomatis menyesuaikan jenis aset yang dipilih
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form tambah aset"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="add-asset-category"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Jenis Aset (Master Dinamis) *
              </label>
              <select
                id="add-asset-category"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSpesifikasi({});
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nama} ({cat.kode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="add-asset-bmd"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Kode Barang BMD *
              </label>
              <input
                id="add-asset-bmd"
                type="text"
                value={kodeBarangBmd}
                onChange={(e) => setKodeBarangBmd(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="add-asset-nup"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                NUP (Nomor Urut Pendaftaran) *
              </label>
              <input
                id="add-asset-nup"
                type="text"
                value={nup}
                onChange={(e) => setNup(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="add-asset-nama"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nama Aset *
              </label>
              <input
                id="add-asset-nama"
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Drone Pemetaan DJI Mavic 3E"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="add-asset-merk"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Merk / Tipe
              </label>
              <input
                id="add-asset-merk"
                type="text"
                value={merkTipe}
                onChange={(e) => setMerkTipe(e.target.value)}
                placeholder="Contoh: DJI Mavic 3 Enterprise RTK"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="add-asset-tahun"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Tahun Perolehan
              </label>
              <input
                id="add-asset-tahun"
                type="number"
                value={tahunPerolehan}
                onChange={(e) => setTahunPerolehan(Number(e.target.value))}
                min={1990}
                max={2035}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="add-asset-nilai"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nilai Perolehan (Rp)
              </label>
              <input
                id="add-asset-nilai"
                type="number"
                value={nilaiPerolehan}
                onChange={(e) => setNilaiPerolehan(Number(e.target.value))}
                min={0}
                step={1000}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="add-asset-seri"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nomor Seri / Rangka / Mesin
              </label>
              <input
                id="add-asset-seri"
                type="text"
                value={nomorSeriRangka}
                onChange={(e) => setNomorSeriRangka(e.target.value)}
                placeholder="Nomor seri pabrikan"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="add-asset-kondisi"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Kondisi Awal
              </label>
              <select
                id="add-asset-kondisi"
                value={kondisi}
                onChange={(e) => setKondisi(e.target.value as AssetCondition)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              >
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="add-asset-unit"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Bidang / UPTD
              </label>
              <select
                id="add-asset-unit"
                value={unitKerja}
                onChange={(e) => setUnitKerja(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.nama}>
                    {u.nama} ({u.kode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="add-asset-lokasi"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Lokasi Penempatan *
              </label>
              <input
                id="add-asset-lokasi"
                type="text"
                value={lokasiPenempatan}
                onChange={(e) => setLokasiPenempatan(e.target.value)}
                placeholder="Contoh: Ruang Perencanaan Teknis Lt. 2"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="add-asset-pic"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                PIC Pemakai Awal (Opsional)
              </label>
              <select
                id="add-asset-pic"
                value={picAktifId}
                onChange={(e) => setPicAktifId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              >
                <option value="">Tersedia di Gudang (Belum ada PIC)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nama} — {emp.unitKerja}
                  </option>
                ))}
              </select>
            </div>

            {picAktifId && (
              <div>
                <label
                  htmlFor="add-asset-bast"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Nomor BAST Awal
                </label>
                <input
                  id="add-asset-bast"
                  type="text"
                  value={nomorBast}
                  onChange={(e) => setNomorBast(e.target.value)}
                  placeholder="027/.../438.5.4/2026"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Dynamic Category Specifications */}
          {selectedCategory && selectedCategory.fields.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#1E3A8A]">
                Spesifikasi Teknis Khusus: {selectedCategory.nama}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {selectedCategory.fields.map((field) => (
                  <div key={field.key}>
                    <label
                      htmlFor={`spec-${field.key}`}
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      {field.label}
                    </label>
                    <input
                      id={`spec-${field.key}`}
                      type="text"
                      value={spesifikasi[field.key] ?? ''}
                      onChange={(e) =>
                        setSpesifikasi((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Foto Fisik Aset */}
          <div className="border-t border-slate-200 pt-4">
            <label
              htmlFor="add-asset-photo"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Foto Fisik Aset (Opsional · JPG/PNG)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="add-asset-photo"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{fotoAsetUrl ? 'Ganti Foto Fisik' : 'Unggah Foto Fisik'}</span>
              </label>
              <input
                id="add-asset-photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {fotoAsetUrl && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5 pr-2.5">
                  <img
                    src={fotoAsetUrl}
                    alt="Pratinjau foto fisik aset"
                    className="h-10 w-10 rounded object-cover"
                  />
                  <span className="max-w-[160px] truncate text-xs text-slate-700">
                    {fotoAsetNama}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFotoAsetUrl('');
                      setFotoAsetNama('');
                    }}
                    aria-label="Hapus foto aset"
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#1E3A8A] px-5 py-2 text-sm font-semibold text-white hover:bg-blue-900"
            >
              Simpan Aset Baru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
