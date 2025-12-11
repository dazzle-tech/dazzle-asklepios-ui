import React, { useEffect, useState } from "react";
import { Panel, Form } from "rsuite";
import MyTable from "@/components/MyTable";
import MyInput from "@/components/MyInput";
import { useAppDispatch } from "@/hooks";
import "./styles.less";
import { notify } from "@/utils/uiReducerActions";
import {
  useGetWarehouseProductDetailsByWarehouseProductQuery,
  useToggleWarehouseProductDetailsIsActiveMutation,
} from "@/services/inventory/inventory-warehouse/warehouseProductDetailsService";
import { MdDelete } from "react-icons/md";
import { FaUndo } from "react-icons/fa";

const ProductDetails = ({
  open,
  setOpen,
  warehouseProduct,
  refetch
}) => {
  const dispatch = useAppDispatch();

  const [selectedRow, setSelectedRow] = useState(null);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: "id,asc",
  });

  const sortColumn = paginationParams.sort.split(",")[0];
  const sortType = paginationParams.sort.split(",")[1] as "asc" | "desc";

  const {
    data,
    isFetching,
    refetch: refetchDetails
  } = useGetWarehouseProductDetailsByWarehouseProductQuery(
    {
      warehouseProductId: warehouseProduct?.id,
      ...paginationParams,
    },
    { skip: !warehouseProduct?.id }
  );

  const tableData = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;

  const [toggleActive] = useToggleWarehouseProductDetailsIsActiveMutation();

  const isSelected = (row) =>
    row?.id === selectedRow?.id ? "selected-row" : "";

  const handleToggle = async (row) => {
    try {
      await toggleActive(row.id).unwrap();
      dispatch(notify({ msg: "Updated!", sev: "success" }));
      refetchDetails();
      refetch();
    } catch {
      dispatch(notify({ msg: "Failed to update", sev: "error" }));
    }
  };

  const columns = [
    {
      key: "lotSerialNum",
      title: "Lot / Serial Number",
      flexGrow: 3,
      render: (row) => row.lotSerialNum
    },
    {
      key: "quantity",
      title: "Qty",
      flexGrow: 2,
      render: (row) => row.quantity
    },
    {
      key: "expiryDate",
      title: "Expiry Date",
      flexGrow: 2,
      render: (row) => row.expiryDate
    },
    {
      key: "isActive",
      title: "Status",
      flexGrow: 2,
      render: (row) => (row.isActive ? "Active" : "Inactive")
    }
  ];

  const handlePageChange = (e, newPage) => {
    setPaginationParams((prev) => ({
      ...prev,
      page: newPage
    }));
  };

  const handleRowsPerPageChange = (e) => {
    const newSize = Number(e.target.value);
    setPaginationParams((prev) => ({
      ...prev,
      size: newSize,
      page: 0
    }));
  };

  const handleSortChange = (col, type) => {
    setPaginationParams((prev) => ({
      ...prev,
      sort: `${col},${type}`,
      page: 0
    }));
  };

  return (
    <Panel header="Product Details">
      <MyTable
        height={450}
        data={tableData}
        columns={columns}
        loading={isFetching}
        rowClassName={isSelected}
        onRowClick={(row) => setSelectedRow(row)}

        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        totalCount={totalCount}

        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}

        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
      />
    </Panel>
  );
};

export default ProductDetails;
