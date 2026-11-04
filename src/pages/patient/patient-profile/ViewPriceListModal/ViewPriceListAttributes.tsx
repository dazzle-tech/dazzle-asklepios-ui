import React, { useState } from "react";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";

import { useGetPriceListAttributesByPriceListQuery } from "@/services/billing/PriceListAttributesService";

import { PriceList } from "@/types/model-types-new";
import { PaginationPerPage } from "@/utils/paginationPerPage";
import { formatEnumString } from "@/utils";

const ViewPriceListAttributes = ({
  open,
  setOpen,
  priceList,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  priceList: PriceList | null;
}) => {
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 10,
    sort: "id,asc",
    timestamp: Date.now(),
  });

  const { data: attrsPage } =
    useGetPriceListAttributesByPriceListQuery(
      {
        priceListId: priceList?.id as number,
        ...paginationParams,
      },
      {
        skip: !priceList?.id,
      }
    );

  const attributesList = (attrsPage?.data ?? []).filter(
    (item: any) => item?.isActive
  );

  const totalCount = attributesList.length;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;
  const link = attrsPage?.links;

  const handlePageChange = (event: any, newPage: number) => {
    PaginationPerPage.handlePageChange(
      event,
      newPage,
      paginationParams,
      link,
      setPaginationParams
    );
  };

  const tableColumns = [
    {
      key: "attributeType",
      title: <Translate>Type</Translate>,
      flexGrow: 2,
      render: (rowData: any) => (
        <span>{formatEnumString(rowData.attributeType)}</span>
      ),
    },
    {
      key: "attribute",
      title: <Translate>Attribute</Translate>,
      flexGrow: 3,
      render: (rowData: any) => (
        <span>{formatEnumString(rowData.attribute)}</span>
      ),
    },
    {
      key: "price",
      title: <Translate>Price</Translate>,
      flexGrow: 2,
    },
  ];

  const direction = localStorage.getItem("direction") || "LTR";
  const dir = direction === "RTL" ? "rtl" : "ltr";

  return (
    <MyModal
      title="Price List Attributes"
      open={open}
      setOpen={setOpen}
      hideActionBtn
      size="70vw"
      position="center"
      content={
        <div dir={dir}>
          <MyTable
            height={450}
            data={attributesList}
            columns={tableColumns}
            totalCount={totalCount}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={(e) => {
              const newSize = Number(e.target.value);

              setPaginationParams({
                ...paginationParams,
                size: newSize,
                page: 0,
                timestamp: Date.now(),
              });
            }}
          />
        </div>
      }
    />
  );
};

export default ViewPriceListAttributes;