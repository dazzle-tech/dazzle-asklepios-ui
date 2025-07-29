import React from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { faHandshake } from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

const AddSupplierSetup = ({ open, setOpen, record, setRecord }) => {
  const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
  const { data: supplierLovQueryResponse } = useGetLovValuesByCodeQuery('SUPPLIER_TYPE');
  const { data: approvedCategoryLovQueryResponse } = useGetLovValuesByCodeQuery(
    'PURCH_PRODUCTS_CATEGORIES'
  );
  // modal content
  const ModalContent = (
    <Form fluid>
      <div className="form-container">
        <MyInput
          width={250}
          fieldType="text"
          fieldLabel="Supplier Name"
          fieldName={'supplierName'}
          record={record}
          setRecord={setRecord}
          required
        />
        <MyInput
          width={250}
          fieldType="text"
          fieldLabel="Supplier Code"
          fieldName={'supplierCode'}
          record={record}
          setRecord={setRecord}
          required
        />

        <MyInput
          width={250}
          fieldType="select"
          fieldName="Currency"
          fieldLabel="Currency"
          selectData={currencyLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={{}}
          setRecord={''}
        />
        <MyInput
          width={250}
          fieldType="select"
          fieldLabel="Approved Category"
          fieldName="approvedCategory"
          selectData={approvedCategoryLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={{}}
          setRecord={''}
        />
        <MyInput
          width={250}
          fieldType="select"
          fieldName="supplierType"
          fieldLabel="Supplier Type"
          selectData={supplierLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={{}}
          setRecord={''}
        />
        <MyInput
          width={250}
          fieldType="select"
          fieldLabel="Status"
          fieldName={'status'}
          selectData={[
            { label: 'Active', key: 'Active' },
            { label: 'Deactive', key: 'Deactive' }
          ]}
          selectDataLabel="label"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width={250}
          fieldType="text"
          fieldLabel="Phone"
          fieldName={'phone'}
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width={250}
          fieldType="text"
          fieldLabel="Email"
          fieldName={'email'}
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width={250}
          fieldType="text"
          fieldLabel="Contact Person"
          fieldName={'contactPerson'}
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width={250}
          fieldType="textarea"
          fieldLabel="Payment Terms"
          fieldName="paymentTerms"
          record={record}
          setRecord={setRecord}
        />
        <span className="custom-text">Address Information</span>
        <MyInput
          width={250}
          fieldType="select"
          fieldLabel="Country"
          fieldName={'country'}
          selectData={[
            { label: 'United States', key: 'US' },
            { label: 'United Kingdom', key: 'UK' },
            { label: 'Canada', key: 'CA' },
            { label: 'Germany', key: 'DE' },
            { label: 'France', key: 'FR' }
          ]}
          selectDataLabel="label"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width={250}
          fieldType="select"
          fieldLabel="State/Province"
          fieldName={'state'}
          selectData={[
            { label: 'New York', key: 'NY' },
            { label: 'California', key: 'CA' },
            { label: 'Texas', key: 'TX' },
            { label: 'Florida', key: 'FL' }
          ]}
          selectDataLabel="label"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width={250}
          fieldType="select"
          fieldLabel="City"
          fieldName={'city'}
          selectData={[
            { label: 'New York City', key: 'NYC' },
            { label: 'Los Angeles', key: 'LA' },
            { label: 'Chicago', key: 'CHI' },
            { label: 'Houston', key: 'HOU' }
          ]}
          selectDataLabel="label"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width={250}
          fieldType="text"
          fieldLabel="Street Name"
          fieldName={'streetName'}
          record={record}
          setRecord={setRecord}
        />
      </div>
    </Form>
  );
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Supplier Setup"
      steps={[
        {
          title: 'Supplier Setup',
          icon: <FontAwesomeIcon icon={faHandshake} />
        }
      ]}
      size="37vw"
      position="right"
      actionButtonLabel="Save"
      content={ModalContent}
    />
  );
};

export default AddSupplierSetup;
