import React, { useEffect, useState } from "react";
import MyModal from "@/components/MyModal/MyModal";
import MyInput from "@/components/MyInput";
import { Form } from "rsuite";
import {
  useAddWarehouseProductMutation,
  useUpdateWarehouseProductMutation,
} from "@/services/inventory/inventory-warehouse/warehouseProductService";
import { useGetInventoryProductsQuery } from "@/services/inventory/inventory-products/inventoryProductsService";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch } from "@/hooks";
import { FaWarehouse } from "react-icons/fa6";
import './styles.less'
const AddEditWarehouseProduct = ({
  open,
  setOpen,
  warehouseProduct,
  setWarehouseProduct,
  refetch,
  warehouse,
}) => {
  const dispatch = useAppDispatch();

  const [formUI, setFormUI] = useState({
    productName: "",
    productType: "",
    baseUom: "",
    pricePerBaseUom: "",
    avgCost: "",
  });

  const { data: products } = useGetInventoryProductsQuery({
    page: 0,
    size: 500,
    sort: "id,asc",
  });

  const [addProduct] = useAddWarehouseProductMutation();
  const [updateProduct] = useUpdateWarehouseProductMutation();

  const safeSetWarehouseProduct = (updated) => {
    setWarehouseProduct((prev) => {
      const newRecord = { ...prev, ...updated };

      // لما تتغير قيمة الـ Product Id
      if (updated.productId !== undefined) {

        // 🔥 لو شال الـ product → فضّي حقول الـ UI
        if (!updated.productId) {
          setFormUI({
            productName: "",
            productType: "",
            baseUom: "",
            pricePerBaseUom: "",
            avgCost: "",
          });

          newRecord.productId = null;
          return newRecord;
        }

        // 🔥 لو اختار Product جديد
        newRecord.productId = Number(updated.productId);

        const selected = products?.data?.find(
          (p) => p.Id === Number(updated.productId)
        );

        if (selected) {
          console.log("🔥 Selected Product:", selected);

          setFormUI({
            productName: selected.name ?? "",
            productType: selected.type ?? "",
            baseUom: selected.baseUom?.toString() ?? "",
            pricePerBaseUom: selected.pricePerBaseUom?.toString() ?? "",
            avgCost: (selected.itemAverageCost ?? 0).toString(),
          });
        }
      }

      return newRecord;
    });
  };

  const buildPayload = () => ({
    id: warehouseProduct.id,
    warehouseId: warehouse.id,
    departmentId: warehouse.departmentId,
    productId: warehouseProduct.productId ?? null,
    quantity: warehouseProduct.quantity ?? 0,
    reOrderQuantity: warehouseProduct.reOrderQuantity ?? 0,
    maxOrder: warehouseProduct.maxOrder ?? 0,
    miniOrder: warehouseProduct.miniOrder ?? 0,
    avgCost: warehouseProduct.avgCost ?? 0,
    isActive: warehouseProduct.isActive ?? true,
  });

  const handleSave = async () => {
    try {
      const payload = buildPayload();

      if (!payload.productId) {
        return dispatch(notify({ msg: "Please select a product", sev: "error" }));
      }

      if (payload.id) await updateProduct(payload).unwrap();
      else await addProduct(payload).unwrap();

      refetch();
      setOpen(false);
      dispatch(notify({ msg: "Saved successfully", sev: "success" }));
    } catch (e) {
      console.error(e);
      dispatch(notify({ msg: "Error while saving", sev: "error" }));
    }
  };

  const productOptions =
    products?.data?.map((p) => ({
      label: p.name,
      value: p.id ?? p.Id,
    })) ?? [];


  useEffect(() => {
    if (open && warehouseProduct?.productId && products?.data) {
      const selected = products.data.find(
        (p) => p.Id === Number(warehouseProduct.productId)
      );

      if (selected) {
        setFormUI({
          productName: selected.name ?? "",
          productType: selected.type ?? "",
          baseUom: selected.baseUom?.toString() ?? "",
          pricePerBaseUom: selected.pricePerBaseUom?.toString() ?? "",
          avgCost: (selected.itemAverageCost ?? 0).toString(),
        });
      }
    }
  }, [open, warehouseProduct, products]);


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={warehouseProduct.id ? "Edit Warehouse Product" : "New Warehouse Product"}
      position="right"
      size="33vw"
      steps={[{ title: "Warehouse Info", icon: <FaWarehouse /> }]}
      content={
        <Form fluid>
            <MyInput
              fieldName="productId"
              fieldType="select"
              width={"100%"}
              selectData={productOptions}
              selectDataLabel="label"
              selectDataValue="value"
              record={warehouseProduct}
              setRecord={safeSetWarehouseProduct}
            />
    <div className="warhouse-products-modal-row-handle">
            <MyInput
              fieldName="reOrderQuantity"
              fieldType="number"
              record={warehouseProduct}
              setRecord={safeSetWarehouseProduct}
            />

            <MyInput
              fieldName="maxOrder"
              fieldType="number"
              record={warehouseProduct}
              setRecord={safeSetWarehouseProduct}
            />

            <MyInput
              fieldName="miniOrder"
              fieldType="number"
              record={warehouseProduct}
              setRecord={safeSetWarehouseProduct}
            />

            <MyInput fieldName="productName" record={formUI} setRecord={setFormUI} disabled />
            <MyInput fieldName="productType" record={formUI} setRecord={setFormUI} disabled />
            <MyInput fieldName="baseUom" record={formUI} setRecord={setFormUI} disabled />
            <MyInput fieldName="pricePerBaseUom" record={formUI} setRecord={setFormUI} disabled />
            <MyInput fieldName="avgCost" record={formUI} setRecord={setFormUI} disabled />


</div>
        </Form>
      }
      actionButtonLabel="SAVE"
      actionButtonFunction={handleSave}
    />
  );
};

export default AddEditWarehouseProduct;
