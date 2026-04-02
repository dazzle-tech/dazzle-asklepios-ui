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

  // Helper function to convert baseUom to number (bigint)
  // Backend expects Long (bigint), not string or null
  const convertBaseUomToNumber = (value: any): number | null => {
    if (value == null || value === '' || value === undefined) return null;
    // Handle string "0" or number 0
    if (value === '0' || value === 0) return 0;
    // Convert to number
    const num = Number(value);
    // Return null if conversion resulted in NaN or non-finite number
    if (isNaN(num) || !isFinite(num)) return null;
    return num;
  };

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
      delete cleanProduct.currency;
      
      // Get baseUom from original product and convert to number
      // Remove from cleanProduct to prevent string contamination
      const baseUomValue = product?.baseUom;
      delete cleanProduct.baseUom;
      
      // Convert baseUom to number (bigint) - backend expects Long, not String
      const convertedBaseUom = convertBaseUomToNumber(baseUomValue);
      
      // Validate that baseUom is provided (backend requires it, even though @NotEmpty is wrong annotation)
      if (convertedBaseUom == null || convertedBaseUom <= 0 || typeof convertedBaseUom !== 'number') {
        dispatch(notify({ 
          msg: "Base UOM is required. Please select a Base UOM unit.", 
          sev: "warning" 
        }));
        return;
      }
      
      // Final safety check: Ensure baseUom is definitely a number (not string, not null)
      // This is critical because backend has invalid @NotEmpty annotation on Long
      const finalBaseUom = typeof convertedBaseUom === 'number' && !isNaN(convertedBaseUom) 
        ? convertedBaseUom 
        : null;
      
      if (finalBaseUom == null || finalBaseUom <= 0) {
        dispatch(notify({ 
          msg: "Base UOM is required. Please select a Base UOM unit.", 
          sev: "warning" 
        }));
        return;
      }
      
        const basePayload: InventoryProduct = {
          ...cleanProduct,
          id: cleanProduct?.id ?? undefined,
          name: cleanProduct?.name?.trim(),
          type: cleanProduct?.type || null,
          // baseUom must be a number (bigint/Long), not string or null
          // Backend has @NotEmpty on Long which is invalid - this needs to be fixed on backend
          // We ensure it's always a valid positive number
          baseUom: finalBaseUom,
          dispenseUom: cleanProduct?.dispenseUom || null,
          inventoryType: cleanProduct?.inventoryType || null,
          isActive: cleanProduct?.isActive ?? true,
          controlledSubstance: cleanProduct?.controlledSubstance ?? false,
          hazardousBiohazardousTag: cleanProduct?.hazardousBiohazardousTag || null,
          allergyRisk: cleanProduct?.allergyRisk ?? false,
        };

      // 🔍 Debug: Show the payload being sent to backend
      console.log("=== PAYLOAD BEING SENT TO BACKEND ===");
      console.log("Full payload object:", basePayload);
      console.log("--- baseUom Details ---");
      console.log("baseUom value:", basePayload.baseUom);
      console.log("baseUom type:", typeof basePayload.baseUom);
      console.log("baseUom is number?", typeof basePayload.baseUom === 'number');
      console.log("baseUom is null?", basePayload.baseUom === null);
      console.log("baseUom is undefined?", basePayload.baseUom === undefined);
      console.log("Original product.baseUom:", product?.baseUom);
      console.log("Original product.baseUom type:", typeof product?.baseUom);
      console.log("Converted baseUom:", convertedBaseUom);
      console.log("================================");

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
      const errorKey = err?.data?.properties?.message;
      const backendTitle = err?.data?.title;
      const errorDetail = err?.data?.detail || '';
      
      let msg = backendTitle || "Failed to save product";

      // Handle specific validation errors
      if (errorKey === "error.unique.name.type") {
        msg = "❗ Product name already exists for this type!";
      } else if (errorKey === "error.unique.code.type") {
        msg = "❗ Product code already exists for this type!";
      } else if (errorDetail?.includes("NotEmpty") && errorDetail?.includes("baseUom")) {
        // Backend validation error: @NotEmpty annotation is incorrectly used on Long type
        msg = "❗ Backend Configuration Error: The backend has an invalid validation annotation on baseUom field. Please contact backend team to change @NotEmpty to @NotNull on the baseUom field in InventoryProductsCreateDTO.";
        console.error("Backend Validation Error:", errorDetail);
        console.error("This is a backend configuration issue. The @NotEmpty annotation cannot be used on Long (bigint) fields.");
      }

      dispatch(
        notify({
          msg,
          sev: "warning",
        })
      );
    }
  };


  // 🔄 Clear Form
  const handleClear = () => {
    setProduct({ ...newInventoryProduct });
    setOpen(false);
  };

  // ------------------ UI CONTENT -----------------------

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

        // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <MyModal
    open={open}
    setOpen={setOpen}
    title="Product Setup"
    size="lg"
    bodyheight="65vh"
    content={<div dir={dir}>{content()}</div>}
    hideBack={true}
    steps={[{ title: "Product Setup", icon: <FontAwesomeIcon icon={faDiceD6} /> }]}
    actionButtonLabel="Save"
    actionButtonFunction={handleSave}
    handleCancelFunction={handleClear}
    />
  );
};

export default AddEditProduct;
