// components/shared/MyTable.tsx
import React from 'react';
import { Table } from 'rsuite';

const { Column, HeaderCell, Cell } = Table;

interface ColumnConfig {
  key: string;
  title: React.ReactNode;
  flexGrow?: number;
  width?: number;
  fullText?: boolean;
  align?: 'left' | 'center' | 'right';
  dataKey?: string;
  render?: (rowData: any, rowIndex?: number) => React.ReactNode;
}

interface MyTableProps {
  data: any[];
  columns: ColumnConfig[];
  height?: number;
  rowHeight?: number;
  loading?: boolean;
  onRowClick?: (rowData: any) => void;
  rowClassName?: (rowData: any) => string;
  sortColumn?: string;
  sortType?: 'asc' | 'desc';
  onSortChange?: (sortColumn: string, sortType: 'asc' | 'desc') => void;
}

const MyTable: React.FC<MyTableProps> = ({
  data,
  columns,
  height = 450,
  rowHeight = 60,
  loading,
  onRowClick,
  rowClassName,
  sortColumn,
  sortType,
  onSortChange
}) => {
  return (
    <Table
      height={height}
      data={data}
      loading={loading}
      rowHeight={rowHeight}
      rowClassName={rowClassName}
      onRowClick={onRowClick}
      sortColumn={sortColumn}
      sortType={sortType}
      onSortColumn={onSortChange}
    >
      {columns.map(col => (
        <Column
          key={col.key}
          flexGrow={col.flexGrow}
          width={col.width}
          align={col.align}
          fullText={col.fullText}
        >
          <HeaderCell>{col.title}</HeaderCell>
          <Cell dataKey={col.dataKey}>
            {col.render ? (rowData, rowIndex) => col.render!(rowData, rowIndex) : undefined}
          </Cell>
        </Column>
      ))}
    </Table>
  );
};

export default MyTable;
