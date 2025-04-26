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
  Collapse,
  IconButton,
  Box,
  Typography,
  TablePagination
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import './styles.less';

interface ColumnConfig {
  key: string;
  title: ReactNode;
  width?: number;
  align?: 'left' | 'center' | 'right';
  dataKey?: string;
  render?: (rowData: any, rowIndex?: number) => ReactNode;
  expandable?: boolean;
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
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange
}) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const visibleColumns = columns.filter(col => !col.expandable);
  const expandableColumns = columns.filter(col => col.expandable);

  const handleExpandClick = (index: number) => {
    setExpandedRow(prev => (prev === index ? null : index));
  };

  return (
    <Box className="my-table-wrapper">
      {filters && <Box className="my-table-filters">{filters}</Box>}
      <TableContainer component={Paper} sx={{ maxHeight: height, overflowY: 'auto' }} className="my-table-container">
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {expandableColumns.length > 0 && <TableCell />}
              {visibleColumns.map(col => {
                const isSortable = !!onSortChange;
                const isActive = sortColumn === col.key;
                const nextDirection = isActive && sortType === 'asc' ? 'desc' : 'asc';

                // Extracted sort icon logic into standalone variable
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
                    <Box display="flex" alignItems="center">
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
                <TableCell colSpan={visibleColumns.length + (expandableColumns.length > 0 ? 1 : 0)} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + (expandableColumns.length > 0 ? 1 : 0)} align="center">
                  <Typography variant="body2" className="no-data-label">No data</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <React.Fragment key={index}>
                  <TableRow onClick={() => onRowClick?.(row)} className={rowClassName?.(row)} hover>
                    {expandableColumns.length > 0 && (
                      <TableCell padding="checkbox">
                        <IconButton size="small" onClick={() => handleExpandClick(index)}>
                          {expandedRow === index ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                    )}
                    {visibleColumns.map(col => (
                      <TableCell key={col.key} align={col.align || 'left'}>
                        {col.render ? col.render(row, index) : row[col.dataKey || col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandableColumns.length > 0 && (
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length + 1}>
                        <Collapse in={expandedRow === index} timeout="auto" unmountOnExit>
                          <Box margin={1}>
                            <Typography variant="subtitle2" gutterBottom>
                              More Details
                            </Typography>
                            <Table size="small">
                              <TableBody>
                                <TableRow>
                                  {expandableColumns.map(col => (
                                    <TableCell key={col.key} align={col.align || 'left'}>
                                      <strong>{col.title}:</strong> {col.render ? col.render(row, index) : row[col.dataKey || col.key]}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
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

export default MyTable;
