import React, { useEffect, useMemo, useState, useCallback } from "react";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import { ColumnConfig } from "@/components/MyTable/MyTable";
import { Box, Typography } from "@mui/material";
import Translate from "@/components/Translate";
import { formatEnumString } from "@/utils";
import { extractPaginationFromLink } from "@/utils/paginationHelper";
import { useGetLinkedServiceDetailsQuery } from "@/services/setup/cdtCodeService";
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";

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
  cdtId: number;
};

const SelectedServicesPreview: React.FC<Props> = ({ open, setOpen, cdtId }) => {
  const shouldSkip = !open || !cdtId;

  const [pager, setPager] = useState({
    page: 0,
    size: 10,
    sort: "id,asc",
    timestamp: Date.now(),
  });

  useEffect(() => {
    if (open && cdtId) {
      setPager((prev) => ({ ...prev, page: 0, timestamp: Date.now() }));
    }
  }, [open, cdtId]);

  const {
    data: resp,
    isFetching,
    isLoading,
    refetch,
  } = useGetLinkedServiceDetailsQuery(
    { cdtId, page: pager.page, size: pager.size, sort: pager.sort, timestamp: pager.timestamp },
    { skip: shouldSkip }
  );

  useEffect(() => {
    if (open && cdtId) refetch();
  }, [open, cdtId, refetch]);

  const totalCount = resp?.totalCount ?? 0;
  const links = resp?.links || {};
  const tableData: ServiceLite[] = (resp?.data ?? []) as ServiceLite[];

  const page = pager.page;
  const rowsPerPage = pager.size;

  const onPageChange = useCallback(
    (_: unknown, newPage: number) => {
      const currentPage = pager.page;
      let targetLink: string | null | undefined = null;

      if (newPage > currentPage && links.next) targetLink = links.next;
      else if (newPage < currentPage && links.prev) targetLink = links.prev;
      else if (newPage === 0 && links.first) targetLink = links.first;
      else if (newPage > currentPage + 1 && links.last) targetLink = links.last;

      if (targetLink) {
        const { page, size } = extractPaginationFromLink(targetLink);
        setPager((prev) => ({
          ...prev,
          page,
          size,
          timestamp: Date.now(),
        }));
      } else {
        // fallback (in case Link header missing)
        setPager((prev) => ({ ...prev, page: newPage, timestamp: Date.now() }));
      }
    },
    [pager.page, links, setPager]
  );

  const onRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSize = parseInt(e.target.value, 10);
      setPager((prev) => ({
        ...prev,
        size: newSize,
        page: 0,
        timestamp: Date.now(),
      }));
    },
    []
  );

  const columns: ColumnConfig[] = useMemo(
    () => [
      {
        key: "name",
        title: <Translate>Service Name</Translate>,
        render: (row: ServiceLite) => (
          <Box display="flex" alignItems="center" gap={1.2}>
            <Typography variant="body2">
              <Translate>{row.name}</Translate>
            </Typography>
          </Box>
        ),
        width: 280,
      },
      { key: "code", title: <Translate>Code</Translate>, width: 120 },
      {
        key: "category",
        title: <Translate>Category</Translate>,
        render: (row: ServiceLite) => (row?.category ? formatEnumString(row.category) : ""),
        width: 160,
      },
      {
        key: "price",
        title: <Translate>Price</Translate>,
        render: (row: ServiceLite) => (
          <span>
            {row?.price ?? ""} {row?.currency ?? ""}
          </span>
        ),
        width: 140,
        align: "right",
      },
      {
        key: "isActive",
        title: <Translate>Status</Translate>,
        render: (rowData: ServiceLite) =>
          rowData.isActive ? (
            <MyBadgeStatus contant="Active" color="#45b887" />
          ) : (
            <MyBadgeStatus contant="Inactive" color="#969fb0" />
          ),
        width: 120,
      },
    ],
    []
  );

  const combinedLoading = isFetching || isLoading;

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={<Translate>Selected Services</Translate>}
      pagesCount={1}
      size="70vw"
      bodyheight="70vh"
      hideActionBtn={true}
      content={
        <div dir={dir}>
          <Typography variant="body2" sx={{ mb: 1 }} color="text.secondary">
            <Translate>Total selected:</Translate> {totalCount}
          </Typography>

          <MyTable
            data={tableData}          
            columns={columns}
            totalCount={totalCount}  
            loading={combinedLoading}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={onPageChange}             
            onRowsPerPageChange={onRowsPerPageChange} 
            height={500}
          />
        </div>
      }
    />
  );
};

export default SelectedServicesPreview;
