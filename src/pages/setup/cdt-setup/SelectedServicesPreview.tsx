
import React, { useEffect, useMemo, useState } from "react";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import { ColumnConfig } from "@/components/MyTable/MyTable";
import { Box, Chip, Typography } from "@mui/material";
import Translate from "@/components/Translate";
import { formatEnumString } from "@/utils";
import {
  useGetLinkedServiceDetailsQuery,
} from "@/services/setup/cdtCodeService";
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
  const { data: details = [], isFetching, isLoading, refetch } =
    useGetLinkedServiceDetailsQuery(cdtId, { skip: shouldSkip });

  useEffect(() => {
    if (open && cdtId) refetch();
  }, [open, cdtId, refetch]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (open) setPage(0);
  }, [open, cdtId]);

  const totalCount = details.length;

  const pagedData: ServiceLite[] = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return details.slice(start, end) as ServiceLite[];
  }, [details, page, rowsPerPage]);

  const onPageChange = (_: unknown, newPage: number) => setPage(newPage);
  const onRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(0);
  };

  const columns: ColumnConfig[] = [
    {
      key: "name",
      title: <Translate>Service Name</Translate>,
      render: (row: ServiceLite) => (
        <Box display="flex" alignItems="center" gap={1.2}>
          <Typography variant="body2"><Translate>{row.name}</Translate></Typography>
        </Box>
      ),
      width: 280,
    },
    { key: "code", title: <Translate>Code</Translate>, width: 120 },
    {
      key: "category",
      title: <Translate>Category</Translate>,
      render: (row: ServiceLite) =>
        row?.category ? formatEnumString(row.category) : "",
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
      render: (rowData) =>
        rowData.isActive ? (
          <MyBadgeStatus contant="Active" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Inactive" color="#969fb0" />
        ),
      width: 120,
    },
  ];

  const combinedLoading = isFetching || isLoading;

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
        <>
          <Typography variant="body2" sx={{ mb: 1 }} color="text.secondary">
            <Translate>Total selected:</Translate> {totalCount}
          </Typography>

          <MyTable
            data={pagedData}
            columns={columns}
            totalCount={totalCount}
            loading={combinedLoading}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
            height={500}
          />
        </>
      }
    />
  );
};

export default SelectedServicesPreview;
