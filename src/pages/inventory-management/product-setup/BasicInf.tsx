import React, { useEffect } from "react";
import { Form } from "rsuite";
import MyInput from "@/components/MyInput";
import { useEnumOptions } from "@/services/enumsApi";
import { useGetAllBrandMedicationsQuery } from "@/services/setup/brandmedication/BrandMedicationService ";

const BasicInf = ({ product, setProduct, disabled }) => {
  const productType = useEnumOptions("ProductTypes");

const { data: brandMedicationList } = useGetAllBrandMedicationsQuery({
  page: 0,
  size: 500,
  sort: "id,asc",
});


useEffect(() => {
  if (product?.type !== "MEDICATION") return;

  const med = brandMedicationList?.data?.find(
    item => item.id === product?.brandId
  );

  setProduct(prev => ({
    ...prev,
    code: med?.code ?? prev.code,
    name: med?.name ?? prev.name,
  }));
}, [product.type, product.brandId, brandMedicationList]);

      // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <Form fluid>
        <MyInput
          fieldLabel="Type"
          fieldName="type"
          fieldType="select"
          selectData={productType ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={product}
          setRecord={setProduct}
          menuMaxHeight={200}
          width={400}
          searchable={false}
          disabled={disabled}
          required
        />
      </Form>

      {product.type === "MEDICATION" ? (
        <Form fluid>
          <MyInput
            fieldLabel="Brand Medication"
            fieldName="brandId"
            fieldType="select"
            selectData={brandMedicationList?.data ?? []}
            selectDataLabel="name"
            selectDataValue="id"
            record={product}
            setRecord={setProduct}
            menuMaxHeight={200}
            width={400}
            searchable={true}
            disabled={disabled}
            required
          />




<div className="flex-row-product-set-up-page">
          <MyInput fieldLabel="Name" fieldName="name"   disabled record={product} setRecord={setProduct}/>
          <MyInput fieldLabel="Code" fieldName="code"   disabled record={product} setRecord={setProduct}/> </div>
          {/* <MyInput fieldLabel="ATC Code" fieldName="medATC" disabled record={product} setRecord={setProduct}/> */}
        </Form>
      ) : (
        <Form fluid>
          <div className="flex-row-product-set-up-page">
          <MyInput fieldLabel="Name" fieldName="name" record={product} setRecord={setProduct} disabled={disabled} required/>
          <MyInput fieldLabel="Code" fieldName="code" record={product} setRecord={setProduct} disabled={disabled}/></div>
        </Form>
      )}

      {/* 🧾 Barcode */}
      <Form fluid>
        <MyInput
          fieldLabel="Barcode / QR Code"
          fieldName="barcode"
          record={product}
          setRecord={setProduct}
          disabled={disabled}
        />
      </Form>
    </div>
  );
};

export default BasicInf;
