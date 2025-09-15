// DragDropTable.tsx
import React, { useState, useEffect, ReactNode } from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Box,
  Typography,
  TablePagination
} from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import clsx from 'clsx';
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

interface DragDropTableProps {
  data: any[];
  columns: ColumnConfig[];
  height?: number;
  loading?: boolean;
  onRowClick?: (rowData: any) => void;
  rowClassName?: (rowData: any) => string;
  sortColumn?: string;
  sortType?: 'asc' | 'desc';
  onSortChange?: (sortColumn: string, sortType: 'asc' | 'desc') => void;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDataChange?: (newData: any[]) => void;
  filters?: ReactNode;
  tableButtons?: ReactNode;
}

const DragDropTable: React.FC<DragDropTableProps> = ({
  data,
  columns,
  height = 450,
  loading,
  onRowClick,
  rowClassName,
  sortColumn,
  sortType,
  onSortChange,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  onDataChange,
  filters,
  tableButtons
}) => {
  const [tableData, setTableData] = useState<any[]>(data);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const mode = useSelector((state: any) => state.ui.mode);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newData = Array.from(tableData);
    const [movedRow] = newData.splice(result.source.index, 1);
    newData.splice(result.destination.index, 0, movedRow);
    setTableData(newData);
    onDataChange?.(newData);
  };

  const handleExpandClick = (index: number) => {
    setExpandedRow(prev => (prev === index ? null : index));
  };

  const emptyTable = () => (
    <TableRow>
      <TableCell colSpan={columns.length} align="center">
        <Typography variant="body2" className="no-data-label">
          No data
        </Typography>
      </TableCell>
    </TableRow>
  );

  return (
    <Box className={`my-table-wrapper ${mode === 'light' ? 'light' : 'dark'}`}>
      {/* Filters above the table */}
      {filters && <Box className="my-table-filters">{filters}</Box>}

      {/* Table buttons above the table */}
      {tableButtons && <Box className="my-table-buttons-wrapper">{tableButtons}</Box>}

      <Box className="my-table-content-wrapper">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="table-body">
            {(provided) => (
              <TableContainer
                component={Paper}
                sx={{ maxHeight: height, overflowY: 'auto' }}
                className="my-table-container"
              >
                <Table stickyHeader size="small">
                  <TableHead className="my-table-header">
                    <TableRow>
                      {columns.map(col => {
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
                  <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} align="center">
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : tableData.length === 0 ? (
                      emptyTable()
                    ) : (
                      tableData.map((row, index) => (
                        <Draggable key={row.id} draggableId={row.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <React.Fragment>
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={clsx('main-row', rowClassName?.(row), {
                                  'even-row': index % 2 === 1,
                                  'dragging-row': snapshot.isDragging
                                })}
                                hover
                                onClick={() => onRowClick?.(row)}
                              >
                                {columns.map(col => (
                                  <TableCell key={col.key} align={col.align || 'left'}>
                                    {col.render
                                      ? col.render(row, index)
                                      : col.isLink ? (
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
                              {expandedRow === index && (
                                <TableRow className="expanded-row">
                                  <TableCell colSpan={columns.length}>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Droppable>
        </DragDropContext>

        {page !== undefined &&
          rowsPerPage !== undefined &&
          totalCount !== undefined && (
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

export default DragDropTable;
