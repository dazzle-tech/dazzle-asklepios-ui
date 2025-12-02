import React, { useEffect, useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import { useLocation } from 'react-router-dom';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery, useGetProductQuery, useGetWarehouseProductsQuery } from '@/services/setupService';
import { useGetServicesQuery } from '@/services/setup/serviceService';
import { initialListRequest, ListRequest } from '@/types/types';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import authSlice from '@/reducers/authSlice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { ApNurseServiceProduct } from '@/types/model-types';
import { newApNurseServiceProduct } from '@/types/model-types-constructor';
import { useGetNurseServiceProductListQuery, useRemoveNurseServiceProductMutation, useSaveNurseServiceProductMutation } from '@/services/encounterService';
import { conjureValueBasedOnIDFromList, conjureValueBasedOnKeyFromList } from '@/utils';
import {
  useGetInventoryProductsQuery,
} from '@/services/inventory/inventory-products/inventoryProductsService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
import { notify } from '@/utils/uiReducerActions';
import { BrandMedication, InventoryProduct, UOMGroupUnit } from '@/types/model-types-new';
import { useGetAllUnitsByGroupIdQuery } from '@/services/setup/uom-group/uomGroupService';

const ServiceAndProductsTab = ({ edit: propEdit }) => {
  const location = useLocation();
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 100
  });
  const SERVICE_CATEGORY_LKEY = '19257854232732994';
  const PRODUCT_CATEGORY_LKEY = '19257880375908711';
  const { data: categoryLovResponse } = useGetLovValuesByCodeQuery('CATEGORY');
  const patient = location.state?.patient;
  const encounter = location.state?.encounter;
  const [nurseServiceProductListRequest, setNurseServiceProductListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      { fieldName: 'encounter_key', operator: 'match', value: encounter?.key },
      { fieldName: 'patient_key', operator: 'match', value: patient?.key },
      { fieldName: 'deleted_at', operator: 'isNull', value: undefined }
    ],
    pageSize: 100
  });

  const authSlice = useAppSelector(state => state.auth);
  const page = 0;
  const size = 100;
  const sort = 'id,asc';

  // Fetch products & services from API
  const { data: serviceListResponse } = useGetServicesQuery({ facilityId: authSlice?.tenant?.selectedFacility?.id, page, size, sort });
  const { data: inventoryProductsResponse } = useGetInventoryProductsQuery({ page, size, sort });
  const [saveNurseServiceProduct] = useSaveNurseServiceProductMutation();
  const [removeNurseServiceProduct] = useRemoveNurseServiceProductMutation();
  const { data: nurseServiceProductListResponse, refetch } = useGetNurseServiceProductListQuery(nurseServiceProductListRequest);
  const dispatch = useAppDispatch();
  const [selectedProductType, setSelectedProductType] = useState({ type: '' });
  const productType = useEnumOptions("ProductTypes");

  const state = location.state || {};
  const edit = propEdit ?? state.edit;

  const [openModal, setOpenModal] = useState(false);
  // Modal state
  const [popupOpen, setPopupOpen] = useState(false);

  const [nurseServiceAndProduct, setNurseServiceAndProduct] = useState<ApNurseServiceProduct>({ ...newApNurseServiceProduct });
  const { data: brandMedicationList } = useGetAllBrandMedicationsQuery({
    page: 0,
    size: 500,
    sort: "id,asc",
  });

  // Open modal for adding new entry
  const handleAddNewService = () => {
    setNurseServiceAndProduct({ ...newApNurseServiceProduct });
    setPopupOpen(true);
  };
  const handleDelete = async () => {
    if (nurseServiceAndProduct?.key !== undefined) {
      try {
        await removeNurseServiceProduct({
          ...nurseServiceAndProduct,
        }).unwrap();
        dispatch(notify({ msg: 'Patient Service/Product Deleted Successfully', sev: 'success' }));
        setNurseServiceAndProduct({ ...newApNurseServiceProduct });
        refetch();
        setOpenModal(false);
      } catch (error) {
        console.log("Failed to save Patient Service/Product", error);
        dispatch(notify({ msg: 'Failed to save Patient Service/Product', sev: 'error' }));
      }

    }
  };

  // Save new service or product to table
  const handleSave = async () => {
    try {
      if (nurseServiceAndProduct.key === undefined) {
        await saveNurseServiceProduct({
          ...nurseServiceAndProduct,
          patientKey: patient?.key,
          encounterKey: encounter?.key,
          departmentId: authSlice?.tenant?.selectedFacility?.departmentId,
          createdBy: authSlice?.user?.key
        }).unwrap();
        dispatch(notify({ msg: 'Patient Service/Product Added Successfully', sev: 'success' }));
        setNurseServiceAndProduct({ ...newApNurseServiceProduct });
      } else {
        await saveNurseServiceProduct({
          ...nurseServiceAndProduct,
          patientKey: patient?.key,
          encounterKey: encounter?.key,
          departmentId: authSlice?.tenant?.selectedFacility?.departmentId,
          updatedBy: authSlice?.user?.key
        }).unwrap();

        dispatch(
          notify({ msg: 'Patient Service/Product Updated Successfully', sev: 'success' })
        );
      }
      refetch();
      setPopupOpen(false);
    } catch (error) {
      console.log("Failed to save Patient Service/Product", error);
      dispatch(notify({ msg: 'Failed to save Patient Service/Product', sev: 'error' }));
    }

  };

  // بعد ما يكون عندك brandMedicationList و inventoryProductsResponse
const selectedBrand = useMemo(
  () =>
    brandMedicationList?.data?.find(
      (b: BrandMedication) =>
        String(b.id) === String(nurseServiceAndProduct.brandId)
    ),
  [brandMedicationList, nurseServiceAndProduct.brandId]
);

const relatedProduct = useMemo(
  () =>
    (inventoryProductsResponse?.data as InventoryProduct[] | undefined)?.find(
      p => String(p.brandId) === String(selectedBrand?.id)
    ),
  [inventoryProductsResponse, selectedBrand]
);

const uomGroupIdForMedication = useMemo(() => {
  const fromProduct = relatedProduct?.uomGroupId
    ? Number(relatedProduct.uomGroupId)
    : undefined;
  const fromBrand = selectedBrand?.uomGroupId;

  return fromProduct ?? fromBrand;
}, [relatedProduct, selectedBrand]);

const { data: uomUnits } = useGetAllUnitsByGroupIdQuery(
  uomGroupIdForMedication!,
  { skip: !uomGroupIdForMedication }
);

  const filteredProducts = useMemo(() => {
    const all: InventoryProduct[] = inventoryProductsResponse?.data ?? [];

    if (!selectedProductType?.type || selectedProductType.type === 'MEDICATION') {
      return all;
    }

    return all.filter(p => p.type === selectedProductType.type);
  }, [inventoryProductsResponse, selectedProductType]);

  useEffect(() => {
    setNurseServiceProductListRequest(prev => ({
      ...prev,
      filters: [
        { fieldName: 'encounter_key', operator: 'match', value: encounter?.key },
        { fieldName: 'patient_key', operator: 'match', value: patient?.key },
        { fieldName: 'deleted_at', operator: 'isNull', value: undefined }
      ]
    }));
  }, [encounter, patient]);

  useEffect(() => {
  if (nurseServiceAndProduct.categoryLkey !== PRODUCT_CATEGORY_LKEY) return;

  if (selectedProductType?.type === 'MEDICATION') return;

  const allProducts: InventoryProduct[] = inventoryProductsResponse?.data ?? [];

  if (!nurseServiceAndProduct.warehouseProductId) {
    setNurseServiceAndProduct(prev => ({
      ...prev,
      baseUOM: '',
      unitPrice: 0,
      totalPrice: 0,
    }));
    return;
  }

 
  const product = allProducts.find(
    p => String(p.Id) === String(nurseServiceAndProduct.warehouseProductId)
  );

;
  const baseUomName = product?.baseUom ?? '';
  const unitPrice = product ? Number(product.pricePerBaseUom) || 0 : 0;
  const qty = Number(nurseServiceAndProduct.quantity) || 0;

  setNurseServiceAndProduct(prev => ({
    ...prev,
    baseUOM: baseUomName,
    unitPrice,
    totalPrice: unitPrice * qty,
  }));
}, [
  nurseServiceAndProduct.categoryLkey,
  nurseServiceAndProduct.warehouseProductId,
  nurseServiceAndProduct.quantity,
  selectedProductType?.type,
  inventoryProductsResponse,
]);


useEffect(() => {
  
  if (nurseServiceAndProduct.categoryLkey !== PRODUCT_CATEGORY_LKEY) return;
  if (selectedProductType?.type !== 'MEDICATION') return;


  if (!nurseServiceAndProduct.brandId) {
    setNurseServiceAndProduct(prev => ({
      ...prev,
      baseUomId: 0,
      baseUOM: '',
      unitPrice: 0,
      totalPrice: 0,
    }));
    return;
  }

  const brands: BrandMedication[] = brandMedicationList?.data ?? [];
  const allProducts: InventoryProduct[] = inventoryProductsResponse?.data ?? [];
  const allUomUnits: UOMGroupUnit[] = uomUnits ?? [];

  const brand = brands.find(
    b => String(b.id) === String(nurseServiceAndProduct.brandId)
  );
  const prod = allProducts.find(
    p => String(p.brandId) === String(brand?.id)
  );

 
  const baseUomId =
    prod?.baseUom ??
    brand?.uomGroupUnitId ??
    0;

  const uomRow = allUomUnits.find(u => u.id === baseUomId);
  const baseUomName = uomRow?.uom ?? prod?.dispenseUom ?? '';

  const unitPrice = prod ? Number(prod.pricePerBaseUom) || 0 : 0;
  const qty = Number(nurseServiceAndProduct.quantity) || 0;

  setNurseServiceAndProduct(prev => ({
    ...prev,
    baseUOM: baseUomName,     
    unitPrice,
    totalPrice: unitPrice * qty,
  }));
}, [
  nurseServiceAndProduct.categoryLkey,
  selectedProductType?.type,
  nurseServiceAndProduct.brandId,
  nurseServiceAndProduct.quantity,
  brandMedicationList,
  inventoryProductsResponse,
  uomUnits,
  uomGroupIdForMedication,
]);

  useEffect(() => {
    // Only apply this logic for Service category
    if (nurseServiceAndProduct.categoryLkey !== '19257854232732994') return;
    if (!serviceListResponse?.data?.length) return;
    if (!nurseServiceAndProduct.serviceId) return;

    const selectedService = serviceListResponse.data.find(
      (s) => s.id === nurseServiceAndProduct.serviceId
    );

    const unitPrice = selectedService?.price ?? 0;
    const qty = Number(nurseServiceAndProduct.quantity) || 0;

    setNurseServiceAndProduct(prev => ({
      ...prev,
      unitPrice,
      totalPrice: unitPrice * qty
    }));
  }, [
    nurseServiceAndProduct.categoryLkey,
    nurseServiceAndProduct.serviceId,
    nurseServiceAndProduct.quantity,
    serviceListResponse
  ]);

  // Table columns
  const columns = [
    {
      key: 'Category',
      title: 'Category',
      render: rowData =>
        rowData?.categoryLkey
          ? rowData.categoryLvalue.lovDisplayVale
          : rowData.categoryLkey
    },
    {
      key: 'name',
      title: 'Name',
      isLink: true,
      render: rowData => {
        //  Product
        if (rowData.categoryLkey === PRODUCT_CATEGORY_LKEY) {
          // 1) Brand Medication
          if (rowData.brandId) {
            return (
              <span>
                {conjureValueBasedOnIDFromList(
                  brandMedicationList?.data ?? [],
                  rowData.brandId,
                  'name'
                )}
              </span>
            );
          }

          // 2) Inventory Product 
          return (
            <span>
              {conjureValueBasedOnIDFromList(
                inventoryProductsResponse?.data ?? [],
                rowData.warehouseProductId,
                'name'
              )}
            </span>
          );
        }

        // Service
        if (rowData.categoryLkey === SERVICE_CATEGORY_LKEY) {
          return (
            <span>
              {conjureValueBasedOnIDFromList(
                serviceListResponse?.data ?? [],
                rowData.serviceId,
                'name'
              )}
            </span>
          );
        }

        return rowData.name;
      }
    },
    {
      key: 'type',
      title: 'Type',
      render: rowData => {
        if (rowData.categoryLkey === SERVICE_CATEGORY_LKEY) {
          return conjureValueBasedOnIDFromList(
            serviceListResponse?.data ?? [],
            rowData.serviceId,
            'category'
          );
        }

        //  Product
        if (rowData.categoryLkey === PRODUCT_CATEGORY_LKEY) {
          if (rowData.brandId) {
            return 'Medication';
          }

          return conjureValueBasedOnIDFromList(
            inventoryProductsResponse?.data ?? [],
            rowData.warehouseProductId,
            'type'
          );
        }

        return rowData.type ?? '';
      }
    },

    { key: 'quantity', title: 'Quantity' },
    {
      key: '',
      title: '',
      render: rowData => (
        <FontAwesomeIcon
          icon={faTrash}
          style={{ cursor: 'pointer', color: 'var(--primary-pink)' }}
          onClick={() => {
            setNurseServiceAndProduct(rowData);
            setOpenModal(true);
          }}
          title="Delete"
        />
      )
    }
  ];

  return (
    <div>
      {/* Add button */}
      <div className="bt-div">
        <div className="bt-right">
          <MyButton prefixIcon={() => <PlusIcon />} disabled={edit} onClick={handleAddNewService}>
            Add
          </MyButton>
        </div>
      </div>

      {/* Table */}
      <MyTable data={nurseServiceProductListResponse?.object ?? []} columns={columns} />

      {/* Modal for adding service/product */}
      <MyModal
        open={popupOpen}
        setOpen={setPopupOpen}
        title="Add New Service or Product"
        actionButtonLabel="Save"
        actionButtonFunction={handleSave}
        position="right"
        size="30vw"
        bodyheight="80vh"
        steps={[{ title: 'New Service or Product', icon: <FontAwesomeIcon icon={faStar} /> }]}
        content={() => (
          <Form>
            {/* Category selection */}
            <MyInput
              width={150}
              fieldName="categoryLkey"
              fieldType="select"
              selectData={categoryLovResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              fieldLabel="Category"
              selectDataValue="key"
              record={nurseServiceAndProduct}
              setRecord={setNurseServiceAndProduct}
              searchable={false}
            />

            {/* Service selection */}
            {nurseServiceAndProduct.categoryLkey === '19257854232732994' && (
              <>
                <MyInput
                  fieldName="serviceId"
                  fieldLabel="Services"
                  fieldType="select"
                  record={nurseServiceAndProduct}
                  setRecord={setNurseServiceAndProduct}
                  selectData={serviceListResponse?.data ?? []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  searchable={false}
                  width={150}
                />
                <MyInput
                  fieldName="quantity"
                  fieldType="number"
                  record={nurseServiceAndProduct}
                  setRecord={setNurseServiceAndProduct}
                  min={1}
                  width={150}
                  required
                />
              </>


            )}

            {/* Product selection & quantity */}
            {nurseServiceAndProduct.categoryLkey === PRODUCT_CATEGORY_LKEY && (
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
                  width={150}
                  searchable={false}
                />

                {selectedProductType?.type === "MEDICATION" ? (
                  <MyInput
                    fieldLabel="Brand Medication"
                    fieldName="brandId"
                    fieldType="select"
                    selectData={brandMedicationList?.data ?? []}
                    selectDataLabel="name"
                    selectDataValue="id"
                    record={nurseServiceAndProduct}
                    setRecord={setNurseServiceAndProduct}
                    width={150}
                    searchable={true}
                  />
                ) : (
                  <MyInput
                    fieldName="warehouseProductId"
                    fieldLabel="Product"
                    fieldType="select"
                    record={nurseServiceAndProduct}
                    setRecord={setNurseServiceAndProduct}
                    selectData={filteredProducts}
                    selectDataLabel="name"
                    selectDataValue="Id"
                    searchable={false}
                    width={150}
                  />
                )}

                <MyInput
                  fieldName="quantity"
                  fieldType="number"
                  record={nurseServiceAndProduct}
                  setRecord={setNurseServiceAndProduct}
                  min={1}
                  width={150}
                  required
                />


                <MyInput
                  fieldName="baseUOM"
                  fieldLabel="Base UOM"
                  record={nurseServiceAndProduct}
                  setRecord={setNurseServiceAndProduct}
                  disabled={true}
                  className="readonly-input"
                  width={150}
                />
              </>
            )}




          </Form>
        )}
      />
      <DeletionConfirmationModal
        open={openModal}
        setOpen={setOpenModal}
        itemToDelete={"product/service"}
        actionButtonFunction={handleDelete}
        actionType="delete"
        confirmationQuestion=""
        actionButtonLabel="Delete"
        cancelButtonLabel="Cancel"
      />
    </div>
  );
};

export default ServiceAndProductsTab;
