import type {
  AppStateData,
  Asset,
  AssetCategory,
  AssetCondition,
  Employee,
  MaintenanceRecord,
  PicHistoryEntry,
  TicketStatus,
  UnitKerjaItem,
} from '../types/asset';

export interface SmartInsightItem {
  asset: Asset;
  categoryName: string;
  repairCount: number;
  totalRepairCost: number;
  reasons: string[];
  recommendation: string;
  priority: 'Tinggi' | 'Sedang';
}

export interface CategoryConditionStat {
  categoryId: string;
  categoryName: string;
  kode: string;
  total: number;
  baik: number;
  rusakRingan: number;
  rusakBerat: number;
}

export interface UnitDistributionStat {
  unitKerja: string;
  total: number;
  baik: number;
  perhatian: number;
  percentage: number;
}

export interface DashboardMetrics {
  totalAssets: number;
  baikCount: number;
  baikPercentage: number;
  rusakRinganCount: number;
  rusakBeratCount: number;
  activePicCount: number;
  inRepairCount: number;
  totalAssetValue: number;
  totalMaintenanceCost: number;
  categoryStats: CategoryConditionStat[];
  unitStats: UnitDistributionStat[];
  smartInsights: SmartInsightItem[];
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateId(isoDate: string | null): string {
  if (!isoDate) return 'Sekarang / Aktif';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  const mIdx = Number(month) - 1;
  const monthLabel = months[mIdx] ?? month;
  return `${Number(day)} ${monthLabel} ${year}`;
}

export function computeDashboardMetrics(data: AppStateData): DashboardMetrics {
  const { assets, categories, maintenance } = data;
  const totalAssets = assets.length;
  const baikCount = assets.filter((a) => a.kondisi === 'Baik').length;
  const baikPercentage =
    totalAssets > 0 ? Math.round((baikCount / totalAssets) * 100) : 0;
  const rusakRinganCount = assets.filter(
    (a) => a.kondisi === 'Rusak Ringan',
  ).length;
  const rusakBeratCount = assets.filter(
    (a) => a.kondisi === 'Rusak Berat',
  ).length;
  const activePicCount = assets.filter(
    (a) => a.statusPemakaian === 'Dipakai PIC' && a.picAktifId !== null,
  ).length;

  const activeRepairAssetIds = new Set(
    maintenance
      .filter((m) => m.statusTiket !== 'Selesai')
      .map((m) => m.assetId),
  );
  const inRepairCount = activeRepairAssetIds.size;

  const totalAssetValue = assets.reduce(
    (sum, a) => sum + (a.nilaiPerolehan || 0),
    0,
  );
  const totalMaintenanceCost = maintenance.reduce(
    (sum, m) => sum + (m.biayaServis || 0),
    0,
  );

  const categoryStats: CategoryConditionStat[] = categories.map((cat) => {
    const catAssets = assets.filter((a) => a.categoryId === cat.id);
    return {
      categoryId: cat.id,
      categoryName: cat.nama,
      kode: cat.kode,
      total: catAssets.length,
      baik: catAssets.filter((a) => a.kondisi === 'Baik').length,
      rusakRingan: catAssets.filter((a) => a.kondisi === 'Rusak Ringan').length,
      rusakBerat: catAssets.filter((a) => a.kondisi === 'Rusak Berat').length,
    };
  });

  const unitMap = new Map<string, { total: number; baik: number }>();
  for (const asset of assets) {
    const curr = unitMap.get(asset.unitKerja) ?? { total: 0, baik: 0 };
    curr.total += 1;
    if (asset.kondisi === 'Baik') curr.baik += 1;
    unitMap.set(asset.unitKerja, curr);
  }

  const unitStats: UnitDistributionStat[] = Array.from(unitMap.entries())
    .map(([unitKerja, stat]) => ({
      unitKerja,
      total: stat.total,
      baik: stat.baik,
      perhatian: stat.total - stat.baik,
      percentage:
        totalAssets > 0 ? Math.round((stat.total / totalAssets) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const smartInsights: SmartInsightItem[] = [];
  const categoryNameMap = new Map(categories.map((c) => [c.id, c.nama]));

  for (const asset of assets) {
    const assetMaint = maintenance.filter((m) => m.assetId === asset.id);
    const repairCount = assetMaint.length;
    const totalRepairCost = assetMaint.reduce(
      (sum, m) => sum + (m.biayaServis || 0),
      0,
    );
    const isRusakBerat = asset.kondisi === 'Rusak Berat';
    const isRepeatedDamage = repairCount >= 2;

    if (isRusakBerat || isRepeatedDamage) {
      const reasons: string[] = [];
      if (isRusakBerat) reasons.push('Kondisi Rusak Berat');
      if (isRepeatedDamage)
        reasons.push(`Riwayat Kerusakan Berulang (${repairCount}x)`);

      let recommendation =
        'Evaluasi biaya pemeliharaan dan jadwalkan inspeksi teknis berkala.';
      if (isRusakBerat && isRepeatedDamage) {
        recommendation =
          'Prioritas Tinggi: Usulkan penghapusan BMD & pengadaan unit pengganti.';
      } else if (isRusakBerat) {
        recommendation =
          'Usulkan kajian kelayakan perbaikan atau penghapusan BMD ke BPKAD.';
      } else if (repairCount >= 2) {
        recommendation =
          'Audit keandalan unit dan pertimbangkan peremajaan komponen utama.';
      }

      smartInsights.push({
        asset,
        categoryName: categoryNameMap.get(asset.categoryId) ?? 'Lainnya',
        repairCount,
        totalRepairCost,
        reasons,
        recommendation,
        priority: isRusakBerat ? 'Tinggi' : 'Sedang',
      });
    }
  }

  smartInsights.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === 'Tinggi' ? -1 : 1;
    return b.repairCount - a.repairCount;
  });

  return {
    totalAssets,
    baikCount,
    baikPercentage,
    rusakRinganCount,
    rusakBeratCount,
    activePicCount,
    inRepairCount,
    totalAssetValue,
    totalMaintenanceCost,
    categoryStats,
    unitStats,
    smartInsights,
  };
}

export interface AssetFilterOptions {
  categoryId: string; // 'ALL' or category id
  condition: string; // 'ALL' or AssetCondition
  searchQuery: string;
}

export function filterAssets(
  assets: Asset[],
  employees: Employee[],
  options: AssetFilterOptions,
): Asset[] {
  const empMap = new Map(employees.map((e) => [e.id, e]));
  const query = options.searchQuery.trim().toLowerCase();

  return assets.filter((asset) => {
    if (
      options.categoryId !== 'ALL' &&
      asset.categoryId !== options.categoryId
    ) {
      return false;
    }
    if (options.condition !== 'ALL' && asset.kondisi !== options.condition) {
      return false;
    }
    if (query.length > 0) {
      const pic = asset.picAktifId ? empMap.get(asset.picAktifId) : undefined;
      const haystack = [
        asset.kodeBarangBmd,
        asset.nup,
        asset.nama,
        asset.merkTipe,
        asset.lokasiPenempatan,
        asset.unitKerja,
        pic?.nama ?? '',
        pic?.nip ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export interface HandoverParams {
  assetId: string;
  newEmployeeId: string;
  tanggalSerahTerima: string;
  nomorBast: string;
  kondisiSerahTerima: AssetCondition;
  lokasiPenempatanBaru?: string;
  catatan: string;
}

export function handoverAssetToPic(
  data: AppStateData,
  params: HandoverParams,
): AppStateData {
  const asset = data.assets.find((a) => a.id === params.assetId);
  if (!asset) {
    throw new Error('Aset tidak ditemukan.');
  }
  const employee = data.employees.find((e) => e.id === params.newEmployeeId);
  if (!employee) {
    throw new Error('Pegawai penerima (PIC) tidak ditemukan.');
  }
  if (!params.nomorBast.trim()) {
    throw new Error('Nomor BAST wajib diisi.');
  }
  if (!params.tanggalSerahTerima.trim()) {
    throw new Error('Tanggal serah terima wajib diisi.');
  }

  // Close any currently open PIC history entry for this asset without erasing history
  const updatedPicHistory: PicHistoryEntry[] = data.picHistory.map((entry) => {
    if (entry.assetId === params.assetId && entry.tanggalSelesai === null) {
      return {
        ...entry,
        tanggalSelesai: params.tanggalSerahTerima,
      };
    }
    return entry;
  });

  const newEntry: PicHistoryEntry = {
    id: `pic-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    assetId: params.assetId,
    employeeId: params.newEmployeeId,
    tanggalMulai: params.tanggalSerahTerima,
    tanggalSelesai: null,
    nomorBast: params.nomorBast.trim(),
    kondisiSerahTerima: params.kondisiSerahTerima,
    catatan: params.catatan.trim() || 'Serah terima pemakaian aset dinas.',
  };

  const updatedAssets: Asset[] = data.assets.map((a) => {
    if (a.id !== params.assetId) return a;
    return {
      ...a,
      picAktifId: params.newEmployeeId,
      statusPemakaian: 'Dipakai PIC',
      kondisi: params.kondisiSerahTerima,
      unitKerja: employee.unitKerja,
      lokasiPenempatan:
        params.lokasiPenempatanBaru?.trim() || a.lokasiPenempatan,
    };
  });

  return {
    ...data,
    assets: updatedAssets,
    picHistory: [...updatedPicHistory, newEntry],
  };
}

export interface ReturnAssetParams {
  assetId: string;
  tanggalPengembalian: string;
  kondisiPengembalian: AssetCondition;
  lokasiGudang: string;
}

export function returnAssetToPool(
  data: AppStateData,
  params: ReturnAssetParams,
): AppStateData {
  const updatedPicHistory = data.picHistory.map((entry) => {
    if (entry.assetId === params.assetId && entry.tanggalSelesai === null) {
      return {
        ...entry,
        tanggalSelesai: params.tanggalPengembalian,
      };
    }
    return entry;
  });

  const updatedAssets = data.assets.map((a) => {
    if (a.id !== params.assetId) return a;
    return {
      ...a,
      picAktifId: null,
      statusPemakaian: 'Tersedia' as const,
      kondisi: params.kondisiPengembalian,
      lokasiPenempatan: params.lokasiGudang.trim() || a.lokasiPenempatan,
    };
  });

  return {
    ...data,
    assets: updatedAssets,
    picHistory: updatedPicHistory,
  };
}

export interface ReportDamageParams {
  assetId: string;
  tanggalLapor: string;
  pelaporId: string;
  tingkatKerusakan: 'Rusak Ringan' | 'Rusak Berat';
  deskripsiKerusakan: string;
  statusTiket?: Exclude<TicketStatus, 'Selesai'>;
  teknisiVendor?: string;
}

export function reportAssetDamage(
  data: AppStateData,
  params: ReportDamageParams,
): AppStateData {
  const asset = data.assets.find((a) => a.id === params.assetId);
  if (!asset) {
    throw new Error('Aset tidak ditemukan.');
  }
  const pelapor = data.employees.find((e) => e.id === params.pelaporId);
  if (!pelapor) {
    throw new Error('Pelapor tidak ditemukan.');
  }
  if (!params.deskripsiKerusakan.trim()) {
    throw new Error('Deskripsi kerusakan wajib diisi.');
  }

  const newRecord: MaintenanceRecord = {
    id: `mnt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    assetId: params.assetId,
    tanggalLapor: params.tanggalLapor,
    pelaporId: pelapor.id,
    pelaporNama: pelapor.nama,
    tingkatKerusakan: params.tingkatKerusakan,
    deskripsiKerusakan: params.deskripsiKerusakan.trim(),
    statusTiket: params.statusTiket ?? 'Menunggu Perbaikan',
    tanggalPerbaikan: null,
    tindakanPerbaikan: '',
    teknisiVendor: params.teknisiVendor?.trim() || 'Menunggu Penugasan Teknisi',
    biayaServis: 0,
    kondisiAkhir: null,
  };

  // Automatically sync asset condition on master record
  const updatedAssets: Asset[] = data.assets.map((a) => {
    if (a.id !== params.assetId) return a;
    return {
      ...a,
      kondisi: params.tingkatKerusakan,
    };
  });

  return {
    ...data,
    assets: updatedAssets,
    maintenance: [newRecord, ...data.maintenance],
  };
}

export interface ResolveMaintenanceParams {
  ticketId: string;
  tanggalPerbaikan: string;
  tindakanPerbaikan: string;
  teknisiVendor: string;
  biayaServis: number;
  kondisiAkhir: AssetCondition;
}

export function resolveMaintenanceTicket(
  data: AppStateData,
  params: ResolveMaintenanceParams,
): AppStateData {
  const ticket = data.maintenance.find((m) => m.id === params.ticketId);
  if (!ticket) {
    throw new Error('Tiket perbaikan tidak ditemukan.');
  }
  if (!params.tindakanPerbaikan.trim()) {
    throw new Error('Tindakan perbaikan wajib diisi.');
  }
  if (!params.teknisiVendor.trim()) {
    throw new Error('Nama teknisi / vendor wajib diisi.');
  }

  const updatedMaintenance: MaintenanceRecord[] = data.maintenance.map((m) => {
    if (m.id !== params.ticketId) return m;
    return {
      ...m,
      statusTiket: 'Selesai',
      tanggalPerbaikan: params.tanggalPerbaikan,
      tindakanPerbaikan: params.tindakanPerbaikan.trim(),
      teknisiVendor: params.teknisiVendor.trim(),
      biayaServis: Math.max(0, Number(params.biayaServis) || 0),
      kondisiAkhir: params.kondisiAkhir,
    };
  });

  // Check if there are other unresolved tickets for the same asset;
  // if none, update master asset condition to kondisiAkhir
  const otherOpenTickets = updatedMaintenance.filter(
    (m) => m.assetId === ticket.assetId && m.statusTiket !== 'Selesai',
  );

  const updatedAssets: Asset[] = data.assets.map((a) => {
    if (a.id !== ticket.assetId) return a;
    if (otherOpenTickets.length === 0) {
      return {
        ...a,
        kondisi: params.kondisiAkhir,
      };
    }
    return a;
  });

  return {
    ...data,
    assets: updatedAssets,
    maintenance: updatedMaintenance,
  };
}

export function updateTicketStatus(
  data: AppStateData,
  ticketId: string,
  statusTiket: Exclude<TicketStatus, 'Selesai'>,
  teknisiVendor?: string,
): AppStateData {
  return {
    ...data,
    maintenance: data.maintenance.map((m) => {
      if (m.id !== ticketId) return m;
      return {
        ...m,
        statusTiket,
        teknisiVendor: teknisiVendor?.trim() || m.teknisiVendor,
      };
    }),
  };
}

export function createNewAsset(
  data: AppStateData,
  newAssetInput: Omit<Asset, 'id' | 'createdAt'>,
  initialBast?: string,
): AppStateData {
  const newId = `ast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const today = new Date().toISOString().slice(0, 10);

  const asset: Asset = {
    ...newAssetInput,
    id: newId,
    createdAt: today,
  };

  let nextPicHistory = data.picHistory;
  if (asset.picAktifId && asset.statusPemakaian === 'Dipakai PIC') {
    const picEntry: PicHistoryEntry = {
      id: `pic-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      assetId: newId,
      employeeId: asset.picAktifId,
      tanggalMulai: today,
      tanggalSelesai: null,
      nomorBast: initialBast?.trim() || `027/REG-${asset.nup}/438.5.4/${asset.tahunPerolehan}`,
      kondisiSerahTerima: asset.kondisi,
      catatan: 'Pencatatan awal penanggung jawab (PIC) aset baru.',
    };
    nextPicHistory = [...data.picHistory, picEntry];
  }

  return {
    ...data,
    assets: [asset, ...data.assets],
    picHistory: nextPicHistory,
  };
}

export function upsertCategory(
  data: AppStateData,
  category: Omit<AssetCategory, 'id'> & { id?: string },
): AppStateData {
  if (category.id) {
    return {
      ...data,
      categories: data.categories.map((c) =>
        c.id === category.id ? ({ ...category, id: category.id } as AssetCategory) : c,
      ),
    };
  }
  const created: AssetCategory = {
    ...category,
    id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  };
  return {
    ...data,
    categories: [...data.categories, created],
  };
}

export function upsertUnitKerja(
  data: AppStateData,
  unit: Omit<UnitKerjaItem, 'id'> & { id?: string },
): AppStateData {
  if (!unit.kode.trim() || !unit.nama.trim()) {
    throw new Error('Kode dan Nama Bidang/UPTD wajib diisi.');
  }
  if (unit.id) {
    const existing = data.units.find((u) => u.id === unit.id);
    const oldName = existing?.nama;
    const nextName = unit.nama.trim();
    const renamed = oldName && oldName !== nextName;

    return {
      ...data,
      units: data.units.map((u) =>
        u.id === unit.id
          ? {
              ...u,
              kode: unit.kode.trim().toUpperCase(),
              nama: nextName,
              kepalaUnit: unit.kepalaUnit.trim(),
              lokasiKantor: unit.lokasiKantor.trim(),
            }
          : u,
      ),
      employees: renamed
        ? data.employees.map((e) =>
            e.unitKerja === oldName ? { ...e, unitKerja: nextName } : e,
          )
        : data.employees,
      assets: renamed
        ? data.assets.map((a) =>
            a.unitKerja === oldName ? { ...a, unitKerja: nextName } : a,
          )
        : data.assets,
    };
  }

  const created: UnitKerjaItem = {
    id: `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    kode: unit.kode.trim().toUpperCase(),
    nama: unit.nama.trim(),
    kepalaUnit: unit.kepalaUnit.trim() || '-',
    lokasiKantor: unit.lokasiKantor.trim() || '-',
  };

  return {
    ...data,
    units: [...data.units, created],
  };
}

export function upsertEmployee(
  data: AppStateData,
  employee: Omit<Employee, 'id'> & { id?: string },
): AppStateData {
  if (!employee.nip.trim() || !employee.nama.trim() || !employee.jabatan.trim()) {
    throw new Error('NIP/ID, Nama Pegawai, dan Jabatan wajib diisi.');
  }
  if (employee.id) {
    return {
      ...data,
      employees: data.employees.map((e) =>
        e.id === employee.id
          ? {
              ...e,
              nip: employee.nip.trim(),
              nama: employee.nama.trim(),
              jabatan: employee.jabatan.trim(),
              unitKerja: employee.unitKerja,
              statusKepegawaian: employee.statusKepegawaian,
              kontak: employee.kontak.trim() || '-',
            }
          : e,
      ),
      maintenance: data.maintenance.map((m) =>
        m.pelaporId === employee.id
          ? { ...m, pelaporNama: employee.nama.trim() }
          : m,
      ),
    };
  }

  const created: Employee = {
    id: `emp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    nip: employee.nip.trim(),
    nama: employee.nama.trim(),
    jabatan: employee.jabatan.trim(),
    unitKerja: employee.unitKerja,
    statusKepegawaian: employee.statusKepegawaian,
    kontak: employee.kontak.trim() || '-',
  };

  return {
    ...data,
    employees: [created, ...data.employees],
  };
}

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateAssetsCsv(
  assets: Asset[],
  categories: AssetCategory[],
  employees: Employee[],
  maintenance: MaintenanceRecord[],
): string {
  const catMap = new Map(categories.map((c) => [c.id, c.nama]));
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const headers = [
    'Kode Barang BMD',
    'NUP',
    'Nama Aset',
    'Merk / Tipe',
    'Jenis Aset',
    'Tahun Perolehan',
    'Nilai Perolehan (Rp)',
    'Nomor Seri / Rangka',
    'Unit Kerja',
    'Lokasi Penempatan',
    'Status Pemakaian',
    'PIC Aktif',
    'NIP / ID PIC',
    'Kondisi Terkini',
    'Jumlah Riwayat Perbaikan',
  ];

  const rows = assets.map((asset) => {
    const pic = asset.picAktifId ? empMap.get(asset.picAktifId) : undefined;
    const repairCount = maintenance.filter((m) => m.assetId === asset.id).length;
    return [
      asset.kodeBarangBmd,
      asset.nup,
      asset.nama,
      asset.merkTipe,
      catMap.get(asset.categoryId) ?? '-',
      asset.tahunPerolehan,
      asset.nilaiPerolehan,
      asset.nomorSeriRangka,
      asset.unitKerja,
      asset.lokasiPenempatan,
      asset.statusPemakaian,
      pic?.nama ?? 'Tersedia di Gudang',
      pic?.nip ?? '-',
      asset.kondisi,
      repairCount,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  return '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
}
