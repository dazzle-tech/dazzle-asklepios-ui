// ===================== IMPORTS =====================
import React, { useEffect, useState } from "react";
import "./styles.less";
import { Panel, Form } from "rsuite";
import { useAppDispatch } from "@/hooks";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import { notify, showSystemLoader, hideSystemLoader } from "@/utils/uiReducerActions";
import { useGetDepartmentsQuery } from "@/services/security/departmentService";

// UI Components
import MyTable from "@/components/MyTable";
import MyInput from "@/components/MyInput";
import MyButton from "@/components/MyButton/MyButton";
import AddOutlineIcon from "@rsuite/icons/AddOutline";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";

import {
  useGetWarehousesQuery,
  useAddWarehouseMutation,
  useUpdateWarehouseMutation,
  useToggleWarehouseIsActiveMutation,
  useSearchWarehousesQuery,
} from "@/services/inventory/inventory-warehouse/warehouseService";

import { newWarehouse } from "@/types/model-types-constructor-new";
import { Warehouse } from "@/types/model-types-new";

import { MdModeEdit, MdDelete } from "react-icons/md";
import { FaUser, FaClock } from "react-icons/fa6";
import { FaUndo } from "react-icons/fa";

import AddEditWarehouse from "./AddEditWarehouse";
import Users from "./Users";
import WorkingHours from "./WorkingHours";
import ProductList from "./ProductList";

const WarehouseSetup = () => {
  const dispatch = useAppDispatch();

  const [warehouse, setWarehouse] = useState<Warehouse>({ ...newWarehouse });
  const [popupOpen, setPopupOpen] = useState(false);
  const [openUsers, setOpenUsers] = useState(false);
  const [openWorkingHours, setOpenWorkingHours] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [actionType, setActionType] = useState("deactivate");

  const [recordOfFilter, setRecordOfFilter] = useState({ filter: "", value: "" });
  const [isFiltered, setIsFiltered] = useState(false);

  const [filterParams, setFilterParams] = useState({
    page: 0,
    size: 15,
    sort: "id,asc",
    quickSearch: "",
  });

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: "id,asc",
  });

  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState<"asc" | "desc">("asc");

  const isSearching = isFiltered && filterParams.quickSearch !== "";

  const {
    data,
    isFetching,
    refetch,
  } = isSearching
      ? useSearchWarehousesQuery(filterParams)
      : useGetWarehousesQuery(paginationParams);

  const [addWarehouse] = useAddWarehouseMutation();
  const [updateWarehouse] = useUpdateWarehouseMutation();
  const [toggleWarehouseActive] = useToggleWarehouseIsActiveMutation();

  // =============== PAGE HEADER SETUP ===============
  useEffect(() => {
    dispatch(setPageCode("Warehouse"));
    dispatch(setDivContent("Warehouse Setup"));

    return () => {
      dispatch(setPageCode(""));
      dispatch(setDivContent(""));
    };
  }, [dispatch]);

  // =============== SELECT ROW CLASS ===============
  const isSelected = (row: Warehouse) =>
    row.id === warehouse.id ? "selected-row" : "";

  const filterFields = [
    { label: "Warehouse Name", value: "name" },
    { label: "Code", value: "code" },
    { label: "Department", value: "department" },
  ];

  const handleSortChange = (column: string, type: "asc" | "desc") => {
    setSortColumn(column);
    setSortType(type);

    const sortValue = `${column},${type}`;

    if (isFiltered) {
      setFilterParams({ ...filterParams, sort: sortValue, page: 0 });
    } else {
      setPaginationParams({ ...paginationParams, sort: sortValue, page: 0 });
    }
  };



  const handlePageChange = (event, newPage) => {
    if (isFiltered) {
      setFilterParams({ ...filterParams, page: newPage });
    } else {
      setPaginationParams({ ...paginationParams, page: newPage });
    }
  };

  const handleSave = async () => {
    try {
      dispatch(showSystemLoader());

      const payload = {
        name: warehouse.name,
        code: warehouse.code,
        capacity: warehouse.capacity,
        isDefault: warehouse.isDefault ?? false,
        closeWarehouse: warehouse.closeWarehouse ?? false,
        isActive: warehouse.isActive ?? true,
        facilityId: warehouse.facilityId,
        departmentId: warehouse.departmentId,
      };

      if (warehouse.id) {
        await updateWarehouse({ id: warehouse.id, ...payload }).unwrap();

        dispatch(notify({ msg: "Warehouse updated successfully", sev: "success" }));
      } else {
        await addWarehouse(payload).unwrap();
        dispatch(notify({ msg: "Warehouse created successfully", sev: "success" }));
      }

      setPopupOpen(false);
      refetch();

    } catch (err) {
      console.log("Save Warehouse Error:", err);
      dispatch(notify({ msg: "Failed to save warehouse", sev: "error" }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleToggleWarehouse = async () => {
    try {
      dispatch(showSystemLoader());

      await toggleWarehouseActive(warehouse.id).unwrap();

      dispatch(
        notify({
          msg:
            actionType === "deactivate"
              ? "Warehouse deactivated successfully"
              : "Warehouse activated successfully",
          sev: "success",
        })
      );

      setOpenConfirmModal(false);
      refetch();

    } catch {
      dispatch(notify({ msg: "Failed to update status", sev: "error" }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const iconsForActions = (row: Warehouse) => (
    <div className="container-of-icons">

      <MdModeEdit
        className="icons"
        title="Edit"
        size={20}
        fill="var(--primary-gray)"
        onClick={() => {
          setWarehouse(row);
          setPopupOpen(true);
        }}
      />

      <FaClock
        className="icons"
        title="Working Hours"
        fill="var(--primary-gray)"
        size={20}
        onClick={() => {
          setWarehouse(row);
          setOpenWorkingHours(true);
        }}
      />

      <FaUser
        className="icons"
        title="Allowed Users"
        fill="var(--primary-gray)"
        size={20}
        onClick={() => {
          setWarehouse(row);
          setOpenUsers(true);
        }}
      />

      {row.isActive ? (
        <MdDelete
          className="icons"
          title="Deactivate"
          size={20}
          fill="var(--primary-pink)"
          onClick={() => {
            setActionType("deactivate");
            setWarehouse(row);
            setOpenConfirmModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons"
          title="Activate"
          fill="var(--primary-gray)"
          size={20}
          onClick={() => {
            setActionType("reactivate");
            setWarehouse(row);
            setOpenConfirmModal(true);
          }}
        />
      )}
    </div>
  );

  const { data: departmentsResponse } = useGetDepartmentsQuery({
    page: 0,
    size: 200,
    sort: "id,asc",
  });
  const departments = departmentsResponse?.data ?? [];

  const getDepartmentName = (id: number) => {
    const dept = departments.find(d => d.id === id);
    return dept?.name ?? "—";
  };



  const tableColumns = [
    {
      key: "departmentId",
      title: "Department",
      flexGrow: 4,
      render: (row) => getDepartmentName(row.departmentId),
    },

    {
      key: "name",
      title: "Warehouse Name",
      flexGrow: 4,
      render: (row) => row.name,
    },
    {
      key: "id",
      title: "Code",
      flexGrow: 3,
    },
    {
      key: "isDefault",
      title: "Default",
      flexGrow: 2,
      render: (row) => (row.isDefault ? "Yes" : "No"),
    },
    {
      key: "isActive",
      title: "Status",
      flexGrow: 3,
      render: (row) => (row.isActive ? "Active" : "Inactive"),
    },
    {
      key: "icons",
      title: "",
      flexGrow: 3,
      render: (rowData) => iconsForActions(rowData),
    },
  ];

  const filters = () => (
    <Form layout="inline" fluid className="filter-container">

      <MyInput
        fieldType="select"
        fieldName="filter"
        selectData={filterFields}
        selectDataLabel="label"
        selectDataValue="value"
        record={recordOfFilter}
        setRecord={(rec) =>
          setRecordOfFilter({ ...recordOfFilter, filter: rec.filter })
        }
        placeholder="Select Filter"
        showLabel={false}
      />


      <MyInput
        fieldType="text"
        fieldName="value"
        placeholder="Search"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
      />

    </Form>
  );

  useEffect(() => {
    const { filter, value } = recordOfFilter;

    if (!filter || !value) {
      setIsFiltered(false);
      setFilterParams((prev) => ({ ...prev, quickSearch: "" }));
      return;
    }

    setIsFiltered(true);

    let searchValue = value;

    if (filter === "department") {
      const dept = departments.find((d) =>
        d.name.toLowerCase().includes(value.toLowerCase())
      );
      searchValue = dept?.name ?? value;
    }

    setFilterParams((prev) => ({
      ...prev,
      page: 0,
      quickSearch: searchValue,
    }));
  }, [recordOfFilter, departments]);


  return (
    <Panel>
      <MyTable
        data={data?.data ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(row) => setWarehouse(row)}
        filters={filters()}
        totalCount={data?.totalCount ?? 0}
        page={isFiltered ? filterParams.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterParams.size : paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={(e) => {
          const size = Number(e.target.value);

          if (isFiltered) {
            setFilterParams({ ...filterParams, size, page: 0 });
          } else {
            setPaginationParams({ ...paginationParams, size, page: 0 });
          }
        }}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              width="120px"
              onClick={() => {
                setWarehouse({ ...newWarehouse });
                setPopupOpen(true);
              }}
            >
              Add New
            </MyButton>
          </div>
        }
      />

      <AddEditWarehouse
        open={popupOpen}
        setOpen={setPopupOpen}
        warehouse={warehouse}
        setWarehouse={setWarehouse}
        handleSave={handleSave}
      />

      <Users
        open={openUsers}
        setOpen={setOpenUsers}
        warehouse={warehouse}
      />

      <WorkingHours
        open={openWorkingHours}
        setOpen={setOpenWorkingHours}
        warehouse={warehouse}
        setWarehouse={setWarehouse}
        refetch={refetch}
      />


      {warehouse?.id && (
        <div style={{ marginTop: "20px" }}>
          <ProductList warehouse={warehouse} />
        </div>
      )}

      <DeletionConfirmationModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        itemToDelete="Warehouse"
        actionButtonFunction={handleToggleWarehouse}
        actionType={actionType}
      />
    </Panel>
  );
};

export default WarehouseSetup;
