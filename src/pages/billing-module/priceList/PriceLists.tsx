import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import { useEnumOptions } from "@/services/enumsApi";
import { useGetAllFacilitiesQuery } from "@/services/security/facilityService";
import {
  useGetAllPriceListsQuery,
  useLazyGetPriceListsByNameQuery,
  useLazyGetPriceListsByTypeQuery,
  useLazyGetPriceListsByTypeAndNameQuery,
  useTogglePriceListActiveMutation
} from "@/services/billing/PriceListService";
import { newPriceList} from "@/types/model-types-constructor-new";
import { conjureValueBasedOnIDFromList, formatEnumString } from "@/utils";
import { PaginationPerPage } from "@/utils/paginationPerPage";
import { notify } from "@/utils/uiReducerActions";
import AddOutlineIcon from "@rsuite/icons/AddOutline";
import React, { useEffect, useState } from "react";
import { FaUndo } from "react-icons/fa";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { useDispatch } from "react-redux";
import { Form, Panel } from "rsuite";
import "./styles.less";
import { PriceList } from "@/types/model-types-new";
import AddEditPriceList from "./AddEditPriceList";

const PriceLists = () => {
  const dispatch = useDispatch();

  // ───────────── STATE ─────────────
  const [priceList, setPriceList] = useState<PriceList>({ ...newPriceList });
  const [width, setWidth] = useState<number>(window.innerWidth);

  const [openAddEdit, setOpenAddEdit] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [stateOfDeleteModal, setStateOfDeleteModal] = useState("deactivate");

  const [recordOfFilter, setRecordOfFilter] = useState({ filter: "", value: "" });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<PriceList[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: "id,asc",
    timestamp: Date.now()
  });

  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 5,
    sort: "id,asc"
  });

  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState<"asc" | "desc">("asc");
  const [link, setLink] = useState({});

  // ───────────── DATA ─────────────
  const { data: priceListResponse, isFetching } =
    useGetAllPriceListsQuery(paginationParams);

  const [toggleActive] = useTogglePriceListActiveMutation();

  const [getByName] = useLazyGetPriceListsByNameQuery();
  const [getByType] = useLazyGetPriceListsByTypeQuery();
  const [getByTypeAndName] = useLazyGetPriceListsByTypeAndNameQuery();
 
  const { data: allFacilities = [] } = useGetAllFacilitiesQuery(null);
  const priceListTypes = useEnumOptions("PriceListTypes");

  const totalCount = priceListResponse?.totalCount ?? 0;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  // ───────────── EFFECTS ─────────────
  useEffect(() => {
    dispatch(setPageCode("PriceLists"));
    dispatch(setDivContent("Price Lists"));
    return () => {
      dispatch(setPageCode(""));
      dispatch(setDivContent(""));
    };
  }, [dispatch]);

  useEffect(() => setLink(priceListResponse?.links), [priceListResponse?.links]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ───────────── FILTER LOGIC ─────────────
  const filterFields = [
    { label: "Type", value: "type" },
    { label: "Facility", value: "facility" },
    { label: "Name", value: "name" }
  ];

  const handleFilterChange = async (field: string, value: string, page = 0, size?: number) => {
    try {
      if (!field || !value) {
        setIsFiltered(false);
        setFilteredList([]);
        return;
      }

      const currentSize = size ?? filterPagination.size;
      const params = { page, size: currentSize, sort: filterPagination.sort };

      let response: any;

      if (field === "type") {
        response = await getByType({ type: value, ...params }).unwrap();
      } else if (field === "name") {
        response = await getByName({ name: value, ...params }).unwrap();
      } else if (field === "facility") {
        dispatch(notify({ msg: "Filter by Facility not implemented on backend yet", sev: "warnning" }));
        return;
      }

      setFilteredList(response.data ?? []);
      setFilteredTotal(response.totalCount ?? 0);
      setLink(response.links);
      setIsFiltered(true);
      setFilterPagination({ ...filterPagination, page, size: currentSize });
    } catch (error) {
      dispatch(notify({ msg: "Failed to filter price lists", sev: "error" }));
      setIsFiltered(false);
    }
  };

  // ───────────── SORT LOGIC ─────────────
  const handleSortChange = (sortCol: string, sortT: "asc" | "desc") => {
    setSortColumn(sortCol);
    setSortType(sortT);

    const sortValue = `${sortCol},${sortT}`;

    if (isFiltered) {
      setFilterPagination({ ...filterPagination, sort: sortValue, page: 0 });
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, filterPagination.size);
    } else {
      setPaginationParams({ ...paginationParams, sort: sortValue, page: 0, timestamp: Date.now() });
    }
  };

  // ───────────── TOGGLE ACTIVE ─────────────
  const handleToggleActive = async (id?: number) => {
    if (!id) return;
    try {
      await toggleActive(id).unwrap();
      dispatch(notify({ msg: "Status updated successfully", sev: "success" }));
      setPaginationParams({ ...paginationParams, timestamp: Date.now() });
    } catch {
      dispatch(notify({ msg: "Failed to update status", sev: "error" }));
    }
  };

  const handleDeactivateReactivate = () => {
    handleToggleActive(priceList.id);
    setOpenConfirmModal(false);
  };

  // ───────────── TABLE ─────────────
  const isSelected = (rowData: PriceList) =>
    rowData?.id === priceList?.id ? "selected-row" : "";

  const iconsForActions = (rowData: PriceList) => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setPriceList(rowData);
          setOpenAddEdit(true);
        }}
      />
      {rowData?.isActive ? (
        <MdDelete
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          className="icons-style"
          onClick={() => {
            setPriceList(rowData);
            setStateOfDeleteModal("deactivate");
            setOpenConfirmModal(true);
          }}
        />
      ) : (
        <FaUndo
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          className="icons-style"
          onClick={() => {
            setPriceList(rowData);
            setStateOfDeleteModal("reactivate");
            setOpenConfirmModal(true);
          }}
        />
      )}
    </div>
  );

  const tableColumns = [
    {
      key: "facilityId",
      title: <Translate>Facility</Translate>,
      flexGrow: 3,
      render: (rowData: any) =>
        rowData?.facilityId
          ? conjureValueBasedOnIDFromList(
              allFacilities,
              rowData?.facilityId,
                "name"
            )
          : <p>Global</p>
    },
    { key: "name", title: <Translate>Name</Translate>, flexGrow: 4 },
    {
      key: "type",
      title: <Translate>Type</Translate>,
      flexGrow: 3,
      render: (rowData: PriceList) => <p>{formatEnumString(rowData.type)}</p>
    },
    {
      key: "effectiveFrom",
      title: <Translate>Effective From</Translate>,
      flexGrow: 3
    },
    {
      key: "effectiveTo",
      title: <Translate>Effective To</Translate>,
      flexGrow: 3,
      render: (rowData: PriceList) => <p>{rowData.effectiveTo ?? "-"}</p>
    },
    {
      key: "isActive",
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (rowData: PriceList) => (
        <p>{rowData.isActive ? "Active" : "Inactive"}</p>
      )
    },
    {
      key: "icons",
      title: "",
      flexGrow: 2,
      render: (rowData: PriceList) => iconsForActions(rowData)
    }
  ];

  // ───────────── PAGINATION ─────────────
  const handlePageChange = (event, newPage) => {
    if (isFiltered) {
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, newPage);
    } else {
      PaginationPerPage.handlePageChange(
        event,
        newPage,
        paginationParams,
        link,
        setPaginationParams
      );
    }
  };

  // ───────────── FILTER UI ─────────────
  const filters = () => (
    <Form layout="inline" style={{ display: "flex", gap: "10px" }}>
      <MyInput
        fieldName="filter"
        fieldType="select"
        selectData={filterFields}
        selectDataLabel="label"
        selectDataValue="value"
        record={recordOfFilter}
        setRecord={(u) => setRecordOfFilter({ filter: u.filter, value: "" })}
        placeholder="Select Filter"
        showLabel={false}
        width="180px"
      />

      {recordOfFilter.filter === "type" && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={priceListTypes ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={(u) => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
          placeholder="Select Type"
        />
      )}

      {recordOfFilter.filter === "facility" && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={allFacilities ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={recordOfFilter}
          setRecord={(u) => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
          placeholder="Select Facility"
        />
      )}

      {recordOfFilter.filter === "name" && (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Enter Name"
        />
      )}

      <MyButton
        color="var(--deep-blue)"
        width="80px"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
      >
        Search
      </MyButton>
    </Form>
  );

  return (
    <Panel>
      <MyTable
        data={isFiltered ? filteredList : priceListResponse?.data ?? []}
        totalCount={isFiltered ? filteredTotal : totalCount}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData) => setPriceList(rowData)}
        filters={filters()}
        loading={isFetching}
        page={isFiltered ? filterPagination.page : pageIndex}
        rowsPerPage={isFiltered ? filterPagination.size : rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={(e) => {
          const newSize = Number(e.target.value);
          if (isFiltered) {
            setFilterPagination({ ...filterPagination, size: newSize, page: 0 });
            handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
          } else {
            setPaginationParams({
              ...paginationParams,
              size: newSize,
              page: 0,
              timestamp: Date.now()
            });
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
              onClick={() => {
                setPriceList({ ...newPriceList });
                setOpenAddEdit(true);
              }}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
        }
      />

      <AddEditPriceList
        open={openAddEdit}
        setOpen={setOpenAddEdit}
        priceList={priceList}
        setPriceList={setPriceList}
        width={width}
        onSaved={() => setPaginationParams({ ...paginationParams, timestamp: Date.now() })}
      />

      <DeletionConfirmationModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        itemToDelete="Price List"
        actionButtonFunction={handleDeactivateReactivate}
        actionType={stateOfDeleteModal}
      />
    </Panel>
  );
};

export default PriceLists;
