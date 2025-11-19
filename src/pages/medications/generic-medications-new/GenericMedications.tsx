import React, { useState, useEffect } from "react";
import { Panel, Form, Whisper, Tooltip } from "rsuite";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import { MdCheckCircle, MdCancel } from "react-icons/md";
import { BrandMedication } from "@/types/model-types-new";
import { newBrandMedication } from "@/types/model-types-constructor-new";

import {
  useCreateBrandMedicationMutation,
  useUpdateBrandMedicationMutation,
  useGetAllBrandMedicationsQuery,
  useToggleBrandMedicationActiveMutation,
  useLazyGetBrandMedicationsByNameQuery,
  useLazyGetBrandMedicationsByManufacturerQuery,
  useLazyGetBrandMedicationsByDosageFormQuery,
  useLazyGetBrandMedicationsByUsageInstructionsQuery,
  useLazyGetBrandMedicationsByRoaQuery,
  useLazyGetBrandMedicationsByExpiresAfterOpeningQuery,
  useLazyGetBrandMedicationsByUseSinglePatientQuery,
  useLazyGetBrandMedicationsByIsActiveQuery,
} from "@/services/setup/brandmedication/BrandMedicationService ";

import MyTable from "@/components/MyTable";
import MyInput from "@/components/MyInput";
import MyButton from "@/components/MyButton/MyButton";
import AddOutlineIcon from "@rsuite/icons/AddOutline";
import AddEditBrandMedication from "./AddEditBrandMedication";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import Translate from "@/components/Translate";
import { MdModeEdit, MdDelete } from "react-icons/md";
import { FaUndo } from "react-icons/fa";
import "./styles.less";
import { GiMedicines } from "react-icons/gi";
import AddActiveIngredient from "./AddActiveIngredient";
import { HiOutlineSwitchHorizontal } from "react-icons/hi";
import { conjureValueBasedOnKeyFromList, conjureValuesFromList } from "@/utils";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import AddBrandSubstitute from "./AddBrandSubstitute";
import { title } from "process";

const GenericMedications = () => {
  const dispatch = useAppDispatch();

  // ---------- State ----------
  const [brandMedication, setBrandMedication] = useState<BrandMedication>({
    ...newBrandMedication,
  });
 
  const [openActiveIngredientPopup, setOpenActiveIngredientPopup] = useState(false);
  const [openSubstitute, setOpenSubstitute] = useState(false)
  const [openAddEditPopup, setOpenAddEditPopup] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<"deactivate" | "reactivate">("deactivate");

  const [recordOfFilter, setRecordOfFilter] = useState({ filter: "", value: "" });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<BrandMedication[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);

   const isSelected = (rowData:BrandMedication) =>
      rowData?.id === brandMedication?.id ? "selected-row" : "";
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: "id,asc",
    timestamp: Date.now(),
  });

  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState<"asc" | "desc">("asc");

  // ---------- Queries ----------
  const { data: allMedications, isFetching,refetch } = useGetAllBrandMedicationsQuery(paginationParams);
  const totalCount = allMedications?.totalCount ?? 0;
  // Fetch Generic Medication Lov  list response
  const { data: brandMedicationLovQueryResponse } =
    useGetLovValuesByCodeQuery('GEN_MED_MANUFACTUR');
  // Fetch doseage Form Lov  list response
  const { data: doseageFormLovQueryResponse } = useGetLovValuesByCodeQuery('DOSAGE_FORMS');
  const { data: medRoutLovQueryResponse } = useGetLovValuesByCodeQuery('MED_ROA');
  const [addBrandMedication] = useCreateBrandMedicationMutation();
  const [updateBrandMedication] = useUpdateBrandMedicationMutation();
  const [toggleActive] = useToggleBrandMedicationActiveMutation();

  // Lazy filters
  const [getByName] = useLazyGetBrandMedicationsByNameQuery();
  const [getByManufacturer] = useLazyGetBrandMedicationsByManufacturerQuery();
  const [getByDosageForm] = useLazyGetBrandMedicationsByDosageFormQuery();
  const [getByUsageInstructions] = useLazyGetBrandMedicationsByUsageInstructionsQuery();
  const [getByRoa] = useLazyGetBrandMedicationsByRoaQuery();
  const [getByExpiresAfterOpening] = useLazyGetBrandMedicationsByExpiresAfterOpeningQuery();
  const [getByUseSinglePatient] = useLazyGetBrandMedicationsByUseSinglePatientQuery();
  const [getByIsActive] = useLazyGetBrandMedicationsByIsActiveQuery();

  // ---------- Effects ----------
  useEffect(() => {
    dispatch(setPageCode("Brand_Medications"));
    dispatch(setDivContent("Brand Medications List"));
    return () => {
      dispatch(setPageCode(""));
      dispatch(setDivContent(""));
    };
  }, [dispatch]);

  // ---------- Handlers ----------
  const handleSave = async () => {
    try {
      if (brandMedication.id) {
       
        await updateBrandMedication({
          ...brandMedication
        }).unwrap();

        dispatch(notify({ msg: "Updated successfully", sev: "success" }));
      } else {
         const { hasActiveIngredient, ...payload } = brandMedication;

    await addBrandMedication(payload).unwrap();
        dispatch(notify({ msg: "Added successfully", sev: "success" }));
      }
      setOpenAddEditPopup(false);
    } catch(error) {
      console.log(error)
      dispatch(notify({ msg: "Error saving medication", sev: "error" }));
    }
  };

  const handleToggleActive = async (id: number) => {
  
    try {
      await toggleActive(brandMedication?.id).unwrap();
      dispatch(notify({ msg: "Status toggled", sev: "success" }));
      setOpenConfirmModal(false)
      refetch();
    } catch {
      dispatch(notify({ msg: "Failed to toggle active", sev: "error" }));
      setOpenConfirmModal(false)
    }
  };

  const handleFilterChange = async (field: string, value: string) => {
    if (!field || value === undefined || value === null || value === "") {

      setIsFiltered(false);
      setFilteredList([]);
      return;
    }

    try {
      const params = { page: 0, size: 5, sort: "id,asc" };
      let response;

      switch (field) {
        case "name":
          response = await getByName({ name: value, ...params }).unwrap();
          break;
        case "manufacturer":
          response = await getByManufacturer({ manufacturer: value, ...params }).unwrap();
          break;
        case "dosageForm":
          response = await getByDosageForm({ dosageForm: value, ...params }).unwrap();
          break;
        case "usageInstructions":
          response = await getByUsageInstructions({ usageInstructions: value, ...params }).unwrap();
          break;
        case "roa":
          response = await getByRoa({ roa: value, ...params }).unwrap();
          break;
        case "expiresAfterOpening":
          response = await getByExpiresAfterOpening({
            expiresAfterOpening: normalizeBool(value),
            ...params,
          }).unwrap();
          break;

        case "useSinglePatient":
          response = await getByUseSinglePatient({
            useSinglePatient: normalizeBool(value),
            ...params,
          }).unwrap();
          break;

        case "isActive":
          response = await getByIsActive({
            isActive: normalizeBool(value),
            ...params,
          }).unwrap();
          break;

        default:
          return;
      }

      setFilteredList(response.data ?? []);
      setFilteredTotal(response.totalCount ?? 0);
      setIsFiltered(true);
    } catch {
      dispatch(notify({ msg: "Error filtering", sev: "error" }));
    }
  };

  const handleSortChange = (col: string, type: "asc" | "desc") => {
    setSortColumn(col);
    setSortType(type);
    const sort = `${col},${type}`;
    setPaginationParams({ ...paginationParams, sort, page: 0, timestamp: Date.now() });
  };

  // ---------- Render ----------
  const normalizeBool = (v: any) =>
    v === true || v === "true" ? true : false;

  const renderFilterValueInput = () => {
    switch (recordOfFilter.filter) {
      case "manufacturer":
        return (
          <MyInput
            fieldName="value"
            fieldType="select"
            selectData={brandMedicationLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={recordOfFilter}
            showLabel={false}
            setRecord={(u) => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
            placeholder="Select Manufacturer"
          />
        );

      case "dosageForm":
        return (
          <MyInput
            fieldName="value"
            fieldType="select"
            selectData={doseageFormLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={recordOfFilter}
            showLabel={false}
            setRecord={(u) => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
            placeholder="Select Dosage Form"
          />
        );

      case "roa":
        return (
          <MyInput
            fieldName="value"
            fieldType="select"
            selectData={medRoutLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={recordOfFilter}
            showLabel={false}
            setRecord={(u) => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
            placeholder="Select Roa"
          />
        );

      case "expiresAfterOpening":
        return <MyInput
          fieldName="value"
          fieldType="checkbox"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Search"
        />

      case "isActive":
        return <MyInput
          fieldName="value"
          fieldType="checkbox"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Search"
        />
      case "useSinglePatient":
        return <MyInput
          fieldName="value"
          fieldType="checkbox"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Search"
        />

      default:

        return (
          <MyInput
            fieldName="value"
            fieldType="text"
            record={recordOfFilter}
            setRecord={setRecordOfFilter}
            showLabel={false}
            placeholder="Search"
          />
        );
    }
  };

  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        fieldName="filter"
        fieldType="select"
        selectData={[
          { label: "Brand Name", value: "name" },
          { label: "Manufacturer", value: "manufacturer" },
          { label: "Dosage Form", value: "dosageForm" },
       
          { label: "ROA", value: "roa" },
          { label: "Expires After Opening", value: "expiresAfterOpening" },
          { label: "Single Patient Use", value: "useSinglePatient" },
          { label: "Active", value: "isActive" },
        ]}
        selectDataLabel="label"
        selectDataValue="value"
        record={recordOfFilter}
        setRecord={(r) => setRecordOfFilter({ ...recordOfFilter, filter: r.filter, value: "" })}
        showLabel={false}
        placeholder="Select Filter"
      />

      {renderFilterValueInput()}
      <MyButton
        color="var(--deep-blue)"
        width="80px"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
      >
        Search
      </MyButton>
    </Form>
  );

  const iconsForActions = (row: BrandMedication) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={22}
        onClick={() => {
          setBrandMedication(row);
          setOpenAddEditPopup(true);
        }}
      />
       {row.isActive ? (
              <MdDelete
                title="Deactivate"
                size={24}
                fill="var(--primary-pink)"
                className="icons-style"
                onClick={() => {
                  setBrandMedication(row);
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
                  setBrandMedication(row);
                 setOpenConfirmModal(true);
                }}
              />
            )}
   
      <Whisper placement="top" speaker={<Tooltip><Translate>Active Ingredient</Translate></Tooltip>}>
        <GiMedicines
          className="icons-style"
          title="Active Ingredient"
          size={22}
          onClick={() =>{
            setBrandMedication(row);
             setOpenActiveIngredientPopup(true)}}
        />
      </Whisper>
  { row.hasActiveIngredient&&
      <Whisper placement="top" speaker={<Tooltip><Translate>Substitute</Translate></Tooltip>}>
        <HiOutlineSwitchHorizontal
          className="icons-style"
          title="Substitute"
          size={22}
          onClick={() =>{
            setBrandMedication(row);
             setOpenSubstitute(true)}}
        />
      </Whisper>}
    </div>
  );

  const columns = [
    { key: "name", title: <Translate>Brand Name</Translate>, flexGrow: 4 },

    {
      key: "manufacturer", title: <Translate>Manufacturer</Translate>, flexGrow: 4,
      render: (rowData) => conjureValueBasedOnKeyFromList(
        brandMedicationLovQueryResponse?.object,
        rowData?.manufacturer,
        "lovDisplayVale"
      )
    },
    {
      key: "dosageForm", title: <Translate>Dosage Form</Translate>, flexGrow: 4,
      render: (rowData) => conjureValueBasedOnKeyFromList(
        doseageFormLovQueryResponse?.object,
        rowData?.dosageForm,
        "lovDisplayVale"
      )
    },

    {
      key: "roa", title: <Translate>ROA</Translate>, flexGrow: 3,
      render: (rowData) => conjureValuesFromList(
        medRoutLovQueryResponse?.object,
        rowData.roa,
        "lovDisplayVale")
    },
    { key: "isActive", title: <Translate>Status</Translate>, flexGrow: 2, render: (r: BrandMedication) => (r.isActive ? "Active" : "Inactive") },
    { key: "actions", title: "", flexGrow: 2, render: iconsForActions },
   

{
  key: "hasActiveIngredient",
  title: "Active Ingredient",
  render: (row) =>
    row.hasActiveIngredient &&(
      <MdCheckCircle size={22} color="var(--success)" />
    ) 
}

     
  ];

  return (
    <Panel>
      <MyTable
        height={500}
        data={isFiltered ? filteredList : allMedications?.data ?? []}
        totalCount={isFiltered ? filteredTotal : totalCount}
        loading={isFetching}
        columns={columns}
        filters={filters()}
        rowClassName={isSelected}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={(_, p) => setPaginationParams({ ...paginationParams, page: p })}
        onRowsPerPageChange={(e) =>
          setPaginationParams({ ...paginationParams, size: Number(e.target.value), page: 0 })
        }
        tableButtons={
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={() => {
              setBrandMedication({ ...newBrandMedication });
              setOpenAddEditPopup(true);
            }}
            width="109px"
          >
            Add New
          </MyButton>
        }
      />

      <AddEditBrandMedication
        open={openAddEditPopup}
        setOpen={setOpenAddEditPopup}
        brandMedication={brandMedication}
        setBrandMedication={setBrandMedication}
        handleSave={handleSave}
      />

      <DeletionConfirmationModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        itemToDelete="Brand Medication"
        actionButtonFunction={() => handleToggleActive(brandMedication.id!)}
        actionType={actionType}
      />

      <AddActiveIngredient
        brandMedication={brandMedication}
        open={openActiveIngredientPopup}
        setOpen={setOpenActiveIngredientPopup}
      />
      <AddBrandSubstitute
      open={openSubstitute}
      setOpen={setOpenSubstitute}
      brandMedication={brandMedication}
      />
    </Panel>
  );
};

export default GenericMedications;
