import { useState } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  FileText,
  Paperclip,
  QrCode,
  ScanLine,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import type { Asset, AssetCondition, Employee } from '../types/asset';
import {
  buildEmployeeQrPayload,
  buildTteVerificationCode,
  resolveEmployeeFromQrInput,
  type HandoverParams,
} from '../utils/assetLogic';
import { readAttachmentFile } from '../utils/fileHelper';
import { AssetQrSvg } from './QrCodeDisplay';

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

  // TTE QR Validation State
  const [qrScanInput, setQrScanInput] = useState('');
  const [tteValidated, setTteValidated] = useState(false);
  const [tteVerificationCode, setTteVerificationCode] = useState('');
  const [tteTimestamp, setTteTimestamp] = useState('');
  const [tteError, setTteError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedAsset = assets.find((a) => a.id === assetId);
  const currentPic = selectedAsset?.picAktifId
    ? employees.find((e) => e.id === selectedAsset.picAktifId)
    : undefined;
  const targetEmployee = employees.find((e) => e.id === newEmployeeId);

  const resetTteValidation = () => {
    setTteValidated(false);
    setTteVerificationCode('');
    setTteTimestamp('');
    setTteError('');
  };

  const handleAssetChange = (id: string) => {
    setAssetId(id);
    const nextAsset = assets.find((a) => a.id === id);
    if (nextAsset) {
      setKondisiSerahTerima(nextAsset.kondisi);
      setLokasiPenempatanBaru(nextAsset.lokasiPenempatan);
    }
    resetTteValidation();
  };

  const handleValidateQrString = (rawInput: string) => {
    if (!targetEmployee) {
      setTteError('Pilih pegawai penerima terlebih dahulu.');
      return;
    }
    const resolved = resolveEmployeeFromQrInput(employees, rawInput);
    if (!resolved) {
      setTteValidated(false);
      setTteVerificationCode('');
      setTteError(
        'Kode QR atau NIP pegawai tidak dikenali dalam Master Pegawai.',
      );
      return;
    }
    if (resolved.id !== targetEmployee.id) {
      setTteValidated(false);
      setTteVerificationCode('');
      setTteError(
        `QR Pegawai tidak cocok: terdeteksi milik "${resolved.nama}" (${resolved.nip}), bukan "${targetEmployee.nama}".`,
      );
      return;
    }

    const code = buildTteVerificationCode({
      assetId,
      employeeId: targetEmployee.id,
      nip: targetEmployee.nip,
      nomorBast: nomorBast.trim() || 'DRAFT',
      tanggal: tanggalSerahTerima,
    });
    setTteValidated(true);
    setTteVerificationCode(code);
    setTteTimestamp(new Date().toISOString());
    setTteError('');
  };

  const handleSimulateScanRecipientQr = () => {
    if (!targetEmployee) return;
    const payload = buildEmployeeQrPayload(targetEmployee);
    setQrScanInput(payload);
    handleValidateQrString(payload);
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
      tteValidated: tteValidated || undefined,
      tteTimestamp: tteValidated ? tteTimestamp : undefined,
      tteVerificationCode: tteValidated ? tteVerificationCode : undefined,
      tteEmployeeQrPayload:
        tteValidated && targetEmployee
          ? buildEmployeeQrPayload(targetEmployee)
          : undefined,
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
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ArrowLeftRight className="h-5 w-5 text-[#1E3A8A]" />
            <div>
              <h2
                id="handover-modal-title"
                className="text-base font-bold text-slate-900"
              >
                Serah Terima &amp; Mutasi PIC Aset
              </h2>
              <p className="text-xs text-slate-500">
                Sistem otomatis menutup periode PIC sebelumnya &amp; mendukung validasi QR TTE pegawai penerima
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
                {currentPic
                  ? `${currentPic.nama} (${currentPic.jabatan})`
                  : 'Tersedia di Gudang (Belum ada PIC)'}
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
                setQrScanInput('');
                resetTteValidation();
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

          {/* QR Code TTE Pegawai Validation Panel */}
          {targetEmployee && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1E3A8A]">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Validasi QR Code / TTE Pegawai Penerima</span>
                </div>
                {tteValidated ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    TTE QR Tervalidasi
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-500">
                    Opsional · Disarankan untuk tanda tangan elektronik BAST
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="shrink-0">
                  <AssetQrSvg
                    value={buildEmployeeQrPayload(targetEmployee)}
                    size={76}
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[180px]">
                      <QrCode className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        id="handover-qr-tte-input"
                        type="text"
                        value={qrScanInput}
                        onChange={(e) => {
                          setQrScanInput(e.target.value);
                          setTteError('');
                        }}
                        placeholder="Tempel payload QR TTE atau NIP penerima..."
                        aria-label="Payload QR TTE atau NIP Pegawai Penerima"
                        className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 font-mono text-xs text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleValidateQrString(qrScanInput)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-[#1E3A8A] hover:text-[#1E3A8A] whitespace-nowrap"
                    >
                      Verifikasi QR
                    </button>
                    <button
                      type="button"
                      onClick={handleSimulateScanRecipientQr}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#1E3A8A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-900 whitespace-nowrap"
                    >
                      <ScanLine className="h-3.5 w-3.5" />
                      <span>Pindai QR Penerima</span>
                    </button>
                  </div>

                  {tteError && (
                    <p className="text-xs font-medium text-red-700">
                      {tteError}
                    </p>
                  )}

                  {tteValidated && (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-emerald-800">
                      Validasi TTE QR Sah · Kode: {tteVerificationCode} ({targetEmployee.nama})
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

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
                onChange={(e) => {
                  setTanggalSerahTerima(e.target.value);
                  if (tteValidated) resetTteValidation();
                }}
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
                onChange={(e) => {
                  setNomorBast(e.target.value);
                  if (tteValidated) resetTteValidation();
                }}
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
                <span>
                  {fileBastUrl ? 'Ganti Scan BAST' : 'Pilih Berkas Scan BAST'}
                </span>
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
              {tteValidated
                ? 'Proses Serah Terima (TTE QR Sah)'
                : 'Proses Serah Terima PIC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
