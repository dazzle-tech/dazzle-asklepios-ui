// import React, { useState } from 'react';
// import MyInput from '@/components/MyInput';
// import { Form } from 'rsuite';
// import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
// import MyButton from '@/components/MyButton/MyButton';
// import ReloadIcon from '@rsuite/icons/Reload';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faBolt } from '@fortawesome/free-solid-svg-icons';
// import Translate from '@/components/Translate';
// import MyTable from '@/components/MyTable';
// import { Checkbox } from 'rsuite';
// import { useGetLovValuesByCodeQuery } from '@/services/setupService';
// const AddPayment = ({ isReadOnly }) => {
//     const [paymentMethodSelected, setPaymentMethodSelected] = useState(null);
//     const [validationResult] = useState({});

//     // Fetch LOV data for various fields
//     const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
//     const { data: paymentMethodLovQueryResponse } = useGetLovValuesByCodeQuery('PAY_METHOD');

//     // Table Columns
//     const columns = [
//         {
//             key: 'select',
//             flexGrow: 1,
//             title: (
//                 <Checkbox />
//             ),
//             render: () => (
//                 <Checkbox />
//             )
//         },
//         {
//             key: 'ServiceName',
//             flexGrow: 2,
//             title: <Translate>Service Name</Translate>,
//             dataKey: 'ServiceName'
//         },
//         {
//             key: 'Type',
//             flexGrow: 2,
//             title: <Translate>Type</Translate>,
//             dataKey: 'Type'
//         },
//         {
//             key: 'Quantity',
//             flexGrow: 2,
//             title: <Translate>Quantity</Translate>,
//             dataKey: 'Quantity'
//         },
//         {
//             key: 'Price',
//             flexGrow: 2,
//             title: <Translate>Price</Translate>,
//             dataKey: 'Price',
//         },
//         {
//             key: 'Currency',
//             flexGrow: 2,
//             title: <Translate>Currency</Translate>,
//             dataKey: 'Currency'
//         }
//     ];

//     return (
//         <div className='payment-method-container'>
//             <Form layout="inline" fluid className='fields-container'>
//                 <MyInput
//                     vr={validationResult}
//                     column
//                     fieldType="select"
//                     fieldName="PaymentMethod"
//                     selectData={paymentMethodLovQueryResponse?.object ?? []}
//                     selectDataLabel="lovDisplayVale"
//                     selectDataValue="key"
//                     record={{}}
//                     disabled={isReadOnly}
//                     setRecord={newValue => { setPaymentMethodSelected(newValue.PaymentMethod) }}
//                 />
//                 <MyInput
//                     column
//                     fieldLabel="Amount"
//                     fieldName={'Amount'}
//                     record={{}}
//                     setRecord={""}
//                 />
//                 <MyInput
//                     vr={validationResult}
//                     column
//                     fieldType="select"
//                     fieldName="Currency"
//                     selectData={currencyLovQueryResponse?.object ?? []}
//                     selectDataLabel="lovDisplayVale"
//                     selectDataValue="key"
//                     record={{}}
//                     setRecord={""}
//                 />
//                 <MyInput
//                     vr={validationResult}
//                     column
//                     fieldLabel="Add to Free Balance"
//                     fieldType="checkbox"
//                     fieldName=""
//                     record={{}}
//                     setRecord={""}
//                 />

//             </Form>
//             {/* // TODO update status to be a LOV value */}
//             {paymentMethodSelected === '3623962430163299'
//                 && (<Form layout="inline" fluid className='fields-container'>
//                     <MyInput
//                         column
//                         fieldName={'CardNumber'}
//                         record={{}}
//                         setRecord={""}
//                     />
//                     <MyInput
//                         column

//                         fieldName={'HolderName'}
//                         record={{}}
//                         setRecord={""}
//                     />
//                     <MyInput
//                         column
//                         fieldType="date"
//                         fieldName="ValidUntil"
//                         record={{}}
//                         setRecord={""}
//                     />
//                 </Form>)
//             }
//             {/* // TODO update status to be a LOV value */}
//             {paymentMethodSelected === '3623993823412902'
//                 &&
//                 <Form layout="inline" fluid className='fields-container'>
//                     <MyInput
//                         column
//                         fieldName='ChequeNumber'
//                         record={{}}
//                         setRecord={""}
//                     />
//                     <MyInput
//                         column
//                         fieldName='BankName'
//                         record={{}}
//                         setRecord={""}
//                     />
//                     <MyInput
//                         column
//                         fieldType="date"
//                         fieldName="ChequeDueDate"
//                         record={{}}
//                         setRecord={""}
//                     /></Form>
//             }
//             {/* // TODO update status to be a LOV value */}
//             {paymentMethodSelected === '91849731565300'
//                 &&
//                 <Form layout="inline" fluid className='fields-container'>
//                     <MyInput
//                         column
//                         fieldName='transferNumber'
//                         record={{}}
//                         setRecord={""}
//                     />
//                     <MyInput
//                         column
//                         fieldName='BankName'
//                         record={{}}
//                         setRecord={""}
//                     />

//                     <MyInput
//                         column
//                         fieldType="date"
//                         fieldName="transferDate"
//                         record={{}}
//                         setRecord={""}
//                     /></Form>
//             }

//             <Form layout="inline" className='btn-fileds-above-table'>
//                 <div className='payment-method-content'>
//                     <MyInput
//                         column
//                         disabled={true}
//                         fieldName={'DueAmount'}
//                         record={{}}
//                         setRecord={""}
//                     />
//                     <MyInput
//                         column
//                         disabled={true}
//                         fieldName={'Patient`s free Balance'}
//                         fieldLabel='Patient`s free Balance'
//                         record={{}}
//                         setRecord={""}
//                     />
//                 </div>
//                 <div className='payment-method-content'>
//                     <MyButton prefixIcon={() => <ReloadIcon />} appearance="ghost" >Refresh</MyButton>
//                     <MyButton prefixIcon={() => <FontAwesomeIcon icon={faBolt} />} appearance="ghost" color="var(--primary-pink)">Exchange Rate</MyButton>
//                     {!isReadOnly && <MyButton prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />} >Save</MyButton>}
//                 </div>
//             </Form>
//             <MyTable
//                 data={[]}
//                 columns={columns}
//                 height={200}

//             />
//         </div>
//     );
// };

// export default AddPayment;

import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';
import ReloadIcon from '@rsuite/icons/Reload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { Checkbox } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

type BillingItem = {
  id: string;
  clinic: string;
  chargeDate: string;
  type: string;
  name: string;
  price: number;
  currency: string;
  discount: number;
  priceList: string;
  patientKey: string;
  quantity?: number;
};

type AddPaymentProps = {
  isReadOnly: boolean;
  invoiceItems?: BillingItem[];   // 🟢 نضيف الآيتمز هنا
};

const AddPayment: React.FC<AddPaymentProps> = ({ isReadOnly, invoiceItems = [] }) => {
  const [paymentMethodSelected, setPaymentMethodSelected] = useState(null);
  const [validationResult] = useState({});

  const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
  const { data: paymentMethodLovQueryResponse } = useGetLovValuesByCodeQuery('PAY_METHOD');

  // نجهّز الداتا للجدول من invoiceItems
  const tableData = invoiceItems.map(item => ({
    id: item.id,
    ServiceName: item.name,
    Type: item.type,
    Quantity: item.quantity ?? 1,
    Price: item.price,
    Currency: item.currency
  }));

  const columns = [
    {
      key: 'select',
      flexGrow: 1,
      title: <Checkbox />,
      render: () => <Checkbox />
    },
    {
      key: 'ServiceName',
      flexGrow: 2,
      title: <Translate>Service Name</Translate>,
      dataKey: 'ServiceName'
    },
    {
      key: 'Type',
      flexGrow: 2,
      title: <Translate>Type</Translate>,
      dataKey: 'Type'
    },
    {
      key: 'Quantity',
      flexGrow: 2,
      title: <Translate>Quantity</Translate>,
      dataKey: 'Quantity'
    },
    {
      key: 'Price',
      flexGrow: 2,
      title: <Translate>Price</Translate>,
      dataKey: 'Price'
    },
    {
      key: 'Currency',
      flexGrow: 2,
      title: <Translate>Currency</Translate>,
      dataKey: 'Currency'
    }
  ];

  return (
    <div className="payment-method-container">
      <Form layout="inline" fluid className="fields-container">
        <MyInput
          vr={validationResult}
          column
          fieldType="select"
          fieldName="PaymentMethod"
          selectData={paymentMethodLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={{}}
          disabled={isReadOnly}
          setRecord={newValue => {
            setPaymentMethodSelected(newValue.PaymentMethod);
          }}
        />
        <MyInput
          column
          fieldLabel="Amount"
          fieldName={'Amount'}
          record={{}}
          setRecord={''}
        />
        <MyInput
          vr={validationResult}
          column
          fieldType="select"
          fieldName="Currency"
          selectData={currencyLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={{}}
          setRecord={''}
        />
        <MyInput
          vr={validationResult}
          column
          fieldLabel="Add to Free Balance"
          fieldType="checkbox"
          fieldName=""
          record={{}}
          setRecord={''}
        />
      </Form>

      {/* بطاقات إضافية حسب الميثود - تركتها كما هي */}
      {paymentMethodSelected === '3623962430163299' && (
        <Form layout="inline" fluid className="fields-container">
          <MyInput column fieldName={'CardNumber'} record={{}} setRecord={''} />
          <MyInput column fieldName={'HolderName'} record={{}} setRecord={''} />
          <MyInput
            column
            fieldType="date"
            fieldName="ValidUntil"
            record={{}}
            setRecord={''}
          />
        </Form>
      )}

      {paymentMethodSelected === '3623993823412902' && (
        <Form layout="inline" fluid className="fields-container">
          <MyInput column fieldName="ChequeNumber" record={{}} setRecord={''} />
          <MyInput column fieldName="BankName" record={{}} setRecord={''} />
          <MyInput
            column
            fieldType="date"
            fieldName="ChequeDueDate"
            record={{}}
            setRecord={''}
          />
        </Form>
      )}

      {paymentMethodSelected === '91849731565300' && (
        <Form layout="inline" fluid className="fields-container">
          <MyInput column fieldName="transferNumber" record={{}} setRecord={''} />
          <MyInput column fieldName="BankName" record={{}} setRecord={''} />
          <MyInput
            column
            fieldType="date"
            fieldName="transferDate"
            record={{}}
            setRecord={''}
          />
        </Form>
      )}

      <Form layout="inline" className="btn-fileds-above-table">
        <div className="payment-method-content">
          <MyInput
            column
            disabled={true}
            fieldName={'DueAmount'}
            record={{}}
            setRecord={''}
          />
          <MyInput
            column
            disabled={true}
            fieldName={"Patient`s free Balance"}
            fieldLabel="Patient`s free Balance"
            record={{}}
            setRecord={''}
          />
        </div>
        <div className="payment-method-content">
          <MyButton prefixIcon={() => <ReloadIcon />} appearance="ghost">
            Refresh
          </MyButton>
          <MyButton
            prefixIcon={() => <FontAwesomeIcon icon={faBolt} />}
            appearance="ghost"
            color="var(--primary-pink)"
          >
            Exchange Rate
          </MyButton>
          {!isReadOnly && (
            <MyButton prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}>
              Save
            </MyButton>
          )}
        </div>
      </Form>

      <MyTable
        data={tableData}   // 🟢 هون صارت آيتمز الفاتورة
        columns={columns}
        height={200}
      />
    </div>
  );
};

export default AddPayment;
