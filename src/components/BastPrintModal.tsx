import { Printer, ShieldCheck, X } from 'lucide-react';
import type { Asset, Employee, PicHistoryEntry } from '../types/asset';
import {
  buildEmployeeQrPayload,
  formatDateId,
  formatRupiah,
} from '../utils/assetLogic';
import { AssetQrSvg } from './QrCodeDisplay';
import { ConditionBadge } from './StatusBadge';

interface BastPrintModalProps {
  asset: Asset;
  categoryName: string;
  historyEntry: PicHistoryEntry;
  recipient?: Employee;
  onClose: () => void;
}

export function BastPrintModal({
  asset,
  categoryName,
  historyEntry,
  recipient,
  onClose,
}: BastPrintModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bast-print-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 id="bast-print-title" className="text-base font-bold text-slate-900">
            Pratinjau Dokumen Berita Acara Serah Terima (BAST)
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-900"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak BAST Resmi</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau BAST"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 sm:p-8 print:p-0">
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <p className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
              Pemerintah Kabupaten Sidoarjo
            </p>
            <h2 className="mt-0.5 text-base font-bold tracking-tight text-slate-900 uppercase">
              Dinas Pekerjaan Umum Bina Marga dan Sumber Daya Air
            </h2>
            <p className="text-xs text-slate-600">
              Jl. Sultan Agung No. 25, Sidoarjo · Telp. (031) 8961234
            </p>
          </div>

          <div className="mt-5 text-center">
            <h4 className="text-sm font-bold underline tracking-wide text-slate-900 uppercase">
              Berita Acara Serah Terima Barang Milik Daerah (BAST)
            </h4>
            <p className="mt-1 font-mono text-xs font-semibold text-slate-700">
              Nomor: {historyEntry.nomorBast}
            </p>
          </div>

          <div className="mt-5 space-y-3 text-xs leading-relaxed text-slate-800">
            <p>
              Pada tanggal{' '}
              <span className="font-semibold">
                {formatDateId(historyEntry.tanggalMulai)}
              </span>
              , telah dilaksanakan serah terima penggunaan Barang Milik Daerah (BMD)
              di lingkungan Dinas Pekerjaan Umum Bina Marga dan Sumber Daya Air Kabupaten
              Sidoarjo antara:
            </p>

            <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-300 bg-slate-50/70 p-4 sm:grid-cols-2">
              <div>
                <p className="font-bold text-slate-900">
                  PIHAK PERTAMA (Penyerah / Pengurus Barang)
                </p>
                <p className="mt-1">Nama: Dina Kartikasari, S.E.</p>
                <p className="font-mono text-[11px] text-slate-600">
                  NIP: 19910822 201903 2 011
                </p>
                <p>Jabatan: Pengurus Barang Pengguna</p>
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  PIHAK KEDUA (Penerima / PIC Pemakai)
                </p>
                <p className="mt-1 font-semibold">
                  Nama: {recipient?.nama ?? '-'}
                </p>
                <p className="font-mono text-[11px] text-slate-600">
                  NIP/ID: {recipient?.nip ?? '-'} ({recipient?.statusKepegawaian ?? '-'})
                </p>
                <p>
                  Jabatan: {recipient?.jabatan ?? '-'} · {recipient?.unitKerja ?? '-'}
                </p>
              </div>
            </div>

            <p className="font-semibold text-slate-900">
              Rincian Barang yang Diserahterimakan:
            </p>
            <table className="w-full border-collapse border border-slate-300 text-left text-xs">
              <thead>
                <tr className="bg-slate-100 font-semibold text-slate-800">
                  <th className="border border-slate-300 px-3 py-2">Kode Barang BMD / NUP</th>
                  <th className="border border-slate-300 px-3 py-2">Nama Barang & Merk</th>
                  <th className="border border-slate-300 px-3 py-2">Kategori</th>
                  <th className="border border-slate-300 px-3 py-2 text-right">Nilai Perolehan</th>
                  <th className="border border-slate-300 px-3 py-2">Kondisi Serah Terima</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-3 py-2 font-mono">
                    {asset.kodeBarangBmd}
                    <br />
                    NUP {asset.nup} ({asset.tahunPerolehan})
                  </td>
                  <td className="border border-slate-300 px-3 py-2">
                    <span className="font-semibold">{asset.nama}</span>
                    <br />
                    <span className="text-slate-600">
                      {asset.merkTipe} · S/N: {asset.nomorSeriRangka}
                    </span>
                  </td>
                  <td className="border border-slate-300 px-3 py-2">{categoryName}</td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-mono tabular-nums">
                    {formatRupiah(asset.nilaiPerolehan)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2">
                    <ConditionBadge condition={historyEntry.kondisiSerahTerima} />
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-700">
              <span className="font-semibold text-slate-900">Catatan BAST:</span>{' '}
              {historyEntry.catatan || 'Digunakan sesuai tugas kedinasan DPUBMSDA.'}
            </p>

            <p>
              Demikian Berita Acara Serah Terima ini dibuat untuk dipergunakan sebagai
              bukti pertanggungjawaban penggunaan Barang Milik Daerah.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p className="text-slate-600">PIHAK KEDUA (Penerima / PIC)</p>
              <p className="font-semibold text-slate-900">
                {recipient?.jabatan ?? 'Pemakai Barang'}
              </p>
              {recipient ? (
                <div className="my-2 flex flex-col items-center justify-center gap-1">
                  <AssetQrSvg
                    value={
                      historyEntry.tteValidated && historyEntry.tteVerificationCode
                        ? `${buildEmployeeQrPayload(recipient)}|BAST:${historyEntry.nomorBast}|${historyEntry.tteVerificationCode}`
                        : buildEmployeeQrPayload(recipient)
                    }
                    size={72}
                  />
                  {historyEntry.tteValidated ? (
                    <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800">
                      <ShieldCheck className="h-3 w-3" />
                      TTE QR Sah · {historyEntry.tteVerificationCode}
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-slate-500">
                      QR Identitas &amp; Validasi PIC
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-14" />
              )}
              <p className="font-semibold underline text-slate-900">
                {recipient?.nama ?? '-'}
              </p>
              <p className="font-mono text-[11px] text-slate-600">
                {recipient?.nip ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-slate-600">PIHAK PERTAMA (Yang Menyerahkan)</p>
              <p className="font-semibold text-slate-900">
                Pengurus Barang Pengguna
              </p>
              <div className="my-2 flex flex-col items-center justify-center gap-1">
                <AssetQrSvg
                  value={`TTE-PENGURUS|DPUBMSDA-SDA|19910822 201903 2 011|${historyEntry.nomorBast}`}
                  size={72}
                />
                <span className="font-mono text-[10px] text-slate-500">
                  Validasi Pengurus Barang BMD
                </span>
              </div>
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
    </div>
  );
}
