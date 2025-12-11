import React, { useState, useEffect } from "react";
import MyTable from "@/components/MyTable";
import MyButton from "@/components/MyButton/MyButton";
import AddOutlineIcon from "@rsuite/icons/AddOutline";

import {
  useGetWarehouseProductsByWarehouseQuery,
  useToggleWarehouseProductIsActiveMutation
} from "@/services/inventory/inventory-warehouse/warehouseProductService";

import { newWarehouseProduct } from "@/types/model-types-constructor-new";
import AddEditWarehouseProduct from "./AddEditWarehouseProduct";
import ProductDetails from "./ProductDetails";
import { useGetInventoryProductsQuery } from "@/services/inventory/inventory-products/inventoryProductsService";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { FaUndo } from "react-icons/fa";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";

const ProductList = ({ warehouse }) => {

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: "id,asc",
  });

  const sortColumn = paginationParams.sort.split(",")[0];
  const sortType = paginationParams.sort.split(",")[1] as "asc" | "desc";

  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [actionType, setActionType] = useState("deactivate");


  const { data, isFetching, refetch } =
    useGetWarehouseProductsByWarehouseQuery({
      warehouseId: warehouse.id,
      ...paginationParams,
    });

  const { data: inventoryProducts } = useGetInventoryProductsQuery({
    page: 0,
    size: 500,
    sort: "id,asc",
  });

  const [toggleActive] = useToggleWarehouseProductIsActiveMutation();

  const [warehouseProduct, setWarehouseProduct] = useState({ ...newWarehouseProduct });
  const [openAddEdit, setOpenAddEdit] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);

  useEffect(() => {
    if (warehouse?.id) refetch();
  }, [warehouse?.id]);

  const handleEdit = (row) => {
    setSelectedRowId(row.id);
    setWarehouseProduct({ ...newWarehouseProduct, ...row });
    setOpenAddEdit(true);
  };

  const handleAdd = () => {
    setWarehouseProduct({
      ...newWarehouseProduct,
      warehouseId: warehouse.id,
      departmentId: warehouse.departmentId
    });
    setOpenAddEdit(true);
  };

  const handleToggleActiveConfirm = async () => {
    try {
      await toggleActive(warehouseProduct.id).unwrap();
      setOpenConfirmModal(false);
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };


  const handlePageChange = (e, newPage) => {
    setPaginationParams((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleRowsPerPageChange = (e) => {
    const newSize = Number(e.target.value);
    setPaginationParams((prev) => ({
      ...prev,
      size: newSize,
      page: 0,
    }));
  };

  const handleSortChange = (column: string, type: "asc" | "desc") => {
    setPaginationParams((prev) => ({
      ...prev,
      sort: `${column},${type}`,
      page: 0,
    }));
  };

  const columns = [
    {
      key: "productName",
      title: "Product Name",
      flexGrow: 3,
      render: (row) => row.productName ?? "—",
    },
    {
      key: "productType",
      title: "Product Type",
      flexGrow: 3,
      render: (row) => row.productTypeName ?? "—",
    },
    {
      key: "productCode",
      title: "Product Code",
      flexGrow: 2,
      render: (row) => row.productCode ?? "—",
    },
    {
      key: "uom",
      title: "Base UOM",
      flexGrow: 2,
      render: (row) => row.baseUom ?? "—",
    },
    {
      key: "quantity",
      title: "Qty",
      flexGrow: 2,
      render: (row) => row.quantity,
    },
    {
      key: "reOrderQuantity",
      title: "Re-Order Qty",
      flexGrow: 2,
      render: (row) => row.reOrderQuantity,
    },
    {
      key: "avgCost",
      title: "Avg Cost",
      flexGrow: 2,
      render: (row) => row.avgCost,
    },
    {
      key: "isActive",
      title: "Status",
      flexGrow: 2,
      render: (row) => (row.isActive ? "Active" : "Inactive"),
    },
    {
      key: "actions",
      title: "",
      flexGrow: 3,
      render: (row) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons"
            size={20}
            fill="var(--primary-gray)"
            title="Edit"
            onClick={() => handleEdit(row)}
          />

          {row.isActive ? (
            <MdDelete
              className="icons"
              size={20}
              fill="var(--primary-pink)"
              title="Deactivate"
              onClick={() => {
                setActionType("deactivate");
                setWarehouseProduct(row);
                setOpenConfirmModal(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons"
              size={20}
              fill="var(--primary-gray)"
              title="Activate"
              onClick={() => {
                setActionType("reactivate");
                setWarehouseProduct(row);
                setOpenConfirmModal(true);
              }}
            />
          )}

        </div>
      )
    }
  ];

  const enhancedData = (data?.data ?? []).map(row => {
    const product = inventoryProducts?.data?.find(p => p.Id === row.productId);
    if (!product) return row;

    return {
      ...row,
      productName: product.name,
      productTypeName: product.type,
      productCode: product.code,
      baseUom: product.baseUom,
      avgCost: product.itemAverageCost ?? row.avgCost
    };
  });

  return (
    <>

      <MyTable
        data={enhancedData}
        loading={isFetching}
        columns={columns}

        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        totalCount={data?.totalCount ?? 0}

        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}

        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}

        onRowClick={(row) => {
          setSelectedRowId(row.id);
          setWarehouseProduct(row);
          setOpenDetails(true);
        }}

        rowClassName={(row) =>
          row.id === selectedRowId ? "selected-row" : ""
        }

        tableButtons={
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={handleAdd}
          >
            Add Product
          </MyButton>
        }
      />

      {openAddEdit && (
        <AddEditWarehouseProduct
          open={openAddEdit}
          setOpen={setOpenAddEdit}
          warehouseProduct={warehouseProduct}
          setWarehouseProduct={setWarehouseProduct}
          refetch={refetch}
          warehouse={warehouse}
        />
      )}

      {openDetails && (
        <ProductDetails
          open={openDetails}
          setOpen={setOpenDetails}
          warehouseProduct={warehouseProduct}
          refetch={refetch}
        />
      )}

      <DeletionConfirmationModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        itemToDelete="Product"
        actionButtonFunction={handleToggleActiveConfirm}
        actionType={actionType}
      />
    </>
  );
};

export default ProductList;
