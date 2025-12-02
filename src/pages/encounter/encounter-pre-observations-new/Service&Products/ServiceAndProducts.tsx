import React, { useEffect, useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import { useLocation } from 'react-router-dom';
import { faTrash, faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetServicesQuery } from '@/services/setup/serviceService';
import { initialListRequest, ListRequest } from '@/types/types';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { ApNurseServiceProduct } from '@/types/model-types';
import { newApNurseServiceProduct } from '@/types/model-types-constructor';
import {
  useGetNurseServiceProductListQuery,
  useRemoveNurseServiceProductMutation,
  useSaveNurseServiceProductMutation,
} from '@/services/encounterService';
import {
  useGetInventoryProductsQuery,
} from '@/services/inventory/inventory-products/inventoryProductsService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
import { notify } from '@/utils/uiReducerActions';
import { BrandMedication, InventoryProduct } from '@/types/model-types-new';

const SERVICE_CATEGORY_LKEY = '19257854232732994';
const PRODUCT_CATEGORY_LKEY = '19257880375908711';

const ServiceAndProductsTab = ({ edit: propEdit }) => {
  const location = useLocation();
  const patient = location.state?.patient;
  const encounter = location.state?.encounter;

  const [nurseServiceProductListRequest, setNurseServiceProductListRequest] =
    useState<ListRequest>({
      ...initialListRequest,
      filters: [
        { fieldName: 'encounter_key', operator: 'match', value: encounter?.key },
        { fieldName: 'patient_key', operator: 'match', value: patient?.key },
        { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
      ],
      pageSize: 100,
    });

  const authSlice = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const page = 0;
  const size = 100;
  const sort = 'id,asc';

  // LOVs & master data
  const { data: categoryLovResponse } = useGetLovValuesByCodeQuery('CATEGORY');
  const { data: serviceListResponse } = useGetServicesQuery({
    facilityId: authSlice?.tenant?.selectedFacility?.id,
    page,
    size,
    sort,
  });
  const { data: inventoryProductsResponse } = useGetInventoryProductsQuery({
    page,
    size,
    sort,
  });
  const { data: brandMedicationList } = useGetAllBrandMedicationsQuery({
    page: 0,
    size: 500,
    sort: 'id,asc',
  });

  const [saveNurseServiceProduct] = useSaveNurseServiceProductMutation();
  const [removeNurseServiceProduct] = useRemoveNurseServiceProductMutation();
  const { data: nurseServiceProductListResponse, refetch } =
    useGetNurseServiceProductListQuery(nurseServiceProductListRequest);

  const productType = useEnumOptions('ProductTypes');
  const [selectedProductType, setSelectedProductType] = useState<{ type: string }>({ type: '' });

  const state = location.state || {};
  const edit = propEdit ?? state.edit;

  const [openModal, setOpenModal] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  const [nurseServiceAndProduct, setNurseServiceAndProduct] =
    useState<ApNurseServiceProduct>({ ...newApNurseServiceProduct });

  // ---- Helpers ----

  const products: InventoryProduct[] = inventoryProductsResponse?.data ?? [];
  const brands: BrandMedication[] = brandMedicationList?.data ?? [];
  const services = serviceListResponse?.data ?? [];

  const filteredProducts: InventoryProduct[] = useMemo(() => {
    if (!selectedProductType?.type) return products;
    return products.filter((p) => p.type === selectedProductType.type);
  }, [products, selectedProductType]);

  const productsWithDisplayName = useMemo(() => {
    return filteredProducts.map((p) => {
      let displayName = p.name;
      if (p.type === 'MEDICATION' && p.brandId) {
        const brand = brands.find((b) => String(b.id) === String(p.brandId));
        if (brand) displayName = brand.name;
      }
      return { ...p, displayName };
    });
  }, [filteredProducts, brands]);

  const getProductById = (id?: number | string) =>
    products.find((p) => String(p.Id) === String(id));

  const getBrandById = (id?: number | string) =>
    brands.find((b) => String(b.id) === String(id));

  // ---- Actions ----

  const handleAddNewService = () => {
    setNurseServiceAndProduct({ ...newApNurseServiceProduct });
    setSelectedProductType({ type: '' });
    setPopupOpen(true);
  };

  const handleDelete = async () => {
    if (nurseServiceAndProduct?.key === undefined) return;

    try {
      await removeNurseServiceProduct({
        ...nurseServiceAndProduct,
      }).unwrap();
      dispatch(
        notify({ msg: 'Patient Service/Product Deleted Successfully', sev: 'success' })
      );
      setNurseServiceAndProduct({ ...newApNurseServiceProduct });
      refetch();
      setOpenModal(false);
    } catch (error) {
      console.log('Failed to delete Patient Service/Product', error);
      dispatch(
        notify({ msg: 'Failed to delete Patient Service/Product', sev: 'error' })
      );
    }
  };

  const handleSave = async () => {
    try {
      const payload: ApNurseServiceProduct = {
        ...nurseServiceAndProduct,
        patientKey: patient?.key,
        encounterKey: encounter?.key,
        departmentId: authSlice?.tenant?.selectedFacility?.departmentId,
        ...(nurseServiceAndProduct.key === undefined
          ? { createdBy: authSlice?.user?.key }
          : { updatedBy: authSlice?.user?.key }),
      };

      await saveNurseServiceProduct(payload).unwrap();

      dispatch(
        notify({
          msg:
            nurseServiceAndProduct.key === undefined
              ? 'Patient Service/Product Added Successfully'
              : 'Patient Service/Product Updated Successfully',
          sev: 'success',
        })
      );

      setNurseServiceAndProduct({ ...newApNurseServiceProduct });
      refetch();
      setPopupOpen(false);
    } catch (error) {
      console.log('Failed to save Patient Service/Product', error);
      dispatch(
        notify({ msg: 'Failed to save Patient Service/Product', sev: 'error' })
      );
    }
  };

  // ---- Effects ----

  // refresh list filter when encounter/patient change
  useEffect(() => {
    setNurseServiceProductListRequest((prev) => ({
      ...prev,
      filters: [
        { fieldName: 'encounter_key', operator: 'match', value: encounter?.key },
        { fieldName: 'patient_key', operator: 'match', value: patient?.key },
        { fieldName: 'deleted_at', operator: 'isNull', value: undefined },
      ],
    }));
  }, [encounter, patient]);

  // Pricing for PRODUCTS (all types)
  useEffect(() => {
    if (nurseServiceAndProduct.categoryLkey !== PRODUCT_CATEGORY_LKEY) return;

    const product = getProductById(nurseServiceAndProduct.warehouseProductId);
    if (!product) {
      setNurseServiceAndProduct((prev) => ({
        ...prev,
        baseUomId: 0,
        baseUOM: '',
        unitPrice: 0,
        totalPrice: 0,
        brandId: undefined,
      }));
      return;
    }

    const baseUomId = product.baseUom ?? 0;
    const baseUomName = product.dispenseUom ?? '';

    // parse pricePerBaseUom safely
    let unitPrice = 0;
    if (product.pricePerBaseUom != null) {
      const raw = String(product.pricePerBaseUom);
      const cleaned = raw.replace(/[^0-9.,-]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      unitPrice = isNaN(parsed) ? 0 : parsed;
    }

    const qty = Number(nurseServiceAndProduct.quantity) || 0;

    setNurseServiceAndProduct((prev) => ({
      ...prev,
      brandId:
        product.type === 'MEDICATION' && product.brandId
          ? Number(product.brandId)
          : prev.brandId,
      baseUomId,
      baseUOM: baseUomName,
      unitPrice,
      totalPrice: unitPrice * qty,
    }));
  }, [
    nurseServiceAndProduct.categoryLkey,
    nurseServiceAndProduct.warehouseProductId,
    nurseServiceAndProduct.quantity,
    inventoryProductsResponse,
  ]);

  // Pricing for SERVICES
  useEffect(() => {
    if (nurseServiceAndProduct.categoryLkey !== SERVICE_CATEGORY_LKEY) return;
    if (!services.length) return;
    if (!nurseServiceAndProduct.serviceId) return;

    const selectedService = services.find(
      (s) => s.id === nurseServiceAndProduct.serviceId
    );
    const unitPrice = selectedService?.price ?? 0;
    const qty = Number(nurseServiceAndProduct.quantity) || 0;

    setNurseServiceAndProduct((prev) => ({
      ...prev,
      unitPrice,
      totalPrice: unitPrice * qty,
    }));
  }, [
    nurseServiceAndProduct.categoryLkey,
    nurseServiceAndProduct.serviceId,
    nurseServiceAndProduct.quantity,
    serviceListResponse,
  ]);

  // ---- Table columns ----

  const columns = [
    {
      key: 'Category',
      title: 'Category',
      render: (rowData) =>
        rowData?.categoryLkey
          ? rowData.categoryLvalue.lovDisplayVale
          : rowData.categoryLkey,
    },
    {
      key: 'name',
      title: 'Name',
      isLink: true,
      render: (rowData) => {
        if (rowData.categoryLkey === PRODUCT_CATEGORY_LKEY) {
          const product = getProductById(rowData.warehouseProductId);
          if (!product) return rowData.name;

          if (product.type === 'MEDICATION' && product.brandId) {
            const brand = getBrandById(product.brandId);
            return <span>{brand?.name ?? product.name}</span>;
          }

          return <span>{product.name}</span>;
        }

        if (rowData.categoryLkey === SERVICE_CATEGORY_LKEY) {
          const service = services.find((s) => s.id === rowData.serviceId);
          return <span>{service?.name ?? rowData.name}</span>;
        }

        return rowData.name;
      },
    },
    {
      key: 'type',
      title: 'Type',
      render: (rowData) => {
        if (rowData.categoryLkey === SERVICE_CATEGORY_LKEY) {
          const service = services.find((s) => s.id === rowData.serviceId);
          return service?.category ?? '';
        }

        if (rowData.categoryLkey === PRODUCT_CATEGORY_LKEY) {
          const product = getProductById(rowData.warehouseProductId);
          if (!product) return rowData.type ?? '';
          if (product.type === 'MEDICATION') return 'Medication';
          return product.type;
        }

        return rowData.type ?? '';
      },
    },
    { key: 'quantity', title: 'Quantity' },
    {
      key: '',
      title: '',
      render: (rowData) => (
        <FontAwesomeIcon
          icon={faTrash}
          style={{ cursor: 'pointer', color: 'var(--primary-pink)' }}
          onClick={() => {
            setNurseServiceAndProduct(rowData);
            setOpenModal(true);
          }}
          title="Delete"
        />
      ),
    },
  ];

  return (
    <div>
      {/* Add button */}
      <div className="bt-div">
        <div className="bt-right">
          <MyButton
            prefixIcon={() => <PlusIcon />}
            disabled={edit}
            onClick={handleAddNewService}
          >
            Add
          </MyButton>
        </div>
      </div>

      {/* Table */}
      <MyTable
        data={nurseServiceProductListResponse?.object ?? []}
        columns={columns}
      />

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

            {/* Service */}
            {nurseServiceAndProduct.categoryLkey === SERVICE_CATEGORY_LKEY && (
              <>
                <MyInput
                  fieldName="serviceId"
                  fieldLabel="Services"
                  fieldType="select"
                  record={nurseServiceAndProduct}
                  setRecord={setNurseServiceAndProduct}
                  selectData={services}
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

            {/* Product */}
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

                <MyInput
                  fieldName="warehouseProductId"
                  fieldLabel="Product"
                  fieldType="select"
                  record={nurseServiceAndProduct}
                  setRecord={setNurseServiceAndProduct}
                  selectData={productsWithDisplayName}
                  selectDataLabel="displayName"
                  selectDataValue="Id"
                  searchable={true}
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
{/* 
                <MyInput
                  fieldName="baseUOM"
                  fieldLabel="Base UOM"
                  record={nurseServiceAndProduct}
                  setRecord={setNurseServiceAndProduct}
                  disabled={true}
                  width={150}
                /> */}
              </>
            )}
          </Form>
        )}
      />

      <DeletionConfirmationModal
        open={openModal}
        setOpen={setOpenModal}
        itemToDelete={'product/service'}
        actionButtonFunction={handleDelete}
        actionType="delete"
        confirmationQuestion="Are you sure you want to delete this product/service?"
        actionButtonLabel="Delete"
        cancelButtonLabel="Cancel"
      />
    </div>
  );
};

export default ServiceAndProductsTab;
