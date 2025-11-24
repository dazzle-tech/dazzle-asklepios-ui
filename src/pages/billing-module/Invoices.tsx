// import React, { useState } from 'react';
// import MyTable from '@/components/MyTable';
// import { MdDelete } from 'react-icons/md';
// import PaymentModal from './PaymentModal';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faMoneyBill } from '@fortawesome/free-solid-svg-icons';

// const Invoices = () => {
//   const [openPayModal, setOpenPayModal] = useState<boolean>(false);
//   const servicesAndProductsForPatient = [
//     {
//       invoiceNumber: 'INV-001',
//       createdBy: 'Rawan Ahmad',
//       createdAt: '2025-11-20',
//       amount: 150.75,
//       status: 'Pending',
//       method: 'Credit Card'
//     },
//     {
//       invoiceNumber: 'INV-002',
//       createdBy: 'Ali Hassan',
//       createdAt: '2025-11-21',
//       amount: 320.0,
//       status: 'Paid',
//       method: 'Cash'
//     },
//     {
//       invoiceNumber: 'INV-003',
//       createdBy: 'Lina Saeed',
//       createdAt: '2025-11-22',
//       amount: 89.99,
//       status: 'Partially',
//       method: 'Bank Transfer'
//     }
//   ];

//   // Icons column (Edite, reactive/Deactivate)
//   const iconsForActions = rowData => (
//     <div className="container-of-icons">
//       <MdDelete
//         className="icons-style"
//         title="Delete"
//         style={{
//           cursor: !(rowData.status == 'Pending') ? 'not-allowed' : 'pointer',
//           color: 'var(--primary-gray)'
//         }}
//         size={24}
//         fill={!(rowData.status == 'Pending') ? '#D4D4D4' : 'var(--primary-pink)'}
//         onClick={() => {
//           if (!(rowData.status == 'Pending')) return;
//         }}
//       />

//       <FontAwesomeIcon
//         icon={faMoneyBill}
//         className="icons-style"
//         onClick={() => setOpenPayModal(true)}
//         title="Pay"
//         color="var(--icon-gray)"
//       />
//     </div>
//   );
//   const columns = [
//     {
//       key: 'invoiceNumber',
//       title: 'Invoice Number'
//     },
//     {
//       key: 'createdByAt',
//       title: 'Created ByAt',
//       render: (rowData: any) => (
//         <>
//           {rowData.createdBy}
//           <br />
//           <span className="date-table-style">{rowData.createdAt}</span>
//         </>
//       )
//     },
//     {
//       key: 'amount',
//       title: 'RequestAmount'
//     },
//     {
//       key: 'status',
//       title: 'Satus'
//     },
//     {
//       key: 'method',
//       title: 'Method'
//     },
//     {
//       key: '',
//       title: '',
//       render: rowData => iconsForActions(rowData)
//     }
//   ];
//   return (
//     <div>
//       <MyTable data={servicesAndProductsForPatient} columns={columns} loading={false} />
//       <PaymentModal open={openPayModal} localPatient="" setOpen={setOpenPayModal} localVisit="" />
//     </div>
//   );
// };
// export default Invoices;
import React, { useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill } from '@fortawesome/free-solid-svg-icons';

import MyTable from '@/components/MyTable';
import PaymentModal from './PaymentModal';

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
};

type Invoice = {
  invoiceNumber: string;
  createdBy: string;
  createdAt: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Partially';
  method: string;
  patientKey: string;
  items: BillingItem[];
};

type InvoicesProps = {
  data: Invoice[];
};

const Invoices: React.FC<InvoicesProps> = ({ data }) => {
  const [openPayModal, setOpenPayModal] = useState<boolean>(false);

  const iconsForActions = (rowData: Invoice) => (
    <div className="container-of-icons">
      <MdDelete
        className="icons-style"
        title="Delete"
        style={{
          cursor: rowData.status !== 'Pending' ? 'not-allowed' : 'pointer',
          color: 'var(--primary-gray)'
        }}
        size={24}
        fill={rowData.status !== 'Pending' ? '#D4D4D4' : 'var(--primary-pink)'}
        onClick={() => {
          if (rowData.status !== 'Pending') return;
          // For demo: do nothing, or plug a toast here
        }}
      />

      <FontAwesomeIcon
        icon={faMoneyBill}
        className="icons-style"
        onClick={() => setOpenPayModal(true)}
        title="Pay"
        color="var(--icon-gray)"
      />
    </div>
  );

  const columns = [
    {
      key: 'invoiceNumber',
      title: 'Invoice Number'
    },
    {
      key: 'createdByAt',
      title: 'Created ByAt',
      render: (rowData: Invoice) => (
        <>
          {rowData.createdBy}
          <br />
          <span className="date-table-style">{rowData.createdAt}</span>
        </>
      )
    },
    {
      key: 'amount',
      title: 'RequestAmount'
    },
    {
      key: 'status',
      title: 'Satus'
    },
    {
      key: 'method',
      title: 'Method'
    },
    {
      key: 'actions',
      title: '',
      render: (rowData: Invoice) => iconsForActions(rowData)
    }
  ];

  return (
    <div>
      <MyTable data={data} columns={columns} loading={false} />
      <PaymentModal
        open={openPayModal}
        localPatient=""
        setOpen={setOpenPayModal}
        localVisit=""
      />
    </div>
  );
};

export default Invoices;
