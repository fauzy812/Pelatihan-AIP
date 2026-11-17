import { useEffect, useState } from 'react';
import { AddAssetModal } from './components/AddAssetModal';
import { AssetDetail360Modal } from './components/AssetDetail360Modal';
import { AssetsView } from './components/AssetsView';
import { DashboardView } from './components/DashboardView';
import { DynamicCategoriesView } from './components/DynamicCategoriesView';
import { EmployeesView } from './components/EmployeesView';
import { HandoverModal } from './components/HandoverModal';
import { HandoverView } from './components/HandoverView';
import {
  ReportDamageModal,
  ResolveMaintenanceModal,
} from './components/MaintenanceModals';
import { MaintenanceView } from './components/MaintenanceView';
import { MasterUnitsView } from './components/MasterUnitsView';
import { QrFieldScannerModal } from './components/QrCodeDisplay';
import { ReportsView } from './components/ReportsView';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import type {
  ActiveMenu,
  AppStateData,
  Asset,
  AssetCategory,
  Employee,
  MaintenanceRecord,
  UnitKerjaItem,
  UserRole,
} from './types/asset';
import {
  createNewAsset,
  handoverAssetToPic,
  reportAssetDamage,
  resolveMaintenanceTicket,
  returnAssetToPool,
  updateTicketStatus,
  upsertCategory,
  upsertEmployee,
  upsertUnitKerja,
  type HandoverParams,
  type ReportDamageParams,
  type ResolveMaintenanceParams,
} from './utils/assetLogic';
import {
  loadAppData,
  loadUserRole,
  resetAppData,
  saveAppData,
  saveUserRole,
} from './utils/storage';

export default function App() {
  const [data, setData] = useState<AppStateData>(() => loadAppData());
  const [userRole, setUserRole] = useState<UserRole>(() => loadUserRole());
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data Aset Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Modals
  const [detailAssetId, setDetailAssetId] = useState<string | null>(null);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [handoverModalAssetId, setHandoverModalAssetId] = useState<
    string | undefined
  >(undefined);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [damageModalAssetId, setDamageModalAssetId] = useState<
    string | undefined
  >(undefined);
  const [showReportDamageModal, setShowReportDamageModal] = useState(false);
  const [resolveTicket, setResolveTicket] = useState<MaintenanceRecord | null>(
    null,
  );
  const [qrScanInitialAssetId, setQrScanInitialAssetId] = useState<
    string | undefined
  >(undefined);
  const [showQrScannerModal, setShowQrScannerModal] = useState(false);

  // Transient confirmation feedback banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  useEffect(() => {
    saveUserRole(userRole);
  }, [userRole]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const activeRepairCount = data.maintenance.filter(
    (m) => m.statusTiket !== 'Selesai',
  ).length;

  const handleAddAsset = (
    assetInput: Omit<Asset, 'id' | 'createdAt'>,
    initialBast?: string,
  ) => {
    setData((prev) => createNewAsset(prev, assetInput, initialBast));
    showToast(`Aset "${assetInput.nama}" berhasil didaftarkan.`);
  };

  const handleUpsertCategory = (
    category: Omit<AssetCategory, 'id'> & { id?: string },
  ) => {
    setData((prev) => upsertCategory(prev, category));
    showToast(`Master jenis aset "${category.nama}" tersimpan.`);
  };

  const handleUpsertUnit = (
    unit: Omit<UnitKerjaItem, 'id'> & { id?: string },
  ) => {
    setData((prev) => upsertUnitKerja(prev, unit));
    showToast(`Master bidang "${unit.nama}" tersimpan.`);
  };

  const handleUpsertEmployee = (
    employee: Omit<Employee, 'id'> & { id?: string },
  ) => {
    setData((prev) => upsertEmployee(prev, employee));
    showToast(`Data pegawai "${employee.nama}" tersimpan.`);
  };

  const handleHandoverSubmit = (params: HandoverParams) => {
    setData((prev) => handoverAssetToPic(prev, params));
    showToast(`Serah terima BAST ${params.nomorBast} berhasil diproses.`);
  };

  const handleReturnToPool = (assetId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const asset = data.assets.find((a) => a.id === assetId);
    if (!asset) return;
    setData((prev) =>
      returnAssetToPool(prev, {
        assetId,
        tanggalPengembalian: today,
        kondisiPengembalian: asset.kondisi,
        lokasiGudang: `Gudang ${asset.unitKerja}`,
      }),
    );
    showToast(`Aset "${asset.nama}" dikembalikan ke status Tersedia.`);
  };

  const handleReportDamageSubmit = (params: ReportDamageParams) => {
    setData((prev) => reportAssetDamage(prev, params));
    showToast(
      `Laporan kerusakan (${params.tingkatKerusakan}) tercatat dan status aset diperbarui.`,
    );
  };

  const handleResolveMaintenanceSubmit = (params: ResolveMaintenanceParams) => {
    setData((prev) => resolveMaintenanceTicket(prev, params));
    showToast(
      `Perbaikan selesai. Kondisi akhir aset diperbarui menjadi ${params.kondisiAkhir}.`,
    );
  };

  const handleStartProgress = (ticketId: string) => {
    setData((prev) => updateTicketStatus(prev, ticketId, 'Dalam Perbaikan'));
    showToast('Status tiket diperbarui menjadi Dalam Perbaikan.');
  };

  const handleResetSimulation = () => {
    const fresh = resetAppData();
    setData(fresh);
    setSelectedCategoryId('ALL');
    setSelectedCondition('ALL');
    setSearchQuery('');
    setDetailAssetId(null);
    showToast('Data simulasi awal DPUBMSDA Kabupaten Sidoarjo telah dipulihkan.');
  };

  const resolveTicketAssetName = resolveTicket
    ? data.assets.find((a) => a.id === resolveTicket.assetId)?.nama ?? 'Unit Aset'
    : '';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
      <Sidebar
        activeMenu={activeMenu}
        onSelectMenu={setActiveMenu}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        activeRepairCount={activeRepairCount}
        userRole={userRole}
        onOpenQrScanner={() => {
          setQrScanInitialAssetId(undefined);
          setShowQrScannerModal(true);
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader
          activeMenu={activeMenu}
          userRole={userRole}
          onChangeRole={setUserRole}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenAddAsset={() => setShowAddAssetModal(true)}
          onOpenHandover={() => {
            setHandoverModalAssetId(undefined);
            setShowHandoverModal(true);
          }}
          onOpenReportDamage={() => {
            setDamageModalAssetId(undefined);
            setShowReportDamageModal(true);
          }}
          onResetSimulation={handleResetSimulation}
        />

        <main className="flex-1 px-4 py-6 sm:px-6">
          {toastMessage && (
            <div
              role="status"
              className="no-print mb-5 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-900"
            >
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="ml-4 font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Tutup
              </button>
            </div>
          )}

          {activeMenu === 'dashboard' && (
            <DashboardView
              data={data}
              onOpenAssetDetail={(id) => setDetailAssetId(id)}
              onNavigateToAssetsByCategory={(catId) => {
                setSelectedCategoryId(catId);
                setActiveMenu('assets');
              }}
              onNavigateToMaintenance={() => setActiveMenu('maintenance')}
            />
          )}

          {activeMenu === 'assets' && (
            <AssetsView
              data={data}
              selectedCategoryId={selectedCategoryId}
              onSelectCategoryId={setSelectedCategoryId}
              selectedCondition={selectedCondition}
              onSelectCondition={setSelectedCondition}
              searchQuery={searchQuery}
              onChangeSearchQuery={setSearchQuery}
              onOpenAssetDetail={(id) => setDetailAssetId(id)}
              onOpenAddAsset={() => setShowAddAssetModal(true)}
            />
          )}

          {activeMenu === 'master-employees' && (
            <EmployeesView
              data={data}
              userRole={userRole}
              onChangeRole={setUserRole}
              onUpsertEmployee={handleUpsertEmployee}
              onOpenAssetDetail={(id) => setDetailAssetId(id)}
            />
          )}

          {activeMenu === 'master-units' && (
            <MasterUnitsView
              data={data}
              userRole={userRole}
              onChangeRole={setUserRole}
              onUpsertUnit={handleUpsertUnit}
            />
          )}

          {activeMenu === 'master-categories' && (
            <DynamicCategoriesView
              data={data}
              userRole={userRole}
              onChangeRole={setUserRole}
              onUpsertCategory={handleUpsertCategory}
            />
          )}

          {activeMenu === 'handover' && (
            <HandoverView
              data={data}
              onOpenHandoverModal={(assetId) => {
                setHandoverModalAssetId(assetId);
                setShowHandoverModal(true);
              }}
              onOpenAssetDetail={(id) => setDetailAssetId(id)}
            />
          )}

          {activeMenu === 'maintenance' && (
            <MaintenanceView
              data={data}
              onOpenReportDamage={() => {
                setDamageModalAssetId(undefined);
                setShowReportDamageModal(true);
              }}
              onOpenResolveModal={(ticket) => setResolveTicket(ticket)}
              onStartProgress={handleStartProgress}
              onOpenAssetDetail={(id) => setDetailAssetId(id)}
            />
          )}

          {activeMenu === 'reports' && <ReportsView data={data} />}
        </main>
      </div>

      {/* Modals */}
      {detailAssetId && (
        <AssetDetail360Modal
          assetId={detailAssetId}
          data={data}
          onClose={() => setDetailAssetId(null)}
          onOpenHandoverForAsset={(id) => {
            setHandoverModalAssetId(id);
            setShowHandoverModal(true);
          }}
          onReturnAssetToPool={handleReturnToPool}
          onOpenReportDamageForAsset={(id) => {
            setDamageModalAssetId(id);
            setShowReportDamageModal(true);
          }}
          onOpenResolveMaintenance={(ticket) => setResolveTicket(ticket)}
          onOpenQrScanner={(id) => {
            setQrScanInitialAssetId(id);
            setShowQrScannerModal(true);
          }}
        />
      )}

      {showAddAssetModal && (
        <AddAssetModal
          categories={data.categories}
          units={data.units}
          employees={data.employees}
          defaultCategoryId={selectedCategoryId}
          onSubmit={handleAddAsset}
          onClose={() => setShowAddAssetModal(false)}
        />
      )}

      {showHandoverModal && (
        <HandoverModal
          assets={data.assets}
          employees={data.employees}
          preselectedAssetId={handoverModalAssetId}
          onSubmit={handleHandoverSubmit}
          onClose={() => setShowHandoverModal(false)}
        />
      )}

      {showReportDamageModal && (
        <ReportDamageModal
          assets={data.assets}
          employees={data.employees}
          preselectedAssetId={damageModalAssetId}
          onSubmit={handleReportDamageSubmit}
          onClose={() => setShowReportDamageModal(false)}
        />
      )}

      {resolveTicket && (
        <ResolveMaintenanceModal
          ticket={resolveTicket}
          assetName={resolveTicketAssetName}
          onSubmit={handleResolveMaintenanceSubmit}
          onClose={() => setResolveTicket(null)}
        />
      )}

      {showQrScannerModal && (
        <QrFieldScannerModal
          assets={data.assets}
          initialAssetId={qrScanInitialAssetId}
          onSelectAsset={(assetId) => setDetailAssetId(assetId)}
          onClose={() => setShowQrScannerModal(false)}
        />
      )}
    </div>
  );
}
