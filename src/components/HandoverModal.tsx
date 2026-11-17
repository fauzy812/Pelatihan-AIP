import { useState } from 'react';
import { ArrowLeftRight, FileText, Paperclip, Trash2, X } from 'lucide-react';
import type { Asset, AssetCondition, Employee } from '../types/asset';
import type { HandoverParams } from '../utils/assetLogic';
import { readAttachmentFile } from '../utils/fileHelper';

interface HandoverModalProps {
  assets: Asset[];
  employees: Employee[];
  preselectedAssetId?: string;
  onSubmit: (params: HandoverParams) => void;
  onClose: () => void;
}

export function HandoverModal({
  assets,
  employees,
  preselectedAssetId,
  onSubmit,
  onClose,
}: HandoverModalProps) {
  const initialAsset =
    assets.find((a) => a.id === preselectedAssetId) ?? assets[0];

  const [assetId, setAssetId] = useState(initialAsset?.id ?? '');
  const [newEmployeeId, setNewEmployeeId] = useState(
    employees.find((e) => e.id !== initialAsset?.picAktifId)?.id ??
      employees[0]?.id ??
      '',
  );
  const [tanggalSerahTerima, setTanggalSerahTerima] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [nomorBast, setNomorBast] = useState(
    `027/${Math.floor(100 + Math.random() * 899)}/438.5.4/2026`,
  );
  const [kondisiSerahTerima, setKondisiSerahTerima] = useState<AssetCondition>(
    initialAsset?.kondisi ?? 'Baik',
  );
  const [lokasiPenempatanBaru, setLokasiPenempatanBaru] = useState(
    initialAsset?.lokasiPenempatan ?? '',
  );
  const [catatan, setCatatan] = useState('');
  const [fileBastUrl, setFileBastUrl] = useState('');
  const [fileBastNama, setFileBastNama] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedAsset = assets.find((a) => a.id === assetId);
  const currentPic = selectedAsset?.picAktifId
    ? employees.find((e) => e.id === selectedAsset.picAktifId)
    : undefined;

  const handleAssetChange = (id: string) => {
    setAssetId(id);
    const nextAsset = assets.find((a) => a.id === id);
    if (nextAsset) {
      setKondisiSerahTerima(nextAsset.kondisi);
      setLokasiPenempatanBaru(nextAsset.lokasiPenempatan);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !newEmployeeId) {
      setErrorMsg('Pilih aset dan pegawai penerima (PIC) baru.');
      return;
    }
    if (!nomorBast.trim()) {
      setErrorMsg('Nomor BAST wajib diisi.');
      return;
    }
    if (selectedAsset?.picAktifId === newEmployeeId) {
      setErrorMsg(
        'Pegawai yang dipilih sudah tercatat sebagai PIC aktif saat ini.',
      );
      return;
    }

    onSubmit({
      assetId,
      newEmployeeId,
      tanggalSerahTerima,
      nomorBast: nomorBast.trim(),
      kondisiSerahTerima,
      lokasiPenempatanBaru: lokasiPenempatanBaru.trim(),
      catatan: catatan.trim(),
      fileBastUrl: fileBastUrl || undefined,
      fileBastNama: fileBastNama || undefined,
    });
    onClose();
  };

  const handleBastFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const encoded = await readAttachmentFile(file, true);
      setFileBastUrl(encoded.dataUrl);
      setFileBastNama(encoded.fileName);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal mengunggah file scan BAST.',
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="handover-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ArrowLeftRight className="h-5 w-5 text-[#1E3A8A]" />
            <div>
              <h2
                id="handover-modal-title"
                className="text-base font-bold text-slate-900"
              >
                Serah Terima & Mutasi PIC Aset
              </h2>
              <p className="text-xs text-slate-500">
                Sistem otomatis menutup periode PIC sebelumnya tanpa menghapus histori
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form serah terima PIC"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label
              htmlFor="handover-asset-select"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Pilih Aset *
            </label>
            <select
              id="handover-asset-select"
              value={assetId}
              onChange={(e) => handleAssetChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama} ({a.kodeBarangBmd} · NUP {a.nup})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              PIC Aktif Saat Ini:{' '}
              <span className="font-semibold text-slate-800">
                {currentPic ? `${currentPic.nama} (${currentPic.jabatan})` : 'Tersedia di Gudang (Belum ada PIC)'}
              </span>
            </p>
          </div>

          <div>
            <label
              htmlFor="handover-emp-select"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Pegawai Penerima (PIC Baru) *
            </label>
            <select
              id="handover-emp-select"
              value={newEmployeeId}
              onChange={(e) => {
                setNewEmployeeId(e.target.value);
                setErrorMsg('');
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nama} — {emp.jabatan} ({emp.unitKerja})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="handover-date"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Tanggal Serah Terima *
              </label>
              <input
                id="handover-date"
                type="date"
                value={tanggalSerahTerima}
                onChange={(e) => setTanggalSerahTerima(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="handover-bast"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Nomor BAST *
              </label>
              <input
                id="handover-bast"
                type="text"
                value={nomorBast}
                onChange={(e) => setNomorBast(e.target.value)}
                placeholder="027/308/438.5.4/2026"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="handover-condition"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Kondisi Saat Serah Terima
              </label>
              <select
                id="handover-condition"
                value={kondisiSerahTerima}
                onChange={(e) =>
                  setKondisiSerahTerima(e.target.value as AssetCondition)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              >
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="handover-location"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Lokasi Penempatan Baru
              </label>
              <input
                id="handover-location"
                type="text"
                value={lokasiPenempatanBaru}
                onChange={(e) => setLokasiPenempatanBaru(e.target.value)}
                placeholder="Lokasi ruangan / pos lapangan"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="handover-notes"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Catatan Berita Acara
            </label>
            <textarea
              id="handover-notes"
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Mutasi operasional penugasan bidang sumber daya air..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="handover-bast-file"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Unggah File Scan BAST (Opsional · PDF / Gambar)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="handover-bast-file"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span>{fileBastUrl ? 'Ganti Scan BAST' : 'Pilih Berkas Scan BAST'}</span>
              </label>
              <input
                id="handover-bast-file"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleBastFileUpload}
                className="hidden"
              />
              {fileBastUrl && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
                  <FileText className="h-3.5 w-3.5 text-[#1E3A8A]" />
                  <span className="max-w-[180px] truncate">{fileBastNama}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFileBastUrl('');
                      setFileBastNama('');
                    }}
                    aria-label="Hapus lampiran BAST"
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
              Proses Serah Terima PIC
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
