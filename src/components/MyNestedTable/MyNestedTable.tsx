import React, { ReactNode, useState } from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  IconButton,
  Box,
  Typography,
  TablePagination
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import clsx from 'clsx';
import './styles.less';

export interface ColumnConfig {
  key: string;
  title: ReactNode;
  width?: number;
  align?: 'left' | 'center' | 'right';
  dataKey?: string;
  render?: (rowData: any, rowIndex?: number) => ReactNode;
}

export interface NestedTableConfig {
  columns: ColumnConfig[];
  data: any[];
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface MyNestedTableProps {
  data: any[];
  columns: ColumnConfig[];
  height?: number;
  loading?: boolean;
  onRowClick?: (rowData: any) => void;
  rowClassName?: (rowData: any) => string;
  sortColumn?: string;
  sortType?: 'asc' | 'desc';
  onSortChange?: (sortColumn: string, sortType: 'asc' | 'desc') => void;
  filters?: ReactNode;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  getNestedTable?: (rowData: any) => NestedTableConfig | null;
}

const MyNestedTable: React.FC<MyNestedTableProps> = ({
  data,
  columns,
  height = 450,
  loading,
  onRowClick,
  rowClassName,
  sortColumn,
  sortType,
  onSortChange,
  filters,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  getNestedTable
}) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const handleExpandClick = (index: number) => {
    setExpandedRow(prev => (prev === index ? null : index));
  };

  const emptyTable = () => (
    <TableRow>
      <TableCell colSpan={columns.length + 1} align="center">
        <Typography variant="body2" className="no-data-label">
          No data
        </Typography>
      </TableCell>
    </TableRow>
  );

  return (
    <Box className="my-table-wrapper">
      {filters && <Box className="my-table-filters">{filters}</Box>}
      <TableContainer
        component={Paper}
        sx={{ maxHeight: height, overflowY: 'auto' }}
        className="my-table-container"
      >
        <Table stickyHeader size="small">
          <TableHead className="my-table-header">
            <TableRow>
              {getNestedTable && <TableCell />}
              {columns.map(col => {
                const isSortable = !!onSortChange;
                const isActive = sortColumn === col.key;
                const nextDirection = isActive && sortType === 'asc' ? 'desc' : 'asc';

                let sortIcon: ReactNode = null;
                if (isActive) {
                  sortIcon = sortType === 'asc'
                    ? <ArrowUpwardIcon fontSize="small" />
                    : <ArrowDownwardIcon fontSize="small" />;
                }

                return (
                  <TableCell
                    key={col.key}
                    align={col.align || 'left'}
                    sx={{ whiteSpace: 'nowrap', cursor: isSortable ? 'pointer' : 'default' }}
                    onClick={isSortable ? () => onSortChange!(col.key, nextDirection) : undefined}
                  >
                    <Box display="flex" alignItems="center" justifyContent={
                      col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start'
                    }>
                      {col.title}
                      {sortIcon}
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              emptyTable()
            ) : (
              data.map((row, index) => {
                const isEvenRow = index % 2 === 1;
                const nestedTable = getNestedTable ? getNestedTable(row) : null;

                return (
                  <React.Fragment key={index}>
                    <TableRow
                      onClick={() => onRowClick?.(row)}
                      className={clsx('main-row', rowClassName?.(row), { 'even-row': isEvenRow })}
                      hover
                    >
                      {getNestedTable && (
                        <TableCell padding="checkbox">
                          {nestedTable ? (
                            <IconButton size="small" onClick={(e) => {
                              e.stopPropagation();
                              handleExpandClick(index);
                            }}>
                              {expandedRow === index ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                          ) : null}
                        </TableCell>
                      )}
                      {columns.map(col => (
                        <TableCell key={col.key} align={col.align || 'left'}>
                          {col.render ? col.render(row, index) : row[col.dataKey || col.key]}
                        </TableCell>
                      ))}
                    </TableRow>
                    {expandedRow === index && nestedTable && (
                      <TableRow className="expanded-row">
                        <TableCell colSpan={columns.length + 1}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {nestedTable.columns.map(nCol => (
                                  <TableCell key={nCol.key} align={nCol.align || 'left'}>
                                    {nCol.title}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {nestedTable.data.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={nestedTable.columns.length} align="center">
                                    No nested data
                                  </TableCell>
                                </TableRow>
                              ) : (
                                nestedTable.data.map((nRow, nIndex) => (
                                  <TableRow key={nIndex}>
                                    {nestedTable.columns.map(nCol => (
                                      <TableCell key={nCol.key} align={nCol.align || 'left'}>
                                        {nCol.render
                                          ? nCol.render(nRow, nIndex)
                                          : nRow[nCol.dataKey || nCol.key]}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>

                          {nestedTable.page !== undefined &&
                            nestedTable.rowsPerPage !== undefined &&
                            nestedTable.totalCount !== undefined && (
                            <TablePagination
                              component="div"
                              count={nestedTable.totalCount}
                              page={nestedTable.page}
                              onPageChange={nestedTable.onPageChange!}
                              rowsPerPage={nestedTable.rowsPerPage}
                              onRowsPerPageChange={nestedTable.onRowsPerPageChange!}
                              rowsPerPageOptions={[3, 5, 10]}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {page !== undefined && rowsPerPage !== undefined && totalCount !== undefined && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={onPageChange!}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange!}
          rowsPerPageOptions={[5, 15, 30]}
        />
      )}
    </Box>
  );
};

export default MyNestedTable;
