import { useGetCatalogsByDepartmentAndNotQuery } from '@/services/setup/catalog/catalogTestService';
import { skipToken } from '@reduxjs/toolkit/query';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import TestTypeSection, { getItemKey, normalizeSearchText } from './TestTypeSection';
import '../styles.less';

/* ================= popup content: Laboratory | Radiology ================= */

type Props = {
  open: boolean;
  selectedTests: any[];
  setSelectedTests: (v: any[]) => void;
  /** Optional fixed list (e.g. favorites). When omitted, each section loads its tests by type */
  items?: any[];
  loading?: boolean;
};

const TestTypeSections: React.FC<Props> = ({ open, selectedTests = [], setSelectedTests, items, loading }) => {
  const selectedKeys = useMemo(() => new Set(selectedTests.map(getItemKey)), [selectedTests]);

  // Catalogs of the logged-in department (or unassigned), split by test type per section
  const selectedDepartmentId = useSelector(
    (state: any) => state.auth?.selectedDepartment?.departmentId
  );
  const { data: catalogsResponse } = useGetCatalogsByDepartmentAndNotQuery(
    open && selectedDepartmentId
      ? { departmentId: selectedDepartmentId, page: 0, size: 1000 }
      : skipToken
  );
  const catalogsOfType = (type: string) =>
    (catalogsResponse?.data ?? []).filter(
      (c: any) => normalizeSearchText(c?.type) === normalizeSearchText(type)
    );

  // Selected count per section comes from the whole selection (by test type), so search/catalog never change it
  const selectedCountOfType = (type: string) =>
    selectedTests.filter(t => normalizeSearchText(t?.type) === normalizeSearchText(type)).length;

  const handleToggle = (item: any) => {
    const key = getItemKey(item);
    setSelectedTests(
      selectedKeys.has(key)
        ? selectedTests.filter(t => getItemKey(t) !== key)
        : [...selectedTests, item]
    );
  };

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <div dir={dir} className="test-type-sections">
      <TestTypeSection
        open={open}
        type="LABORATORY"
        title="Laboratory"
        catalogs={catalogsOfType('LABORATORY')}
        selectedKeys={selectedKeys}
        selectedCount={selectedCountOfType('LABORATORY')}
        onToggle={handleToggle}
        items={items}
        loading={loading}
      />
      <TestTypeSection
        open={open}
        type="RADIOLOGY"
        title="Radiology"
        catalogs={catalogsOfType('RADIOLOGY')}
        selectedKeys={selectedKeys}
        selectedCount={selectedCountOfType('RADIOLOGY')}
        onToggle={handleToggle}
        items={items}
        loading={loading}
      />
    </div>
  );
};

export default TestTypeSections;
