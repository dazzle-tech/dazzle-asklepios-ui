import React, { useState, useEffect } from "react";
import { Panel, Form, Whisper, Tooltip } from "rsuite";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import { MdCheckCircle } from "react-icons/md";
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
} from "@/services/setup/brandmedication/BrandMedicationService";

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
import { conjureValueBasedOnKeyFromList, formatEnumString } from "@/utils";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import AddBrandSubstitute from "./AddBrandSubstitute";
import { useEnumOptions } from "@/services/enumsApi";

const FIELD_LABELS: Record<string, string> = {
  id: "ID",
  name: "Brand Name",
  code: "Brand Code",
  manufacturer: "Manufacturer",
  dosageForm: "Dosage Form",
  usageInstructions: "Usage Instructions",
  storageRequirements: "Storage Requirements",
  expiresAfterOpening: "Expires After Opening",
  expiresAfterOpeningValue: "Expires After Opening Value",
  expiresAfterOpeningUnit: "Expires After Opening Unit",
  useSinglePatient: "Single Patient Use",
  highCostMedication: "High Cost Medication",
  costCategory: "Cost Category",
  roa: "ROA",
  isActive: "Active",
  uomGroupId: "UOM Group",
  uomGroupUnitId: "Base UOM",
  price: "Price",
  currency: "Currency",
};

const BRAND_MEDICATION_ERROR_MAP: Record<string, string> = {
  namerequired: "Brand Name is required.",
  dosageformrequired: "Dosage Form is required.",
  uomGrouprequired: "UOM Group is required.",
  uomGroupUnitrequired: "Base UOM is required.",
  notfound: "Requested Brand Medication record was not found.",
};

const formatFieldName = (field?: string): string => {
  if (!field) return "";
  return FIELD_LABELS[field] || field;
};

const normalizeFieldMessage = (msg?: string) => {
  const m = (msg || "").toLowerCase().trim();

  if (
    m.includes("must not be null") ||
    m.includes("must not be blank") ||
    m.includes("must not be empty") ||
    m.includes("is required")
  ) {
    return "is required";
  }

  if (m.includes("failed to convert")) return "has invalid value";
  if (m.includes("size must be between")) return "length is out of range";
  if (m.includes("must be greater")) return "value is too small";
  if (m.includes("must be less")) return "value is too large";

  return msg || "invalid value";
};

const prettifyInlineBackendMessage = (message: string): string => {
  return message
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const firstColonIndex = part.indexOf(":");
      if (firstColonIndex === -1) return part;

      const rawField = part.slice(0, firstColonIndex).trim();
      const rawMessage = part.slice(firstColonIndex + 1).trim();

      const field = formatFieldName(rawField);
      const normalizedMessage = normalizeFieldMessage(rawMessage);

      return field ? `${field} ${normalizedMessage}` : normalizedMessage;
    })
    .join(", ");
};

  export const handleCrudError = (
    error: any,
    dispatch: any,
    keyMap?: Record<string, string>
  ) => {
    const data = error?.data ?? {};

    const traceId =
      data?.traceId || data?.requestId || data?.correlationId;
    const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

    const rawMessage =
      data?.detail ||
      data?.message ||
      data?.title ||
      '';

    let message = '';

    // 1) Spring validation errors
    if (rawMessage.includes('Validation failed')) {
      const blocks = rawMessage.split('[Field error in object').slice(1);

      if (blocks.length) {
        const lines = blocks
          .map((block: string) => {
            const fieldMatch = block.match(/on field '([^']+)'/);
            const field = fieldMatch?.[1] || '';

            const label = FIELD_LABELS[field] || field;
            const lowerBlock = block.toLowerCase();

            let normalized = 'invalid value';

            if (
              lowerBlock.includes('must not be empty') ||
              lowerBlock.includes('must not be null') ||
              lowerBlock.includes('must not be blank') ||
              lowerBlock.includes('is required')
            ) {
              normalized = 'is required';
            } else if (lowerBlock.includes('failed to convert')) {
              normalized = 'has invalid value';
            } else if (lowerBlock.includes('size must be between')) {
              normalized = 'length is out of range';
            } else if (lowerBlock.includes('must be greater')) {
              normalized = 'value is too small';
            } else if (lowerBlock.includes('must be less')) {
              normalized = 'value is too large';
            }

            if (!label) return null;

            return `• ${label} ${normalized}`;
          })
          .filter(Boolean);

        if (lines.length) {
          message = lines.join('\n');
        }
      }
    }

    // 2) PostgreSQL duplicate / DB errors
    if (!message) {
      let backendMessage = rawMessage;

      if (backendMessage.includes('Detail:')) {
        const match = backendMessage.match(/Detail:\s*(.*?)(\]|\[|$)/);
        if (match?.[1]) {
          backendMessage = match[1].trim();
        }
      }

      if (backendMessage.includes('already exists')) {
        if (backendMessage.includes('(code)')) {
          message = 'Brand Code already exists';
        } else {
          message = 'Record already exists';
        }
      } else {
        message = backendMessage;
      }
    }

    // 3) keyMap fallback
    if (!message) {
      const messageProp: string = data?.message || '';
      const errorKey = messageProp.startsWith('error.')
        ? messageProp.substring(6)
        : undefined;

      message =
        (errorKey && keyMap?.[errorKey]) ||
        'Unexpected error';
    }

    dispatch(
      notify({
        msg: message + suffix,
        sev: 'error'
      })
    );
  };

  const GenericMedications = () => {
    const dispatch = useAppDispatch();

    const [brandMedication, setBrandMedication] = useState<BrandMedication>({
      ...newBrandMedication,
    });

    const [openActiveIngredientPopup, setOpenActiveIngredientPopup] = useState(false);
    const [openSubstitute, setOpenSubstitute] = useState(false);
    const [openAddEditPopup, setOpenAddEditPopup] = useState(false);
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [actionType, setActionType] = useState<"deactivate" | "reactivate">("deactivate");

    const [recordOfFilter, setRecordOfFilter] = useState({ filter: "", value: "" });
    const [isFiltered, setIsFiltered] = useState(false);
    const [filteredList, setFilteredList] = useState<BrandMedication[]>([]);
    const [filteredTotal, setFilteredTotal] = useState(0);

    const isSelected = (rowData: BrandMedication) =>
      rowData?.id === brandMedication?.id ? "selected-row" : "";

    const [paginationParams, setPaginationParams] = useState({
      page: 0,
      size: 15,
      sort: "id,asc",
      timestamp: Date.now(),
    });

    const [sortColumn, setSortColumn] = useState("id");
    const [sortType, setSortType] = useState<"asc" | "desc">("asc");

    const { data: allMedications, isFetching, refetch } =
      useGetAllBrandMedicationsQuery(paginationParams);

    const totalCount = allMedications?.totalCount ?? 0;

    const { data: brandMedicationLovQueryResponse } =
      useGetLovValuesByCodeQuery("GEN_MED_MANUFACTUR");

    const { data: doseageFormLovQueryResponse } =
      useGetLovValuesByCodeQuery("DOSAGE_FORMS");

    const roaEnumOptions = useEnumOptions("MedRoa");

    const [addBrandMedication] = useCreateBrandMedicationMutation();
    const [updateBrandMedication] = useUpdateBrandMedicationMutation();
    const [toggleActive] = useToggleBrandMedicationActiveMutation();

    const [getByName] = useLazyGetBrandMedicationsByNameQuery();
    const [getByManufacturer] = useLazyGetBrandMedicationsByManufacturerQuery();
    const [getByDosageForm] = useLazyGetBrandMedicationsByDosageFormQuery();
    const [getByUsageInstructions] = useLazyGetBrandMedicationsByUsageInstructionsQuery();
    const [getByRoa] = useLazyGetBrandMedicationsByRoaQuery();
    const [getByExpiresAfterOpening] = useLazyGetBrandMedicationsByExpiresAfterOpeningQuery();
    const [getByUseSinglePatient] = useLazyGetBrandMedicationsByUseSinglePatientQuery();
    const [getByIsActive] = useLazyGetBrandMedicationsByIsActiveQuery();

    useEffect(() => {
      dispatch(setPageCode("Brand_Medications"));
      dispatch(setDivContent("Brand Medications List"));

      return () => {
        dispatch(setPageCode(""));
        dispatch(setDivContent(""));
      };
    }, [dispatch]);

    const handleSave = async () => {
      try {
        if (brandMedication.id) {
          const { hasActiveIngredient, ...updatePayload } = brandMedication;
          await updateBrandMedication(updatePayload).unwrap();
          dispatch(notify({ msg: "Updated successfully", sev: "success" }));
        } else {
          const { hasActiveIngredient, ...payload } = brandMedication;
          await addBrandMedication(payload).unwrap();
          dispatch(notify({ msg: "Added successfully", sev: "success" }));
        }

        setOpenAddEditPopup(false);
        refetch();
      } catch (error: any) {
        handleCrudError(error, dispatch, BRAND_MEDICATION_ERROR_MAP);
      }
    };

    const handleToggleActive = async (id: number) => {
      try {
        await toggleActive(id).unwrap();
        dispatch(notify({ msg: "Status toggled", sev: "success" }));
        setOpenConfirmModal(false);
        refetch();
      } catch (error: any) {
        handleCrudError(error, dispatch, BRAND_MEDICATION_ERROR_MAP);
        setOpenConfirmModal(false);
      }
    };

   
    const handleActiveIngredientSaved = async () => {
      try {
       await refetch();
       setBrandMedication((prev) => ({
        ...prev,
        hasActiveIngredient: true,
       }));
       if (isFiltered) {
        setFilteredList((prev) =>
        prev.map((item) =>
          item.id === brandMedication.id
            ? { ...item, hasActiveIngredient: true }
            : item
                )
                );
       }
      } catch (error) {
      }
    };
    const normalizeBool = (v: any) => (v === true || v === "true" ? true : false);

    const handleFilterChange = async (field: string, value: string) => {
      if (!field || value === undefined || value === null || value === "") {
        setIsFiltered(false);
        setFilteredList([]);
        setFilteredTotal(0);
        return;
      }

      try {
        const params = { page: 0, size: 15, sort: "id,asc" };
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
      } catch (error: any) {
        handleCrudError(error, dispatch, BRAND_MEDICATION_ERROR_MAP);
      }
    };

    const handleSortChange = (col: string, type: "asc" | "desc") => {
      setSortColumn(col);
      setSortType(type);
      const sort = `${col},${type}`;
      setPaginationParams({
        ...paginationParams,
        sort,
        page: 0,
        timestamp: Date.now(),
      });
    };

    const renderFilterValueInput = () => {
      switch (recordOfFilter.filter) {
        case "manufacturer":
          return (
            <MyInput
              fieldName="value"
              fieldType="select"
              selectData={brandMedicationLovQueryResponse?.object ?? []}
               selectDataLabel="lovDisplayVale"
 disableByField='isValid'

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
 disableByField='isValid'

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
              fieldType="select"
              fieldName="roa"
              selectData={roaEnumOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={recordOfFilter}
              showLabel={false}
              setRecord={(u) => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
              placeholder="Select Roa"
            />
          );

        case "expiresAfterOpening":
        case "isActive":
        case "useSinglePatient":
          return (
            <MyInput
              fieldName="value"
              fieldType="checkbox"
              record={recordOfFilter}
              setRecord={setRecordOfFilter}
              showLabel={false}
              placeholder="Search"
            />
          );

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
      <Form fluid className="form-of-filters-set-up">
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
          setRecord={(r) =>
            setRecordOfFilter({ ...recordOfFilter, filter: r.filter, value: "" })
          }
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
              setActionType("deactivate");
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
              setActionType("reactivate");
              setOpenConfirmModal(true);
            }}
          />
        )}

        <Whisper
          placement="top"
          speaker={
            <Tooltip>
              <Translate>Active Ingredient</Translate>
            </Tooltip>
          }
        >
          <GiMedicines
            className="icons-style"
            title="Active Ingredient"
            size={22}
            onClick={() => {
              setBrandMedication(row);
              setOpenActiveIngredientPopup(true);
            }}
          />
        </Whisper>

        {row.hasActiveIngredient && (
          <Whisper
            placement="top"
            speaker={
              <Tooltip>
                <Translate>Substitute</Translate>
              </Tooltip>
            }
          >
            <HiOutlineSwitchHorizontal
              className="icons-style"
              title="Substitute"
              size={22}
              onClick={() => {
                setBrandMedication(row);
                setOpenSubstitute(true);
              }}
            />
          </Whisper>
        )}
      </div>
    );

    const columns = [
      { key: "name", title: <Translate>Brand Name</Translate>, flexGrow: 4 },
      {
        key: "manufacturer",
        title: <Translate>Manufacturer</Translate>,
        flexGrow: 4,
        render: (rowData: BrandMedication) =>
          conjureValueBasedOnKeyFromList(
            brandMedicationLovQueryResponse?.object,
            rowData?.manufacturer,
            "lovDisplayVale"
          ),
      },
      {
        key: "dosageForm",
        title: <Translate>Dosage Form</Translate>,
        flexGrow: 4,
        render: (rowData: BrandMedication) =>
          conjureValueBasedOnKeyFromList(
            doseageFormLovQueryResponse?.object,
            rowData?.dosageForm,
            "lovDisplayVale"
          ),
      },
      {
        key: "roa",
        title: <Translate>ROA</Translate>,
        flexGrow: 3,
        render: (rowData: BrandMedication) => <p>{formatEnumString(rowData?.roa)}</p>,
      },
      {
        key: "isActive",
        title: <Translate>Status</Translate>,
        flexGrow: 2,
        render: (r: BrandMedication) => (r.isActive ? "Active" : "Inactive"),
      },
      { key: "actions", title: "", flexGrow: 2, render: iconsForActions },
      {
        key: "hasActiveIngredient",
        title: "Active Ingredient",
        render: (row: BrandMedication) =>
          row.hasActiveIngredient && <MdCheckCircle size={22} color="var(--success)" />,
      },
    ];

    const direction = localStorage.getItem("direction") || "LTR";
    const isRTL = direction === "RTL";
    const dir = isRTL ? "rtl" : "ltr";

    return (
      <Panel dir={dir}>
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
          onPageChange={(_, p) =>
            setPaginationParams({ ...paginationParams, page: p })
          }
          onRowsPerPageChange={(e) =>
            setPaginationParams({
              ...paginationParams,
              size: Number(e.target.value),
              page: 0,
            })
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
          onSaved={handleActiveIngredientSaved}
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
