import React, { useState } from "react";
import ChildModal from "@/components/ChildModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";

import { useAppSelector } from "@/hooks";
import { useGetActiveFacilitiesQuery } from "@/services/security/facilityService";
import { useGetAllPriceListsQuery } from "@/services/billing/PriceListService";

import { newPriceList } from "@/types/model-types-constructor-new";
import { PriceList } from "@/types/model-types-new";
import { conjureValueBasedOnIDFromList, formatEnumString } from "@/utils";

import { Tooltip, Whisper } from "rsuite";
import { MdRule, MdPlaylistAdd } from "react-icons/md";

import ViewPriceListAttributes from "./ViewPriceListAttributes";
import ViewPriceListItemsModal from "./ViewPriceListItemsModal";
import MyModal from "@/components/MyModal/MyModal";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const ViewPriceListModal = ({ open, setOpen }: Props) => {
  const authSlice = useAppSelector((state) => state.auth);

  const loggedInFacilityId =
    authSlice?.selectedDepartment?.facilityId ??
    authSlice?.tenant?.selectedFacility?.id ??
    authSlice?.selectedFacility?.id;

  const [priceList, setPriceList] = useState<PriceList>({
    ...newPriceList,
  });

  const [openItemsModal, setOpenItemsModal] = useState(false);
  const [openAttributesModal, setOpenAttributesModal] = useState(false);

  const { data: allFacilities = [] } =
    useGetActiveFacilitiesQuery(null);

  const { data: priceListResponse, isFetching } =
    useGetAllPriceListsQuery(
      {
        page: 0,
        size: 1000,
        sort: "id,asc",
      },
      {
        skip: !open,
      }
    );

  const priceLists = (priceListResponse?.data ?? []).filter(
    (item: PriceList) =>
      Number(item?.facilityId) === Number(loggedInFacilityId) &&
      item?.isActive
  );

  const itemsIcon = (rowData: PriceList) => (
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

      <Whisper
        trigger="hover"
        placement="top"
        speaker={<Tooltip>Attributes</Tooltip>}
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
            setOpenAttributesModal(true);
          }}
        >
          <MdRule size={22} />
        </span>
      </Whisper>
    </div>
  );

  const tableColumns = [
    {
      key: "facilityId",
      title: <Translate>Facility</Translate>,
      flexGrow: 3,
      render: (rowData: PriceList) =>
        conjureValueBasedOnIDFromList(
          allFacilities,
          rowData?.facilityId,
          "name"
        ),
    },
    {
      key: "name",
      title: <Translate>Name</Translate>,
      flexGrow: 4,
    },
    {
      key: "type",
      title: <Translate>Type</Translate>,
      flexGrow: 3,
      render: (rowData: PriceList) => (
        <span>{formatEnumString(rowData.type)}</span>
      ),
    },
    {
      key: "effectiveFrom",
      title: <Translate>Effective From</Translate>,
      flexGrow: 3,
    },
    {
      key: "effectiveTo",
      title: <Translate>Effective To</Translate>,
      flexGrow: 3,
      render: (rowData: PriceList) => (
        <span>{rowData.effectiveTo ?? "-"}</span>
      ),
    },
    {
      key: "items",
      title: "",
      flexGrow: 1,
      render: (rowData: PriceList) => itemsIcon(rowData),
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
            data={priceLists}
            columns={tableColumns}
            loading={isFetching}
          />

          <ViewPriceListItemsModal
            open={openItemsModal}
            setOpen={setOpenItemsModal}
            priceList={priceList}
          />

          <ViewPriceListAttributes
            open={openAttributesModal}
            setOpen={setOpenAttributesModal}
            priceList={priceList}
          />
        </div>
      }
    />
  );
};

export default ViewPriceListModal;