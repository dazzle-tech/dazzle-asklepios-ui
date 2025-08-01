import React from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import {
  faHandshake,
  faUser,
  faPhone,
  faFileInvoiceDollar,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

const AddSupplierSetup = ({ open, setOpen, record, setRecord }) => {
  const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
  const { data: approvedCategoryLovQueryResponse } = useGetLovValuesByCodeQuery(
    'PURCH_PRODUCTS_CATEGORIES'
  );

  const ModalContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
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
                fieldLabel="Supplier Type"
                fieldName="supplierType"
                selectData={[
                  { label: 'Company', key: 'company' },
                  { label: 'Person', key: 'person' }
                ]}
                selectDataLabel="label"
                selectDataValue="key"
                record={{}}
                setRecord={''}
              />
            </div>
          </Form>
        );
      case 1:
        return (
          <Form fluid>
            <div className="form-container">
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
      case 2:
        return (
          <Form fluid>
            <div className="form-container">
              <MyInput
                width={250}
                fieldType="text"
                fieldLabel="Email"
                fieldName={'Email'}
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="text"
                fieldLabel="Primary Phone Number"
                fieldName={'primaryPhoneNumber'}
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="text"
                fieldLabel="Second Phone Number"
                fieldName={'secondPhoneNumber'}
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="text"
                fieldLabel="Website"
                fieldName={'website'}
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="text"
                fieldLabel="Emargency Contact Name"
                fieldName={'emargencyContactName'}
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="text"
                fieldLabel="Emargency Contact Phone"
                fieldName={'emargencyContactPhone'}
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={512}
                fieldType="textarea"
                fieldLabel="Note"
                fieldName={'note'}
                record={record}
                setRecord={setRecord}
              />
            </div>
          </Form>
        );
      case 3:
        return (
          <Form fluid>
            <div className="form-container">
              <MyInput
                width={250}
                fieldType="select"
                fieldLabel="Payment Terms"
                fieldName={'paymentTerms'}
                selectData={currencyLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="select"
                fieldLabel="Currency"
                fieldName={'currency'}
                selectData={currencyLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="number"
                fieldLabel="Lead Time"
                fieldName={'leadTime'}
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="select"
                fieldLabel="Purchase Price list"
                fieldName={'purchasePriceList'}
                selectData={[
                  { label: 'Price List A', key: 'A' },
                  { label: 'Price List B', key: 'B' },
                  { label: 'Price List C', key: 'C' }
                ]}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="number"
                fieldLabel="Credit Limit"
                fieldName={'creditLimit'}
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="select"
                fieldLabel="Default Warehouse"
                fieldName={'defaultWarehouse'}
                record={record}
                setRecord={setRecord}
                selectData={[
                  { label: 'Warehouse A', key: 'A' },
                  { label: 'Warehouse B', key: 'B' },
                  { label: 'Warehouse C', key: 'C' }
                ]}
                selectDataLabel="label"
                selectDataValue="key"
              />
            </div>
          </Form>
        );
      case 4:
        return (
          <Form fluid>
            <div className="form-container">
              <MyInput
                width={250}
                fieldType="text"
                fieldLabel="Supplier Account Code"
                fieldName={'supplierAccountCode'}
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="text"
                fieldLabel="Tax ID"
                fieldName={'taxId'}
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="select"
                fieldLabel="Invoice Currency"
                fieldName={'invoiceCurrency'}
                selectData={currencyLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="number"
                fieldLabel="Retention Percentage"
                fieldName="retentionPercentage"
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="multyPicker"
                fieldLabel="Allowed Payment Methods"
                fieldName="allowedPaymentMethods"
                selectData={[
                  { label: 'visa', key: 'A' },
                  { label: 'cash', key: 'B' },
                  { label: 'check', key: 'C' }
                ]}
                selectDataLabel="label"
                selectDataValue="key"
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={250}
                fieldType="checkbox"
                fieldLabel="Invoice Approach Required"
                fieldName="invoiceApproachRequired"
                record={record}
                setRecord={setRecord}
              />
            </div>
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Supplier Setup"
      steps={[
        { title: 'Basic Info', icon: <FontAwesomeIcon icon={faUser} /> },
        { title: 'Address Info', icon: <FontAwesomeIcon icon={faMapMarkerAlt} /> },
        { title: 'Contact', icon: <FontAwesomeIcon icon={faPhone} /> },
        { title: 'Sales & Purchase', icon: <FontAwesomeIcon icon={faHandshake} /> },
        { title: 'Invoicing', icon: <FontAwesomeIcon icon={faFileInvoiceDollar} /> }
      ]}
      size="37vw"
      position="right"
      actionButtonLabel="Save"
      content={ModalContent}
    />
  );
};

export default AddSupplierSetup;
