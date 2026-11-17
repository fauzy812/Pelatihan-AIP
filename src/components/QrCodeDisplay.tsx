import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Printer, QrCode, ScanLine, Search, ShieldCheck, X } from 'lucide-react';
import type { Asset, Employee } from '../types/asset';
import { buildEmployeeQrPayload } from '../utils/assetLogic';

export function AssetQrSvg({
  value,
  size = 112,
}: {
  value: string;
  size?: number;
}) {
  const [svgMarkup, setSvgMarkup] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      width: size,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then((svg) => {
        if (!cancelled) setSvgMarkup(svg);
      })
      .catch(() => {
        if (!cancelled) setSvgMarkup('');
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!svgMarkup) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded border border-slate-200 bg-white text-slate-400"
      >
        <QrCode className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div
      className="inline-block rounded border border-slate-200 bg-white p-1.5"
      style={{ width: size + 12, height: size + 12 }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}

export function QrStickerPrintModal({
  asset,
  categoryName,
  onClose,
}: {
  asset: Asset;
  categoryName: string;
  onClose: () => void;
}) {
  const qrPayload = `SI-ASET|DPUBMSDA-SDA|${asset.kodeBarangBmd}|NUP:${asset.nup}|${asset.id}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-print-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="no-print mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 id="qr-print-title" className="text-base font-semibold text-slate-900">
            Pratinjau Stiker QR Inventaris BMD
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau stiker QR"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-lg border-2 border-slate-900 bg-white p-4">
          <div className="border-b border-slate-900 pb-2 text-center">
            <p className="text-[11px] font-bold tracking-wide text-slate-900 uppercase">
              Pemerintah Kabupaten Sidoarjo
            </p>
            <p className="text-xs font-semibold text-[#1E3A8A]">
              DPUBMSDA — Kartu Label Barang Milik Daerah
            </p>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <AssetQrSvg value={qrPayload} size={108} />
            <div className="min-w-0 flex-1 space-y-1 text-xs">
              <div>
                <span className="text-[11px] text-slate-500">Kode Barang BMD</span>
                <p className="font-mono font-semibold text-slate-900 tabular-nums">
                  {asset.kodeBarangBmd}
                </p>
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="text-[11px] text-slate-500">NUP</span>
                  <p className="font-mono font-semibold text-slate-900 tabular-nums">
                    {asset.nup}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Tahun</span>
                  <p className="font-mono font-semibold text-slate-900 tabular-nums">
                    {asset.tahunPerolehan}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Nama Aset</span>
                <p className="font-semibold text-slate-900 leading-snug">
                  {asset.nama}
                </p>
              </div>
              <p className="text-[11px] text-slate-600">
                {categoryName} · {asset.unitKerja}
              </p>
            </div>
          </div>
        </div>

        <div className="no-print mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-blue-900"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Stiker QR</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function QrFieldScannerModal({
  assets,
  initialAssetId,
  onSelectAsset,
  onClose,
}: {
  assets: Asset[];
  initialAssetId?: string;
  onSelectAsset: (assetId: string) => void;
  onClose: () => void;
}) {
  const [scanInput, setScanInput] = useState(
    initialAssetId
      ? assets.find((a) => a.id === initialAssetId)?.kodeBarangBmd ?? ''
      : '',
  );
  const [errorMsg, setErrorMsg] = useState('');

  const handleScanLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const q = scanInput.trim().toLowerCase();
    if (!q) {
      setErrorMsg('Masukkan kode BMD, NUP, atau pilih simulasi stiker QR.');
      return;
    }
    const found = assets.find(
      (a) =>
        a.id.toLowerCase() === q ||
        a.kodeBarangBmd.toLowerCase() === q ||
        `${a.kodeBarangBmd}-${a.nup}`.toLowerCase() === q ||
        a.nama.toLowerCase().includes(q),
    );
    if (!found) {
      setErrorMsg('QR Code atau Kode Barang BMD tidak ditemukan di database.');
      return;
    }
    onSelectAsset(found.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scan-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-[#1E3A8A]" />
            <h3 id="qr-scan-title" className="text-base font-semibold text-slate-900">
              Mode Scan QR Lapangan (Simulasi)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup simulasi scan QR"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-900 p-4 text-white">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Pemindai Kamera Lapangan</span>
            <span className="font-mono">Siap Memindai</span>
          </div>
          <div className="my-3 flex flex-col items-center justify-center rounded-lg border border-dashed border-blue-400/60 bg-slate-800/70 py-5">
            <ScanLine className="mb-2 h-10 w-10 text-blue-400" />
            <p className="text-xs text-slate-300">
              Arahkan pemindai ke stiker QR aset atau pilih unit uji di bawah
            </p>
          </div>
        </div>

        <form onSubmit={handleScanLookup} className="space-y-3">
          <div>
            <label
              htmlFor="qr-lookup-input"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Input Payload QR / Kode Barang BMD
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="qr-lookup-input"
                  type="text"
                  value={scanInput}
                  onChange={(e) => {
                    setScanInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Contoh: 1.3.2.10.01.02.002"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 font-mono text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 whitespace-nowrap"
              >
                Buka Detail
              </button>
            </div>
            {errorMsg && (
              <p className="mt-1.5 text-xs text-red-600">{errorMsg}</p>
            )}
          </div>
        </form>

        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="mb-2 text-xs font-medium text-slate-600">
            Simulasi Cepat Pindai Stiker Aset Lapangan:
          </p>
          <div className="grid max-h-40 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
            {assets.slice(0, 6).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  onSelectAsset(a.id);
                  onClose();
                }}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs hover:border-[#1E3A8A] hover:bg-blue-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{a.nama}</p>
                  <p className="font-mono text-[11px] text-slate-500">
                    {a.kodeBarangBmd} · NUP {a.nup}
                  </p>
                </div>
                <QrCode className="ml-2 h-4 w-4 shrink-0 text-[#1E3A8A]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmployeeQrCardModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const qrPayload = buildEmployeeQrPayload(employee);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrPayload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emp-qr-print-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="no-print mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#1E3A8A]" />
            <h3 id="emp-qr-print-title" className="text-base font-semibold text-slate-900">
              Kartu QR TTE Pegawai (PIC)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kartu QR pegawai"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-lg border-2 border-slate-900 bg-white p-4">
          <div className="border-b border-slate-900 pb-2 text-center">
            <p className="text-[11px] font-bold tracking-wide text-slate-900 uppercase">
              Pemerintah Kabupaten Sidoarjo
            </p>
            <p className="text-xs font-semibold text-[#1E3A8A]">
              DPUBMSDA — QR Validasi &amp; TTE Serah Terima BMD
            </p>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <AssetQrSvg value={qrPayload} size={112} />
            <div className="min-w-0 flex-1 space-y-1 text-xs">
              <div>
                <span className="text-[11px] text-slate-500">Nama Pegawai</span>
                <p className="font-bold text-slate-900 leading-snug">
                  {employee.nama}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">
                  NIP / ID ({employee.statusKepegawaian})
                </span>
                <p className="font-mono font-semibold text-slate-900 tabular-nums">
                  {employee.nip}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Jabatan &amp; Bidang</span>
                <p className="text-slate-700 leading-snug">
                  {employee.jabatan} · {employee.unitKerja}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-3 break-all rounded bg-slate-50 px-2.5 py-1.5 font-mono text-[10px] text-slate-600 border border-slate-200">
            {qrPayload}
          </p>
        </div>

        <div className="no-print mt-5 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Kode QR Disalin</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Salin Payload QR</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak Kartu QR TTE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

