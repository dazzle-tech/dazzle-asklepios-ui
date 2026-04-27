import React, { useEffect, useMemo, useState } from "react";
import ChildModal from "@/components/ChildModal";
import MyTable from "@/components/MyTable";
import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import Translate from "@/components/Translate";
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";

import AddOutlineIcon from "@rsuite/icons/AddOutline";
import { MdModeEdit, MdDelete } from "react-icons/md";
import { Form } from "rsuite";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";

import {
  useGetPriceListItemsByPriceListIdQuery,
  useCreatePriceListItemMutation,
  useUpdatePriceListItemMutation,
  useTogglePriceListItemActiveMutation,
} from "@/services/billing/PriceListItemService";

import { useEnumOptions } from "@/services/enumsApi";
import { newPriceListItem } from "@/types/model-types-constructor-new";
import { PriceListItem } from "@/types/model-types-new";

import { useGetActiveServicesByFacilityQuery } from "@/services/setup/serviceService";
import { useGetBrandMedicationsByIsActiveQuery } from "@/services/setup/brandmedication/BrandMedicationService";
import { useGetActiveDiagnosticTestsByTypeQuery } from "@/services/setup/diagnosticTest/diagnosticTestService";
import { useGetActiveProceduresByFacilityQuery } from "@/services/setup/procedure/procedureService";
import { useGetFacilityByIdQuery } from "@/services/security/facilityService";
import { formatEnumString } from "@/utils";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  priceList?: any;
};

const AddEditPriceListItem = ({ open, setOpen, priceList }: Props) => {
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector((state) => state.auth);

  const selectedFacilityId =
    priceList?.facilityId ??
    authSlice?.selectedDepartment?.facilityId ??
    authSlice?.tenant?.selectedFacility?.id;

  const [openChild, setOpenChild] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);

  const [item, setItem] = useState<PriceListItem>({
    ...newPriceListItem,
    priceListId: priceList?.id ?? 0,
  });

  useEffect(() => {
    if (!priceList?.id) return;
    setItem((prev) => ({ ...prev, priceListId: priceList.id }));
  }, [priceList?.id]);

  const itemTypes = useEnumOptions("BillingItemTypes", {
    exclude: ["PATHOLOGY"],
  });

  const { data: itemsRes, refetch, isFetching } =
    useGetPriceListItemsByPriceListIdQuery(
      { priceListId: priceList?.id as number, page: 0, size: 50, sort: "id,asc" },
      { skip: !priceList?.id }
    );

  const items = itemsRes?.data ?? [];

  const { data: facilityData } = useGetFacilityByIdQuery(priceList?.facilityId, {
    skip: !priceList?.facilityId,
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
        skip: !openChild || !selectedFacilityId || item?.itemType !== "SERVICE",
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
        skip: !openChild || item?.itemType !== "MEDICATION",
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
        skip: !openChild || item?.itemType !== "LABORATORY",
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
        skip: !openChild || item?.itemType !== "RADIOLOGY",
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
        skip: !openChild || !selectedFacilityId || item?.itemType !== "PROCEDURE",
      }
    );

  const [createItem] = useCreatePriceListItemMutation();
  const [updateItem] = useUpdatePriceListItemMutation();
  const [toggleActive] = useTogglePriceListItemActiveMutation();

  const uniqueById = (arr: any[]) =>
    arr.filter(
      (value, index, self) =>
        value?.id != null &&
        index === self.findIndex((x) => Number(x?.id) === Number(value?.id))
    );

  const handleOpenAdd = () => {
    setItem({
      ...newPriceListItem,
      priceListId: priceList?.id ?? 0,
      itemType: null,
      serviceId: null,
      brandMedicationId: null,
      diagnosticTestId: null,
      procedureId: null,
      service: null,
      serviceSetup: null,
      brandMedication: null,
      diagnosticTest: null,
      procedure: null,
      price: 0,
    });

    setOpenChild(true);
  };

  const handleOpenEdit = (row: PriceListItem) => {
    setItem({
      ...newPriceListItem,
      ...row,
      priceListId: row.priceListId ?? priceList?.id ?? 0,

      serviceId:
        row.itemType === "SERVICE"
          ? row.serviceId ?? row.service?.id ?? row.serviceSetup?.id ?? null
          : null,

      brandMedicationId:
        row.itemType === "MEDICATION"
          ? row.brandMedicationId ?? row.brandMedication?.id ?? null
          : null,

      diagnosticTestId:
        ["LABORATORY", "RADIOLOGY", "PATHOLOGY"].includes(row.itemType ?? "")
          ? row.diagnosticTestId ?? row.diagnosticTest?.id ?? null
          : null,

      procedureId:
        row.itemType === "PROCEDURE"
          ? row.procedureId ?? row.procedure?.id ?? null
          : null,
    });

    setOpenChild(true);
  };

  const getValidationError = () => {
    let errorMsg = "";

    if (!item?.itemType) {
      errorMsg += errorMsg ? ", Item Type can't be empty" : "Item Type can't be empty";
    }

    if (item?.itemType === "SERVICE" && !item?.serviceId) {
      errorMsg += errorMsg ? ", Service can't be empty" : "Service can't be empty";
    }

    if (item?.itemType === "MEDICATION" && !item?.brandMedicationId) {
      errorMsg += errorMsg ? ", Medication can't be empty" : "Medication can't be empty";
    }

    if (
      ["LABORATORY", "RADIOLOGY", "PATHOLOGY"].includes(item?.itemType ?? "") &&
      !item?.diagnosticTestId
    ) {
      errorMsg += errorMsg ? ", Diagnostic Test can't be empty" : "Diagnostic Test can't be empty";
    }

    if (item?.itemType === "PROCEDURE" && !item?.procedureId) {
      errorMsg += errorMsg ? ", Procedure can't be empty" : "Procedure can't be empty";
    }

    if (item.price === null || item.price === undefined || Number(item.price) < 0) {
      errorMsg += errorMsg ? ", Price is required" : "Price is required";
    }

    return errorMsg;
  };

  const itemSelectConfig = useMemo(() => {
    switch (item?.itemType) {
      case "SERVICE":
        return {
          fieldName: "serviceId",
          fieldLabel: "Service",
          selectData: uniqueById([
            ...(item.service ? [item.service] : []),
            ...(item.serviceSetup ? [item.serviceSetup] : []),
            ...(activeServicesResponse?.data ?? []),
          ]),
          selectDataLabel: "name",
          selectDataValue: "id",
          loading: isFetchingServices,
          hasMore: activeServicesResponse?.links?.next != null,
        };

      case "MEDICATION":
        return {
          fieldName: "brandMedicationId",
          fieldLabel: "Medication",
          selectData: uniqueById([
            ...(item.brandMedication ? [item.brandMedication] : []),
            ...(medicationsResponse?.data ?? []),
          ]),
          selectDataLabel: "name",
          selectDataValue: "id",
          loading: isFetchingMedications,
          hasMore: medicationsResponse?.links?.next != null,
        };

      case "LABORATORY":
        return {
          fieldName: "diagnosticTestId",
          fieldLabel: "Laboratory Test",
          selectData: uniqueById([
            ...(item.diagnosticTest ? [item.diagnosticTest] : []),
            ...(laboratoryResponse?.data ?? []),
          ]),
          selectDataLabel: "name",
          selectDataValue: "id",
          loading: isFetchingLaboratory,
          hasMore: laboratoryResponse?.links?.next != null,
        };

      case "RADIOLOGY":
        return {
          fieldName: "diagnosticTestId",
          fieldLabel: "Radiology Test",
          selectData: uniqueById([
            ...(item.diagnosticTest ? [item.diagnosticTest] : []),
            ...(radiologyResponse?.data ?? []),
          ]),
          selectDataLabel: "name",
          selectDataValue: "id",
          loading: isFetchingRadiology,
          hasMore: radiologyResponse?.links?.next != null,
        };

      case "PROCEDURE":
        return {
          fieldName: "procedureId",
          fieldLabel: "Procedure",
          selectData: uniqueById([
            ...(item.procedure ? [item.procedure] : []),
            ...(proceduresResponse?.data ?? []),
          ]),
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
    item?.service,
    item?.serviceSetup,
    item?.brandMedication,
    item?.diagnosticTest,
    item?.procedure,
    activeServicesResponse,
    medicationsResponse,
    laboratoryResponse,
    radiologyResponse,
    proceduresResponse,
    isFetchingServices,
    isFetchingMedications,
    isFetchingLaboratory,
    isFetchingRadiology,
    isFetchingProcedures,
  ]);

  const handleSaveItem = async () => {
    const validationError = getValidationError();

    if (validationError) {
      dispatch(notify({ msg: validationError, sev: "warning" }));
      return;
    }

    try {
      const payload: PriceListItem = {
        ...newPriceListItem,
        id: item.id,
        priceListId: item.priceListId,
        itemType: item.itemType,
        serviceId: item.itemType === "SERVICE" ? item.serviceId ?? null : null,
        brandMedicationId:
          item.itemType === "MEDICATION" ? item.brandMedicationId ?? null : null,
        diagnosticTestId: ["LABORATORY", "RADIOLOGY", "PATHOLOGY"].includes(
          item.itemType ?? ""
        )
          ? item.diagnosticTestId ?? null
          : null,
        procedureId: item.itemType === "PROCEDURE" ? item.procedureId ?? null : null,
        price: item.price,
        discountAllowed: !!item.discountAllowed,
        isActive: item.isActive ?? true,
      };

      if (item?.id) {
        await updateItem(payload).unwrap();
        dispatch(notify({ msg: "Item updated successfully", sev: "success" }));
      } else {
        const { id, ...createPayload } = payload;
        await createItem(createPayload as PriceListItem).unwrap();
        dispatch(notify({ msg: "Item created successfully", sev: "success" }));
      }

      setOpenChild(false);
      refetch();
    } catch (err: any) {
      dispatch(
        notify({
          msg:
            err?.data?.message?.replace(/^error\./i, "") ||
            err?.data?.detail ||
            "Failed to save item",
          sev: "error",
        })
      );
    }
  };

  const handleToggleItem = async () => {
    if (!item.id) return;

    try {
      await toggleActive(item.id).unwrap();
      dispatch(notify({ msg: "Status updated", sev: "success" }));
      setConfirmToggle(false);
      refetch();
    } catch {
      dispatch(notify({ msg: "Failed to update status", sev: "error" }));
    }
  };

  const getItemName = (row: PriceListItem) => {
    if (row.itemType === "SERVICE") {
      return row.serviceSetup?.name ?? row.service?.name ?? row.serviceId ?? "-";
    }

    if (row.itemType === "MEDICATION") {
      return row.brandMedication?.name ?? row.brandMedicationId ?? "-";
    }

    if (["LABORATORY", "RADIOLOGY", "PATHOLOGY"].includes(row.itemType ?? "")) {
      return row.diagnosticTest?.name ?? row.diagnosticTestId ?? "-";
    }

    if (row.itemType === "PROCEDURE") {
      return row.procedure?.name ?? row.procedureId ?? "-";
    }

    return "-";
  };

  const iconsForActions = (row: PriceListItem) => (
    <div className="container-of-icons" onClick={(e) => e.stopPropagation()}>
      <MdModeEdit
        title="Edit"
        size={22}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenEdit(row);
        }}
      />

      <MdDelete
        title={row.isActive ? "Deactivate" : "Activate"}
        size={22}
        fill="var(--primary-pink)"
        className="icons-style"
        onClick={(e) => {
          e.stopPropagation();
          setItem(row);
          setConfirmToggle(true);
        }}
      />
    </div>
  );

  const tableColumns = [
    {
      key: "itemType",
      title: <Translate>Item Type</Translate>,
      flexGrow: 2,
      render: (row: PriceListItem) => <span>{formatEnumString(row.itemType)}</span>,
    },
    {
      key: "target",
      title: <Translate>Item</Translate>,
      flexGrow: 4,
      render: (row: PriceListItem) => <span>{getItemName(row)}</span>,
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
    {
      key: "isActive",
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (row: PriceListItem) => (
        <span>{row.isActive ? "Active" : "Inactive"}</span>
      ),
    },
    {
      key: "icons",
      title: "",
      flexGrow: 2,
      render: (row: PriceListItem) => iconsForActions(row),
    },
  ];

  const conjureMainContent = () => (
    <Form>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleOpenAdd}
          width="109px"
        >
          Add New
        </MyButton>
      </div>

      <MyTable
        height={450}
        data={items}
        columns={tableColumns}
        rowClassName={(row) => (row?.id === item?.id ? "selected-row" : "")}
        onRowClick={(row) => setItem(row)}
        loading={isFetching}
      />

      <DeletionConfirmationModal
        open={confirmToggle}
        setOpen={setConfirmToggle}
        itemToDelete="Price List Item"
        actionButtonFunction={handleToggleItem}
        actionType={item?.isActive ? "deactivate" : "reactivate"}
      />
    </Form>
  );

  const conjureChildContent = () => (
    <Form fluid>
      <MyInput
        required
        width={350}
        fieldType="select"
        fieldLabel="Item Type"
        fieldName="itemType"
        selectData={itemTypes ?? []}
        selectDataLabel="label"
        selectDataValue="value"
        record={item}
        setRecord={(record) => {
          setItem((prev) => {
            const itemTypeChanged = record.itemType !== prev.itemType;

            return {
              ...record,
              serviceId: itemTypeChanged ? null : prev.serviceId,
              brandMedicationId: itemTypeChanged ? null : prev.brandMedicationId,
              diagnosticTestId: itemTypeChanged ? null : prev.diagnosticTestId,
              procedureId: itemTypeChanged ? null : prev.procedureId,
              price: itemTypeChanged ? 0 : prev.price,

              service: itemTypeChanged ? null : prev.service,
              serviceSetup: itemTypeChanged ? null : prev.serviceSetup,
              brandMedication: itemTypeChanged ? null : prev.brandMedication,
              diagnosticTest: itemTypeChanged ? null : prev.diagnosticTest,
              procedure: itemTypeChanged ? null : prev.procedure,
            };
          });
        }}
      />

      {itemSelectConfig && (
        <MyInput
          key={`${item?.itemType}-${item?.id ?? "new"}-${item?.serviceId ??
            item?.brandMedicationId ??
            item?.diagnosticTestId ??
            item?.procedureId ??
            "empty"
            }`}
          required
          width={350}
          fieldType="selectPagination"
          fieldLabel={itemSelectConfig.fieldLabel}
          fieldName={itemSelectConfig.fieldName}
          selectData={itemSelectConfig.selectData}
          selectDataLabel={itemSelectConfig.selectDataLabel}
          selectDataValue={itemSelectConfig.selectDataValue}
          record={item}
          setRecord={setItem}
          searchable
          loading={itemSelectConfig.loading}
          hasMore={itemSelectConfig.hasMore}
          onFetchMore={async () => { }}
          onSelectItem={(selectedItem) => {
            setItem({
              ...item,
              [itemSelectConfig.fieldName]:
                selectedItem?.[itemSelectConfig.selectDataValue] ?? null,
              price: selectedItem?.price ?? selectedItem?.cost ?? 0,
            });
          }}
        />
      )}

      <MyInput
        width={350}
        fieldName="defaultCurrency"
        fieldLabel="Currency"
        record={facilityData}
        setRecord={() => { }}
        disabled
      />

      <MyInput
        required
        width={350}
        fieldType="number"
        fieldLabel="Price"
        fieldName="price"
        record={item}
        setRecord={setItem}
      />

      <MyInput
        width={350}
        fieldType="checkbox"
        fieldLabel="Discount Allowed"
        fieldName="discountAllowed"
        record={item}
        setRecord={setItem}
      />
    </Form>
  );

  const direction = localStorage.getItem("direction") || "LTR";
  const dir = direction === "RTL" ? "rtl" : "ltr";

  return (
    <ChildModal
      open={open}
      setOpen={setOpen}
      title="Price List Items"
      actionButtonLabel="Close"
      actionButtonFunction={() => setOpen(false)}
      mainContent={<div dir={dir}>{conjureMainContent()}</div>}
      mainStep={[
        {
          title: "Items",
          icon: <Translate>IT</Translate>,
          disabledNext: true,
        },
      ]}
      showChild={openChild}
      setShowChild={setOpenChild}
      childTitle={item?.id ? "Edit Item" : "Add Item"}
      childContent={<div dir={dir}>{conjureChildContent()}</div>}
      actionChildButtonFunction={handleSaveItem}
      mainSize="lg"
    />
  );
};

export default AddEditPriceListItem;