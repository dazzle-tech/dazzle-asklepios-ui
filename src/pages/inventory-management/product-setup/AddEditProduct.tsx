import React, { useEffect, useState } from "react";
import MyInput from "@/components/MyInput";
import { Form, Row, Col, Divider, Text } from "rsuite";
import MyButton from "@/components/MyButton/MyButton";
import MyModal from "@/components/MyModal/MyModal";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch, useAppSelector } from "@/hooks";

// 🆕 Model
import { InventoryProduct } from "@/types/model-types-new";
import { newInventoryProduct } from "@/types/model-types-constructor-new";

// 🆕 New Service
import {
  useCreateInventoryProductMutation,
  useUpdateInventoryProductMutation,
} from "@/services/inventory/inventory-products/inventoryProductsService";

// 🧩 Tabs
import BasicInf from "./BasicInf";
import UomGroup from "./UOMGroup";
import InventoryAttributes from "./InventoryAttributes";
import RegulSafty from "./RegulSafty";
import FinancCostInfo from "./FinancCostInfo";
import MaintenanceInformation from "./MaintenanceInformation";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiceD6 } from "@fortawesome/free-solid-svg-icons";
import SectionContainer from "@/components/SectionsoContainer";

const AddEditProduct = ({ open, setOpen, product, setProduct }) => {
  const dispatch = useAppDispatch();

  const facility = useAppSelector((state) => state.auth?.tenant);

  // 🆕 Mutations
  const [createProduct] = useCreateInventoryProductMutation();
  const [updateProduct] = useUpdateInventoryProductMutation();

  const handleSave = async () => {
    try {
      const cleanProduct: any = { ...product };

      // 🧹 remove backend extra fields
      delete cleanProduct.Id;
      delete cleanProduct.createdAt;
      delete cleanProduct.createdBy;
      delete cleanProduct.updatedAt;
      delete cleanProduct.updatedBy;
      delete cleanProduct.Id;

        const basePayload: InventoryProduct = {
          ...cleanProduct,
          id: cleanProduct?.id ?? undefined,
          name: cleanProduct?.name?.trim(),
          type: cleanProduct?.type || null,
          baseUom: cleanProduct?.baseUom || null,
          dispenseUom: cleanProduct?.dispenseUom || null,
          inventoryType: cleanProduct?.inventoryType || null,
          isActive: cleanProduct?.isActive ?? true,
          controlledSubstance: cleanProduct?.controlledSubstance ?? false,
          hazardousBiohazardousTag: cleanProduct?.hazardousBiohazardousTag || null,
          allergyRisk: cleanProduct?.allergyRisk ?? false,
        };

      if (!cleanProduct.id) {
        // ➕ Create
        await createProduct(basePayload).unwrap();
        dispatch(notify({ msg: "Product created successfully", sev: "success" }));
      } else {
        // 🔄 Update
        await updateProduct(basePayload).unwrap();
        dispatch(notify({ msg: "Product updated successfully", sev: "success" }));
      }
      setOpen(false);
      setProduct({ ...newInventoryProduct });
    } 
    catch (err: any) {
      console.log("Save Product Error:", err);

      const errorKey = err?.data?.properties?.message;
      const backendTitle = err?.data?.title;
      let msg = backendTitle || "Failed to save product";

      if (errorKey === "error.unique.name.type") msg = "❗ Product name already exists for this type!";
      if (errorKey === "error.unique.code.type") msg = "❗ Product code already exists for this type!";

      dispatch(
        notify({
          msg,
          sev: "error",
        })
      );
    }
  };


console.log("Facility", facility);

  // 🔄 Clear Form
  const handleClear = () => {
    setProduct({ ...newInventoryProduct });
    setOpen(false);
  };

  // ------------------ UI CONTENT -----------------------

  console.log(facility?.selectedFacility?.defaultCurrency);

  const content = () => (
    <>
      <Row gutter={10}>
        <Form fluid>
<div className="section-row-product-page">
          <Col md={12}>
          <Row>
              <SectionContainer 
                title="Basic Information" 
                content={<BasicInf product={product} setProduct={setProduct} disabled={false} />} 
              />
          </Row>
            <Row>
              <SectionContainer 
                title="UOM Group" 
                content={<UomGroup product={product} setProduct={setProduct} disabled={false} />} 
              />
            </Row>

            <Row>
              <SectionContainer 
                title="Regulatory & Safety" 
                content={<RegulSafty product={product} setProduct={setProduct} disabled={false} />} 
              />
            </Row>
            <Row>
            <SectionContainer 
                  title="Financial & Costing Information" 
                  content={<FinancCostInfo 
                  product={product} 
                  setProduct={setProduct} 
                  disabled={false} 
                  facilityCurrency={facility?.selectedFacility?.defaultCurrency}
                />} 
              />
            </Row>
          </Col>

          <Col md={12}>
            <Row>
                <SectionContainer 
                  title="Maintenance Information" 
                  content={<MaintenanceInformation product={product} setProduct={setProduct} disabled={false} />} 
              />
            </Row>

            <Row>
              <SectionContainer 
                  title="Inventory Attributes" 
                  content={<InventoryAttributes product={product} setProduct={setProduct} disabled={false} />} 
              />
            </Row>
          </Col></div>
        </Form>
      </Row>
    </>
  );
  return (
    <MyModal
    open={open}
    setOpen={setOpen}
    title="Product Setup"
    size="lg"
    bodyheight="65vh"
    content={content}
    hideBack={true}
    steps={[{ title: "Product Setup", icon: <FontAwesomeIcon icon={faDiceD6} /> }]}
    actionButtonLabel="Save"
    actionButtonFunction={handleSave}
    handleCancelFunction={handleClear}
    />
  );
};

export default AddEditProduct;
