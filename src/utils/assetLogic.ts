import type {
  AppStateData,
  Asset,
  AssetCategory,
  AssetCondition,
  AuditEntityType,
  AuditLogEntry,
  Employee,
  MaintenanceRecord,
  PicHistoryEntry,
  TicketStatus,
  UnitKerjaItem,
  UserRole,
} from '../types/asset';

export interface ActorContext {
  actorRole: UserRole;
  actorName: string;
}

const DEFAULT_ACTOR: ActorContext = {
  actorRole: 'Admin / Pranata Komputer',
  actorName: 'Sistem SI-ASET',
};

export interface RolePermissions {
  canManageMaster: boolean;
  canCrudAssets: boolean;
  canHandover: boolean;
  canReportDamage: boolean;
  canResolveMaintenance: boolean;
  canExportReports: boolean;
  canRestoreBackup: boolean;
}

export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'Admin / Pranata Komputer':
      return {
        canManageMaster: true,
        canCrudAssets: true,
        canHandover: true,
        canReportDamage: true,
        canResolveMaintenance: true,
        canExportReports: true,
        canRestoreBackup: true,
      };
    case 'Pengurus Barang':
      return {
        canManageMaster: true,
        canCrudAssets: true,
        canHandover: true,
        canReportDamage: true,
        canResolveMaintenance: true,
        canExportReports: true,
        canRestoreBackup: false,
      };
    case 'Teknisi':
      return {
        canManageMaster: false,
        canCrudAssets: false,
        canHandover: false,
        canReportDamage: true,
        canResolveMaintenance: true,
        canExportReports: true,
        canRestoreBackup: false,
      };
    case 'Pemakai (PIC)':
      return {
        canManageMaster: false,
        canCrudAssets: false,
        canHandover: false,
        canReportDamage: true,
        canResolveMaintenance: false,
        canExportReports: false,
        canRestoreBackup: false,
      };
    case 'Pimpinan':
    default:
      return {
        canManageMaster: false,
        canCrudAssets: false,
        canHandover: false,
        canReportDamage: false,
        canResolveMaintenance: false,
        canExportReports: true,
        canRestoreBackup: false,
      };
  }
}

function appendAuditLog(
  logs: AuditLogEntry[] | undefined,
  actor: ActorContext,
  aksi: string,
  entitas: AuditEntityType,
  entitasId: string,
  detailPerubahan: string,
): AuditLogEntry[] {
  const entry: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actorRole: actor.actorRole,
    actorName: actor.actorName,
    aksi,
    entitas,
    entitasId,
    detailPerubahan,
  };
  return [entry, ...(logs ?? [])];
}

export interface SmartInsightItem {
  asset: Asset;
  categoryName: string;
  repairCount: number;
  recent6MonthCount: number;
  totalRepairCost: number;
  costRatioPercent: number;
  reasons: string[];
  recommendation: string;
  priority: 'Tinggi' | 'Sedang';
}

export interface IdleAssetRecommendation {
  asset: Asset;
  categoryName: string;
  idleDays: number;
  lastUsedDate: string;
  recommendation: string;
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
  mttrDays: number;
  qrCoveragePercent: number;
  categoryStats: CategoryConditionStat[];
  unitStats: UnitDistributionStat[];
  smartInsights: SmartInsightItem[];
  idleAssets: IdleAssetRecommendation[];
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

function diffDaysBetween(fromIso: string, toIso: string): number {
  const start = Date.parse(fromIso);
  const end = Date.parse(toIso);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

export function computeDashboardMetrics(
  data: AppStateData,
  referenceDateIso = new Date().toISOString().slice(0, 10),
): DashboardMetrics {
  const { assets, categories, maintenance, picHistory } = data;
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

  // MTTR (Mean Time to Repair) in days across completed tickets
  const resolvedTickets = maintenance.filter(
    (m) => m.statusTiket === 'Selesai' && m.tanggalPerbaikan,
  );
  const mttrDays =
    resolvedTickets.length > 0
      ? Number(
          (
            resolvedTickets.reduce(
              (sum, t) =>
                sum + diffDaysBetween(t.tanggalLapor, t.tanggalPerbaikan!),
              0,
            ) / resolvedTickets.length
          ).toFixed(1),
        )
      : 0;

  // QR coverage (every registered BMD asset with valid code & NUP has QR generated)
  const qrReadyCount = assets.filter(
    (a) => Boolean(a.kodeBarangBmd && a.nup),
  ).length;
  const qrCoveragePercent =
    totalAssets > 0 ? Math.round((qrReadyCount / totalAssets) * 100) : 0;

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
  const idleAssets: IdleAssetRecommendation[] = [];
  const categoryNameMap = new Map(categories.map((c) => [c.id, c.nama]));

  for (const asset of assets) {
    const assetMaint = maintenance.filter((m) => m.assetId === asset.id);
    const repairCount = assetMaint.length;
    const recent6MonthCount = assetMaint.filter(
      (m) => diffDaysBetween(m.tanggalLapor, referenceDateIso) <= 183,
    ).length;
    const totalRepairCost = assetMaint.reduce(
      (sum, m) => sum + (m.biayaServis || 0),
      0,
    );
    const costRatioPercent =
      asset.nilaiPerolehan > 0
        ? Math.round((totalRepairCost / asset.nilaiPerolehan) * 100)
        : 0;

    const isRusakBerat = asset.kondisi === 'Rusak Berat';
    const isHighCost =
      asset.nilaiPerolehan > 0 && totalRepairCost > asset.nilaiPerolehan * 0.5;
    const isHighFreq6Mo = recent6MonthCount >= 3;
    const isRepeatedDamage = repairCount >= 2;

    if (isRusakBerat || isHighCost || isHighFreq6Mo || isRepeatedDamage) {
      const reasons: string[] = [];
      if (isRusakBerat) reasons.push('Kondisi Rusak Berat');
      if (isHighCost)
        reasons.push(
          `Biaya Servis Tinggi (${costRatioPercent}% Nilai Perolehan)`,
        );
      if (isHighFreq6Mo) {
        reasons.push(`Sering Rusak ≥3x dalam 6 Bulan (${recent6MonthCount}x)`);
      } else if (isRepeatedDamage) {
        reasons.push(`Riwayat Kerusakan Berulang (${repairCount}x)`);
      }

      let recommendation =
        'Evaluasi biaya pemeliharaan dan jadwalkan inspeksi teknis berkala.';
      if ((isRusakBerat && isRepeatedDamage) || isHighCost) {
        recommendation = isHighCost
          ? 'Prioritas Tinggi: Akumulasi biaya servis >50% nilai perolehan — usulkan penghapusan BMD.'
          : 'Prioritas Tinggi: Usulkan penghapusan BMD & pengadaan unit pengganti.';
      } else if (isRusakBerat) {
        recommendation =
          'Usulkan kajian kelayakan perbaikan berat atau penghapusan BMD ke BPKAD.';
      } else if (isHighFreq6Mo) {
        recommendation =
          'Prioritas Tinggi: Evaluasi penggantian unit (lemon asset ≥3x rusak / 6 bulan).';
      } else if (repairCount >= 2) {
        recommendation =
          'Audit keandalan unit dan pertimbangkan peremajaan komponen utama.';
      }

      smartInsights.push({
        asset,
        categoryName: categoryNameMap.get(asset.categoryId) ?? 'Lainnya',
        repairCount,
        recent6MonthCount,
        totalRepairCost,
        costRatioPercent,
        reasons,
        recommendation,
        priority: isRusakBerat || isHighCost || isHighFreq6Mo ? 'Tinggi' : 'Sedang',
      });
    }

    // Idle asset relocation candidate (PRD 8.3: status Tersedia dalam waktu lama >= 30 hari)
    if (asset.statusPemakaian === 'Tersedia' && asset.kondisi !== 'Rusak Berat') {
      const closedHistories = picHistory
        .filter((h) => h.assetId === asset.id && h.tanggalSelesai !== null)
        .sort((a, b) =>
          (b.tanggalSelesai ?? '').localeCompare(a.tanggalSelesai ?? ''),
        );
      const lastUsedDate = closedHistories[0]?.tanggalSelesai ?? asset.createdAt;
      const idleDays = diffDaysBetween(lastUsedDate, referenceDateIso);
      if (idleDays >= 30) {
        idleAssets.push({
          asset,
          categoryName: categoryNameMap.get(asset.categoryId) ?? 'Lainnya',
          idleDays,
          lastUsedDate,
          recommendation: `Menganggur ${idleDays} hari di ${asset.unitKerja}. Kandidat realokasi antar-bidang/UPTD yang membutuhkan.`,
        });
      }
    }
  }

  smartInsights.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === 'Tinggi' ? -1 : 1;
    if (b.costRatioPercent !== a.costRatioPercent) {
      return b.costRatioPercent - a.costRatioPercent;
    }
    return b.repairCount - a.repairCount;
  });

  idleAssets.sort((a, b) => b.idleDays - a.idleDays);

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
    mttrDays,
    qrCoveragePercent,
    categoryStats,
    unitStats,
    smartInsights,
    idleAssets,
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

export function buildEmployeeQrPayload(
  employee: Pick<Employee, 'id' | 'nip' | 'nama'>,
): string {
  return `TTE-PIC|DPUBMSDA-SDA|${employee.id}|${employee.nip}|${employee.nama}`;
}

export function resolveEmployeeFromQrInput(
  employees: Employee[],
  rawInput: string,
): Employee | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('TTE-PIC|DPUBMSDA-SDA|')) {
    const parts = trimmed.split('|');
    const qrId = parts[2]?.trim();
    const qrNip = parts[3]?.trim();
    const byId = employees.find((e) => e.id === qrId);
    if (byId) return byId;
    if (qrNip) {
      const byNip = employees.find((e) => e.nip === qrNip);
      if (byNip) return byNip;
    }
  }

  const normalized = trimmed.replace(/\s+/g, '').toLowerCase();
  return (
    employees.find(
      (e) =>
        e.id.toLowerCase() === trimmed.toLowerCase() ||
        e.nip.replace(/\s+/g, '').toLowerCase() === normalized,
    ) ?? null
  );
}

export function buildTteVerificationCode(params: {
  assetId: string;
  employeeId: string;
  nip: string;
  nomorBast: string;
  tanggal: string;
}): string {
  const seed = `${params.assetId}|${params.employeeId}|${params.nip}|${params.nomorBast}|${params.tanggal}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ (c + i), 0x85ebca6b);
  }
  const part1 = (h1 >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
  const part2 = (h2 >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
  return `TTE-SDA-${part1}-${part2}`;
}

export interface HandoverParams {
  assetId: string;
  newEmployeeId: string;
  tanggalSerahTerima: string;
  nomorBast: string;
  kondisiSerahTerima: AssetCondition;
  lokasiPenempatanBaru?: string;
  catatan: string;
  fileBastUrl?: string;
  fileBastNama?: string;
  tteValidated?: boolean;
  tteTimestamp?: string;
  tteVerificationCode?: string;
  tteEmployeeQrPayload?: string;
}

export function handoverAssetToPic(
  data: AppStateData,
  params: HandoverParams,
  actor: ActorContext = DEFAULT_ACTOR,
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

  const tteCode = params.tteValidated
    ? params.tteVerificationCode ||
      buildTteVerificationCode({
        assetId: params.assetId,
        employeeId: params.newEmployeeId,
        nip: employee.nip,
        nomorBast: params.nomorBast.trim(),
        tanggal: params.tanggalSerahTerima,
      })
    : undefined;

  const newEntry: PicHistoryEntry = {
    id: `pic-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    assetId: params.assetId,
    employeeId: params.newEmployeeId,
    tanggalMulai: params.tanggalSerahTerima,
    tanggalSelesai: null,
    nomorBast: params.nomorBast.trim(),
    kondisiSerahTerima: params.kondisiSerahTerima,
    catatan: params.catatan.trim() || 'Serah terima pemakaian aset dinas.',
    fileBastUrl: params.fileBastUrl,
    fileBastNama: params.fileBastNama,
    tteValidated: params.tteValidated,
    tteTimestamp: params.tteValidated
      ? params.tteTimestamp ?? new Date().toISOString()
      : undefined,
    tteVerificationCode: tteCode,
    tteEmployeeQrPayload: params.tteValidated
      ? params.tteEmployeeQrPayload ?? buildEmployeeQrPayload(employee)
      : undefined,
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
    auditLogs: appendAuditLog(
      data.auditLogs,
      actor,
      params.tteValidated ? 'Serah Terima PIC (TTE QR)' : 'Serah Terima PIC',
      'Serah Terima PIC',
      asset.id,
      `Mutasi "${asset.nama}" ke ${employee.nama} (BAST ${params.nomorBast.trim()}, Kondisi: ${params.kondisiSerahTerima}${tteCode ? `, Validasi TTE QR: ${tteCode}` : ''}).`,
    ),
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
  actor: ActorContext = DEFAULT_ACTOR,
): AppStateData {
  const asset = data.assets.find((a) => a.id === params.assetId);
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
    auditLogs: appendAuditLog(
      data.auditLogs,
      actor,
      'Pengembalian ke Gudang',
      'Serah Terima PIC',
      params.assetId,
      `Aset "${asset?.nama ?? params.assetId}" dikembalikan ke gudang (${params.lokasiGudang}).`,
    ),
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
  fotoKerusakanUrl?: string;
  fotoKerusakanNama?: string;
}

export function reportAssetDamage(
  data: AppStateData,
  params: ReportDamageParams,
  actor: ActorContext = DEFAULT_ACTOR,
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
    fotoKerusakanUrl: params.fotoKerusakanUrl,
    fotoKerusakanNama: params.fotoKerusakanNama,
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
    auditLogs: appendAuditLog(
      data.auditLogs,
      actor,
      'Laporan Kerusakan',
      'Pemeliharaan',
      asset.id,
      `Kerusakan "${asset.nama}" (${params.tingkatKerusakan}) dilaporkan oleh ${pelapor.nama}: ${params.deskripsiKerusakan.trim()}.`,
    ),
  };
}

export interface ResolveMaintenanceParams {
  ticketId: string;
  tanggalPerbaikan: string;
  tindakanPerbaikan: string;
  teknisiVendor: string;
  biayaServis: number;
  kondisiAkhir: AssetCondition;
  fotoPerbaikanUrl?: string;
  fotoPerbaikanNama?: string;
}

export function resolveMaintenanceTicket(
  data: AppStateData,
  params: ResolveMaintenanceParams,
  actor: ActorContext = DEFAULT_ACTOR,
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

  const asset = data.assets.find((a) => a.id === ticket.assetId);

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
      fotoPerbaikanUrl: params.fotoPerbaikanUrl ?? m.fotoPerbaikanUrl,
      fotoPerbaikanNama: params.fotoPerbaikanNama ?? m.fotoPerbaikanNama,
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
    auditLogs: appendAuditLog(
      data.auditLogs,
      actor,
      'Penyelesaian Perbaikan',
      'Pemeliharaan',
      ticket.id,
      `Perbaikan "${asset?.nama ?? ticket.assetId}" selesai oleh ${params.teknisiVendor.trim()} (Biaya: ${formatRupiah(Math.max(0, Number(params.biayaServis) || 0))}, Kondisi Akhir: ${params.kondisiAkhir}).`,
    ),
  };
}

export function updateTicketStatus(
  data: AppStateData,
  ticketId: string,
  statusTiket: Exclude<TicketStatus, 'Selesai'>,
  teknisiVendor?: string,
  actor: ActorContext = DEFAULT_ACTOR,
): AppStateData {
  const ticket = data.maintenance.find((m) => m.id === ticketId);
  const asset = ticket
    ? data.assets.find((a) => a.id === ticket.assetId)
    : undefined;

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
    auditLogs: appendAuditLog(
      data.auditLogs,
      actor,
      'Update Status Servis',
      'Pemeliharaan',
      ticketId,
      `Status tiket "${asset?.nama ?? ticketId}" diperbarui menjadi ${statusTiket}.`,
    ),
  };
}

export function createNewAsset(
  data: AppStateData,
  newAssetInput: Omit<Asset, 'id' | 'createdAt'>,
  initialBast?: string,
  actor: ActorContext = DEFAULT_ACTOR,
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
      nomorBast:
        initialBast?.trim() ||
        `027/REG-${asset.nup}/438.5.4/${asset.tahunPerolehan}`,
      kondisiSerahTerima: asset.kondisi,
      catatan: 'Pencatatan awal penanggung jawab (PIC) aset baru.',
    };
    nextPicHistory = [...data.picHistory, picEntry];
  }

  return {
    ...data,
    assets: [asset, ...data.assets],
    picHistory: nextPicHistory,
    auditLogs: appendAuditLog(
      data.auditLogs,
      actor,
      'Pendaftaran Aset Baru',
      'Aset',
      newId,
      `Aset "${asset.nama}" (${asset.kodeBarangBmd} · NUP ${asset.nup}) didaftarkan pada ${asset.unitKerja}.`,
    ),
  };
}

export interface UpdateAssetDetailsParams {
  assetId: string;
  lokasiPenempatan: string;
  kondisi: AssetCondition;
  fotoAsetUrl?: string;
  fotoAsetNama?: string;
  spesifikasi?: Record<string, string>;
  terakhirDiinspeksi?: string;
}

export function updateAssetDetails(
  data: AppStateData,
  params: UpdateAssetDetailsParams,
  actor: ActorContext = DEFAULT_ACTOR,
): AppStateData {
  const existing = data.assets.find((a) => a.id === params.assetId);
  if (!existing) {
    throw new Error('Aset tidak ditemukan.');
  }

  const today = params.terakhirDiinspeksi ?? new Date().toISOString().slice(0, 10);

  const updatedAssets = data.assets.map((a) => {
    if (a.id !== params.assetId) return a;
    return {
      ...a,
      lokasiPenempatan: params.lokasiPenempatan.trim() || a.lokasiPenempatan,
      kondisi: params.kondisi,
      fotoAsetUrl: params.fotoAsetUrl ?? a.fotoAsetUrl,
      fotoAsetNama: params.fotoAsetNama ?? a.fotoAsetNama,
      spesifikasi: params.spesifikasi ?? a.spesifikasi,
      terakhirDiinspeksi: today,
    };
  });

  return {
    ...data,
    assets: updatedAssets,
    auditLogs: appendAuditLog(
      data.auditLogs,
      actor,
      'Inspeksi / Pembaruan Aset',
      'Aset',
      existing.id,
      `Aset "${existing.nama}" diperbarui (Kondisi: ${existing.kondisi} → ${params.kondisi}, Lokasi: ${params.lokasiPenempatan.trim() || existing.lokasiPenempatan}).`,
    ),
  };
}

export function upsertCategory(
  data: AppStateData,
  category: Omit<AssetCategory, 'id'> & { id?: string },
  actor: ActorContext = DEFAULT_ACTOR,
): AppStateData {
  if (category.id) {
    return {
      ...data,
      categories: data.categories.map((c) =>
        c.id === category.id
          ? ({ ...category, id: category.id } as AssetCategory)
          : c,
      ),
      auditLogs: appendAuditLog(
        data.auditLogs,
        actor,
        'Ubah Jenis Aset',
        'Jenis Aset',
        category.id,
        `Skema jenis aset "${category.nama}" (${category.kode}) diperbarui.`,
      ),
    };
  }
  const newId = `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const created: AssetCategory = {
    ...category,
    id: newId,
  };
  return {
    ...data,
    categories: [...data.categories, created],
    auditLogs: appendAuditLog(
      data.auditLogs,
      actor,
      'Tambah Jenis Aset Dinamis',
      'Jenis Aset',
      newId,
      `Jenis aset baru "${created.nama}" (${created.kode}) ditambahkan dengan ${created.fields.length} atribut teknis.`,
    ),
  };
}

export function upsertUnitKerja(
  data: AppStateData,
  unit: Omit<UnitKerjaItem, 'id'> & { id?: string },
  actor: ActorContext = DEFAULT_ACTOR,
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
      auditLogs: appendAuditLog(
        data.auditLogs,
        actor,
        'Ubah Master Bidang',
        'Bidang',
        unit.id,
        `Data bidang "${nextName}" diperbarui${renamed ? ` (dari "${oldName}")` : ''}.`,
      ),
    };
  }

  const newId = `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const created: UnitKerjaItem = {
    id: newId,
    kode: unit.kode.trim().toUpperCase(),
    nama: unit.nama.trim(),
    kepalaUnit: unit.kepalaUnit.trim() || '-',
    lokasiKantor: unit.lokasiKantor.trim() || '-',
  };

  return {
    ...data,
    units: [...data.units, created],
    auditLogs: appendAuditLog(
      data.auditLogs,
      actor,
      'Tambah Master Bidang',
      'Bidang',
      newId,
      `Bidang baru "${created.nama}" (${created.kode}) ditambahkan.`,
    ),
  };
}

export function upsertEmployee(
  data: AppStateData,
  employee: Omit<Employee, 'id'> & { id?: string },
  actor: ActorContext = DEFAULT_ACTOR,
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
      auditLogs: appendAuditLog(
        data.auditLogs,
        actor,
        'Ubah Data Pegawai',
        'Pegawai',
        employee.id,
        `Data pegawai "${employee.nama.trim()}" (${employee.statusKepegawaian}) diperbarui.`,
      ),
    };
  }

  const newId = `emp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const created: Employee = {
    id: newId,
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
    auditLogs: appendAuditLog(
      data.auditLogs,
      actor,
      'Tambah Pegawai Baru',
      'Pegawai',
      newId,
      `Pegawai baru "${created.nama}" (${created.statusKepegawaian} · ${created.unitKerja}) ditambahkan.`,
    ),
  };
}

export function validateBackupPayload(
  raw: unknown,
  actor: ActorContext = DEFAULT_ACTOR,
): AppStateData {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Format file backup tidak valid (bukan objek JSON).');
  }
  const obj = raw as Partial<AppStateData>;
  if (
    !Array.isArray(obj.categories) ||
    !Array.isArray(obj.units) ||
    !Array.isArray(obj.employees) ||
    !Array.isArray(obj.assets) ||
    !Array.isArray(obj.picHistory) ||
    !Array.isArray(obj.maintenance)
  ) {
    throw new Error(
      'Struktur file backup tidak lengkap. Pastikan berasal dari ekspor JSON SI-ASET SMART DPUBMSDA.',
    );
  }
  return {
    categories: obj.categories,
    units: obj.units,
    employees: obj.employees,
    assets: obj.assets,
    picHistory: obj.picHistory,
    maintenance: obj.maintenance,
    auditLogs: appendAuditLog(
      Array.isArray(obj.auditLogs) ? obj.auditLogs : [],
      actor,
      'Pemulihan Backup JSON',
      'Sistem',
      'restore',
      `Database dipulihkan (${obj.assets.length} aset, ${obj.employees.length} pegawai, ${obj.picHistory.length} histori PIC).`,
    ),
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
