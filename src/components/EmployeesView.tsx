import { useEffect, useState } from 'react';
import { Check, Copy, Edit2, Eye, Plus, Printer, QrCode, Search, ShieldCheck, Users, X } from 'lucide-react';
import type { AppStateData, Employee, EmploymentStatus, UserRole } from '../types/asset';
import { buildEmployeeQrPayload } from '../utils/assetLogic';
import { AssetQrSvg, EmployeeQrCardModal } from './QrCodeDisplay';
import { ConditionBadge } from './StatusBadge';

const EMPLOYMENT_STATUSES: EmploymentStatus[] = [
  'PNS',
  'PPPK Penuh Waktu',
  'PPPK Paruh Waktu',
  'Non ASN',
];

interface EmployeesViewProps {
  data: AppStateData;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onUpsertEmployee: (
    employee: Omit<Employee, 'id'> & { id?: string },
  ) => void;
  onOpenAssetDetail: (assetId: string) => void;
}

export function EmployeesView({
  data,
  userRole,
  onChangeRole,
  onUpsertEmployee,
  onOpenAssetDetail,
}: EmployeesViewProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | EmploymentStatus>(
    'ALL',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    data.employees[0]?.id ?? '',
  );
  const [pendingFocusNip, setPendingFocusNip] = useState<string | null>(null);

  // Add / Edit Form Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nip, setNip] = useState('');
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [unitKerja, setUnitKerja] = useState(data.units[0]?.nama ?? '');
  const [statusKepegawaian, setStatusKepegawaian] =
    useState<EmploymentStatus>('PNS');
  const [kontak, setKontak] = useState('');
  const [formError, setFormError] = useState('');
  const [qrModalEmployee, setQrModalEmployee] = useState<Employee | null>(null);
  const [copiedQrId, setCopiedQrId] = useState<string | null>(null);

  const handleCopyQrPayload = async (emp: Employee) => {
    const payload = buildEmployeeQrPayload(emp);
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedQrId(emp.id);
      window.setTimeout(() => {
        setCopiedQrId((curr) => (curr === emp.id ? null : curr));
      }, 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  useEffect(() => {
    if (pendingFocusNip) {
      const matched = data.employees.find((e) => e.nip === pendingFocusNip);
      if (matched) {
        setSelectedEmployeeId(matched.id);
        setPendingFocusNip(null);
      }
    }
  }, [data.employees, pendingFocusNip]);

  const canManage =
    userRole === 'Admin / Pranata Komputer' || userRole === 'Pengurus Barang';

  const openAddModal = () => {
    setEditingId(null);
    setNip('');
    setNama('');
    setJabatan('');
    setUnitKerja(data.units[0]?.nama ?? '');
    setStatusKepegawaian('PNS');
    setKontak('');
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingId(emp.id);
    setNip(emp.nip);
    setNama(emp.nama);
    setJabatan(emp.jabatan);
    setUnitKerja(emp.unitKerja);
    setStatusKepegawaian(emp.statusKepegawaian);
    setKontak(emp.kontak);
    setFormError('');
    setShowFormModal(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nip.trim() || !nama.trim() || !jabatan.trim()) {
      setFormError('NIP/ID Pegawai, Nama Lengkap, dan Jabatan wajib diisi.');
      return;
    }
    const cleanNip = nip.trim();
    onUpsertEmployee({
      id: editingId ?? undefined,
      nip: cleanNip,
      nama: nama.trim(),
      jabatan: jabatan.trim(),
      unitKerja: unitKerja || data.units[0]?.nama || 'Bidang Sekretariat',
      statusKepegawaian,
      kontak: kontak.trim() || '-',
    });
    if (editingId) {
      setSelectedEmployeeId(editingId);
    } else {
      setPendingFocusNip(cleanNip);
    }
    setShowFormModal(false);
  };

  const filteredEmployees = data.employees.filter((emp) => {
    if (
      statusFilter !== 'ALL' &&
      emp.statusKepegawaian !== statusFilter
    ) {
      return false;
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return [emp.nama, emp.nip, emp.jabatan, emp.unitKerja]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const activeEmployee =
    data.employees.find((e) => e.id === selectedEmployeeId) ??
    filteredEmployees[0];

  const heldAssets = activeEmployee
    ? data.assets.filter((a) => a.picAktifId === activeEmployee.id)
    : [];

  return (
    <div className="space-y-5">
      {!canManage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-xs text-amber-900">
          <p>
            Peran saat ini (<span className="font-semibold">{userRole}</span>) hanya
            memiliki akses baca pada Master Pegawai. Beralih ke{' '}
            <span className="font-semibold">Admin / Pranata Komputer</span> untuk
            menambah atau mengubah data pegawai.
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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['ALL', ...EMPLOYMENT_STATUSES] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'ALL' ? 'Semua Status' : status}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <label htmlFor="employee-search" className="sr-only">
              Cari pegawai berdasarkan nama, NIP, atau bidang
            </label>
            <input
              id="employee-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pegawai, NIP, atau bidang..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          disabled={!canManage}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Pegawai</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Employee Table */}
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Users className="h-4 w-4 text-[#1E3A8A]" />
              <span>Master Pegawai DPUBMSDA ({filteredEmployees.length})</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="px-5 py-3">Pegawai &amp; NIP/ID</th>
                  <th className="px-4 py-3">Jabatan &amp; Bidang</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aset</th>
                  <th className="px-5 py-3 text-right">QR &amp; Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEmployees.map((emp) => {
                  const assetCount = data.assets.filter(
                    (a) => a.picAktifId === emp.id,
                  ).length;
                  const isSelected = activeEmployee?.id === emp.id;
                  return (
                    <tr
                      key={emp.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="px-5 py-3.5 align-top">
                        <button
                          type="button"
                          onClick={() => setSelectedEmployeeId(emp.id)}
                          className="text-left"
                        >
                          <p className="font-semibold text-slate-900 hover:text-[#1E3A8A]">
                            {emp.nama}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-slate-500">
                            {emp.nip}
                          </p>
                        </button>
                      </td>
                      <td className="px-4 py-3.5 align-top text-xs text-slate-600">
                        <p className="font-medium text-slate-800">
                          {emp.jabatan}
                        </p>
                        <p className="mt-0.5">{emp.unitKerja}</p>
                      </td>
                      <td className="px-4 py-3.5 align-top text-xs font-medium text-slate-700">
                        {emp.statusKepegawaian}
                      </td>
                      <td className="px-4 py-3.5 align-top text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEmployeeId(emp.id)}
                          className="font-mono text-xs font-semibold text-[#1E3A8A] hover:underline tabular-nums"
                        >
                          {assetCount} unit
                        </button>
                      </td>
                      <td className="px-5 py-3.5 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmployeeId(emp.id);
                              setQrModalEmployee(emp);
                            }}
                            aria-label={`Lihat QR TTE ${emp.nama}`}
                            title="Lihat & cetak QR TTE Pegawai"
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#1E3A8A] hover:bg-blue-100 whitespace-nowrap"
                          >
                            <QrCode className="h-3 w-3" />
                            <span>QR TTE</span>
                          </button>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => openEditModal(emp)}
                              aria-label={`Edit pegawai ${emp.nama}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Employee Assigned Assets Panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          {activeEmployee ? (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <p className="text-xs font-medium text-slate-500">
                  {activeEmployee.statusKepegawaian} · {activeEmployee.unitKerja}
                </p>
                <h2 className="mt-1 text-base font-bold text-slate-900">
                  {activeEmployee.nama}
                </h2>
                <p className="text-xs text-slate-600">
                  {activeEmployee.jabatan} · NIP/ID:{' '}
                  <span className="font-mono">{activeEmployee.nip}</span> · Kontak:{' '}
                  <span className="font-mono">{activeEmployee.kontak}</span>
                </p>
              </div>

              {/* Employee QR Code for Handover Validation & TTE */}
              <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3.5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A]">
                    <ShieldCheck className="h-4 w-4" />
                    <span>QR Validasi / TTE Serah Terima Aset</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQrModalEmployee(activeEmployee)}
                    className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1E3A8A] hover:bg-blue-50"
                  >
                    <Printer className="h-3 w-3" />
                    <span>Cetak Kartu QR</span>
                  </button>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="shrink-0">
                    <AssetQrSvg
                      value={buildEmployeeQrPayload(activeEmployee)}
                      size={88}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2 text-xs">
                    <p className="text-slate-600 leading-relaxed">
                      Pindai QR ini saat proses Serah Terima PIC / BAST sebagai validasi Tanda Tangan Elektronik (TTE) penerima aset.
                    </p>
                    <p className="break-all rounded border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-[10px] text-slate-600">
                      {buildEmployeeQrPayload(activeEmployee)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopyQrPayload(activeEmployee)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
                    >
                      {copiedQrId === activeEmployee.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-700">Kode QR Disalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Salin Kode QR TTE</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Aset Aktif dalam Tanggung Jawab ({heldAssets.length})
                </h3>
                {heldAssets.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                    Pegawai ini tidak sedang memegang aset inventaris aktif.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {heldAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {asset.nama}
                          </p>
                          <p className="font-mono text-xs text-slate-500">
                            {asset.kodeBarangBmd} · NUP {asset.nup}
                          </p>
                          <ConditionBadge condition={asset.kondisi} />
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenAssetDetail(asset.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-[#1E3A8A] hover:border-[#1E3A8A] shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Detail 360°</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Pilih pegawai untuk melihat daftar aset yang dipegang.
            </p>
          )}
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {showFormModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-form-title"
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2
                id="employee-form-title"
                className="text-base font-bold text-slate-900"
              >
                {editingId ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru (Master PIC)'}
              </h2>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                aria-label="Tutup form pegawai"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveEmployee}
              className="overflow-y-auto px-6 py-5 space-y-4"
            >
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="emp-nip"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    NIP / NI PPPK / ID Non ASN *
                  </label>
                  <input
                    id="emp-nip"
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="19950512 202421 1 008"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="emp-status"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Status Kepegawaian *
                  </label>
                  <select
                    id="emp-status"
                    value={statusKepegawaian}
                    onChange={(e) =>
                      setStatusKepegawaian(e.target.value as EmploymentStatus)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                  >
                    {EMPLOYMENT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="emp-nama"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Nama Lengkap & Gelar *
                </label>
                <input
                  id="emp-nama"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Fajar Ramadhan, S.T."
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="emp-jabatan"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Jabatan *
                </label>
                <input
                  id="emp-jabatan"
                  type="text"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Contoh: Pengawas Lapangan Bina Marga"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="emp-unit"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Bidang / UPTD *
                  </label>
                  <select
                    id="emp-unit"
                    value={unitKerja}
                    onChange={(e) => setUnitKerja(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                  >
                    {data.units.map((u) => (
                      <option key={u.id} value={u.nama}>
                        {u.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="emp-kontak"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    Nomor Telepon / WA
                  </label>
                  <input
                    id="emp-kontak"
                    type="text"
                    value={kontak}
                    onChange={(e) => setKontak(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#1E3A8A] px-5 py-2 text-sm font-semibold text-white hover:bg-blue-900"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrModalEmployee && (
        <EmployeeQrCardModal
          employee={qrModalEmployee}
          onClose={() => setQrModalEmployee(null)}
        />
      )}
    </div>
  );
}
