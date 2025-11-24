// import React, { useState } from 'react';
// import MyTable from '@/components/MyTable';
// import PaymentModal from './PaymentModal';

// const Receipt = () => {
//   const [openPayModal, setOpenPayModal] = useState<boolean>(false);
//   const dummyData = [
//     {
//       invoiceNumber: 'INV-1001',
//       amount: 2,
//       price: 50,
//       total: 100
//     },
//     {
//       invoiceNumber: 'INV-1002',
//       amount: 5,
//       price: 20,
//       total: 100
//     },
//     {
//       invoiceNumber: 'INV-1003',
//       amount: 1,
//       price: 75,
//       total: 75
//     }
//   ];

//   //  const servicesAndProductsForPatient = [];
//   const columns = [
//     {
//       key: 'invoiceNumber',
//       title: 'Invoice Number'
//     },
//     {
//       key: 'amount',
//       title: 'Amount'
//     },
//     {
//       key: 'price',
//       title: 'Price'
//     },
//     {
//       key: 'total',
//       title: 'Total'
//     }
//   ];
//   return (
//     <div>
//       <MyTable data={dummyData} columns={columns} loading={false} />
//       <PaymentModal open={openPayModal} localPatient="" setOpen={setOpenPayModal} localVisit="" />
//     </div>
//   );
// };
// export default Receipt;
import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import PaymentModal from './PaymentModal';

type ReceiptItem = {
  invoiceNumber: string;
  itemCode: string;
  description: string;
  type: 'Service' | 'Product';
  clinicService: string; // e.g. General Clinic, Lab, Radiology, Dental...
  amount: number;        // quantity
  price: number;
  total: number;
};

const Receipt: React.FC = () => {
  const [openPayModal, setOpenPayModal] = useState<boolean>(false);

  const dummyData: ReceiptItem[] = [
    {
      invoiceNumber: 'INV-1001',
      itemCode: 'SRV-001',
      description: 'General Consultation',
      type: 'Service',
      clinicService: 'General Clinic',
      amount: 1,
      price: 50,
      total: 50
    },
    {
      invoiceNumber: 'INV-1001',
      itemCode: 'SRV-002',
      description: 'Blood Test – CBC',
      type: 'Service',
      clinicService: 'Laboratory',
      amount: 1,
      price: 25,
      total: 25
    },
    {
      invoiceNumber: 'INV-1001',
      itemCode: 'PRD-001',
      description: 'Pain Relief Tablets (Box)',
      type: 'Product',
      clinicService: 'Pharmacy',
      amount: 2,
      price: 12.5,
      total: 25
    },
    {
      invoiceNumber: 'INV-1002',
      itemCode: 'SRV-010',
      description: 'X-Ray – Chest',
      type: 'Service',
      clinicService: 'Radiology',
      amount: 1,
      price: 80,
      total: 80
    },
    {
      invoiceNumber: 'INV-1002',
      itemCode: 'PRD-010',
      description: 'Contrast Material',
      type: 'Product',
      clinicService: 'Radiology',
      amount: 1,
      price: 20,
      total: 20
    },
    {
      invoiceNumber: 'INV-1003',
      itemCode: 'SRV-020',
      description: 'Dental Filling',
      type: 'Service',
      clinicService: 'Dental Clinic',
      amount: 1,
      price: 150,
      total: 150
    },
    {
      invoiceNumber: 'INV-1003',
      itemCode: 'SRV-021',
      description: 'Scaling & Polishing',
      type: 'Service',
      clinicService: 'Dental Clinic',
      amount: 1,
      price: 100,
      total: 100
    },
    {
      invoiceNumber: 'INV-1003',
      itemCode: 'PRD-020',
      description: 'Dental Kit',
      type: 'Product',
      clinicService: 'Dental Clinic',
      amount: 1,
      price: 30,
      total: 30
    }
  ];

  const columns = [
    {
      key: 'invoiceNumber',
      title: 'Invoice Number'
    },
    {
      key: 'itemCode',
      title: 'Code'
    },
    {
      key: 'description',
      title: 'Description'
    },
    {
      key: 'type',
      title: 'Type' // Service / Product
    },
    {
      key: 'clinicService',
      title: 'Clinic / Service'
    },
    {
      key: 'amount',
      title: 'Qty'
    },
    {
      key: 'price',
      title: 'Unit Price'
    },
    {
      key: 'total',
      title: 'Total'
    }
  ];

  return (
    <div>
      <MyTable data={dummyData} columns={columns} loading={false} />
      <PaymentModal
        open={openPayModal}
        localPatient=""
        setOpen={setOpenPayModal}
        localVisit=""
      />
    </div>
  );
};

export default Receipt;
