import { INITIAL_SEED_DATA } from '../data/seedData';
import type { AppStateData, Employee, EmploymentStatus, UserRole } from '../types/asset';

const DATA_STORAGE_KEY = 'si_aset_dpubmsda_sidoarjo_v1';
const ROLE_STORAGE_KEY = 'si_aset_dpubmsda_role_v1';
const PIC_EMP_STORAGE_KEY = 'si_aset_dpubmsda_pic_emp_v1';

export function normalizeEmploymentStatus(status: string): EmploymentStatus {
  if (status === 'ASN') return 'PNS';
  if (status === 'PPPK') return 'PPPK Penuh Waktu';
  if (status === 'Satgas') return 'Non ASN';
  if (
    status === 'PNS' ||
    status === 'PPPK Penuh Waktu' ||
    status === 'PPPK Paruh Waktu' ||
    status === 'Non ASN'
  ) {
    return status;
  }
  return 'Non ASN';
}

export function loadAppData(): AppStateData {
  try {
    const raw = window.localStorage.getItem(DATA_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        DATA_STORAGE_KEY,
        JSON.stringify(INITIAL_SEED_DATA),
      );
      return INITIAL_SEED_DATA;
    }
    const parsed = JSON.parse(raw) as Partial<AppStateData>;
    if (
      !Array.isArray(parsed.categories) ||
      !Array.isArray(parsed.employees) ||
      !Array.isArray(parsed.assets) ||
      !Array.isArray(parsed.picHistory) ||
      !Array.isArray(parsed.maintenance)
    ) {
      return INITIAL_SEED_DATA;
    }
    const normalizedEmployees: Employee[] = parsed.employees.map((e) => ({
      ...e,
      statusKepegawaian: normalizeEmploymentStatus(String(e.statusKepegawaian)),
    }));
    return {
      ...parsed,
      employees: normalizedEmployees,
      units: Array.isArray(parsed.units)
        ? parsed.units
        : INITIAL_SEED_DATA.units,
      auditLogs: Array.isArray(parsed.auditLogs)
        ? parsed.auditLogs
        : INITIAL_SEED_DATA.auditLogs,
    } as AppStateData;
  } catch {
    return INITIAL_SEED_DATA;
  }
}

export function saveAppData(data: AppStateData): void {
  try {
    window.localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors cleanly
  }
}

export function resetAppData(): AppStateData {
  try {
    window.localStorage.setItem(
      DATA_STORAGE_KEY,
      JSON.stringify(INITIAL_SEED_DATA),
    );
  } catch {
    // Ignore
  }
  return INITIAL_SEED_DATA;
}

export function loadUserRole(): UserRole {
  try {
    const raw = window.localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    const validRoles: UserRole[] = [
      'Admin / Pranata Komputer',
      'Pengurus Barang',
      'Teknisi',
      'Pemakai (PIC)',
      'Pimpinan',
    ];
    if (raw && validRoles.includes(raw)) {
      return raw;
    }
  } catch {
    // Ignore
  }
  return 'Admin / Pranata Komputer';
}

export function saveUserRole(role: UserRole): void {
  try {
    window.localStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch {
    // Ignore
  }
}

export function loadActivePicEmployeeId(): string {
  try {
    const raw = window.localStorage.getItem(PIC_EMP_STORAGE_KEY);
    if (raw) return raw;
  } catch {
    // Ignore
  }
  return INITIAL_SEED_DATA.employees[0]?.id ?? 'emp-1';
}

export function saveActivePicEmployeeId(empId: string): void {
  try {
    window.localStorage.setItem(PIC_EMP_STORAGE_KEY, empId);
  } catch {
    // Ignore
  }
}
