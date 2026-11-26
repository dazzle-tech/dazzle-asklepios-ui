import React, { useState, useEffect } from "react";
import { Panel, Whisper, Tooltip } from "rsuite";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import { MdCheckCircle, MdLocalOffer } from "react-icons/md";
import { BrandMedication } from "@/types/model-types-new";
import { newBrandMedication } from "@/types/model-types-constructor-new";

import {
  useCreateBrandMedicationMutation,
  useUpdateBrandMedicationMutation,
  useGetAllBrandMedicationsQuery,
  useToggleBrandMedicationActiveMutation,
} from "@/services/setup/brandmedication/BrandMedicationService";

import MyTable from "@/components/MyTable";
import MyButton from "@/components/MyButton/MyButton";
import AddOutlineIcon from "@rsuite/icons/AddOutline";
import AddEditBrandMedication from "./AddEditBrandMedication";
import PriceListPrompt, { usePriceListPrompt } from "@/components/PriceListPrompt";
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
  facilityId: "Facility",
  priceBaseUomId: "Price Base Unit",
  registrationNumber: "Registration Number",
  integrationCode: "Integration Code",
  gtinCode: "GTIN Code",
  descriptionCode: "Description Code",
  medDistributeArea: "Med Distribute Area",
  localMarket: "Local Market",
};

const BRAND_MEDICATION_ERROR_MAP: Record<string, string> = {
  namerequired: "Brand Name is required.",
  dosageformrequired: "Dosage Form is required.",
  uomGrouprequired: "UOM Group is required.",
  uomGroupUnitrequired: "Base UOM is required.",
  facilityrequired: "Facility is required.",
  priceBaseUomrequired: "Price Base Unit is required.",
  priceBaseUomNotInGroup: "Price Base Unit must belong to the selected UOM Group.",
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
    const priceListPrompt = usePriceListPrompt();
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [actionType, setActionType] = useState<"deactivate" | "reactivate">("deactivate");

    // Header filters: draft values typed in the inputs, applied on Enter / select change.
    // Everything is sent to one endpoint and combined with AND.
    const emptyHeaderFilters = {
      name: "",
      manufacturer: "",
      dosageForm: "",
      roa: "",
      expiresAfterOpening: "",
      useSinglePatient: "",
    };
    type HeaderFilterField = keyof typeof emptyHeaderFilters;
    const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
    const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
    // 'all' sends no isActive param
    const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
    const activeFilter = statusFilter === "all" ? undefined : statusFilter === "active";

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
      useGetAllBrandMedicationsQuery({ ...paginationParams, ...appliedFilters, isActive: activeFilter });

    const totalCount = allMedications?.totalCount ?? 0;

    const { data: brandMedicationLovQueryResponse } =
      useGetLovValuesByCodeQuery("GEN_MED_MANUFACTUR");

    const { data: doseageFormLovQueryResponse } =
      useGetLovValuesByCodeQuery("DOSAGE_FORMS");

    const roaEnumOptions = useEnumOptions("MedRoa");

    const [addBrandMedication] = useCreateBrandMedicationMutation();
    const [updateBrandMedication] = useUpdateBrandMedicationMutation();
    const [toggleActive] = useToggleBrandMedicationActiveMutation();

    // Changing the status filter starts again from the first page
    useEffect(() => {
      setPaginationParams((prev) => ({ ...prev, page: 0 }));
    }, [statusFilter]);

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
        let saved: any;
        if (brandMedication.id) {
          const { hasActiveIngredient, ...updatePayload } = brandMedication;
          saved = await updateBrandMedication(updatePayload).unwrap();
          dispatch(notify({ msg: "Updated successfully", sev: "success" }));
        } else {
          const { hasActiveIngredient, ...payload } = brandMedication;
          saved = await addBrandMedication(payload).unwrap();
          dispatch(notify({ msg: "Added successfully", sev: "success" }));
        }

        priceListPrompt.prompt({
          itemType: "MEDICATION",
          sourceId: saved?.id ?? brandMedication.id,
          itemCode: saved?.code ?? brandMedication.code,
          itemName: saved?.name ?? brandMedication.name,
          unitPrice: saved?.price ?? brandMedication.price,
          facilityId: saved?.facilityId ?? brandMedication.facilityId,
          currency: saved?.currency ?? brandMedication.currency,
        });

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
      } catch (error) {
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

    // Applying one header filter also applies whatever is typed in the others
    const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
      const next = { ...headerFilters, [field]: value };
      setHeaderFilters(next);
      setAppliedFilters(next);
      setPaginationParams((prev) => ({ ...prev, page: 0 }));
    };

    const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
      searchable: true,
      searchPlaceholder: placeholder,
      searchValue: headerFilters[field],
      onSearchChange: (value: string) => setHeaderFilters((prev) => ({ ...prev, [field]: value })),
      onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field]),
    });

    const headerSelect = (field: HeaderFilterField, options: { label: string; value: string }[]) => ({
      ...headerSearch(field),
      searchType: "select" as const,
      searchOptions: [{ label: "All", value: "" }, ...options],
    });

    const lovOptions = (lov: any) =>
      (lov?.object ?? []).map((o: any) => ({ label: o.lovDisplayVale, value: String(o.key) }));

    const YES_NO = [
      { label: "Yes", value: "true" },
      { label: "No", value: "false" },
    ];

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
        <MdLocalOffer
          className="icons-style"
          title="Price Lists"
          size={22}
          onClick={() =>
            priceListPrompt.view({
              itemType: "MEDICATION",
              sourceId: row.id,
              itemCode: row.code,
              itemName: row.name,
              unitPrice: row.price,
              facilityId: row.facilityId,
              currency: row.currency
            })
          }
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
      {
        key: "name",
        title: <Translate>Brand Name</Translate>,
        width: 220,
        ...headerSearch("name", "Search name"),
      },
      {
        key: "manufacturer",
        title: <Translate>Manufacturer</Translate>,
        width: 190,
        ...headerSelect("manufacturer", lovOptions(brandMedicationLovQueryResponse)),
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
        width: 170,
        ...headerSelect("dosageForm", lovOptions(doseageFormLovQueryResponse)),
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
        width: 150,
        ...headerSelect("roa", roaEnumOptions ?? []),
        render: (rowData: BrandMedication) => <p>{formatEnumString(rowData?.roa)}</p>,
      },
      {
        key: "expiresAfterOpening",
        title: <Translate>Expires After Opening</Translate>,
        width: 130,
        ...headerSelect("expiresAfterOpening", YES_NO),
        render: (r: BrandMedication) => (r.expiresAfterOpening ? "Yes" : "No"),
      },
      {
        key: "useSinglePatient",
        title: <Translate>Single Patient Use</Translate>,
        width: 130,
        ...headerSelect("useSinglePatient", YES_NO),
        render: (r: BrandMedication) => (r.useSinglePatient ? "Yes" : "No"),
      },
      {
        key: "isActive",
        title: <Translate>Status</Translate>,
        width: 120,
        searchable: true,
        searchType: "select" as const,
        searchOptions: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
          { label: "All", value: "all" },
        ],
        searchValue: statusFilter,
        onSearchChange: (value: string) => setStatusFilter(value as "active" | "inactive" | "all"),
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
          data={allMedications?.data ?? []}
          totalCount={totalCount}
          loading={isFetching}
          columns={columns}
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
        <PriceListPrompt prompt={priceListPrompt} />

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
