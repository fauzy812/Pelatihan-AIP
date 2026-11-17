import { useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, Trash2, Wrench, X } from 'lucide-react';
import type {
  Asset,
  AssetCondition,
  Employee,
  MaintenanceRecord,
} from '../types/asset';
import type {
  ReportDamageParams,
  ResolveMaintenanceParams,
} from '../utils/assetLogic';
import { readAttachmentFile } from '../utils/fileHelper';

interface ReportDamageModalProps {
  assets: Asset[];
  employees: Employee[];
  preselectedAssetId?: string;
  onSubmit: (params: ReportDamageParams) => void;
  onClose: () => void;
}

export function ReportDamageModal({
  assets,
  employees,
  preselectedAssetId,
  onSubmit,
  onClose,
}: ReportDamageModalProps) {
  const initialAsset =
    assets.find((a) => a.id === preselectedAssetId) ?? assets[0];

  const [assetId, setAssetId] = useState(initialAsset?.id ?? '');
  const [pelaporId, setPelaporId] = useState(
    initialAsset?.picAktifId ?? employees[0]?.id ?? '',
  );
  const [tanggalLapor, setTanggalLapor] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [tingkatKerusakan, setTingkatKerusakan] = useState<
    'Rusak Ringan' | 'Rusak Berat'
  >('Rusak Ringan');
  const [statusTiket, setStatusTiket] = useState<
    'Menunggu Perbaikan' | 'Dalam Perbaikan'
  >('Menunggu Perbaikan');
  const [teknisiVendor, setTeknisiVendor] = useState('');
  const [deskripsiKerusakan, setDeskripsiKerusakan] = useState('');
  const [fotoKerusakanUrl, setFotoKerusakanUrl] = useState('');
  const [fotoKerusakanNama, setFotoKerusakanNama] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDamagePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const encoded = await readAttachmentFile(file, false);
      setFotoKerusakanUrl(encoded.dataUrl);
      setFotoKerusakanNama(encoded.fileName);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal mengunggah foto kerusakan.',
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !pelaporId) {
      setErrorMsg('Pilih aset dan pegawai pelapor.');
      return;
    }
    if (!deskripsiKerusakan.trim()) {
      setErrorMsg('Deskripsi gejala / kerusakan wajib diisi.');
      return;
    }
    onSubmit({
      assetId,
      pelaporId,
      tanggalLapor,
      tingkatKerusakan,
      statusTiket,
      teknisiVendor: teknisiVendor.trim(),
      deskripsiKerusakan: deskripsiKerusakan.trim(),
      fotoKerusakanUrl: fotoKerusakanUrl || undefined,
      fotoKerusakanNama: fotoKerusakanNama || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-damage-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <h2
                id="report-damage-title"
                className="text-base font-bold text-slate-900"
              >
                Laporkan Kerusakan Aset
              </h2>
              <p className="text-xs text-slate-500">
                Status kondisi aset di master otomatis berubah sesuai tingkat kerusakan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form laporan kerusakan"
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
              htmlFor="damage-asset-select"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Aset yang Mengalami Kerusakan *
            </label>
            <select
              id="damage-asset-select"
              value={assetId}
              onChange={(e) => {
                setAssetId(e.target.value);
                const found = assets.find((a) => a.id === e.target.value);
                if (found?.picAktifId) setPelaporId(found.picAktifId);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama} ({a.kodeBarangBmd} · NUP {a.nup}) — {a.kondisi}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="damage-reporter"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Pegawai Pelapor *
              </label>
              <select
                id="damage-reporter"
                value={pelaporId}
                onChange={(e) => setPelaporId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nama} ({emp.unitKerja})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="damage-date"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Tanggal Lapor *
              </label>
              <input
                id="damage-date"
                type="date"
                value={tanggalLapor}
                onChange={(e) => setTanggalLapor(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="damage-severity"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Tingkat Kerusakan *
              </label>
              <select
                id="damage-severity"
                value={tingkatKerusakan}
                onChange={(e) =>
                  setTingkatKerusakan(
                    e.target.value as 'Rusak Ringan' | 'Rusak Berat',
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              >
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="damage-status"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Status Penanganan Awal
              </label>
              <select
                id="damage-status"
                value={statusTiket}
                onChange={(e) =>
                  setStatusTiket(
                    e.target.value as 'Menunggu Perbaikan' | 'Dalam Perbaikan',
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              >
                <option value="Menunggu Perbaikan">Menunggu Perbaikan</option>
                <option value="Dalam Perbaikan">Dalam Perbaikan</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="damage-vendor"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Rencana Teknisi / Vendor (Opsional)
            </label>
            <input
              id="damage-vendor"
              type="text"
              value={teknisiVendor}
              onChange={(e) => setTeknisiVendor(e.target.value)}
              placeholder="Contoh: Tim Pranata Komputer Internal / CV Teknik Pompa"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="damage-desc"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Deskripsi Kerusakan *
            </label>
            <textarea
              id="damage-desc"
              rows={3}
              value={deskripsiKerusakan}
              onChange={(e) => setDeskripsiKerusakan(e.target.value)}
              placeholder="Jelaskan kronologi dan gejala kerusakan unit aset..."
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="damage-photo-input"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Foto Bukti Kerusakan (Opsional · JPG/PNG)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="damage-photo-input"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{fotoKerusakanUrl ? 'Ganti Foto Bukti' : 'Unggah Foto Kerusakan'}</span>
              </label>
              <input
                id="damage-photo-input"
                type="file"
                accept="image/*"
                onChange={handleDamagePhoto}
                className="hidden"
              />
              {fotoKerusakanUrl && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5 pr-2.5">
                  <img
                    src={fotoKerusakanUrl}
                    alt="Pratinjau foto kerusakan"
                    className="h-10 w-10 rounded object-cover"
                  />
                  <span className="max-w-[160px] truncate text-xs text-slate-700">
                    {fotoKerusakanNama}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFotoKerusakanUrl('');
                      setFotoKerusakanNama('');
                    }}
                    aria-label="Hapus foto kerusakan"
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
              className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Buat Tiket Kerusakan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ResolveMaintenanceModalProps {
  ticket: MaintenanceRecord;
  assetName: string;
  onSubmit: (params: ResolveMaintenanceParams) => void;
  onClose: () => void;
}

export function ResolveMaintenanceModal({
  ticket,
  assetName,
  onSubmit,
  onClose,
}: ResolveMaintenanceModalProps) {
  const [tanggalPerbaikan, setTanggalPerbaikan] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [tindakanPerbaikan, setTindakanPerbaikan] = useState(
    ticket.tindakanPerbaikan || '',
  );
  const [teknisiVendor, setTeknisiVendor] = useState(
    ticket.teknisiVendor.startsWith('Menunggu')
      ? ''
      : ticket.teknisiVendor,
  );
  const [biayaServis, setBiayaServis] = useState(ticket.biayaServis || 0);
  const [kondisiAkhir, setKondisiAkhir] = useState<AssetCondition>('Baik');
  const [fotoPerbaikanUrl, setFotoPerbaikanUrl] = useState('');
  const [fotoPerbaikanNama, setFotoPerbaikanNama] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleResolveAttachment = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const encoded = await readAttachmentFile(file, true);
      setFotoPerbaikanUrl(encoded.dataUrl);
      setFotoPerbaikanNama(encoded.fileName);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal mengunggah bukti perbaikan.',
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tindakanPerbaikan.trim()) {
      setErrorMsg('Tindakan perbaikan yang dilakukan wajib diisi.');
      return;
    }
    if (!teknisiVendor.trim()) {
      setErrorMsg('Nama teknisi / vendor pelaksana wajib diisi.');
      return;
    }
    onSubmit({
      ticketId: ticket.id,
      tanggalPerbaikan,
      tindakanPerbaikan: tindakanPerbaikan.trim(),
      teknisiVendor: teknisiVendor.trim(),
      biayaServis: Number(biayaServis) || 0,
      kondisiAkhir,
      fotoPerbaikanUrl: fotoPerbaikanUrl || undefined,
      fotoPerbaikanNama: fotoPerbaikanNama || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resolve-maintenance-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Wrench className="h-5 w-5 text-emerald-600" />
            <div>
              <h2
                id="resolve-maintenance-title"
                className="text-base font-bold text-slate-900"
              >
                Catat Penyelesaian Perbaikan
              </h2>
              <p className="text-xs text-slate-500">
                Unit: <span className="font-semibold text-slate-800">{assetName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form penyelesaian perbaikan"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Keluhan Awal ({ticket.tingkatKerusakan}):</p>
            <p className="mt-1">{ticket.deskripsiKerusakan}</p>
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="resolve-date"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Tanggal Selesai Perbaikan *
              </label>
              <input
                id="resolve-date"
                type="date"
                value={tanggalPerbaikan}
                onChange={(e) => setTanggalPerbaikan(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="resolve-cost"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Biaya Servis (Rp)
              </label>
              <input
                id="resolve-cost"
                type="number"
                value={biayaServis}
                onChange={(e) => setBiayaServis(Number(e.target.value))}
                min={0}
                step={5000}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="resolve-vendor"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Teknisi / Vendor Pelaksana *
              </label>
              <input
                id="resolve-vendor"
                type="text"
                value={teknisiVendor}
                onChange={(e) => setTeknisiVendor(e.target.value)}
                placeholder="Contoh: CV Teknik Pompa Nusantara"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="resolve-final-condition"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Kondisi Akhir Setelah Diperbaiki *
              </label>
              <select
                id="resolve-final-condition"
                value={kondisiAkhir}
                onChange={(e) =>
                  setKondisiAkhir(e.target.value as AssetCondition)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
              >
                <option value="Baik">Baik (Kembali Operasional)</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat (Tidak Layak Pakai)</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="resolve-action"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Tindakan Perbaikan yang Dilakukan *
            </label>
            <textarea
              id="resolve-action"
              rows={3}
              value={tindakanPerbaikan}
              onChange={(e) => setTindakanPerbaikan(e.target.value)}
              placeholder="Rincikan komponen yang diganti, kalibrasi, atau tindakan perbaikan teknis..."
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="resolve-attachment-input"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Foto Sesudah Perbaikan / Nota Servis (Opsional · JPG/PNG/PDF)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="resolve-attachment-input"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{fotoPerbaikanUrl ? 'Ganti Lampiran Servis' : 'Unggah Nota / Foto Servis'}</span>
              </label>
              <input
                id="resolve-attachment-input"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleResolveAttachment}
                className="hidden"
              />
              {fotoPerbaikanUrl && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
                  <span className="max-w-[180px] truncate">{fotoPerbaikanNama}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFotoPerbaikanUrl('');
                      setFotoPerbaikanNama('');
                    }}
                    aria-label="Hapus lampiran perbaikan"
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Selesaikan Perbaikan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
