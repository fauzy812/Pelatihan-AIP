import { useState } from 'react';
import {
  ArrowLeftRight,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Database,
  FileBarChart2,
  Layers,
  LayoutDashboard,
  ScanLine,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import type { ActiveMenu, UserRole } from '../types/asset';

interface SidebarProps {
  activeMenu: ActiveMenu;
  onSelectMenu: (menu: ActiveMenu) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  activeRepairCount: number;
  userRole: UserRole;
  onOpenQrScanner: () => void;
}

const PRIMARY_ITEMS_BEFORE: {
  id: ActiveMenu;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: 'dashboard', label: 'Dashboard Eksekutif', icon: LayoutDashboard },
  { id: 'assets', label: 'Data Aset', icon: ClipboardList },
];

const MASTER_SUB_ITEMS: {
  id: ActiveMenu;
  label: string;
  icon: typeof Users;
}[] = [
  { id: 'master-employees', label: 'Pegawai', icon: Users },
  { id: 'master-units', label: 'Bidang', icon: Building2 },
  { id: 'master-categories', label: 'Jenis Aset', icon: Layers },
];

const PRIMARY_ITEMS_AFTER: {
  id: ActiveMenu;
  label: string;
  icon: typeof ArrowLeftRight;
}[] = [
  { id: 'handover', label: 'Serah Terima & PIC', icon: ArrowLeftRight },
  { id: 'maintenance', label: 'Kerusakan & Perbaikan', icon: Wrench },
  { id: 'reports', label: 'Laporan & Ekspor', icon: FileBarChart2 },
];

export function Sidebar({
  activeMenu,
  onSelectMenu,
  mobileOpen,
  onCloseMobile,
  activeRepairCount,
  userRole,
  onOpenQrScanner,
}: SidebarProps) {
  const isMasterActive =
    activeMenu === 'master-employees' ||
    activeMenu === 'master-units' ||
    activeMenu === 'master-categories';

  const [masterExpanded, setMasterExpanded] = useState(true);

  const renderNavButton = (item: {
    id: ActiveMenu;
    label: string;
    icon: typeof LayoutDashboard;
  }) => {
    const Icon = item.icon;
    const isActive = activeMenu === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onSelectMenu(item.id);
          onCloseMobile();
        }}
        aria-current={isActive ? 'page' : undefined}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
          isActive
            ? 'bg-white text-[#1E3A8A] shadow-sm'
            : 'text-blue-100 hover:bg-white/10 hover:text-white'
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`h-4 w-4 shrink-0 ${
              isActive ? 'text-[#1E3A8A]' : 'text-blue-200'
            }`}
          />
          <span className="whitespace-nowrap">{item.label}</span>
        </span>
        {item.id === 'maintenance' && activeRepairCount > 0 && (
          <span
            className={`ml-2 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${
              isActive
                ? 'bg-amber-100 text-amber-800'
                : 'bg-amber-500 text-slate-950'
            }`}
          >
            {activeRepairCount}
          </span>
        )}
      </button>
    );
  };

  const navContent = (
    <div className="flex h-full flex-col bg-[#1E3A8A] text-white">
      <div className="flex items-center justify-between border-b border-blue-800/80 px-5 py-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 border border-white/20">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-white">
              SI-ASET SMART
            </p>
            <p className="truncate text-[11px] text-blue-200">
              DPUBMSDA Kab. Sidoarjo
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Tutup menu navigasi"
          className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav
        aria-label="Menu Utama"
        className="flex-1 space-y-1 px-3 py-4 overflow-y-auto"
      >
        {PRIMARY_ITEMS_BEFORE.map(renderNavButton)}

        {/* Master Group with Sub-Sidebar */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setMasterExpanded((prev) => !prev)}
            aria-expanded={masterExpanded}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              isMasterActive
                ? 'bg-white/15 text-white'
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Database className="h-4 w-4 shrink-0 text-blue-200" />
              <span className="whitespace-nowrap">Master</span>
            </span>
            {masterExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-blue-200" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-blue-200" />
            )}
          </button>

          {masterExpanded && (
            <div className="mt-1 ml-4 space-y-1 border-l border-blue-700/80 pl-2.5">
              {MASTER_SUB_ITEMS.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = activeMenu === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      onSelectMenu(sub.id);
                      onCloseMobile();
                    }}
                    aria-current={isSubActive ? 'page' : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                      isSubActive
                        ? 'bg-white text-[#1E3A8A] font-semibold shadow-sm'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <SubIcon
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isSubActive ? 'text-[#1E3A8A]' : 'text-blue-200'
                      }`}
                    />
                    <span className="whitespace-nowrap">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {PRIMARY_ITEMS_AFTER.map(renderNavButton)}
      </nav>

      <div className="border-t border-blue-800/80 p-4 space-y-3">
        <button
          type="button"
          onClick={() => {
            onOpenQrScanner();
            onCloseMobile();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-400/40 bg-blue-800/60 px-3 py-2.5 text-xs font-semibold text-white hover:bg-blue-700/70 transition-colors"
        >
          <ScanLine className="h-4 w-4 shrink-0" />
          <span>Mode Scan QR Lapangan</span>
        </button>
        <div className="rounded-lg bg-blue-950/50 px-3 py-2.5 text-xs">
          <p className="text-[11px] text-blue-300">Peran Aktif</p>
          <p className="mt-0.5 truncate font-semibold text-white">{userRole}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="no-print hidden w-[272px] shrink-0 lg:block">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {/* Mobile collapsible drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 h-full w-72 max-w-[85vw]">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
