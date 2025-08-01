import React from 'react';
import { Form, Tabs } from 'rsuite';
import { FaBuilding, FaEnvelope, FaPhone, FaGlobe } from 'react-icons/fa';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import './style.less';

interface CardProps {
  record: any;
  setRecord: (record: any) => void;
}

const Card: React.FC<CardProps> = ({ record, setRecord }) => {
  const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');

  return (
    <div className="modal-content">
      {/* Vendor Type Selection */}
      <div className="vendor-type-selection">
        <div className="vendor-header">
          {/* Icon on the left */}
          <FaBuilding className="vendor-icon" />

          {/* Content on the right */}
          <div className="vendor-content">
            {/* Supplier Type */}
            <div className="supplier-type-container">
              <MyInput
                width={250}
                fieldType="checkbox"
                fieldName=""
                checkedLabel={'Company'}
                unCheckedLabel={'Person'}
                record={record}
                setRecord={setRecord}
              />
            </div>

            {/* Company Name */}
            <div className="company-name">Wuhan Huafeida Construction Labor Se</div>

            {/* Contact Icons */}
            <div className="contact-icons">
              <div className="contact-item">
                <FaEnvelope className="contact-icon" />
                <span className="contact-text">john.smith@company.com</span>
              </div>
              <div className="contact-item">
                <FaPhone className="contact-icon" />
                <span className="contact-text">+86 137 0716 5955</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="two-column-layout">
        {/* Left Column - Address */}
        <div className="column">
          <h4 className="column-title">Address</h4>
          <div className="display-field">Bapu Village, Xinchong Town, Xinzhou District</div>
          <div className="display-field">Building A, Floor 3</div>
          <div className="display-field-row">
            <div className="display-field-half">Wuhan</div>
            <div className="display-field-half">Hubei</div>
          </div>
          <div className="display-field-row">
            <div className="display-field-half">430013</div>
            <div className="display-field-half">China</div>
          </div>
        </div>

        {/* Right Column - Other Details */}
        <div className="column">
          <div className="tax-id-container">
            <MyLabel label="Tax ID" className="field-label" />
            <div className="display-field">91420117303544945L</div>
          </div>
          <div className="website-container">
            <div className="field-with-icon">
              <FaGlobe className="field-icon" />
              <MyLabel label="Website" />
            </div>
            <div className="display-field">https://www.huafeida.com</div>
          </div>
          <div></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-section">
        <Tabs defaultActiveKey="1" appearance="subtle">
          <Tabs.Tab eventKey="1" title="Contacts">
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
          </Tabs.Tab>
          <Tabs.Tab eventKey="2" title="Sales & Purchase">
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
          </Tabs.Tab>
          <Tabs.Tab eventKey="3" title="Invoicing">
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
          </Tabs.Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default Card;
