import React, { useEffect, useMemo, useState } from "react";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import { Form } from "rsuite";
import {
  useGetItemsByPlanQuery,
  useCreatePlanItemMutation,
  useUpdatePlanItemMutation,
  useDeletePlanItemMutation,
} from "@/services/setup/payer/PayorPlanService";
import { useEnumOptions } from "@/services/enumsApi";
import { useAppDispatch, useAppSelector } from "@/hooks";
import {
  notify,
  showSystemLoader,
  hideSystemLoader,
} from "@/utils/uiReducerActions";
import { FaTrash } from "react-icons/fa";
import { MdModeEdit } from "react-icons/md";
import { formatEnumString } from "@/utils";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";

import { useGetActiveServicesByFacilityQuery } from "@/services/setup/serviceService";
import { useGetBrandMedicationsByIsActiveQuery } from "@/services/setup/brandmedication/BrandMedicationService";
import { useGetActiveDiagnosticTestsByTypeQuery } from "@/services/setup/diagnosticTest/diagnosticTestService";
import { useGetActiveProceduresByFacilityQuery } from "@/services/setup/procedure/procedureService";

const PlanItemsModal = ({ open, setOpen, plan }) => {
  if (!plan) return null;

  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);

  const selectedFacilityId =
    authSlice?.selectedDepartment?.facilityId ??
    authSlice?.tenant?.selectedFacility?.id;

  const itemTypes = useEnumOptions("BillingItemTypes", { exclude: ["PATHOLOGY"] });
  const coverageTypes = useEnumOptions("InsuranceCoverageType");

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const { data: itemsResp, refetch, isFetching } = useGetItemsByPlanQuery(
    { planId: plan?.id, page, size },
    { skip: !plan?.id }
  );

  const [createItem] = useCreatePlanItemMutation();
  const [updateItem] = useUpdatePlanItemMutation();
  const [deleteItem] = useDeletePlanItemMutation();

  const [selectedRow, setSelectedRow] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [item, setItem] = useState({
    id: undefined,
    planId: plan?.id,
    itemType: "",
    coverageType: "",
    amount: null,
    isActive: true,
    preAuthorization: false,
    brandMedicationId: null,
    diagnosticTestId: null,
    serviceId: null,
    procedureId: null,
  });

  const { data: activeServicesResponse, isFetching: isFetchingServices } =
    useGetActiveServicesByFacilityQuery(
      {
        facilityId: selectedFacilityId,
        page: 0,
        size: 50,
        sort: "id,asc",
      },
      {
        skip: !open || !selectedFacilityId || item?.itemType !== "SERVICE",
      }
    );

  const { data: medicationsResponse, isFetching: isFetchingMedications } =
    useGetBrandMedicationsByIsActiveQuery(
      {
        isActive: true,
        page: 0,
        size: 50,
        sort: "id,asc",
      },
      {
        skip: !open || item?.itemType !== "MEDICATION",
      }
    );

  const { data: laboratoryResponse, isFetching: isFetchingLaboratory } =
    useGetActiveDiagnosticTestsByTypeQuery(
      {
        type: "LABORATORY",
        page: 0,
        size: 50,
        sort: "id,asc",
      },
      {
        skip: !open || item?.itemType !== "LABORATORY",
      }
    );

  const { data: radiologyResponse, isFetching: isFetchingRadiology } =
    useGetActiveDiagnosticTestsByTypeQuery(
      {
        type: "RADIOLOGY",
        page: 0,
        size: 50,
        sort: "id,asc",
      },
      {
        skip: !open || item?.itemType !== "RADIOLOGY",
      }
    );

  const { data: pathologyResponse, isFetching: isFetchingPathology } =
    useGetActiveDiagnosticTestsByTypeQuery(
      {
        type: "PATHOLOGY",
        page: 0,
        size: 50,
        sort: "id,asc",
      },
      {
        skip: !open || item?.itemType !== "PATHOLOGY",
      }
    );

  const { data: proceduresResponse, isFetching: isFetchingProcedures } =
    useGetActiveProceduresByFacilityQuery(
      {
        facilityId: selectedFacilityId,
        page: 0,
        size: 50,
        sort: "id,asc",
      },
      {
        skip: !open || !selectedFacilityId || item?.itemType !== "PROCEDURE",
      }
    );

  useEffect(() => {
    if (open) {
      resetForm();
      refetch();
      setSelectedRow(null);
    }
  }, [open]);

  const resetForm = () => {
    setItem({
      id: undefined,
      planId: plan.id,
      itemType: "",
      coverageType: "",
      amount: null,
      isActive: true,
      preAuthorization: false,
      brandMedicationId: null,
      diagnosticTestId: null,
      serviceId: null,
      procedureId: null,
    });
  };

  const itemSelectConfig = useMemo(() => {
    switch (item?.itemType) {
      case "MEDICATION":
        return {
          fieldName: "brandMedicationId",
          fieldLabel: "Medication",
          selectData: medicationsResponse?.data ?? [],
          selectDataLabel: "name",
          selectDataValue: "id",
          loading: isFetchingMedications,
          hasMore: medicationsResponse?.links?.next != null,
        };

      case "LABORATORY":
        return {
          fieldName: "diagnosticTestId",
          fieldLabel: "Laboratory Test",
          selectData: laboratoryResponse?.data ?? [],
          selectDataLabel: "name",
          selectDataValue: "id",
          loading: isFetchingLaboratory,
          hasMore: laboratoryResponse?.links?.next != null,
        };

      case "RADIOLOGY":
        return {
          fieldName: "diagnosticTestId",
          fieldLabel: "Radiology Test",
          selectData: radiologyResponse?.data ?? [],
          selectDataLabel: "name",
          selectDataValue: "id",
          loading: isFetchingRadiology,
          hasMore: radiologyResponse?.links?.next != null,
        };

      case "PATHOLOGY":
        return {
          fieldName: "diagnosticTestId",
          fieldLabel: "Pathology Test",
          selectData: pathologyResponse?.data ?? [],
          selectDataLabel: "name",
          selectDataValue: "id",
          loading: isFetchingPathology,
          hasMore: pathologyResponse?.links?.next != null,
        };

      case "SERVICE":
        return {
          fieldName: "serviceId",
          fieldLabel: "Service",
          selectData: activeServicesResponse?.data ?? [],
          selectDataLabel: "name",
          selectDataValue: "id",
          loading: isFetchingServices,
          hasMore: activeServicesResponse?.links?.next != null,
        };

      case "PROCEDURE":
        return {
          fieldName: "procedureId",
          fieldLabel: "Procedure",
          selectData: proceduresResponse?.data ?? [],
          selectDataLabel: "name",
          selectDataValue: "id",
          loading: isFetchingProcedures,
          hasMore: proceduresResponse?.links?.next != null,
        };

      default:
        return null;
    }
  }, [
    item?.itemType,
    medicationsResponse,
    laboratoryResponse,
    radiologyResponse,
    pathologyResponse,
    activeServicesResponse,
    proceduresResponse,
    isFetchingMedications,
    isFetchingLaboratory,
    isFetchingRadiology,
    isFetchingPathology,
    isFetchingServices,
    isFetchingProcedures,
  ]);

  const getValidationError = () => {
    if (!item.itemType) return "Item Type is required";
    if (!item.coverageType) return "Coverage Type is required";
    if (item.amount === null || item.amount === undefined || item.amount === "") {
      return "Amount is required";
    }

    if (item.itemType === "MEDICATION" && !item.brandMedicationId) {
      return "Medication is required";
    }

    if (
      ["LABORATORY", "RADIOLOGY", "PATHOLOGY"].includes(item.itemType) &&
      !item.diagnosticTestId
    ) {
      return "Diagnostic test is required";
    }

    if (item.itemType === "SERVICE" && !item.serviceId) {
      return "Service is required";
    }

    if (item.itemType === "PROCEDURE" && !item.procedureId) {
      return "Procedure is required";
    }

    return "";
  };

  const buildRequestBody = () => ({
    id: item.id,
    planId: plan.id,
    itemType: item.itemType,
    amount: item.amount,
    coverageType: item.coverageType,
    isActive: item.isActive ?? true,
    preAuthorization: item.preAuthorization ?? false,

    brandMedicationId:
      item.itemType === "MEDICATION" ? item.brandMedicationId ?? null : null,

    diagnosticTestId:
      ["LABORATORY", "RADIOLOGY", "PATHOLOGY"].includes(item.itemType)
        ? item.diagnosticTestId ?? null
        : null,

    serviceId:
      item.itemType === "SERVICE" ? item.serviceId ?? null : null,

    procedureId:
      item.itemType === "PROCEDURE" ? item.procedureId ?? null : null,
  });

  const saveItemHandler = async () => {
    const validationError = getValidationError();

    if (validationError) {
      dispatch(notify({ msg: validationError, sev: "warning" }));
      return;
    }

    try {
      dispatch(showSystemLoader());

      const body = buildRequestBody();

      if (item.id) {
        await updateItem(body).unwrap();
        dispatch(notify({ msg: "Item updated successfully", sev: "success" }));
      } else {
        await createItem(body).unwrap();
        dispatch(notify({ msg: "Item added successfully", sev: "success" }));
      }

      resetForm();
      setSelectedRow(null);
      refetch();
    } catch (err) {
      dispatch(
        notify({
          msg: err?.data?.message || "Failed to save item",
          sev: "error",
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const confirmDeleteHandler = async () => {
    try {
      dispatch(showSystemLoader());

      await deleteItem(itemToDelete).unwrap();

      dispatch(notify({ msg: "Item deleted successfully", sev: "success" }));

      refetch();
    } catch {
      dispatch(notify({ msg: "Failed to delete", sev: "error" }));
    } finally {
      dispatch(hideSystemLoader());
      setOpenDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const getDisplayName = rowData => {
    if (rowData?.brandMedicationName) return rowData.brandMedicationName;
    if (rowData?.diagnosticTestName) return rowData.diagnosticTestName;
    if (rowData?.serviceName) return rowData.serviceName;
    if (rowData?.procedureName) return rowData.procedureName;

    if (rowData?.brandMedication?.name) return rowData.brandMedication.name;
    if (rowData?.diagnosticTest?.name) return rowData.diagnosticTest.name;
    if (rowData?.service?.name) return rowData.service.name;
    if (rowData?.procedure?.name) return rowData.procedure.name;

    return "-";
  };

  const columns = [
    {
      key: "itemType",
      title: "Item Type",
      flexGrow: 1,
      render: rowData => <p>{formatEnumString(rowData?.itemType)}</p>,
    },
    {
      key: "name",
      title: "Name",
      flexGrow: 1,
      render: rowData => <p>{getDisplayName(rowData)}</p>,
    },
    {
      key: "coverageType",
      
      flexGrow: 1,
      render: rowData => <p>{formatEnumString(rowData?.coverageType)}</p>,
    },
    {
      key: "amount",
      title: "Amount",
      flexGrow: 1,
    },
    {
      key: "preAuthorization",
      title: "Pre-Auth",
      flexGrow: 1,
      render: rowData => <p>{rowData?.preAuthorization ? "Yes" : "No"}</p>,
    },
    {
      key: "actions",
      title: "",
      flexGrow: 1,
      render: row => (
        <div style={{ display: "flex", gap: "14px" }}>
          <MdModeEdit
            size={20}
            color="var(--primary-gray)"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setSelectedRow(row);

              setItem({
                id: row.id,
                planId: row.planId,
                itemType: row.itemType ?? "",
                coverageType: row.coverageType ?? "",
                amount: row.amount ?? null,
                isActive: row.isActive ?? true,
                preAuthorization: row.preAuthorization ?? false,
                brandMedicationId: row.brandMedicationId ?? null,
                diagnosticTestId: row.diagnosticTestId ?? null,
                serviceId: row.serviceId ?? null,
                procedureId: row.procedureId ?? null,
              });
            }}
          />

          <FaTrash
            size={18}
            color="var(--primary-pink)"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setItemToDelete(row.id);
              setOpenDeleteModal(true);
            }}
          />
        </div>
      ),
    },
  ];

  const isSelected = row =>
    selectedRow && row.id === selectedRow.id ? "selected-row" : "";

  const tablefilters = (
    <Form fluid layout="inline">
      <MyInput
        fieldLabel="Item Type"
        fieldName="itemType"
        fieldType="select"
        selectData={itemTypes}
        selectDataLabel="label"
        selectDataValue="value"
        record={item}
        setRecord={val =>
          setItem({
            ...val,
            brandMedicationId: null,
            diagnosticTestId: null,
            serviceId: null,
            procedureId: null,
          })
        }
        column
        required
      />

      {itemSelectConfig && (
        <MyInput
          fieldLabel={itemSelectConfig.fieldLabel}
          fieldName={itemSelectConfig.fieldName}
          fieldType="selectPagination"
          selectData={itemSelectConfig.selectData}
          selectDataLabel={itemSelectConfig.selectDataLabel}
          selectDataValue={itemSelectConfig.selectDataValue}
          record={item}
          setRecord={setItem}
          loading={itemSelectConfig.loading}
          hasMore={itemSelectConfig.hasMore}
          onFetchMore={async () => {}}
          searchable
          column
          required
        />
      )}

      <MyInput
        fieldLabel="Coverage Type"
        fieldName="coverageType"
        fieldType="select"
        selectData={coverageTypes}
        selectDataLabel="label"
        selectDataValue="value"
        record={item}
        setRecord={setItem}
        column
        required
      />

      <MyInput
        fieldLabel="Amount"
        fieldName="amount"
        fieldType="number"
        width="120px"
        record={item}
        setRecord={setItem}
        column
        required
      />

      <MyInput
        fieldLabel="Pre-Authorization"
        fieldName="preAuthorization"
        fieldType="checkbox"
        record={item}
        setRecord={setItem}
        column
      />
    </Form>
  );

  const tablebuttons = (
    <div className="payor-plan-buttons-handle">
      <MyButton
        color="var(--deep-blue)"
        width="100px"
        onClick={saveItemHandler}
      >
        Save
      </MyButton>

      <MyButton
        color="var(--primary-gray)"
        width="100px"
        onClick={() => {
          resetForm();
          setSelectedRow(null);
        }}
      >
        Cancel
      </MyButton>
    </div>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      size="45vw"
      position="center"
      title={`Manage Items — ${plan?.name}`}
      content={
        <>
          <MyTable
            data={itemsResp?.data ?? []}
            loading={isFetching}
            columns={columns}
            totalCount={itemsResp?.totalCount ?? 0}
            page={page}
            rowsPerPage={size}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={e => setSize(Number(e.target.value))}
            rowClassName={isSelected}
            onRowClick={row => setSelectedRow(row)}
            tableButtons={tablebuttons}
            filters={tablefilters}
          />

          <DeletionConfirmationModal
            open={openDeleteModal}
            setOpen={setOpenDeleteModal}
            itemToDelete="Item"
            actionType="delete"
            actionButtonFunction={confirmDeleteHandler}
          />
        </>
      }
    />
  );
};

export default PlanItemsModal;