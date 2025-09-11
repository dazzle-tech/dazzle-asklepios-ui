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
import { useSelector } from 'react-redux';

export interface ColumnConfig {
  key: string;
  title: ReactNode;
  width?: number;
  align?: 'left' | 'center' | 'right';
  dataKey?: string;
  render?: (rowData: any, rowIndex?: number) => ReactNode;
  expandable?: boolean;
  isLink?: boolean;
  onLinkClick?: (rowData: any) => void;
}

interface MyTableProps {
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
  tableButtons?: ReactNode;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const MyTable: React.FC<MyTableProps> = ({
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
  tableButtons,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange
}) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const mode = useSelector((state: any) => state.ui.mode);
  const visibleColumns = columns.filter(col => !col.expandable);
  const expandableColumns = columns.filter(col => col.expandable);

  const handleExpandClick = (index: number) => {
    setExpandedRow(prev => (prev === index ? null : index));
  };

  const emptyTable = () => (
    <TableRow>
      <TableCell
        colSpan={visibleColumns.length + (expandableColumns.length > 0 ? 1 : 0)}
        align="center"
      >
        <Typography variant="body2" className="no-data-label">
          No data
        </Typography>
      </TableCell>
    </TableRow>
  );

  return (
    <Box className={`my-table-wrapper ${mode === 'light' ? 'light' : 'dark'}`}>
      {filters && <Box className="my-table-filters">{filters}</Box>}

      {tableButtons && <Box className="my-table-buttons-wrapper">{tableButtons}</Box>}
      <Box className="my-table-content-wrapper">
        <TableContainer
          component={Paper}
          sx={{ maxHeight: height, overflowY: 'auto' }}
          className="my-table-container"
        >
          <Table stickyHeader size="small">
            <TableHead className="my-table-header">
              <TableRow>
                {expandableColumns.length > 0 && <TableCell />}
                {visibleColumns.map(col => {
                  const isSortable = !!onSortChange;
                  const isActive = sortColumn === col.key;
                  const nextDirection = isActive && sortType === 'asc' ? 'desc' : 'asc';

                  let sortIcon: ReactNode = null;
                  if (isActive) {
                    sortIcon =
                      sortType === 'asc' ? (
                        <ArrowUpwardIcon fontSize="small" />
                      ) : (
                        <ArrowDownwardIcon fontSize="small" />
                      );
                  }

                  return (
                    <TableCell
                      key={col.key}
                      align={col.align || 'left'}
                      sx={{
                        whiteSpace: 'nowrap',
                        cursor: isSortable ? 'pointer' : 'default',
                        width: col.width ? `${col.width}px` : 'auto',
                        minWidth: col.width ? `${col.width}px` : 'auto'
                      }}
                      onClick={isSortable ? () => onSortChange!(col.key, nextDirection) : undefined}
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent={
                          col.align === 'center'
                            ? 'center'
                            : col.align === 'right'
                            ? 'flex-end'
                            : 'flex-start'
                        }
                      >
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
                  <TableCell
                    colSpan={visibleColumns.length + (expandableColumns.length > 0 ? 1 : 0)}
                    align="center"
                  >
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                emptyTable()
              ) : (
                data.map((row, index) => {
                  const isEvenRow = index % 2 === 1;

                  return (
                    <React.Fragment key={index}>
                      <TableRow
                        onClick={() => onRowClick?.(row)}
                        className={clsx('main-row', rowClassName?.(row), {
                          'even-row': isEvenRow
                        })}
                        hover
                      >
                        {expandableColumns.length > 0 && (
                          <TableCell padding="checkbox">
                            <IconButton size="small" onClick={() => handleExpandClick(index)}>
                              {expandedRow === index ? (
                                <KeyboardArrowUpIcon />
                              ) : (
                                <KeyboardArrowDownIcon />
                              )}
                            </IconButton>
                          </TableCell>
                        )}
                        {visibleColumns.map(col => (
                          <TableCell
                            key={col.key}
                            align={col.align || 'left'}
                            className="even"
                            sx={{
                              width: col.width ? `${col.width}px` : 'auto',
                              minWidth: col.width ? `${col.width}px` : 'auto'
                            }}
                          >
                            {col.render ? (
                              col.render(row, index)
                            ) : col.isLink ? (
                              <span
                                className="table-link"
                                onClick={e => {
                                  e.stopPropagation();
                                  col.onLinkClick?.(row);
                                }}
                              >
                                {row[col.dataKey || col.key]}
                              </span>
                            ) : (
                              row[col.dataKey || col.key]
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      {expandableColumns.length > 0 && expandedRow === index && (
                        <TableRow className="expanded-row">
                          <TableCell colSpan={visibleColumns.length + 1} className="expanded-table">
                            <Box>
                              <Table size="small">
                                <TableHead className="my-table-header">
                                  <TableRow>
                                    {expandableColumns.map(col => (
                                      <TableCell
                                        key={col.key}
                                        align={col.align || 'left'}
                                        sx={{ fontWeight: 600, backgroundColor: '#f9f9f9' }}
                                      >
                                        {col.title}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  <TableRow>
                                    {expandableColumns.map(col => (
                                      <TableCell key={col.key} align={col.align || 'left'}>
                                        {col.render
                                          ? col.render(row, index)
                                          : row[col.dataKey || col.key]}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </Box>
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
    </Box>
  );
};

export default MyTable;
