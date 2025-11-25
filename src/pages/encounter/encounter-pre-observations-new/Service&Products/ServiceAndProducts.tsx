import React, { useState } from 'react';
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
import { useGetProductQuery, useGetServicesQuery } from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

// Local fallback service list
const servicesList = [
  { id: 'srv1', name: 'General Consultation', baseUOM: 'Hour' },
  { id: 'srv2', name: 'Physiotherapy Session', baseUOM: 'Session' },
  { id: 'srv3', name: 'Dental Cleaning', baseUOM: 'Visit' }
];

// Local fallback product list
const productsList = [
  { id: 'prd1', name: 'Vitamin D Supplement', baseUOM: 'Tablet' },
  { id: 'prd2', name: 'COVID-19 Vaccine', baseUOM: 'Dose' },
  { id: 'prd3', name: 'Blood Pressure Monitor', baseUOM: 'Piece' }
];

const initialTableData = [
  { id: 1, category: 'Service', name: 'Consultation', type: 'Service', quantity: 1 },
  { id: 2, category: 'Product', name: 'BSM Kit',  type: 'Product', quantity: 2 },
  { id: 3, category: 'Service', name: 'Vital Signs',   type: 'Service', quantity: 1 }
];

const ServiceAndProductsTab = ({ edit: propEdit }) => {
  // List request params for API
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 100
  });

  // Fetch products & services from API
  const { data: productListResponse } = useGetProductQuery(listRequest);
  const { data: serviceListResponse } = useGetServicesQuery(listRequest);

  // Table data
  const [data, setData] = useState(initialTableData);


  const location = useLocation();
  const state = location.state || {};
  const edit = propEdit ?? state.edit;

  const [openModal, setOpenModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  // Modal state
  const [popupOpen, setPopupOpen] = useState(false);

  // Form state for modal
  const [formData, setFormData] = useState({
    category: '',
    itemId: '',
    quantity: '',
    productKey: '',
    serviceKey: ''
  });

  // Base unit of measurement for selected item
  const [baseUOM, setBaseUOM] = useState('');

  // Open modal for adding new entry
  const handleAddNewService = () => {
    setFormData({ category: '', itemId: '', quantity: '' });
    setBaseUOM('');
    setPopupOpen(true);
  };
  const handleDelete = () => {
    if (itemToDelete) {
      setData(prev => prev.filter(item => item.id !== itemToDelete.id));
      setItemToDelete(null);
      setOpenModal(false);
    }
  };

  // Save new service or product to table
  const handleSave = () => {
    // read form values
    const { category, serviceKey, productKey, quantity } = formData;

    // choose appropriate source list (API response preferred, fallback to local)
    const servicesSource = serviceListResponse?.object ?? servicesList;
    const productsSource = productListResponse?.object ?? productsList;

    // try to find selected item (support both API objects with 'key' and local ones with 'id')
    let selectedItem = null;
    if (category === 'Service') {
      selectedItem = servicesSource.find(it => String(it.key ?? it.id) === String(serviceKey));
    } else if (category === 'Product') {
      selectedItem = productsSource.find(it => String(it.key ?? it.id) === String(productKey));
    }

    // derive values (graceful fallback if selectedItem not found)
    const name =
      selectedItem?.name || (category === 'Service' ? serviceKey : productKey) || 'Unnamed Item';
    const type = selectedItem?.baseUOM || selectedItem?.uom || '';
    const qty = quantity ? Number(quantity) : 1;

    // build new row and append to table data
    const newItem = {
      id: Date.now(),
      category: category || 'Product', // default to Product if empty
      name,
      type,
      quantity: qty
    };

    setData(prev => [...prev, newItem]);

    // reset modal form and close
    setPopupOpen(false);
    setFormData({ category: '', itemId: '', quantity: '', productKey: '', serviceKey: '' });
    setBaseUOM('');
  };

  // Table columns
  const columns = [
    { key: 'category', title: 'Category ' },
    {
      key: 'name',
      title: 'Name',
      isLink: true,
      render: rowData => {
        if (rowData.category === 'Product') {
          return (
            <a
              href={`#/products/${rowData.id}`}
              style={{ color: 'var(--primary-blue)', textDecoration: 'underline' }}
            >
              {rowData.name}
            </a>
          );
        }
        return rowData.name;
      }
    },
    { key: 'type', title: 'Type' },
    { key: 'quantity', title: 'Quantity' },
    {
      key: '',
      title: '',
      render: rowData => (
        <FontAwesomeIcon
          icon={faTrash}
          style={{ cursor: 'pointer', color: 'var(--primary-pink)' }}
          onClick={() => {
            setItemToDelete(rowData);
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
      <MyTable data={data} columns={columns} />

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
              fieldName="category"
              fieldType="select"
              record={formData}
              setRecord={setFormData}
              selectData={[
                { label: 'Service', value: 'Service' },
                { label: 'Product', value: 'Product' }
              ]}
              selectDataLabel="label"
              selectDataValue="value"
              placeholder="Select Category"
              searchable={false}
              width={150}
            />

            {/* Service selection */}
            {formData.category === 'Service' && (
              <MyInput
                fieldName="serviceKey"
                fieldLabel="Services"
                fieldType="select"
                record={formData}
                setRecord={setFormData}
                selectData={serviceListResponse?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                searchable={false}
                width={150}
              />
            )}

            {/* Product selection & quantity */}
            {formData.category === 'Product' && (
              <>
                <MyInput
                  fieldName="productKey"
                  fieldLabel="Products"
                  fieldType="select"
                  record={formData}
                  setRecord={setFormData}
                  selectData={productListResponse?.object ?? []}
                  selectDataLabel="name"
                  selectDataValue="key"
                  searchable={false}
                  width={150}
                />

                <MyInput
                  fieldName="quantity"
                  fieldType="number"
                  record={formData}
                  setRecord={setFormData}
                  placeholder="Enter quantity"
                  min={1}
                  width={150}
                />

                {/* Base UOM (read-only) */}
                <MyInput
                  fieldName="baseUOM"
                  fieldType="text"
                  fieldLabel="BaseUOM"
                  record={baseUOM}
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
        itemToDelete={itemToDelete?.category}
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
