import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Camera,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  Image as ImageIcon,
  PackageCheck,
  Printer,
  Save,
  ScanLine,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import type {
  AppStateData,
  AssetCondition,
  MaintenanceRecord,
  PicHistoryEntry,
  UserRole,
} from '../types/asset';
import {
  formatDateId,
  formatRupiah,
  getRolePermissions,
  type UpdateAssetDetailsParams,
} from '../utils/assetLogic';
import { readAttachmentFile } from '../utils/fileHelper';
import { BastPrintModal } from './BastPrintModal';
import { AssetQrSvg, QrStickerPrintModal } from './QrCodeDisplay';
import {
  ConditionBadge,
  TicketStatusBadge,
  UsageStatusBadge,
} from './StatusBadge';

interface AssetDetail360ModalProps {
  assetId: string;
  data: AppStateData;
  userRole: UserRole;
  onClose: () => void;
  onUpdateAssetDetails: (params: UpdateAssetDetailsParams) => void;
  onOpenHandoverForAsset: (assetId: string) => void;
  onReturnAssetToPool: (assetId: string) => void;
  onOpenReportDamageForAsset: (assetId: string) => void;
  onOpenResolveMaintenance: (ticket: MaintenanceRecord) => void;
  onOpenQrScanner: (assetId: string) => void;
}

type DetailTab = 'info' | 'pic' | 'maintenance';

interface AttachmentPreview {
  title: string;
  dataUrl: string;
  fileName: string;
}

export function AssetDetail360Modal({
  assetId,
  data,
  userRole,
  onClose,
  onUpdateAssetDetails,
  onOpenHandoverForAsset,
  onReturnAssetToPool,
  onOpenReportDamageForAsset,
  onOpenResolveMaintenance,
  onOpenQrScanner,
}: AssetDetail360ModalProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [showQrSticker, setShowQrSticker] = useState(false);
  const [bastPrintEntry, setBastPrintEntry] = useState<PicHistoryEntry | null>(
    null,
  );
  const [attachmentPreview, setAttachmentPreview] =
    useState<AttachmentPreview | null>(null);

  const asset = data.assets.find((a) => a.id === assetId);
  if (!asset) return null;

  const permissions = getRolePermissions(userRole);
  const canEditInspection =
    permissions.canCrudAssets || permissions.canResolveMaintenance;

  const [isEditing, setIsEditing] = useState(false);
  const [editLokasi, setEditLokasi] = useState(asset.lokasiPenempatan);
  const [editKondisi, setEditKondisi] = useState<AssetCondition>(asset.kondisi);
  const [editSpecs, setEditSpecs] = useState<Record<string, string>>({
    ...asset.spesifikasi,
  });
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | undefined>(
    asset.fotoAsetUrl,
  );
  const [editPhotoName, setEditPhotoName] = useState<string | undefined>(
    asset.fotoAsetNama,
  );
  const [photoError, setPhotoError] = useState('');

  const category = data.categories.find((c) => c.id === asset.categoryId);
  const activePic = asset.picAktifId
    ? data.employees.find((e) => e.id === asset.picAktifId)
    : undefined;
  const employeeMap = new Map(data.employees.map((e) => [e.id, e]));

  const picTimeline = data.picHistory
    .filter((h) => h.assetId === asset.id)
    .slice()
    .sort((a, b) => b.tanggalMulai.localeCompare(a.tanggalMulai));

  const maintenanceTimeline = data.maintenance
    .filter((m) => m.assetId === asset.id)
    .slice()
    .sort((a, b) => b.tanggalLapor.localeCompare(a.tanggalLapor));

  const openTicket = maintenanceTimeline.find(
    (m) => m.statusTiket !== 'Selesai',
  );
  const totalServiceCost = maintenanceTimeline.reduce(
    (sum, m) => sum + (m.biayaServis || 0),
    0,
  );

  const qrPayload = `SI-ASET|DPUBMSDA-SDA|${asset.kodeBarangBmd}|NUP:${asset.nup}|${asset.id}`;

  const handleStartEdit = () => {
    setEditLokasi(asset.lokasiPenempatan);
    setEditKondisi(asset.kondisi);
    setEditSpecs({ ...asset.spesifikasi });
    setEditPhotoUrl(asset.fotoAsetUrl);
    setEditPhotoName(asset.fotoAsetNama);
    setPhotoError('');
    setIsEditing(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const encoded = await readAttachmentFile(file, false);
      setEditPhotoUrl(encoded.dataUrl);
      setEditPhotoName(encoded.fileName);
      setPhotoError('');
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : 'Gagal memuat foto aset.',
      );
    }
  };

  const handleSaveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAssetDetails({
      assetId: asset.id,
      lokasiPenempatan: editLokasi,
      kondisi: editKondisi,
      fotoAsetUrl: editPhotoUrl,
      fotoAsetNama: editPhotoName,
      spesifikasi: editSpecs,
      terakhirDiinspeksi: new Date().toISOString().slice(0, 10),
    });
    setIsEditing(false);
  };

  const bastRecipient = bastPrintEntry
    ? employeeMap.get(bastPrintEntry.employeeId)
    : undefined;

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-360-title"
      >
        <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          {/* Header Profil 360° */}
          <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                {asset.fotoAsetUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setAttachmentPreview({
                        title: `Foto Fisik: ${asset.nama}`,
                        dataUrl: asset.fotoAsetUrl!,
                        fileName: asset.fotoAsetNama ?? `${asset.nup}.jpg`,
                      })
                    }
                    className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white hover:border-[#1E3A8A] sm:block"
                    title="Perbesar foto fisik aset"
                  >
                    <img
                      src={asset.fotoAsetUrl}
                      alt={asset.nama}
                      className="h-full w-full object-cover"
                    />
                  </button>
                )}

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="font-mono font-semibold text-[#1E3A8A] tabular-nums">
                      {asset.kodeBarangBmd}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono font-semibold text-slate-800 tabular-nums">
                      NUP {asset.nup}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700">
                      {category?.nama ?? 'Lainnya'}
                    </span>
                  </div>

                  <h2
                    id="detail-360-title"
                    className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
                  >
                    {asset.nama}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {asset.merkTipe} · {asset.unitKerja} · {asset.lokasiPenempatan}
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <ConditionBadge
                      condition={asset.kondisi}
                      inRepair={Boolean(openTicket)}
                    />
                    <UsageStatusBadge status={asset.statusPemakaian} />
                    {activePic && (
                      <span className="text-xs text-slate-700">
                        PIC Aktif:{' '}
                        <span className="font-semibold text-slate-900">
                          {activePic.nama}
                        </span>
                      </span>
                    )}
                    {asset.terakhirDiinspeksi && (
                      <span className="font-mono text-[11px] text-slate-500">
                        Inspeksi: {formatDateId(asset.terakhirDiinspeksi)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* QR Code Aset & Actions */}
              <div className="flex items-start gap-4 shrink-0">
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                  <AssetQrSvg value={qrPayload} size={84} />
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-800">
                      Label QR Inventaris
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowQrSticker(true)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:border-[#1E3A8A] hover:text-[#1E3A8A] whitespace-nowrap"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Cetak Stiker QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenQrScanner(asset.id)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-[#1E3A8A] hover:bg-blue-100 whitespace-nowrap"
                    >
                      <ScanLine className="h-3.5 w-3.5" />
                      <span>Mode Scan QR</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup detail aset 360"
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 3 Tab Navigation */}
            <div
              role="tablist"
              aria-label="Tab Informasi Detail Aset 360"
              className="mt-5 flex flex-wrap gap-1 border-b border-slate-200 -mb-5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'info'}
                onClick={() => setActiveTab('info')}
                className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'info'
                    ? 'border-[#1E3A8A] text-[#1E3A8A]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Informasi Umum &amp; Spesifikasi
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'pic'}
                onClick={() => setActiveTab('pic')}
                className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'pic'
                    ? 'border-[#1E3A8A] text-[#1E3A8A]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Histori Pemakai / PIC ({picTimeline.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'maintenance'}
                onClick={() => setActiveTab('maintenance')}
                className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'maintenance'
                    ? 'border-[#1E3A8A] text-[#1E3A8A]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Riwayat Kerusakan &amp; Perbaikan ({maintenanceTimeline.length})
              </button>
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'info' && (
              <div className="space-y-5">
                {/* Action Bar for Periodic Inspection / Photo Update (FR-04) */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Pemantauan Kondisi &amp; Foto Fisik Aset:
                    </span>{' '}
                    {asset.fotoAsetUrl
                      ? `Foto tersedia (${asset.fotoAsetNama ?? 'lampiran.jpg'})`
                      : 'Belum ada foto fisik diunggah'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {asset.fotoAsetUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setAttachmentPreview({
                            title: `Foto Fisik: ${asset.nama}`,
                            dataUrl: asset.fotoAsetUrl!,
                            fileName: asset.fotoAsetNama ?? `${asset.nup}.jpg`,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>Lihat Foto Fisik</span>
                      </button>
                    )}
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={handleStartEdit}
                        disabled={!canEditInspection}
                        title={
                          canEditInspection
                            ? 'Perbarui kondisi, lokasi, atau foto fisik aset'
                            : 'Hanya Admin, Pengurus Barang, atau Teknisi yang dapat memperbarui inspeksi aset'
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit / Inspeksi Kondisi</span>
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <form
                    onSubmit={handleSaveInspection}
                    className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/30 p-5"
                  >
                    <h3 className="text-sm font-bold text-slate-900">
                      Formulir Inspeksi Berkala &amp; Pembaruan Data Aset
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="inspect-condition"
                          className="mb-1 block text-xs font-semibold text-slate-700"
                        >
                          Kondisi Terkini Hasil Inspeksi
                        </label>
                        <select
                          id="inspect-condition"
                          value={editKondisi}
                          onChange={(e) =>
                            setEditKondisi(e.target.value as AssetCondition)
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                        >
                          <option value="Baik">Baik</option>
                          <option value="Rusak Ringan">Rusak Ringan</option>
                          <option value="Rusak Berat">Rusak Berat</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="inspect-location"
                          className="mb-1 block text-xs font-semibold text-slate-700"
                        >
                          Lokasi Penempatan Aktual
                        </label>
                        <input
                          id="inspect-location"
                          type="text"
                          value={editLokasi}
                          onChange={(e) => setEditLokasi(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                        />
                      </div>
                    </div>

                    {category && category.fields.length > 0 && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {category.fields.map((field) => (
                          <div key={field.key}>
                            <label
                              htmlFor={`edit-spec-${field.key}`}
                              className="mb-1 block text-xs font-semibold text-slate-700"
                            >
                              {field.label}
                            </label>
                            <input
                              id={`edit-spec-${field.key}`}
                              type="text"
                              value={editSpecs[field.key] ?? ''}
                              onChange={(e) =>
                                setEditSpecs((prev) => ({
                                  ...prev,
                                  [field.key]: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="inspect-photo"
                        className="mb-1 block text-xs font-semibold text-slate-700"
                      >
                        Unggah / Perbarui Foto Fisik Aset
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        <label
                          htmlFor="inspect-photo"
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-[#1E3A8A]"
                        >
                          <Camera className="h-3.5 w-3.5 text-[#1E3A8A]" />
                          <span>
                            {editPhotoName
                              ? `Ganti Foto (${editPhotoName})`
                              : 'Pilih Foto Fisik'}
                          </span>
                        </label>
                        <input
                          id="inspect-photo"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        {editPhotoUrl && (
                          <img
                            src={editPhotoUrl}
                            alt="Pratinjau foto"
                            className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                          />
                        )}
                      </div>
                      {photoError && (
                        <p className="mt-1 text-xs font-medium text-red-700">
                          {photoError}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Simpan Pembaruan Aset</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        Identitas &amp; Nilai Barang Milik Daerah
                      </h3>
                      <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                        <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                          <dt className="text-slate-500">Kode Barang BMD</dt>
                          <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                            {asset.kodeBarangBmd}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                          <dt className="text-slate-500">NUP</dt>
                          <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                            {asset.nup}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                          <dt className="text-slate-500">Merk / Tipe</dt>
                          <dd className="font-medium text-slate-900 text-right">
                            {asset.merkTipe}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                          <dt className="text-slate-500">Nomor Seri / Rangka</dt>
                          <dd className="font-mono font-medium text-slate-900">
                            {asset.nomorSeriRangka}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                          <dt className="text-slate-500">Tahun Perolehan</dt>
                          <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                            {asset.tahunPerolehan}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                          <dt className="text-slate-500">Nilai Perolehan</dt>
                          <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                            {formatRupiah(asset.nilaiPerolehan)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                          <dt className="text-slate-500">
                            Total Biaya Pemeliharaan
                          </dt>
                          <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                            {formatRupiah(totalServiceCost)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        Spesifikasi Teknis ({category?.nama ?? 'Umum'})
                      </h3>
                      <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                        {category && category.fields.length > 0 ? (
                          category.fields.map((field) => (
                            <div
                              key={field.key}
                              className="flex justify-between gap-4 px-4 py-2.5 text-xs"
                            >
                              <dt className="text-slate-500">{field.label}</dt>
                              <dd className="font-medium text-slate-900 text-right">
                                {asset.spesifikasi[field.key] || '-'}
                              </dd>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center text-xs text-slate-500">
                            Tidak ada atribut spesifikasi khusus untuk kategori ini.
                          </div>
                        )}
                        <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                          <dt className="text-slate-500">Bidang / UPTD</dt>
                          <dd className="font-medium text-slate-900 text-right">
                            {asset.unitKerja}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4 px-4 py-2.5 text-xs">
                          <dt className="text-slate-500">Lokasi Penempatan</dt>
                          <dd className="font-medium text-slate-900 text-right">
                            {asset.lokasiPenempatan}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pic' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Timeline Kronologis Pemakai (PIC)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Rekam jejak lengkap seluruh pegawai yang pernah memegang unit aset ini
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {asset.picAktifId && (
                      <button
                        type="button"
                        onClick={() => onReturnAssetToPool(asset.id)}
                        disabled={!permissions.canHandover}
                        title={
                          permissions.canHandover
                            ? 'Kembalikan aset ke gudang / status Tersedia'
                            : 'Hanya Admin / Pengurus Barang yang dapat memproses pengembalian'
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <PackageCheck className="h-3.5 w-3.5 text-sky-600" />
                        <span>Kembalikan ke Gudang</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenHandoverForAsset(asset.id)}
                      disabled={!permissions.canHandover}
                      title={
                        permissions.canHandover
                          ? 'Proses serah terima / mutasi PIC baru'
                          : 'Hanya Admin / Pengurus Barang yang dapat memproses mutasi PIC'
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      <span>Serah Terima / Ganti PIC</span>
                    </button>
                  </div>
                </div>

                {picTimeline.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500">
                    Belum ada riwayat serah terima PIC untuk aset ini.
                  </div>
                ) : (
                  <ol className="space-y-3">
                    {picTimeline.map((entry) => {
                      const emp = employeeMap.get(entry.employeeId);
                      const isActive = entry.tanggalSelesai === null;
                      return (
                        <li
                          key={entry.id}
                          className={`rounded-lg border p-4 ${
                            isActive
                              ? 'border-blue-300 bg-blue-50/40'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">
                                  {emp?.nama ?? 'Pegawai Tidak Dikenal'}
                                </span>
                                {isActive && (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-[#1E3A8A]">
                                    <UserCheck className="h-3 w-3" />
                                    PIC Aktif Saat Ini
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-slate-600">
                                NIP/ID:{' '}
                                <span className="font-mono">{emp?.nip ?? '-'}</span>{' '}
                                · {emp?.jabatan ?? '-'} · {emp?.unitKerja ?? '-'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <ConditionBadge condition={entry.kondisiSerahTerima} />
                              <button
                                type="button"
                                onClick={() => setBastPrintEntry(entry)}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1E3A8A] hover:border-[#1E3A8A] hover:bg-blue-50"
                              >
                                <Printer className="h-3 w-3" />
                                <span>Cetak BAST</span>
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-200/80 pt-3 text-xs sm:grid-cols-3">
                            <div>
                              <span className="text-slate-500">
                                Tanggal Mulai Pakai:
                              </span>
                              <p className="font-mono font-medium text-slate-900">
                                {formatDateId(entry.tanggalMulai)}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">
                                Tanggal Selesai Pakai:
                              </span>
                              <p
                                className={`font-mono font-medium ${
                                  isActive ? 'text-[#1E3A8A]' : 'text-slate-900'
                                }`}
                              >
                                {formatDateId(entry.tanggalSelesai)}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">Nomor BAST:</span>
                              <p className="font-mono font-semibold text-slate-900">
                                {entry.nomorBast}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            {entry.catatan && (
                              <p className="text-xs text-slate-600">
                                Catatan: {entry.catatan}
                              </p>
                            )}
                            {entry.fileBastUrl && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAttachmentPreview({
                                      title: `Scan BAST: ${entry.nomorBast}`,
                                      dataUrl: entry.fileBastUrl!,
                                      fileName:
                                        entry.fileBastNama ??
                                        `${entry.nomorBast}.pdf`,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#1E3A8A] hover:bg-blue-100"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>Lihat Scan BAST</span>
                                </button>
                                <a
                                  href={entry.fileBastUrl}
                                  download={
                                    entry.fileBastNama ?? `${entry.nomorBast}.pdf`
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900"
                                >
                                  <Download className="h-3 w-3" />
                                  <span>Unduh</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Timeline Riwayat Kerusakan &amp; Perbaikan
                    </h3>
                    <p className="text-xs text-slate-500">
                      Seluruh kejadian kerusakan, tindakan teknis, vendor, bukti foto, dan biaya servis pada unit ini
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {openTicket && (
                      <button
                        type="button"
                        onClick={() => onOpenResolveMaintenance(openTicket)}
                        disabled={!permissions.canResolveMaintenance}
                        title={
                          permissions.canResolveMaintenance
                            ? 'Catat penyelesaian perbaikan tiket aktif'
                            : 'Hanya Admin, Pengurus Barang, atau Teknisi yang dapat menyelesaikan perbaikan'
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Catat Penyelesaian Perbaikan</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenReportDamageForAsset(asset.id)}
                      disabled={!permissions.canReportDamage}
                      title={
                        permissions.canReportDamage
                          ? 'Laporkan kerusakan unit aset'
                          : 'Peran Pimpinan bersifat baca-saja (Viewer)'
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Laporkan Kerusakan</span>
                    </button>
                  </div>
                </div>

                {maintenanceTimeline.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500">
                    Belum ada catatan kerusakan maupun perbaikan pada unit aset ini.
                  </div>
                ) : (
                  <ol className="space-y-3">
                    {maintenanceTimeline.map((record) => {
                      const isResolved = record.statusTiket === 'Selesai';
                      return (
                        <li
                          key={record.id}
                          className={`rounded-lg border p-4 ${
                            isResolved
                              ? 'border-slate-200 bg-white'
                              : 'border-amber-300 bg-amber-50/40'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <TicketStatusBadge status={record.statusTiket} />
                                <ConditionBadge condition={record.tingkatKerusakan} />
                                <span className="font-mono text-xs text-slate-500">
                                  Lapor: {formatDateId(record.tanggalLapor)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-semibold text-slate-900">
                                {record.deskripsiKerusakan}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                Pelapor:{' '}
                                <span className="font-medium text-slate-700">
                                  {record.pelaporNama}
                                </span>
                              </p>
                            </div>

                            {!isResolved && (
                              <button
                                type="button"
                                onClick={() => onOpenResolveMaintenance(record)}
                                disabled={!permissions.canResolveMaintenance}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45 shrink-0"
                              >
                                <Wrench className="h-3.5 w-3.5" />
                                <span>Selesaikan Perbaikan</span>
                              </button>
                            )}
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-200/80 pt-3 text-xs sm:grid-cols-4">
                            <div>
                              <span className="text-slate-500">
                                Tanggal Perbaikan:
                              </span>
                              <p className="font-mono font-medium text-slate-900">
                                {record.tanggalPerbaikan
                                  ? formatDateId(record.tanggalPerbaikan)
                                  : 'Belum selesai'}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">
                                Teknisi / Vendor:
                              </span>
                              <p className="font-medium text-slate-900">
                                {record.teknisiVendor}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">Biaya Servis:</span>
                              <p className="font-mono font-semibold text-slate-900 tabular-nums">
                                {formatRupiah(record.biayaServis)}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">Kondisi Akhir:</span>
                              <div className="mt-0.5">
                                {record.kondisiAkhir ? (
                                  <ConditionBadge condition={record.kondisiAkhir} />
                                ) : (
                                  <span className="text-slate-500">
                                    Menunggu selesai
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {record.tindakanPerbaikan && (
                            <p className="mt-2.5 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-700">
                              <span className="font-semibold text-slate-900">
                                Tindakan Perbaikan:
                              </span>{' '}
                              {record.tindakanPerbaikan}
                            </p>
                          )}

                          {(record.fotoKerusakanUrl ||
                            record.fotoPerbaikanUrl) && (
                            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2.5">
                              {record.fotoKerusakanUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAttachmentPreview({
                                      title: `Bukti Kerusakan (${formatDateId(record.tanggalLapor)})`,
                                      dataUrl: record.fotoKerusakanUrl!,
                                      fileName:
                                        record.fotoKerusakanNama ??
                                        'bukti-kerusakan.jpg',
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                                >
                                  <ImageIcon className="h-3 w-3" />
                                  <span>Lihat Bukti Kerusakan</span>
                                </button>
                              )}
                              {record.fotoPerbaikanUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAttachmentPreview({
                                      title: `Bukti Perbaikan / Nota Servis`,
                                      dataUrl: record.fotoPerbaikanUrl!,
                                      fileName:
                                        record.fotoPerbaikanNama ??
                                        'bukti-perbaikan.jpg',
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>Lihat Bukti / Nota Perbaikan</span>
                                </button>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showQrSticker && (
        <QrStickerPrintModal
          asset={asset}
          categoryName={category?.nama ?? 'Umum'}
          onClose={() => setShowQrSticker(false)}
        />
      )}

      {bastPrintEntry && (
        <BastPrintModal
          asset={asset}
          categoryName={category?.nama ?? 'Umum'}
          historyEntry={bastPrintEntry}
          recipient={bastRecipient}
          onClose={() => setBastPrintEntry(null)}
        />
      )}

      {attachmentPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="attachment-preview-title"
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h4
                id="attachment-preview-title"
                className="truncate text-sm font-bold text-slate-900"
              >
                {attachmentPreview.title}
              </h4>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={attachmentPreview.dataUrl}
                  download={attachmentPreview.fileName}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] hover:bg-blue-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh File</span>
                </a>
                <button
                  type="button"
                  onClick={() => setAttachmentPreview(null)}
                  aria-label="Tutup pratinjau lampiran"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-4 flex items-center justify-center">
              {attachmentPreview.dataUrl.startsWith('data:application/pdf') ? (
                <iframe
                  title={attachmentPreview.title}
                  src={attachmentPreview.dataUrl}
                  className="h-[68vh] w-full rounded border border-slate-200 bg-white"
                />
              ) : (
                <img
                  src={attachmentPreview.dataUrl}
                  alt={attachmentPreview.title}
                  className="max-h-[68vh] max-w-full rounded border border-slate-200 object-contain bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
