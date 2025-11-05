import React, { useMemo } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import { Box, Checkbox, Chip, Typography } from '@mui/material';
import { formatEnumString } from '@/utils';


export type ServiceLite = {
  id: number;
  name: string;
  code?: string;
  category?: string | null;
  isActive?: boolean;
  abbreviation?: string | null;
  price?: number | string | null;
  currency?: string | null;
};

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;

  data: ServiceLite[];
  loading?: boolean;

  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;

  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;

  onConfirm: (ids: number[]) => void;
};

const LinkServices: React.FC<Props> = ({
  open,
  setOpen,
  data,
  loading,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  selectedIds,
  setSelectedIds,
  onConfirm,
}) => {
  const pageIds = useMemo(() => data.map(d => d.id), [data]);

  const allOnPageChecked = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));
  const someOnPageChecked = pageIds.some(id => selectedIds.includes(id)) && !allOnPageChecked;

  const toggleOne = (id: number, checked: boolean) => {
    if (checked) {
      if (!selectedIds.includes(id)) setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(x => x !== id));
    }
  };

  const toggleAllOnPage = (checked: boolean) => {
    if (checked) {
      const merged = Array.from(new Set([...selectedIds, ...pageIds]));
      setSelectedIds(merged);
    } else {
      const rest = selectedIds.filter(id => !pageIds.includes(id));
      setSelectedIds(rest);
    }
  };

  const columns: ColumnConfig[] = [
    {
      key: 'name',
      title: <Translate>Service Name</Translate>,
      render: (row: ServiceLite) => (
        <Box display="flex" alignItems="center" gap={1.2}>
          <Checkbox
            checked={selectedIds.includes(row.id)}
            onChange={(_, checked) => toggleOne(row.id, checked)}
            onClick={e => e.stopPropagation()}
            size="small"
          />
          <Typography variant="body2">{row.name}</Typography>
          {row.abbreviation ? <Chip label={row.abbreviation} size="small" /> : null}
        </Box>
      ),
      width: 280,
    },
    { key: 'code', title: <Translate>Code</Translate>, width: 120 },
    {
      key: 'category',
      title: <Translate>Category</Translate>,
      render: (row: ServiceLite) => (row?.category ? formatEnumString(row.category) : ''),
      width: 160,
    },
    {
      key: 'price',
      title: <Translate>Price</Translate>,
      render: (row: ServiceLite) => (
        <span>
          {row?.price ?? ''} {row?.currency ?? ''}
        </span>
      ),
      width: 140,
      align: 'right',
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      render: (row: ServiceLite) => (
        <Chip
          size="small"
          label={row?.isActive ? 'Active' : 'Inactive'}
          variant={row?.isActive ? 'filled' : 'outlined'}
        />
      ),
      width: 120,
    },
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={<Translate>Link Services</Translate>}
      pagesCount={1}
      size="70vw"
      bodyheight="70vh"
      content={() => (
        <MyTable
          data={data}
          columns={columns}
          loading={!!loading}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          tableButtons={
            <Box display="flex" alignItems="center" gap={1}>
              <Checkbox
                checked={allOnPageChecked}
                indeterminate={someOnPageChecked}
                onChange={(_, checked) => toggleAllOnPage(checked)}
                size="small"
              />
              <Typography variant="body2">
                <Translate>Select all on this page</Translate>
              </Typography>
            </Box>
          }
        />
      )}
      hideActionBtn={false}
      actionButtonLabel={"Use Selection"}
      actionButtonFunction={() => onConfirm(selectedIds)}
      cancelButtonLabel={<Translate>Cancel</Translate> as any}
      handleCancelFunction={() => setSelectedIds([])}
    />
  );
};

export default LinkServices;
