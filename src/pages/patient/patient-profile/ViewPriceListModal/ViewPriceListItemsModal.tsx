import React from "react";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";

import { useGetPriceListItemsByPriceListIdQuery } from "@/services/billing/PriceListItemService";
import { PriceListItem } from "@/types/model-types-new";
import { formatEnumString } from "@/utils";
import MyModal from "@/components/MyModal/MyModal";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  priceList?: any;
};

const ViewPriceListItemsModal = ({
  open,
  setOpen,
  priceList,
}: Props) => {
  const { data: itemsRes, isFetching } =
    useGetPriceListItemsByPriceListIdQuery(
      {
        priceListId: priceList?.id,
        page: 0,
        size: 100,
        sort: "id,asc",
      },
      {
        skip: !priceList?.id,
      }
    );

  const items = (itemsRes?.data ?? []).filter(
    (item: PriceListItem) => item?.isActive
  );

  const getItemName = (row: PriceListItem) => {
    if (row.itemType === "SERVICE") {
      return (
        row.serviceSetup?.name ??
        row.service?.name ??
        row.serviceId ??
        "-"
      );
    }

    if (row.itemType === "MEDICATION") {
      return row.brandMedication?.name ?? "-";
    }

    if (
      ["LABORATORY", "RADIOLOGY", "PATHOLOGY"].includes(
        row.itemType ?? ""
      )
    ) {
      return row.diagnosticTest?.name ?? "-";
    }

    if (row.itemType === "PROCEDURE") {
      return row.procedure?.name ?? "-";
    }

    return "-";
  };

  const columns = [
    {
      key: "itemType",
      title: <Translate>Item Type</Translate>,
      flexGrow: 2,
      render: (row: PriceListItem) => (
        <span>{formatEnumString(row.itemType)}</span>
      ),
    },
    {
      key: "item",
      title: <Translate>Item</Translate>,
      flexGrow: 4,
      render: (row: PriceListItem) => (
        <span>{getItemName(row)}</span>
      ),
    },
    {
      key: "price",
      title: <Translate>Price</Translate>,
      flexGrow: 2,
    },
    {
      key: "discountAllowed",
      title: <Translate>Discount Allowed</Translate>,
      flexGrow: 2,
      render: (row: PriceListItem) => (
        <span>{row.discountAllowed ? "Yes" : "No"}</span>
      ),
    },
  ];

  const direction = localStorage.getItem("direction") || "LTR";
  const dir = direction === "RTL" ? "rtl" : "ltr";

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={`${priceList?.name ?? ""} Items`}
      size="70vw"
      position="center"
      hideActionBtn
      content={
        <div dir={dir}>
          <MyTable
            height={500}
            data={items}
            columns={columns}
            loading={isFetching}
          />
        </div>
      }
      steps={[
        {
          title: "Items",
          icon: <Translate>IT</Translate>,
        },
      ]}
    />
  );
};

export default ViewPriceListItemsModal;