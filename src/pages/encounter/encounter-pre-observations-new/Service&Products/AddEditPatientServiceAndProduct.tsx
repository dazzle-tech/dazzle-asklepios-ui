import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form } from 'rsuite';
import { useLocation } from 'react-router-dom';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetServicesQuery } from '@/services/setup/serviceService';
import { useGetInventoryProductsQuery } from '@/services/inventory/inventory-products/inventoryProductsService';
import {
  useCreatePatientServiceOrProductMutation,
  useUpdatePatientServiceOrProductMutation,
} from '@/services/encounters/patientServicesAndProductsService';
import { notify } from '@/utils/uiReducerActions';
import {
  InventoryProduct,
  PatientServiceAndProduct,
  PatientServiceProductCreateDTO,
  PatientServiceProductUpdateDTO,
} from '@/types/model-types-new';
import {
  newPatientServiceAndProduct,
  newPatientServiceProductCreateDTO,
  newPatientServiceProductUpdateDTO,
} from '@/types/model-types-constructor-new';

const AddEditPatientServiceAndProduct = ({
  open,
  setOpen,
  patientServiceAndProduct,
  setPatientServiceAndProduct,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  patientServiceAndProduct: PatientServiceAndProduct;
  setPatientServiceAndProduct: (patientServiceAndProduct: PatientServiceAndProduct) => void;
}) => {
  const authSlice = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const patient = location.state?.patient;
  const encounter = location.state?.encounter;
  const prevCategoryRef = useRef<string | undefined>(patientServiceAndProduct?.category);

  // Filters product list by selected product type in the form.
  const [selectedProductType, setSelectedProductType] = useState<{ type: string }>({ type: '' });

  const categoryEnumResponse = useEnumOptions('PatientServiceCategory');
  const productType = useEnumOptions('ProductTypes');

  // Master data for service/product lookups.
  const { data: inventoryProductsResponse } = useGetInventoryProductsQuery({
    page: 0,
    size: 100,
    sort: 'id,asc',
  });
  const { data: serviceListResponse } = useGetServicesQuery({
    facilityId: authSlice?.tenant?.selectedFacility?.id,
    page: 0,
    size: 100,
    sort: 'id,asc',
  });

  const products: InventoryProduct[] = inventoryProductsResponse?.data ?? [];
  const services = serviceListResponse?.data ?? [];

  const filteredProducts: InventoryProduct[] = useMemo(() => {
    if (!selectedProductType?.type) return [];
    return products.filter((p) => p.type === selectedProductType.type);
  }, [products, selectedProductType]);

  // Keep selected product type in sync while editing existing rows.
  useEffect(() => {
    if (patientServiceAndProduct?.category !== 'PRODUCT') {
      setSelectedProductType({ type: '' });
      return;
    }

    if (selectedProductType?.type) return;

    const selectedProduct = products.find((p) => p.Id === patientServiceAndProduct?.productId);
    if (selectedProduct?.type) {
      setSelectedProductType({ type: selectedProduct.type });
    }
  }, [patientServiceAndProduct, products, selectedProductType?.type]);

  // Clear opposite fields when category changes between SERVICE and PRODUCT.
  useEffect(() => {


    if (patientServiceAndProduct?.category === 'SERVICE') {
      setPatientServiceAndProduct({
        ...patientServiceAndProduct,
        productId: undefined,
      });
      setSelectedProductType({ type: '' });
    }

    if (patientServiceAndProduct?.category === 'PRODUCT') {
      setPatientServiceAndProduct({
        ...patientServiceAndProduct,
        serviceId: undefined,
      });
    }

  }, [patientServiceAndProduct?.category, setPatientServiceAndProduct]);

  const [createPatientServiceAndProduct] = useCreatePatientServiceOrProductMutation();
  const [updatePatientServiceAndProduct] = useUpdatePatientServiceOrProductMutation();

  // Extract readable backend message when available.
  const extractErrorMessage = (response) => {
    try {
      const msg = response?.data?.message;
      if (typeof msg === 'string') return msg.replace(/^error\./i, '');
      return '';
    } catch {
      return '';
    }
  };

  // Required validation similar to warning modal approach.
  const getValidationError = () => {
    let errorMsg = '';

    if (!patientServiceAndProduct?.category) {
      errorMsg += errorMsg ? ', Category can`t be empty' : 'Category can`t be empty';
    }

    if (patientServiceAndProduct?.category === 'SERVICE' && !patientServiceAndProduct?.serviceId) {
      errorMsg += errorMsg ? ', Service can`t be empty' : 'Service can`t be empty';
    }

    if (patientServiceAndProduct?.category === 'PRODUCT' && !selectedProductType?.type) {
      errorMsg += errorMsg ? ', Type can`t be empty' : 'Type can`t be empty';
    }

    if (patientServiceAndProduct?.category === 'PRODUCT' && !patientServiceAndProduct?.productId) {
      errorMsg += errorMsg ? ', Product can`t be empty' : 'Product can`t be empty';
    }

    if (!patientServiceAndProduct?.quantity || Number(patientServiceAndProduct?.quantity) <= 0) {
      errorMsg += errorMsg ? ', Quantity should be greater than 0' : 'Quantity should be greater than 0';
    }

    return errorMsg;
  };

  // Modal content.
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            {/* Category */}
            <MyInput
              width="100%"
              fieldName="category"
              fieldType="select"
              selectData={categoryEnumResponse ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={patientServiceAndProduct}
              setRecord={setPatientServiceAndProduct}
              searchable={false}
              required
            />

            {/* Service fields */}
            {patientServiceAndProduct.category === 'SERVICE' && (
              <>
                <MyInput
                  fieldName="serviceId"
                  fieldLabel="Service"
                  fieldType="select"
                  record={patientServiceAndProduct}
                  setRecord={setPatientServiceAndProduct}
                  selectData={services}
                  selectDataLabel="name"
                  selectDataValue="id"
                  searchable={false}
                  width="100%"
                  required
                />
                <MyInput
                  fieldName="quantity"
                  fieldType="number"
                  record={patientServiceAndProduct}
                  setRecord={setPatientServiceAndProduct}
                  width="100%"
                  required
                />
              </>
            )}

            {/* Product fields */}
            {patientServiceAndProduct.category === 'PRODUCT' && (
              <>
                <MyInput
                  fieldLabel="Type"
                  fieldName="type"
                  fieldType="select"
                  selectData={productType ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={selectedProductType}
                  setRecord={setSelectedProductType}
                  menuMaxHeight={200}
                  width="100%"
                  searchable={false}
                  required
                />

                <MyInput
                  fieldName="productId"
                  fieldLabel="Product"
                  fieldType="select"
                  record={patientServiceAndProduct}
                  setRecord={setPatientServiceAndProduct}
                  selectData={filteredProducts}
                  selectDataLabel="name"
                  selectDataValue="Id"
                  searchable={true}
                  width="100%"
                  required
                />

                <MyInput
                  fieldName="quantity"
                  fieldType="number"
                  record={patientServiceAndProduct}
                  setRecord={setPatientServiceAndProduct}
                  width="100%"
                  required
                />
              </>
            )}
          </Form>
        );
      default:
        return null;
    }
  };

  const handleSave = async () => {
    const validationError = getValidationError();
    if (validationError) {
      dispatch(notify({ msg: validationError, sev: 'warning' }));
      return;
    }

    try {
      if (!patientServiceAndProduct?.id) {
        const createDTO: PatientServiceProductCreateDTO = {
          ...newPatientServiceProductCreateDTO,
          patientId: patient?.id,
          encounterId: encounter?.id,
          category: patientServiceAndProduct.category,
          serviceId: patientServiceAndProduct.serviceId,
          productId: patientServiceAndProduct.productId,
          quantity: patientServiceAndProduct.quantity,
        };

        await createPatientServiceAndProduct(createDTO).unwrap();
        dispatch(
          notify({
            msg: 'Patient Service/Product Added Successfully',
            sev: 'success',
          })
        );
      } else {
        const updateDTO: PatientServiceProductUpdateDTO = {
          ...newPatientServiceProductUpdateDTO,
          id: patientServiceAndProduct.id,
          category: patientServiceAndProduct.category,
          serviceId: patientServiceAndProduct.serviceId,
          productId: patientServiceAndProduct.productId,
          quantity: patientServiceAndProduct.quantity,
        };

        await updatePatientServiceAndProduct({
          id: patientServiceAndProduct.id,
          body: updateDTO,
          encounterId: encounter?.id,
        }).unwrap();
        dispatch(
          notify({
            msg: 'Patient Service/Product Updated Successfully',
            sev: 'success',
          })
        );
      }

      setPatientServiceAndProduct({ ...newPatientServiceAndProduct });
      setOpen(false);
    } catch (error) {
      const errorMsg = extractErrorMessage(error) || 'Failed to save Patient Service/Product';
      dispatch(notify({ msg: errorMsg, sev: 'warning' }));
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add New Service or Product"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      position="right"
      size="30vw"
      bodyheight="80vh"
      content={conjureFormContent}
    />
  );
};

export default AddEditPatientServiceAndProduct;
