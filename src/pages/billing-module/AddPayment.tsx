// import React, { useMemo, useState } from 'react';
// import { Form, Checkbox } from 'rsuite';
// import ReloadIcon from '@rsuite/icons/Reload';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faBolt, faCheckDouble } from '@fortawesome/free-solid-svg-icons';

// import MyInput from '@/components/MyInput';
// import MyButton from '@/components/MyButton/MyButton';
// import MyTable from '@/components/MyTable';
// import Translate from '@/components/Translate';
// import { useGetLovValuesByCodeQuery } from '@/services/setupService';

// import type {
//   BillingItem,
//   PatientPaymentCreateVM,
// } from '@/types/model-types-new';

// type AddPaymentProps = {
//   isReadOnly: boolean;
//   invoiceItems: BillingItem[];
//   dueAmount: number;
//   freeBalance: number;
//   onSave: (payment: PatientPaymentCreateVM) => void;
//   loading?: boolean;
// };

// const AddPayment: React.FC<AddPaymentProps> = ({
//   isReadOnly,
//   invoiceItems,
//   dueAmount,
//   freeBalance,
//   onSave,
//   loading = false,
// }) => {
//   const [form, setForm] = useState<any>({
//     PaymentMethod: null,
//     Amount: dueAmount,
//     Currency: null,
//     AddToFreeBalance: false,

//     CardNumber: '',
//     HolderName: '',
//     ValidUntil: null,

//     ChequeNumber: '',
//     ChequeBankName: '',
//     ChequeDueDate: null,

//     transferNumber: '',
//     transferBankName: '',
//     transferDate: null,
//   });

//   const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery(
//     'CURRENCY'
//   );
//   const { data: paymentMethodLovQueryResponse } =
//     useGetLovValuesByCodeQuery('PAY_METHOD');

//   const paymentMethodSelected = form.PaymentMethod;

//   const tableData = useMemo(
//     () =>
//       invoiceItems.map(item => ({
//         id: item.id,
//         ServiceName: item.name,
//         Type: item.type,
//         Quantity: item.quantity ?? 1,
//         Price: item.price,
//         Currency: item.currency,
//       })),
//     [invoiceItems]
//   );

//   const columns = [
//     {
//       key: 'select',
//       flexGrow: 1,
//       title: <Checkbox />,
//       render: () => <Checkbox />,
//     },
//     {
//       key: 'ServiceName',
//       flexGrow: 2,
//       title: <Translate>Service Name</Translate>,
//       dataKey: 'ServiceName',
//     },
//     {
//       key: 'Type',
//       flexGrow: 2,
//       title: <Translate>Type</Translate>,
//       dataKey: 'Type',
//     },
//     {
//       key: 'Quantity',
//       flexGrow: 2,
//       title: <Translate>Quantity</Translate>,
//       dataKey: 'Quantity',
//     },
//     {
//       key: 'Price',
//       flexGrow: 2,
//       title: <Translate>Price</Translate>,
//       dataKey: 'Price',
//     },
//     {
//       key: 'Currency',
//       flexGrow: 2,
//       title: <Translate>Currency</Translate>,
//       dataKey: 'Currency',
//     },
//   ];

//   const handleSaveClick = () => {
//     const amountNumber = Number(form.Amount || 0);
//     if (!amountNumber || amountNumber <= 0) return;

//     const payment: PatientPaymentCreateVM = {
//       facilityId: 0, // رح نعدلها في PaymentModal
//       patientKey: null,
//       paymentType: 'INVOICE_PAYMENT',
//       paymentMethod: form.PaymentMethod,
//       paymentDate: new Date().toISOString().slice(0, 10),
//       amount: amountNumber,
//       currency: form.Currency,
//       reference:
//         form.ChequeNumber ||
//         form.transferNumber ||
//         form.CardNumber ||
//         null,
//       notes: null,
//     };

//     onSave(payment);
//   };

//   return (
//     <div className="payment-method-container">
//       <Form layout="inline" fluid className="fields-container">
//         <MyInput
//           vr={{}}
//           column
//           fieldType="select"
//           fieldName="PaymentMethod"
//           selectData={paymentMethodLovQueryResponse?.object ?? []}
//           selectDataLabel="lovDisplayVale"
//           selectDataValue="key"
//           record={form}
//           disabled={isReadOnly}
//           setRecord={setForm}
//         />
//         <MyInput
//           column
//           fieldLabel="Amount"
//           fieldName="Amount"
//           record={form}
//           setRecord={setForm}
//         />
//         <MyInput
//           vr={{}}
//           column
//           fieldType="select"
//           fieldName="Currency"
//           selectData={currencyLovQueryResponse?.object ?? []}
//           selectDataLabel="lovDisplayVale"
//           selectDataValue="key"
//           record={form}
//           setRecord={setForm}
//         />
//         <MyInput
//           vr={{}}
//           column
//           fieldLabel="Add to Free Balance"
//           fieldType="checkbox"
//           fieldName="AddToFreeBalance"
//           record={form}
//           setRecord={setForm}
//         />
//       </Form>

//       {paymentMethodSelected === '3623962430163299' && (
//         <Form layout="inline" fluid className="fields-container">
//           <MyInput column fieldName="CardNumber" record={form} setRecord={setForm} />
//           <MyInput column fieldName="HolderName" record={form} setRecord={setForm} />
//           <MyInput
//             column
//             fieldType="date"
//             fieldName="ValidUntil"
//             record={form}
//             setRecord={setForm}
//           />
//         </Form>
//       )}

//       {paymentMethodSelected === '3623993823412902' && (
//         <Form layout="inline" fluid className="fields-container">
//           <MyInput
//             column
//             fieldName="ChequeNumber"
//             record={form}
//             setRecord={setForm}
//           />
//           <MyInput
//             column
//             fieldName="ChequeBankName"
//             record={form}
//             setRecord={setForm}
//           />
//           <MyInput
//             column
//             fieldType="date"
//             fieldName="ChequeDueDate"
//             record={form}
//             setRecord={setForm}
//           />
//         </Form>
//       )}

//       {paymentMethodSelected === '91849731565300' && (
//         <Form layout="inline" fluid className="fields-container">
//           <MyInput
//             column
//             fieldName="transferNumber"
//             record={form}
//             setRecord={setForm}
//           />
//           <MyInput
//             column
//             fieldName="transferBankName"
//             record={form}
//             setRecord={setForm}
//           />
//           <MyInput
//             column
//             fieldType="date"
//             fieldName="transferDate"
//             record={form}
//             setRecord={setForm}
//           />
//         </Form>
//       )}

//       <Form layout="inline" className="btn-fileds-above-table">
//         <div className="payment-method-content">
//           <MyInput
//             column
//             disabled
//             fieldName="DueAmount"
//             fieldLabel="Due Amount"
//             record={{ DueAmount: dueAmount }}
//             setRecord={() => {}}
//           />
//           <MyInput
//             column
//             disabled
//             fieldName="FreeBalance"
//             fieldLabel="Patient`s free Balance"
//             record={{ FreeBalance: freeBalance }}
//             setRecord={() => {}}
//           />
//         </div>
//         <div className="payment-method-content">
//           <MyButton prefixIcon={() => <ReloadIcon />} appearance="ghost">
//             Refresh
//           </MyButton>
//           <MyButton
//             prefixIcon={() => <FontAwesomeIcon icon={faBolt} />}
//             appearance="ghost"
//             color="var(--primary-pink)"
//           >
//             Exchange Rate
//           </MyButton>
//           {!isReadOnly && (
//             <MyButton
//               prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
//               onClick={handleSaveClick}
//               loading={loading}
//             >
//               Save
//             </MyButton>
//           )}
//         </div>
//       </Form>

//       <MyTable data={tableData} columns={columns} height={200} />
//     </div>
//   );
// };

// export default AddPayment;
// src/pages/accounting/AddPayment.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Form, Checkbox } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import ReloadIcon from '@rsuite/icons/Reload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import type {
  BillingItem,
  PatientPaymentCreateVM,
} from '@/types/model-types-new';

type AddPaymentProps = {
  isReadOnly: boolean;
  // 🟢 هدول عشان نعرضهم زي ما كان (Due + Free Balance)
  dueAmount: number;
  freeBalance: number;
  // 🟢 هدول اللي راح نعرضهم بالجدول تحت
  invoiceItems: BillingItem[];
  // 🟢 هاد اللي رح نستدعيه من برّا (PaymentModal)
  onSave: (payment: PatientPaymentCreateVM, selectedItemIds: string[]) => void;
  loading?: boolean;
};

const AddPayment: React.FC<AddPaymentProps> = ({
  isReadOnly,
  dueAmount,
  freeBalance,
  invoiceItems,
  onSave,
  loading = false,
}) => {
  const [validationResult] = useState<any>({});
  const [record, setRecord] = useState<any>({
    PaymentMethod: null,
    Amount: dueAmount,
    Currency: null,
    AddToFreeBalance: false,

    CardNumber: '',
    HolderName: '',
    ValidUntil: null,

    ChequeNumber: '',
    BankName: '',
    ChequeDueDate: null,

    transferNumber: '',
    BankNameTransfer: '',
    transferDate: null,
  });

  const paymentMethodSelected = record.PaymentMethod;
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  useEffect(() => {
    const allIds = (invoiceItems ?? []).map(item => String(item.id));
    setSelectedItemIds(allIds);
  }, [invoiceItems, dueAmount]);

  useEffect(() => {
    const selectedTotal = (invoiceItems ?? [])
      .filter(item => selectedItemIds.includes(String(item.id)))
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.totalPrice != null
              ? item.totalPrice
              : Number(item.price || 0) * Number(item.quantity || 1)
          ),
        0
      );
    setRecord((prev: any) => ({ ...prev, Amount: selectedTotal }));
  }, [selectedItemIds, invoiceItems]);

  // LOVs نفس ما كان
  const { data: currencyLovQueryResponse } =
    useGetLovValuesByCodeQuery('CURRENCY');
  const { data: paymentMethodLovQueryResponse } =
    useGetLovValuesByCodeQuery('PAY_METHOD');

  // 🟢 داتا الجدول من الـ invoiceItems (services/products اللي بالفاتورة)
  const tableData = useMemo(
    () =>
      (invoiceItems ?? []).map(item => ({
        id: item.id,
        ServiceName: item.name,
        Type: item.type,
        Quantity: item.quantity ?? 1,
        Price: item.price,
        TotalPrice:
          item.totalPrice != null
            ? Number(item.totalPrice)
            : Number(item.price || 0) * Number(item.quantity || 1),
        Currency: item.currency,
      })),
    [invoiceItems]
  );

  const columns = [
    {
      key: 'select',
      flexGrow: 1,
      title: (
        <Checkbox
          checked={
            tableData.length > 0 && selectedItemIds.length === tableData.length
          }
          indeterminate={
            selectedItemIds.length > 0 &&
            selectedItemIds.length < tableData.length
          }
          onChange={(_, checked) => {
            setSelectedItemIds(checked ? tableData.map(row => String(row.id)) : []);
          }}
        />
      ),
      render: (row: any) => (
        <Checkbox
          checked={selectedItemIds.includes(String(row.id))}
          onChange={(_, checked) => {
            const rowId = String(row.id);
            setSelectedItemIds(prev =>
              checked ? [...prev, rowId] : prev.filter(id => id !== rowId)
            );
          }}
        />
      ),
    },
    {
      key: 'ServiceName',
      flexGrow: 2,
      title: <Translate>Service Name</Translate>,
      dataKey: 'ServiceName',
    },
    {
      key: 'Type',
      flexGrow: 2,
      title: <Translate>Type</Translate>,
      dataKey: 'Type',
    },
    {
      key: 'Quantity',
      flexGrow: 2,
      title: <Translate>Quantity</Translate>,
      dataKey: 'Quantity',
    },
    {
      key: 'Price',
      flexGrow: 2,
      title: <Translate>Price</Translate>,
      dataKey: 'Price',
    },
    {
      key: 'TotalPrice',
      flexGrow: 2,
      title: <Translate>Total Price</Translate>,
      dataKey: 'TotalPrice',
    },
    {
      key: 'Currency',
      flexGrow: 2,
      title: <Translate>Currency</Translate>,
      dataKey: 'Currency',
    },
  ];

  const handleSaveClick = () => {
    const amountNumber = Number(record.Amount || 0);
    if (!amountNumber || amountNumber <= 0 || selectedItemIds.length === 0) return;

    const payment: PatientPaymentCreateVM = {
      // هدول رح نكمّلهم في PaymentModal (facilityId + patientKey)
      facilityId: 0,
      patientKey: null,

      paymentType: 'INVOICE_PAYMENT', // أو enum عندكم
      paymentMethod: record.PaymentMethod,

      paymentDate: new Date().toISOString().slice(0, 10),
      amount: amountNumber,
      currency: record.Currency,

      reference:
        record.ChequeNumber ||
        record.transferNumber ||
        record.CardNumber ||
        null,
      notes: null,
    };

    onSave(payment, selectedItemIds);
  };

  return (
    <div className="payment-method-container">
      {/* ✅ نفس الفورم الأساسي تبعك */}
      <Form layout="inline" fluid className="fields-container">
        <MyInput
          vr={validationResult}
          column
          fieldType="select"
          fieldName="PaymentMethod"
          selectData={paymentMethodLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={record}
          disabled={isReadOnly}
          setRecord={setRecord}
                  disableByField='isValid'

        />
        <MyInput
          column
          fieldLabel="Amount"
          fieldName="Amount"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          vr={validationResult}
          column
          fieldType="select"
          fieldName="Currency"
          selectData={currencyLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={record}
          setRecord={setRecord}
                  disableByField='isValid'

        />
        <MyInput
          vr={validationResult}
          column
          fieldLabel="Add to Free Balance"
          fieldType="checkbox"
          fieldName="AddToFreeBalance"
          record={record}
          setRecord={setRecord}
        />
      </Form>

      {/* ✅ نفس الشروط تبعت Card / Cheque / Transfer (بس ربطناها بالـ record) */}
      {paymentMethodSelected === '3623962430163299' && (
        <Form layout="inline" fluid className="fields-container">
          <MyInput
            column
            fieldName="CardNumber"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            column
            fieldName="HolderName"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            column
            fieldType="date"
            fieldName="ValidUntil"
            record={record}
            setRecord={setRecord}
          />
        </Form>
      )}

      {paymentMethodSelected === '3623993823412902' && (
        <Form layout="inline" fluid className="fields-container">
          <MyInput
            column
            fieldName="ChequeNumber"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            column
            fieldName="BankName"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            column
            fieldType="date"
            fieldName="ChequeDueDate"
            record={record}
            setRecord={setRecord}
          />
        </Form>
      )}

      {paymentMethodSelected === '91849731565300' && (
        <Form layout="inline" fluid className="fields-container">
          <MyInput
            column
            fieldName="transferNumber"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            column
            fieldName="BankNameTransfer"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            column
            fieldType="date"
            fieldName="transferDate"
            record={record}
            setRecord={setRecord}
          />
        </Form>
      )}

      {/* ✅ نفس الجزء اللي فوق الجدول */}
      <Form layout="inline" className="btn-fileds-above-table">
        <div className="payment-method-content">
          <MyInput
            column
            disabled={true}
            fieldName="DueAmount"
            fieldLabel="Due Amount"
            record={{ DueAmount: dueAmount }}
            setRecord={() => {}}
          />
          <MyInput
            column
            disabled={true}
            fieldName="FreeBalance"
            fieldLabel="Patient`s free Balance"
            record={{ FreeBalance: freeBalance }}
            setRecord={() => {}}
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
            <MyButton
              prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
              onClick={handleSaveClick}
              loading={loading}
            >
              Save
            </MyButton>
          )}
        </div>
      </Form>

      {/* ✅ نفس الجدول، بس هلأ مربوط على invoiceItems */}
      <MyTable data={tableData} columns={columns} height={200} />
    </div>
  );
};

export default AddPayment;
