import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_SEED_DATA } from '../data/seedData';
import {
  buildEmployeeQrPayload,
  buildTteVerificationCode,
  computeDashboardMetrics,
  createNewAsset,
  filterAssets,
  generateAssetsCsv,
  getRolePermissions,
  handoverAssetToPic,
  reportAssetDamage,
  resolveEmployeeFromQrInput,
  resolveMaintenanceTicket,
  returnAssetToPool,
  updateAssetDetails,
  upsertCategory,
  upsertEmployee,
  upsertUnitKerja,
  validateBackupPayload,
} from './assetLogic';

test('computeDashboardMetrics calculates accurate KPI counts and Smart Insight alerts', () => {
  const metrics = computeDashboardMetrics(INITIAL_SEED_DATA);

  assert.equal(metrics.totalAssets, 10);
  assert.equal(metrics.baikCount, 7);
  assert.equal(metrics.baikPercentage, 70);
  assert.equal(metrics.rusakRinganCount, 2);
  assert.equal(metrics.rusakBeratCount, 1);
  assert.equal(metrics.activePicCount, 9);
  assert.equal(metrics.inRepairCount, 3); // ast-2, ast-6, ast-8

  // Smart insight should flag assets with >= 2 repairs or Rusak Berat (ast-1, ast-2, ast-4, ast-6)
  const insightIds = metrics.smartInsights.map((i) => i.asset.id);
  assert.ok(insightIds.includes('ast-6'));
  assert.ok(insightIds.includes('ast-1'));
  assert.ok(insightIds.includes('ast-2'));
  assert.ok(insightIds.includes('ast-4'));
  assert.equal(metrics.smartInsights[0].asset.id, 'ast-6'); // Rusak Berat priority Tinggi first
});

test('handoverAssetToPic closes previous PIC end date, appends new row, and preserves old history', () => {
  const beforeHistory = INITIAL_SEED_DATA.picHistory.filter(
    (h) => h.assetId === 'ast-1',
  );
  assert.equal(beforeHistory.length, 2);

  const nextState = handoverAssetToPic(INITIAL_SEED_DATA, {
    assetId: 'ast-1',
    newEmployeeId: 'emp-3',
    tanggalSerahTerima: '2026-11-16',
    nomorBast: '027/999/438.5.4/2026',
    kondisiSerahTerima: 'Baik',
    catatan: 'Mutasi untuk survei lapangan.',
  });

  const updatedAsset = nextState.assets.find((a) => a.id === 'ast-1');
  assert.equal(updatedAsset?.picAktifId, 'emp-3');
  assert.equal(updatedAsset?.statusPemakaian, 'Dipakai PIC');

  const afterHistory = nextState.picHistory.filter(
    (h) => h.assetId === 'ast-1',
  );
  assert.equal(afterHistory.length, 3);

  const previousActive = afterHistory.find((h) => h.id === 'pic-102');
  assert.equal(previousActive?.tanggalSelesai, '2026-11-16');

  const newestActive = afterHistory[2];
  assert.equal(newestActive.employeeId, 'emp-3');
  assert.equal(newestActive.tanggalSelesai, null);
  assert.equal(newestActive.nomorBast, '027/999/438.5.4/2026');
});

test('returnAssetToPool closes active PIC and sets asset to Tersedia', () => {
  const nextState = returnAssetToPool(INITIAL_SEED_DATA, {
    assetId: 'ast-1',
    tanggalPengembalian: '2026-11-16',
    kondisiPengembalian: 'Baik',
    lokasiGudang: 'Gudang Sekretariat',
  });

  const updatedAsset = nextState.assets.find((a) => a.id === 'ast-1');
  assert.equal(updatedAsset?.picAktifId, null);
  assert.equal(updatedAsset?.statusPemakaian, 'Tersedia');
  assert.equal(updatedAsset?.lokasiPenempatan, 'Gudang Sekretariat');

  const closedEntry = nextState.picHistory.find((h) => h.id === 'pic-102');
  assert.equal(closedEntry?.tanggalSelesai, '2026-11-16');
});

test('reportAssetDamage and resolveMaintenanceTicket synchronize master asset condition', () => {
  const damagedState = reportAssetDamage(INITIAL_SEED_DATA, {
    assetId: 'ast-5',
    tanggalLapor: '2026-11-16',
    pelaporId: 'emp-4',
    tingkatKerusakan: 'Rusak Berat',
    deskripsiKerusakan: 'Lensa utama pecah terjatuh di lapangan.',
  });

  const damagedAsset = damagedState.assets.find((a) => a.id === 'ast-5');
  assert.equal(damagedAsset?.kondisi, 'Rusak Berat');

  const newTicket = damagedState.maintenance[0];
  assert.equal(newTicket.assetId, 'ast-5');
  assert.equal(newTicket.statusTiket, 'Menunggu Perbaikan');

  const repairedState = resolveMaintenanceTicket(damagedState, {
    ticketId: newTicket.id,
    tanggalPerbaikan: '2026-11-18',
    tindakanPerbaikan: 'Penggantian unit lensa EDM dan kalibrasi ulang.',
    teknisiVendor: 'PT Geosains Instrumentasi Indonesia',
    biayaServis: 12500000,
    kondisiAkhir: 'Baik',
  });

  const repairedAsset = repairedState.assets.find((a) => a.id === 'ast-5');
  assert.equal(repairedAsset?.kondisi, 'Baik');

  const resolvedTicket = repairedState.maintenance.find(
    (m) => m.id === newTicket.id,
  );
  assert.equal(resolvedTicket?.statusTiket, 'Selesai');
  assert.equal(resolvedTicket?.biayaServis, 12500000);
});

test('upsertCategory and createNewAsset integrate new dynamic category seamlessly', () => {
  const withDroneCategory = upsertCategory(INITIAL_SEED_DATA, {
    kode: 'DRN',
    nama: 'Drone Pemetaan',
    deskripsi: 'UAV survei pemetaan udara DPUBMSDA.',
    fields: [
      { key: 'resolusi', label: 'Resolusi Kamera', placeholder: '20 MP' },
    ],
  });

  const createdCat = withDroneCategory.categories.find(
    (c) => c.kode === 'DRN',
  );
  assert.ok(createdCat);

  const withNewAsset = createNewAsset(withDroneCategory, {
    kodeBarangBmd: '1.3.2.08.02.01.001',
    nup: '0001',
    nama: 'DJI Mavic 3 Enterprise RTK',
    merkTipe: 'DJI M3E RTK',
    categoryId: createdCat.id,
    tahunPerolehan: 2026,
    nilaiPerolehan: 84000000,
    nomorSeriRangka: 'DJI-M3E-2026',
    unitKerja: 'Bidang Jalan & Jembatan',
    lokasiPenempatan: 'Ruang Perencanaan Teknis',
    kondisi: 'Baik',
    statusPemakaian: 'Dipakai PIC',
    picAktifId: 'emp-4',
    spesifikasi: { resolusi: '20 MP Mechanical Shutter' },
  });

  const filtered = filterAssets(
    withNewAsset.assets,
    withNewAsset.employees,
    {
      categoryId: createdCat.id,
      condition: 'ALL',
      searchQuery: 'Mavic',
    },
  );
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].nama, 'DJI Mavic 3 Enterprise RTK');

  const metrics = computeDashboardMetrics(withNewAsset);
  const droneStat = metrics.categoryStats.find(
    (s) => s.categoryId === createdCat.id,
  );
  assert.equal(droneStat?.total, 1);
  assert.equal(droneStat?.baik, 1);
});

test('filterAssets searches by BMD code, NUP, location, and active PIC name', () => {
  const byPic = filterAssets(
    INITIAL_SEED_DATA.assets,
    INITIAL_SEED_DATA.employees,
    {
      categoryId: 'ALL',
      condition: 'ALL',
      searchQuery: 'Slamet Hariyanto',
    },
  );
  assert.equal(byPic.length, 1);
  assert.equal(byPic[0].id, 'ast-2');

  const byBmd = filterAssets(
    INITIAL_SEED_DATA.assets,
    INITIAL_SEED_DATA.employees,
    {
      categoryId: 'ALL',
      condition: 'Rusak Berat',
      searchQuery: '1.3.2.01.02.04.008',
    },
  );
  assert.equal(byBmd.length, 1);
  assert.equal(byBmd[0].id, 'ast-6');
});

test('generateAssetsCsv outputs valid UTF-8 BOM CSV with escaped values', () => {
  const csv = generateAssetsCsv(
    INITIAL_SEED_DATA.assets,
    INITIAL_SEED_DATA.categories,
    INITIAL_SEED_DATA.employees,
    INITIAL_SEED_DATA.maintenance,
  );
  assert.ok(csv.startsWith('\uFEFFKode Barang BMD,NUP,Nama Aset'));
  assert.ok(csv.includes('Laptop Lenovo ThinkPad T14 Gen 4'));
  assert.ok(csv.includes('"Ahmad Fauzi, S.Kom."'));
});

test('upsertUnitKerja creates new Bidang and propagates renames to employees and assets', () => {
  const withNewUnit = upsertUnitKerja(INITIAL_SEED_DATA, {
    kode: 'drn',
    nama: 'Bidang Drainase Perkotaan',
    kepalaUnit: 'Ir. Kusuma Wardhani, M.T.',
    lokasiKantor: 'Gedung C Lt. 1',
  });
  assert.equal(withNewUnit.units.length, INITIAL_SEED_DATA.units.length + 1);
  const created = withNewUnit.units.find((u) => u.kode === 'DRN');
  assert.ok(created);
  assert.equal(created.nama, 'Bidang Drainase Perkotaan');

  const renamedState = upsertUnitKerja(withNewUnit, {
    id: 'unit-pompa',
    kode: 'RMP',
    nama: 'UPTD Rumah Pompa Banjir',
    kepalaUnit: 'Slamet Hariyanto',
    lokasiKantor: 'Stasiun Rumah Pompa',
  });
  const empMoved = renamedState.employees.find((e) => e.id === 'emp-5');
  assert.equal(empMoved?.unitKerja, 'UPTD Rumah Pompa Banjir');
  const assetMoved = renamedState.assets.find((a) => a.id === 'ast-2');
  assert.equal(assetMoved?.unitKerja, 'UPTD Rumah Pompa Banjir');
});

test('upsertEmployee adds new Pegawai and edits existing Pegawai cleanly', () => {
  const addedState = upsertEmployee(INITIAL_SEED_DATA, {
    nip: '19960512 202421 1 008',
    nama: 'Fajar Ramadhan, S.T.',
    jabatan: 'Analis Jalan & Jembatan',
    unitKerja: 'Bidang Bina Marga',
    statusKepegawaian: 'PPPK Penuh Waktu',
    kontak: '0812-8899-1122',
  });
  assert.equal(addedState.employees.length, INITIAL_SEED_DATA.employees.length + 1);
  const created = addedState.employees[0];
  assert.equal(created.nama, 'Fajar Ramadhan, S.T.');
  assert.equal(created.statusKepegawaian, 'PPPK Penuh Waktu');

  const editedState = upsertEmployee(addedState, {
    id: created.id,
    nip: created.nip,
    nama: 'Fajar Ramadhan, S.T., M.T.',
    jabatan: 'Kepala Subbag Perencanaan',
    unitKerja: 'Bidang Sekretariat',
    statusKepegawaian: 'PNS',
    kontak: '0812-8899-1122',
  });
  const updated = editedState.employees.find((e) => e.id === created.id);
  assert.equal(updated?.nama, 'Fajar Ramadhan, S.T., M.T.');
  assert.equal(updated?.statusKepegawaian, 'PNS');
});

test('getRolePermissions enforces RBAC matrix per PRD section 2.1', () => {
  const admin = getRolePermissions('Admin / Pranata Komputer');
  assert.equal(admin.canManageMaster, true);
  assert.equal(admin.canRestoreBackup, true);

  const teknisi = getRolePermissions('Teknisi');
  assert.equal(teknisi.canManageMaster, false);
  assert.equal(teknisi.canHandover, false);
  assert.equal(teknisi.canResolveMaintenance, true);

  const pic = getRolePermissions('Pemakai (PIC)');
  assert.equal(pic.canCrudAssets, false);
  assert.equal(pic.canReportDamage, true);
  assert.equal(pic.canResolveMaintenance, false);

  const pimpinan = getRolePermissions('Pimpinan');
  assert.equal(pimpinan.canCrudAssets, false);
  assert.equal(pimpinan.canReportDamage, false);
  assert.equal(pimpinan.canExportReports, true);
});

test('computeDashboardMetrics computes MTTR, >50% repair cost alerts, and idle asset relocation', () => {
  const reported = reportAssetDamage(INITIAL_SEED_DATA, {
    assetId: 'ast-1',
    tanggalLapor: '2026-10-01',
    pelaporId: 'emp-1',
    tingkatKerusakan: 'Rusak Ringan',
    deskripsiKerusakan: 'Kerusakan motherboard utama.',
  });
  const ticketId = reported.maintenance[0].id;
  const resolved = resolveMaintenanceTicket(reported, {
    ticketId,
    tanggalPerbaikan: '2026-10-05',
    tindakanPerbaikan: 'Penggantian motherboard',
    teknisiVendor: 'CV Mitra Komputer',
    biayaServis: 15000000,
    kondisiAkhir: 'Baik',
  });

  const metrics = computeDashboardMetrics(resolved, '2026-11-16');
  assert.ok(metrics.mttrDays > 0);
  const ast1Insight = metrics.smartInsights.find((i) => i.asset.id === 'ast-1');
  assert.ok(ast1Insight);
  assert.equal(ast1Insight.priority, 'Tinggi');
  assert.ok(ast1Insight.costRatioPercent > 50);
  assert.ok(
    ast1Insight.reasons.some((r) => r.includes('Biaya Servis Tinggi')),
  );

  // ast-9 has been Tersedia since 2025-12-20 -> idle >= 30 days
  const idleIds = metrics.idleAssets.map((i) => i.asset.id);
  assert.ok(idleIds.includes('ast-9'));
});

test('updateAssetDetails and mutations append immutable audit logs', () => {
  const beforeCount = INITIAL_SEED_DATA.auditLogs.length;
  const updated = updateAssetDetails(
    INITIAL_SEED_DATA,
    {
      assetId: 'ast-1',
      lokasiPenempatan: 'Ruang TI Lt. 3',
      kondisi: 'Baik',
      terakhirDiinspeksi: '2026-11-16',
    },
    { actorRole: 'Pengurus Barang', actorName: 'Dina Kartikasari, S.E.' },
  );
  assert.equal(updated.auditLogs.length, beforeCount + 1);
  assert.equal(updated.auditLogs[0].entitas, 'Aset');
  assert.equal(updated.auditLogs[0].actorRole, 'Pengurus Barang');
  const asset = updated.assets.find((a) => a.id === 'ast-1');
  assert.equal(asset?.lokasiPenempatan, 'Ruang TI Lt. 3');
  assert.equal(asset?.terakhirDiinspeksi, '2026-11-16');
});

test('validateBackupPayload restores valid backup JSON and rejects invalid payloads', () => {
  assert.throws(() => validateBackupPayload({ invalid: true }));
  const restored = validateBackupPayload(INITIAL_SEED_DATA, {
    actorRole: 'Admin / Pranata Komputer',
    actorName: 'Ahmad Fauzi, S.Kom.',
  });
  assert.equal(restored.assets.length, INITIAL_SEED_DATA.assets.length);
  assert.equal(restored.auditLogs[0].aksi, 'Pemulihan Backup JSON');
});

test('buildEmployeeQrPayload, resolveEmployeeFromQrInput, and TTE QR handover work end-to-end', () => {
  const emp = INITIAL_SEED_DATA.employees[2];
  const qrPayload = buildEmployeeQrPayload(emp);
  assert.ok(qrPayload.startsWith(`TTE-PIC|DPUBMSDA-SDA|${emp.id}|${emp.nip}|`));

  const resolvedFromQr = resolveEmployeeFromQrInput(
    INITIAL_SEED_DATA.employees,
    qrPayload,
  );
  assert.equal(resolvedFromQr?.id, emp.id);

  const resolvedFromNip = resolveEmployeeFromQrInput(
    INITIAL_SEED_DATA.employees,
    emp.nip.replace(/\s+/g, ''),
  );
  assert.equal(resolvedFromNip?.id, emp.id);

  const tteCode = buildTteVerificationCode({
    assetId: 'ast-1',
    employeeId: emp.id,
    nip: emp.nip,
    nomorBast: '027/888/438.5.4/2026',
    tanggal: '2026-11-17',
  });
  assert.ok(tteCode.startsWith('TTE-SDA-'));

  const next = handoverAssetToPic(INITIAL_SEED_DATA, {
    assetId: 'ast-1',
    newEmployeeId: emp.id,
    tanggalSerahTerima: '2026-11-17',
    nomorBast: '027/888/438.5.4/2026',
    kondisiSerahTerima: 'Baik',
    catatan: 'Validasi serah terima TTE QR.',
    tteValidated: true,
    tteVerificationCode: tteCode,
    tteEmployeeQrPayload: qrPayload,
  });

  const latestPic = next.picHistory[next.picHistory.length - 1];
  assert.equal(latestPic.tteValidated, true);
  assert.equal(latestPic.tteVerificationCode, tteCode);
  assert.equal(latestPic.tteEmployeeQrPayload, qrPayload);
  assert.equal(next.auditLogs[0].aksi, 'Serah Terima PIC (TTE QR)');
  assert.ok(next.auditLogs[0].detailPerubahan.includes(tteCode));
});




