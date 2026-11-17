import {
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  UserCheck,
  Wrench,
  XCircle,
} from 'lucide-react';
import type {
  AssetCondition,
  AssetUsageStatus,
  TicketStatus,
} from '../types/asset';

export function ConditionBadge({
  condition,
  inRepair = false,
}: {
  condition: AssetCondition;
  inRepair?: boolean;
}) {
  if (condition === 'Baik') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span>Baik</span>
      </span>
    );
  }
  if (condition === 'Rusak Ringan') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 whitespace-nowrap">
        {inRepair ? (
          <Wrench className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        )}
        <span>{inRepair ? 'Rusak Ringan (Perbaikan)' : 'Rusak Ringan'}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 whitespace-nowrap">
      <XCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
      <span>Rusak Berat</span>
    </span>
  );
}

export function UsageStatusBadge({ status }: { status: AssetUsageStatus }) {
  if (status === 'Dipakai PIC') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 whitespace-nowrap">
        <UserCheck className="h-3.5 w-3.5 shrink-0 text-blue-600" />
        <span>Dipakai PIC</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 whitespace-nowrap">
      <PackageCheck className="h-3.5 w-3.5 shrink-0 text-sky-600" />
      <span>Tersedia</span>
    </span>
  );
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  if (status === 'Selesai') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span>Selesai</span>
      </span>
    );
  }
  if (status === 'Dalam Perbaikan') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 whitespace-nowrap">
        <Wrench className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        <span>Dalam Perbaikan</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 whitespace-nowrap">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600" />
      <span>Menunggu Perbaikan</span>
    </span>
  );
}
