import type { PackageSetup } from '@/services/setup/packageSetupService';

/**
 * Packages reception can choose for a new visit: valid today and allowed in the visit's department
 * (packages for all departments always show). The backend checks the same when the package is given.
 */
export const availablePackageOptions = (packages: PackageSetup[] | undefined, departmentId?: number | null) => {
  // today's local date (toISOString would give the UTC date, a day behind just after midnight)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const department = Number(departmentId ?? 0);
  return (packages ?? [])
    .filter(p => (!p.validFrom || p.validFrom <= today) && (!p.validTo || p.validTo >= today))
    .filter(
      p => p.allDepartments !== false || (department > 0 && (p.departmentIds ?? []).map(Number).includes(department))
    )
    .map(p => ({
      value: p.id as number,
      label: p.price != null ? `${p.code} - ${p.name} (${Number(p.price).toFixed(2)})` : `${p.code} - ${p.name}`
    }));
};
