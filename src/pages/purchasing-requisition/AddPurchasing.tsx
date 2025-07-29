import React, { useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus, faBroom } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import './styles.less';
// Component for adding a purchasing requisition
const AddPurchasing = ({ open, setOpen }) => {
  // Fetching LOV values for currency, urgency, and purchase types
  const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
  const { data: urgencyLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  const { data: purchaseLovQueryResponse } = useGetLovValuesByCodeQuery('PURCH_TYPES');
  const [record, setRecord] = useState({
    text: '',
    number: 0,
    checkbox: true,
    date: new Date(),
    datetime: new Date(),
    time: new Date(),
    select: '',
    multy: [],
    check: false,
    textarea: '',
    checkPicker: []
  });
  // Model content
  const modelContent = (
    <>
      <Form fluid>
        <div className="form-container">
          <MyInput
            fieldLabel="Initiated by"
            fieldName="Initiated by"
            fieldType="select"
            selectData={[
              { key: 'emp1', lovDisplayVale: 'Mohammed' },
              { key: 'emp2', lovDisplayVale: 'Layla' }
            ]}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
            width={250}
            required
          />
          <MyInput
            fieldLabel="Initiated Department"
            fieldName="Initiated Department"
            fieldType="select"
            selectData={[
              { key: 'HR', lovDisplayVale: 'HR Department' },
              { key: 'IT', lovDisplayVale: 'IT Department' }
            ]}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
            width={250}
            required
          />
          <MyInput
            fieldLabel="Category Name"
            fieldName="Category Name"
            fieldType="select"
            selectData={[
              { key: 'cat1', lovDisplayVale: 'Furniture' },
              { key: 'cat2', lovDisplayVale: 'Electronics' }
            ]}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
            width={250}
            required
          />
          <MyInput
            fieldLabel="Estimated Delivery Date"
            fieldName="Estimated Delivery Date"
            fieldType="datetime"
            record={record}
            setRecord={setRecord}
            width={250}
          />
          <MyInput
            fieldLabel="Recommended Supplier"
            fieldName="Recommended Supplier"
            fieldType="select"
            selectData={[
              { key: 'sup1', lovDisplayVale: 'Supplier One' },
              { key: 'sup2', lovDisplayVale: 'Supplier Two' }
            ]}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
            width={250}
          />
          <MyInput
            fieldName="Urgency Level"
            fieldLabel="Urgency Level"
            fieldType="select"
            selectData={urgencyLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={{}}
            setRecord={''}
            width={250}
          />
          <MyInput
            fieldLabel="Estimated Budget"
            fieldName="Estimated Budget"
            fieldType="number"
            record={record}
            setRecord={setRecord}
            width={250}
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
            fieldLabel="Justification"
            fieldName="Justification"
            fieldType="select"
            selectData={[
              { key: 'business', lovDisplayVale: 'Business Need' },
              { key: 'mandatory', lovDisplayVale: 'Mandatory Purchase' }
            ]}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
            width={250}
            required
          />
          <MyInput
            fieldLabel="Created Department"
            fieldName="Created Department"
            fieldType="select"
            disabled={true}
            selectData={[
              { key: 'd1', lovDisplayVale: 'Procurement' },
              { key: 'd2', lovDisplayVale: 'Operations' }
            ]}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
            width={250}
            required
          />
          <MyInput
            fieldLabel="Last Purchase Order"
            fieldName="Last Purchase Order"
            fieldType="select"
            disabled={true}
            selectData={[
              { key: 'PO123', lovDisplayVale: 'PO123' },
              { key: 'PO124', lovDisplayVale: 'PO124' }
            ]}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
            width={250}
          />
          <MyInput
            fieldLabel="Stock Name"
            fieldName="Stock Name"
            fieldType="select"
            selectData={[
              { key: 'main', lovDisplayVale: 'Main Store' },
              { key: 'branch', lovDisplayVale: 'Branch Store' }
            ]}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={record}
            setRecord={setRecord}
            width={250}
            required
          />

          <MyInput
            fieldLabel="Order ID"
            fieldName="Order ID"
            fieldType="number"
            record={record}
            setRecord={setRecord}
            width={250}
            required
          />
          <MyInput
            fieldLabel="Purchase Requistation type"
            fieldName="Purchase Requistation type"
            fieldType="select"
            selectData={purchaseLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={{}}
            setRecord={''}
            width={250}
          />
        </div>
      </Form>
    </>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Purchasing Requisition"
      steps={[
        {
          title: 'Purchasing Requisition',
          icon: <FontAwesomeIcon icon={faCartPlus} />,
          footer: <MyButton prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}>clear</MyButton>
        }
      ]}
      size="38vw"
      position="right"
      actionButtonLabel="Create"
      content={modelContent}
    />
  );
};

export default AddPurchasing;
