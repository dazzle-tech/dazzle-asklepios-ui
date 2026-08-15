import React from 'react';

import MyTable from '@/components/MyTable';
import type { ColumnConfig } from '@/components/MyTable/MyTable';
import type { PreAuthorizationTrackingResponse } from '@/types/model-types-new';

type PreAuthorizationRequestsTableProps = {
  data: PreAuthorizationTrackingResponse[];
  columns: ColumnConfig[];
  filters: React.ReactNode;
  page: number;
  rowsPerPage: number;
  totalCount: number;
  loading: boolean;
  rowClassName: (row: PreAuthorizationTrackingResponse) => string;
  onRowClick: (row: PreAuthorizationTrackingResponse) => void;
  onPageChange: (_: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  tableButtons?: React.ReactNode;
  height?: number;
};

const PreAuthorizationRequestsTable: React.FC<PreAuthorizationRequestsTableProps> = ({
  data,
  columns,
  filters,
  page,
  rowsPerPage,
  totalCount,
  loading,
  rowClassName,
  onRowClick,
  onPageChange,
  onRowsPerPageChange,
  tableButtons,
  height = 680
}) => (
  <MyTable
    data={data}
    columns={columns}
    rowClassName={rowClassName}
    loading={loading}
    onRowClick={onRowClick}
    filters={filters}
    page={page}
    rowsPerPage={rowsPerPage}
    totalCount={totalCount}
    onPageChange={onPageChange}
    onRowsPerPageChange={onRowsPerPageChange}
    tableButtons={tableButtons}
    height={height}
  />
);

export default PreAuthorizationRequestsTable;