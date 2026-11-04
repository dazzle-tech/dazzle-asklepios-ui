import React, { useMemo, useState } from "react";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import {newPriceListSetup } from "@/types/model-types-constructor-new";
import { conjureValueBasedOnIDFromList, formatEnumString } from "@/utils";

import { Tooltip, Whisper } from "rsuite";
import {  MdPlaylistAdd } from "react-icons/md";
import ViewPriceListItemsModal from "./ViewPriceListItemsModal";
import MyModal from "@/components/MyModal/MyModal";
import {
  useGetPriceListSetupsByLoggedInFacilityQuery,
} from '@/services/setup/priceListSetup/priceListSetupService';
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";
import type {
  PriceListSetup as PriceListSetupModel
} from '@/types/model-types-new';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetAllNphiesPayersQuery } from '@/services/setup/payer/NphiesPayerSetupService';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const ViewPriceListModal = ({ open, setOpen }: Props) => {

  const [priceList, setPriceList] = useState<PriceListSetupModel>({
    ...newPriceListSetup,
  });

  const [
    paginationParams,
    setPaginationParams
  ] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc',
    timestamp: Date.now()
  });
  const [openItemsModal, setOpenItemsModal] = useState(false);

  const {
      data: payerListResponse
    } = useGetAllNphiesPayersQuery({
      page: 0,
      size: 500,
      sort: 'nameEn,asc'
    });

  const {
    data: facilityListResponse
  } = useGetAllFacilitiesQuery({});

  const {
    data: priceListPage,
    isFetching,
    refetch
  } = useGetPriceListSetupsByLoggedInFacilityQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    timestamp: paginationParams.timestamp
  });

  const tableData = useMemo(
    () => priceListPage?.data ?? [],
    [priceListPage?.data]
  );

  const totalCount =
    priceListPage?.totalCount ?? 0;


  const itemsIcon = (rowData: PriceListSetupModel) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Whisper
        trigger="hover"
        placement="top"
        speaker={<Tooltip>Items</Tooltip>}
      >
        <span
          className="icons-style"
          style={{
            cursor: "pointer",
            display: "inline-flex",
          }}
          onClick={(e) => {
            e.stopPropagation();
            setPriceList(rowData);
            setOpenItemsModal(true);
          }}
        >
          <MdPlaylistAdd size={22} />
        </span>
      </Whisper>

    </div>
  );

  const handlePageChange = (
    _: unknown,
    newPage: number
  ) => {
    setPaginationParams(previous => ({
      ...previous,
      page: newPage,
      timestamp: Date.now()
    }));
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSize = Number(
      event.target.value
    );

    setPaginationParams(previous => ({
      ...previous,
      page: 0,
      size: newSize,
      timestamp: Date.now()
    }));
  };

  const tableColumns = [
    {
      key: 'facilityId',
      title: <Translate>Facility</Translate>,
      flexGrow: 3,

      render: (
        row: PriceListSetupModel
      ) =>
        conjureValueBasedOnIDFromList(
          facilityListResponse ?? [],
          row.facilityId,
          'name'
        )
    },

    {
      key: 'name',
      title: <Translate>Name</Translate>,
      flexGrow: 4
    },

    {
      key: 'type',
      title: <Translate>Type</Translate>,
      flexGrow: 2,

      render: (
        row: PriceListSetupModel
      ) =>
        row.type
          ? formatEnumString(row.type)
          : ''
    },

    {
      key: 'payerName',
      title: <Translate>Payer</Translate>,
      flexGrow: 3,

      render: (
        row: PriceListSetupModel
      ) => {
        if (row.payerName) {
          return row.payerName;
        }

        if (!row.payerId) {
          return '-';
        }

        const payer =
          payerListResponse?.data?.find(
            item =>
              Number(item.id) ===
              Number(row.payerId)
          );

        return (
          payer?.nameEn ||
          payer?.nameAr ||
          '-'
        );
      }
    },

    {
      key: 'versionNumber',
      title: <Translate>Version</Translate>,
      width: 90,
      align: 'center' as const
    },

    {
      key: 'effectiveFrom',
      title:
        <Translate>
          Effective From
        </Translate>,
      flexGrow: 2
    },

    {
      key: 'effectiveTo',
      title:
        <Translate>
          Effective To
        </Translate>,
      flexGrow: 2,

      render: (
        row: PriceListSetupModel
      ) =>
        row.effectiveTo || '-'
    },

    {
      key: 'currency',
      title: <Translate>Currency</Translate>,
      width: 100,
      align: 'center' as const
    },

    {
      key: 'status',
      title: <Translate>Status</Translate>,
      width: 110,

      render: (
        row: PriceListSetupModel
      ) => (
        <MyBadgeStatus
          contant={
            row.status
              ? formatEnumString(
                row.status
              )
              : 'Draft'
          }
          color={
            row.status === 'ACTIVE'
              ? '#415be7'
              : row.status === 'CANCELLED'
                ? '#d9534f'
                : '#b1acac'
          }
        />
      )
    },
    {
      key: "items",
      title: "",
      flexGrow: 1,
      render: (rowData: PriceListSetupModel) => itemsIcon(rowData),
    },
    
  ];

  const direction =
    localStorage.getItem("direction") || "LTR";

  const dir =
    direction === "RTL"
      ? "rtl"
      : "ltr";

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="View Price List"
      size="70vw"
      position="center"
      hideActionBtn
      content={
        <div dir={dir}>
          <MyTable
            data={tableData}
            totalCount={totalCount}
            columns={tableColumns}
            loading={isFetching}
            page={paginationParams.page}
            rowsPerPage={paginationParams.size}
            onPageChange={handlePageChange}
            onRowsPerPageChange={
              handleRowsPerPageChange
            }
          />

          <ViewPriceListItemsModal
            open={openItemsModal}
            setOpen={setOpenItemsModal}
            priceListSetupId={priceList?.id}
            priceListName={priceList?.name}
            priceListType={priceList?.type}
          />

        </div>
      }
    />
  );
};

export default ViewPriceListModal;