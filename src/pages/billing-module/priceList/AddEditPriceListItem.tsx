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
import { useAppDispatch } from "@/hooks";
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

import { useGetAllServicesQuery } from "@/services/setup/serviceService";
import {
  useGetInventoryProductByIdQuery,
  useGetInventoryProductByTypeQuery,
  useGetInventoryProductsQuery,
} from "@/services/inventory/inventory-products/inventoryProductsService";
import { useGetFacilityByIdQuery } from "@/services/security/facilityService";
import { formatEnumString } from "@/utils";
import { useGetQtyInBaseUomQuery } from "@/services/inventoryTransactionService";
import { useGetAllUnitsByGroupIdQuery } from "@/services/setup/uom-group/uomGroupService";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  priceList?: any;
};

const AddEditPriceListItem = ({ open, setOpen, priceList }: Props) => {
  const dispatch = useAppDispatch();

  const [openChild, setOpenChild] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);

  const [item, setItem] = useState<PriceListItem>({
    ...newPriceListItem,
    priceListId: priceList?.id ?? 0,
  });

  // keep priceListId in item state
  useEffect(() => {
    if (!priceList?.id) return;
    setItem((prev) => ({ ...prev, priceListId: priceList?.id }));
  }, [priceList?.id]);

  // enums
  const itemTypes = useEnumOptions("PriceListItemType"); // SERVICE / PRODUCT
  const productTypes = useEnumOptions("ProductTypes"); // MEDICATION / DEVICE / ...

  // fetch items for this price list
  const { data: itemsRes, refetch, isFetching } =
    useGetPriceListItemsByPriceListIdQuery(
      { priceListId: priceList?.id as number, page: 0, size: 50, sort: "id,asc" },
      { skip: !priceList?.id }
    );
  const { data: productByIdData } =
    useGetInventoryProductByIdQuery({ id: item.productId }, { skip: !item.productId });
  const { data: uomUnitsResponse } = useGetAllUnitsByGroupIdQuery(
    productByIdData?.uomGroupId ?? 0,
    { skip: !productByIdData?.uomGroupId }
  );
  const items = itemsRes?.data ?? [];

  // fetch services and products
  const { data: servicesData } = useGetAllServicesQuery({ page: 0, size: 1000 });
 const {data:AllProducts}=useGetInventoryProductsQuery({page:0,size:1000});
  const { data: productsData, isFetching: isFetchingProducts } =
    useGetInventoryProductByTypeQuery(
      { type: item.productType, page: 0, size: 1000 },
      { skip: item.itemType !== "PRODUCT" || !item.productType }
    );
  const { data: facilityData } = useGetFacilityByIdQuery(priceList?.facilityId, { skip: !priceList?.facilityId });
  const servicesList = servicesData?.data ?? [];
  const productsList = productsData?.data ?? [];
  const service = servicesList.find(s => s.id === item.serviceId);

  // mutations
  const [createItem] = useCreatePriceListItemMutation();
  const [updateItem] = useUpdatePriceListItemMutation();
  const [toggleActive] = useTogglePriceListItemActiveMutation();

  const handleOpenAdd = () => {
    setItem({
      ...newPriceListItem,
      priceListId: priceList?.id ?? 0,
      itemType: null, // default if you want
      serviceId: null,
      productType: null,
      productId: null,
    });
    setOpenChild(true);
  };

  const handleSaveItem = async () => {
    try {


      if (item.itemType === "SERVICE") {
        if (!item.serviceId) {
          dispatch(notify({ msg: "Service is required", sev: "warning" }));
          return;
        }
      }

      if (item.itemType === "PRODUCT") {
        if (!item.productType) {
          dispatch(notify({ msg: "Product type is required", sev: "warning" }));
          return;
        }
        if (!item.productId) {
          dispatch(notify({ msg: "Product is required", sev: "warning" }));
          return;
        }
      }

      if (item.price === null || item.price === undefined) {
        dispatch(notify({ msg: "Price is required", sev: "warning" }));
        return;
      }

      const basePayload = {
        priceListId: item.priceListId,
        itemType: item.itemType,
        productType: item.itemType === "PRODUCT" ? item.productType : null,
        serviceId: item.itemType === "SERVICE" ? item.serviceId : null,
        productId: item.itemType === "PRODUCT" ? item.productId : null,
        price: item.price,
        discountAllowed: !!item.discountAllowed,
        isActive: item.isActive ?? true,
      };

      if (item?.id) {
        await updateItem({ id: item.id, ...basePayload } as any).unwrap();
        dispatch(notify({ msg: "Item updated successfully", sev: "success" }));
      } else {
        await createItem(basePayload as any).unwrap();
        dispatch(notify({ msg: "Item created successfully", sev: "success" }));
      }

      setOpenChild(false);
      refetch();
    } catch (err: any) {
      dispatch(
        notify({
          msg: err?.data?.detail || "Failed to save item",
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

  const iconsForActions = (row: PriceListItem) => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={22}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          // ensure polymorphic fields are clean on edit
          setItem({
            ...row,
            serviceId: row.itemType === "SERVICE" ? row.serviceId : null,
            productId: row.itemType === "PRODUCT" ? row.productId : null,
            productType: row.itemType === "PRODUCT" ? row.productType : null,
          });
          setOpenChild(true);
        }}
      />
      <MdDelete
        title={row.isActive ? "Deactivate" : "Activate"}
        size={22}
        fill="var(--primary-pink)"
        className="icons-style"
        onClick={() => {
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
      render: (r: PriceListItem) => (
        <span>{formatEnumString(r.itemType)}</span>
      ),
    },
    {
      key: "productType",
      title: <Translate>Product Type</Translate>,
      flexGrow: 2,
      render: (r: PriceListItem) => (
        <span>
          {r.itemType === "PRODUCT" ? formatEnumString(r.productType) : "-"}
        </span>
      ),
    },
    {
      key: "target",
      title: <Translate>Item</Translate>,
      flexGrow: 4,
      render: (r: PriceListItem) => {
        if (r.itemType === "SERVICE") {
          return (
            <span>
              {servicesList.find((s: any) => s.id === r.serviceId)?.name ??
                r.serviceId}
            </span>
          );
        }
        return (
          <span>
            {AllProducts?.data.find((p: any) => p.Id === r.productId)?.name ??
              r.productId}
          </span>
        );
      },
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
      render: (r: PriceListItem) => (
        <span>{r.discountAllowed ? "Yes" : "No"}</span>
      ),
    },
    {
      key: "isActive",
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (r: PriceListItem) => (
        <span>{r.isActive ? "Active" : "Inactive"}</span>
      ),
    },
    {
      key: "icons",
      title: "",
      flexGrow: 2,
      render: (r: PriceListItem) => iconsForActions(r),
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
        setRecord={setItem}
      />

      {item.itemType === "PRODUCT" && (
        <MyInput
          required
          width={350}
          fieldType="select"
          fieldLabel="Product Type"
          fieldName="productType"
          selectData={productTypes ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={item}
          setRecord={setItem}
        />
      )}

      {item.itemType === "SERVICE" && (
        <MyInput
          required
          width={350}
          fieldType="select"
          fieldLabel="Service"
          fieldName="serviceId"
          selectData={servicesList}
          selectDataLabel="name"
          selectDataValue="id"
          record={item}
          setRecord={setItem}
          searchable
        />
      )}

      {item.itemType === "PRODUCT" && (
        <MyInput
          required
          width={350}
          fieldType="select"
          fieldLabel="Product"
          fieldName="productId"
          selectData={productsList}
          selectDataLabel="name"
          selectDataValue="Id"
          record={item}
          setRecord={setItem}
          searchable
          loading={isFetchingProducts}
          placeholder={
            item.productType ? "Select Product" : "Select Product Type first"
          }
          disabled={!item.productType}
        />
      )}
      {item.itemType === "PRODUCT" && (
        <MyInput
          width={350}
          fieldLabel="Base UOM"
          fieldName="baseUom"
          fieldType="select"
          selectData={uomUnitsResponse ?? []}
          selectDataLabel="uom"
          selectDataValue="id"
          record={productByIdData}
          setRecord={() => { }}
          disabled
        />

      )}
      <MyInput
        fieldName="defaultCurrency"
        fieldLabel="Currency"
        record={facilityData}
        setRecord={() => { }}
        disabled
      />
      <MyInput
       fieldName={item.itemType === "PRODUCT" ? "pricePerBaseUom" : "price"}
        fieldLabel="Cost"
        record={item.itemType === "PRODUCT" ? productByIdData : servicesData?.data.find((s: any) => s.id === item.serviceId)}
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

    // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


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
