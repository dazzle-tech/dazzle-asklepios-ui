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
import { useGetProductQuery } from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetServicesQuery } from '@/services/setupService';

const servicesList = [
  { id: 'srv1', name: 'General Consultation', baseUOM: 'Hour' },
  { id: 'srv2', name: 'Physiotherapy Session', baseUOM: 'Session' },
  { id: 'srv3', name: 'Dental Cleaning', baseUOM: 'Visit' }
];

const productsList = [
  { id: 'prd1', name: 'Vitamin D Supplement', baseUOM: 'Tablet' },
  { id: 'prd2', name: 'COVID-19 Vaccine', baseUOM: 'Dose' },
  { id: 'prd3', name: 'Blood Pressure Monitor', baseUOM: 'Piece' }
];

const ServiceAndProductsTab = ({ edit: propEdit }) => {
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 100
  });

  const { data: productListResponse } = useGetProductQuery(listRequest);
  const { data: serviceListResponse } = useGetServicesQuery(listRequest);

  console.log('productListResponse==>', productListResponse);
  const [data, setData] = useState([
    {
      id: 1,
      category: 'Product',
      name: 'Central Line',
      type: 'Consumable',
      quantity: 30
    },
    {
      id: 2,
      category: 'Product',
      name: 'Syringe',
      type: 'Consumable',
      quantity: 5
    },
    {
      id: 3,
      category: 'Service',
      name: 'ER Fees',
      type: 'Consultation',
      quantity: 10
    }
  ]);
  const location = useLocation();
  const state = location.state || {};
  const edit = propEdit ?? state.edit;
  //
  const [popupOpen, setPopupOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    itemId: '',
    quantity: '',
    productKey: '',
    serviceKey: ''
  });
  const [baseUOM, setBaseUOM] = useState('');

  const handleDelete = id => {
    setData(prev => prev.filter(item => item.id !== id));
  };

  const handleAddNewService = () => {
    setFormData({ category: '', itemId: '', quantity: '' });
    setBaseUOM('');
    setPopupOpen(true);
  };

  const handleSave = () => {
    const { category, itemId, quantity } = formData;

    // التحقق من أن الحقول الأساسية موجودة
    if (!category || !itemId || !quantity) {
      alert('Please fill all required fields.');
      return;
    }

    // التحقق من أن الكمية صحيحة
    if (Number(quantity) <= 0) {
      alert('Quantity must be greater than 0.');
      return;
    }

    // اختيار القائمة المناسبة
    const selectedList = category === 'Service' ? servicesList : productsList;
    const selectedItem = selectedList.find(i => i.id === itemId);

    if (!selectedItem) {
      alert(`${category} not found.`);
      return;
    }

    // التحقق من عدم التكرار
    const isDuplicate = data.some(d => d.category === category && d.name === selectedItem.name);
    if (isDuplicate) {
      alert(`${selectedItem.name} already exists in the list.`);
      return;
    }

    // إنشاء العنصر الجديد
    const newItem = {
      id: Date.now(),
      category,
      name: selectedItem.name,
      type: selectedItem.baseUOM,
      quantity: Number(quantity)
    };

    // الإضافة للقائمة
    setData(prev => [...prev, newItem]);

    // إغلاق البوب أب وتصفية البيانات
    setPopupOpen(false);
    setFormData({ category: '', itemId: '', quantity: '', productKey: '', serviceKey: '' });
    setBaseUOM('');
  };

  const columns = [
    {
      key: 'category',
      title: 'Category '
    },
    {
      key: 'name',
      title: 'Name'
    },
    {
      key: 'type',
      title: 'Type'
    },
    {
      key: 'quantity',
      title: 'Quantity'
    },
    {
      key: '',
      title: '',
      render: rowData => (
        <FontAwesomeIcon
          icon={faTrash}
          style={{ cursor: 'pointer', color: 'red' }}
          onClick={() => handleDelete(rowData.id)}
          title="Delete"
        />
      )
    }
  ];
  return (
    <div>
      <div className="bt-div">
        <div className="bt-right">
          <MyButton prefixIcon={() => <PlusIcon />} disabled={edit} onClick={handleAddNewService}>
            Add
          </MyButton>
        </div>
      </div>
      <MyTable data={data} columns={columns} />

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
    </div>
  );
};

export default ServiceAndProductsTab;
