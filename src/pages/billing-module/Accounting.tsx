// import { newApPatient } from '@/types/model-types-constructor';
// import React, { useEffect, useState } from 'react';
// import { setDivContent, setPageCode } from '@/reducers/divSlice';
// import { useAppDispatch } from '@/hooks';
// import MyTab from '@/components/MyTab';
// import SectionContainer from '@/components/SectionsoContainer';
// import MyInput from '@/components/MyInput';
// import { Form } from 'rsuite';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faMagnifyingGlass, faBroom } from '@fortawesome/free-solid-svg-icons';
// import MyButton from '@/components/MyButton/MyButton';
// import Billing from './Billing';
// import Invoices from './Invoices';
// import Receipt from './Receipt';
// import ProfileSidebar from '../patient/patient-profile/ProfileSidebar-new';
// import { getHeight } from 'rsuite/esm/DOMHelper';
// const Accounting = () => {
//   const dispatch = useAppDispatch();
//   const [expand, setExpand] = useState<boolean>(false);
//   const [patient, setPatient] = useState({ ...newApPatient });
//   useEffect(() => {
//     console.log('patient');
//     console.log(patient);
//   }, [patient]);
//   const [windowHeight] = useState(getHeight(window));
//   const [refetchData, setRefetchData] = useState(false);
//   const [dateFilter, setDateFilter] = useState({
//     fromDate: new Date(),
//     toDate: new Date()
//   });

//   const divContent = 'Accounting';

//   const tabData = [
//     {
//       title: 'Billing',
//       content: <Billing />
//     },
//     {
//       title: 'Invoices',
//       content: <Invoices />
//     },
//     {
//       title: 'Print Receipt(s)',
//       content: <Receipt />
//     }
//   ];

//   useEffect(() => {
//     dispatch(setPageCode('Operation_Module'));
//     dispatch(setDivContent(divContent));
//   }, []);

//   const handleClearFilters = () => {
//     setDateFilter({
//       fromDate: null,
//       toDate: null
//     });
//   };

//   const contentOfSearchSection = () => {
//     return (
//       <>
//         <Form layout="inline" fluid className="date-filter-form">
//           <MyInput
//             column
//             width={180}
//             fieldType="date"
//             fieldLabel="From Date"
//             fieldName="fromDate"
//             record={dateFilter}
//             setRecord={setDateFilter}
//             disabled={!patient?.key}
//           />
//           <MyInput
//             width={180}
//             column
//             fieldType="date"
//             fieldLabel="To Date"
//             fieldName="toDate"
//             record={dateFilter}
//             setRecord={setDateFilter}
//             disabled={!patient?.key}
//           />
//         </Form>
//         <div style={{ display: 'flex', gap: '10px', justifyContent: 'end' }}>
//           <MyButton
//             prefixIcon={() => <FontAwesomeIcon icon={faMagnifyingGlass} />}
//             disabled={!patient?.key}
//           >
//             Search
//           </MyButton>

//           <MyButton
//             prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
//             onClick={handleClearFilters}
//             disabled={!patient?.key}
//           >
//             Clear
//           </MyButton>
//         </div>
//       </>
//     );
//   };

//   return (
//     <div className="container">
//       <div className="left-box" style={{ width: '100%' }}>
//         <SectionContainer title="Search Patient" content={contentOfSearchSection()} />
//         <MyTab data={tabData} />
//       </div>
//       <br />
//       <div>
//         <ProfileSidebar
//           expand={expand}
//           setExpand={setExpand}
//           windowHeight={windowHeight}
//           setLocalPatient={setPatient}
//           refetchData={refetchData}
//           setRefetchData={setRefetchData}
//         />
//       </div>
//     </div>
//   );
// };
// export default Accounting;




import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faBroom } from '@fortawesome/free-solid-svg-icons';
import { getHeight } from 'rsuite/esm/DOMHelper';

import { newApPatient } from '@/types/model-types-constructor';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

import MyTab from '@/components/MyTab';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';

import Billing from './Billing';
import Invoices from './Invoices';
import Receipt from './Receipt';
import ProfileSidebar from '../patient/patient-profile/ProfileSidebar-new';

// ---------- TYPES & DEMO DATA ----------

type BillingItem = {
  id: string;
  clinic: string;
  chargeDate: string; // 'YYYY-MM-DD'
  type: string;
  name: string;
  price: number;
  currency: string;
  discount: number;
  priceList: string;
  patientKey: string; // for future real backend
};

type Invoice = {
  invoiceNumber: string;
  createdBy: string;
  createdAt: string; // 'YYYY-MM-DD'
  amount: number;
  status: 'Pending' | 'Paid' | 'Partially';
  method: string;
  patientKey: string;
  items: BillingItem[]; // exact services/products in this invoice
};

// Demo "unbilled" services
const DEMO_BILLING_ITEMS: BillingItem[] = [
  {
    id: '1',
    clinic: 'Dental Clinic',
    chargeDate: '2025-11-23',
    type: 'Service',
    name: 'Initial Checkup',
    price: 50,
    currency: 'USD',
    discount: 0,
    priceList: 'Standard',
    patientKey: 'P001'
  },
  {
    id: '2',
    clinic: 'Dental Clinic',
    chargeDate: '2025-11-23',
    type: 'Service',
    name: 'X-Ray',
    price: 100,
    currency: 'USD',
    discount: 0,
    priceList: 'Standard',
    patientKey: 'P001'
  },
  {
    id: '3',
    clinic: 'Dental Clinic',
    chargeDate: '2025-11-22',
    type: 'Service',
    name: 'Teeth Cleaning',
    price: 80,
    currency: 'USD',
    discount: 0,
    priceList: 'Standard',
    patientKey: 'P002'
  }
];

// ---------- COMPONENT ----------

const Accounting: React.FC = () => {
  const dispatch = useAppDispatch();

  // patient selection (your existing behavior)
  const [expand, setExpand] = useState<boolean>(false);
  const [patient, setPatient] = useState<any>({ ...newApPatient });

  const [windowHeight] = useState(getHeight(window));
  const [refetchData, setRefetchData] = useState(false);

  // date filter (same as you had)
  const [dateFilter, setDateFilter] = useState<any>({
    fromDate: new Date(),
    toDate: new Date()
  });

  // "backend" state
  const [allBillingItems, setAllBillingItems] =
    useState<BillingItem[]>(DEMO_BILLING_ITEMS); // unbilled items
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]); // start with NO invoices

  // what is actually shown in Billing tab
  const [filteredBilling, setFilteredBilling] = useState<BillingItem[]>([]);

  const divContent = 'Accounting';

  useEffect(() => {
    dispatch(setPageCode('Operation_Module'));
    dispatch(setDivContent(divContent));
  }, [dispatch]);

  useEffect(() => {
    console.log('patient', patient);
  }, [patient]);

  // ---------- HELPERS ----------

  const applyDateFilterToBilling = (
    items: BillingItem[],
    fromDate: Date | null,
    toDate: Date | null
  ) => {
    return items.filter(item => {
      const itemDate = new Date(item.chargeDate);

      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;

      return true;
    });
  };

  // ---------- HANDLERS ----------

  // Filter billing items by date (requires patient selected, just for UX)
  const handleSearch = () => {
    if (!patient?.key) return;

    const fromDate = dateFilter.fromDate ? new Date(dateFilter.fromDate) : null;
    const toDate = dateFilter.toDate ? new Date(dateFilter.toDate) : null;

    const billing = applyDateFilterToBilling(allBillingItems, fromDate, toDate);
    setFilteredBilling(billing);
  };

  const handleClearFilters = () => {
    setDateFilter({
      fromDate: null,
      toDate: null
    });
    // show all remaining unbilled items when clearing
    setFilteredBilling(allBillingItems);
  };

  // Create an invoice from selected billing row IDs
  const handleCreateInvoiceFromBilling = (selectedIds: string[]) => {
    if (!patient?.key || selectedIds.length === 0) return;

    // exactly the selected rows
    const itemsToInvoice = allBillingItems.filter(item =>
      selectedIds.includes(item.id)
    );

    if (itemsToInvoice.length === 0) return;

    // sum after discount
    const totalAmount = itemsToInvoice.reduce(
      (sum, item) => sum + (item.price - (item.discount || 0)),
      0
    );

    const newInvoiceNumber = `INV-${(allInvoices.length + 1)
      .toString()
      .padStart(3, '0')}`;

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const newInvoice: Invoice = {
      invoiceNumber: newInvoiceNumber,
      createdBy: 'Demo User',
      createdAt: today,
      amount: totalAmount,
      status: 'Pending',
      method: 'N/A',
      patientKey: patient.key ?? 'DEMO',
      items: itemsToInvoice
    };

    // 1) add the new invoice
    setAllInvoices(prev => [...prev, newInvoice]);

    // 2) remove invoiced items from the "unbilled" list
    const updatedBilling = allBillingItems.filter(
      item => !selectedIds.includes(item.id)
    );
    setAllBillingItems(updatedBilling);

    // 3) auto-refresh Billing according to current date filter
    const fromDate = dateFilter.fromDate
      ? new Date(dateFilter.fromDate)
      : null;
    const toDate = dateFilter.toDate ? new Date(dateFilter.toDate) : null;

    const updatedFilteredBilling = applyDateFilterToBilling(
      updatedBilling,
      fromDate,
      toDate
    );

    setFilteredBilling(updatedFilteredBilling);
  };

  // ---------- AUTO REFRESH ----------

  // When patient changes (and is selected), auto-show all unbilled items
  useEffect(() => {
    if (!patient?.key) {
      setFilteredBilling([]);
      return;
    }
    setFilteredBilling(allBillingItems);
  }, [patient, allBillingItems]);

  // ---------- UI SECTIONS ----------

  const contentOfSearchSection = () => {
    return (
      <>
        <Form layout="inline" fluid className="date-filter-form">
          <MyInput
            column
            width={180}
            fieldType="date"
            fieldLabel="From Date"
            fieldName="fromDate"
            record={dateFilter}
            setRecord={setDateFilter}
            disabled={!patient?.key}
          />
        <MyInput
            width={180}
            column
            fieldType="date"
            fieldLabel="To Date"
            fieldName="toDate"
            record={dateFilter}
            setRecord={setDateFilter}
            disabled={!patient?.key}
          />
        </Form>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'end' }}>
          <MyButton
            prefixIcon={() => <FontAwesomeIcon icon={faMagnifyingGlass} />}
            disabled={!patient?.key}
            onClick={handleSearch}
          >
            Search
          </MyButton>

          <MyButton
            prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
            onClick={handleClearFilters}
            disabled={!patient?.key}
          >
            Clear
          </MyButton>
        </div>
      </>
    );
  };

  const tabData = [
    {
      title: 'Billing',
      content: (
        <Billing
          data={filteredBilling}
          onCreateInvoice={handleCreateInvoiceFromBilling}
          patient={patient}
        />
      )
    },
    {
      title: 'Invoices',
      // show ALL invoices that were created from selections
      content: <Invoices data={allInvoices} />
    },
    {
      title: 'Print Receipt(s)',
      content: <Receipt />
    }
  ];

  return (
    <div className="container">
      <div className="left-box" style={{ width: '100%' }}>
        <SectionContainer
          title="Search Patient"
          content={contentOfSearchSection()}
        />
        <MyTab data={tabData} />
      </div>

      <br />

      <div>
        <ProfileSidebar
          expand={expand}
          setExpand={setExpand}
          windowHeight={windowHeight}
          setLocalPatient={setPatient}
          refetchData={refetchData}
          setRefetchData={setRefetchData}
        />
      </div>
    </div>
  );
};

export default Accounting;
