import React, { useState } from 'react';
import MyTable from '@/components/MyTable';
import PaymentModal from './PaymentModal';

const Receipt = () => {
  const [openPayModal, setOpenPayModal] = useState<boolean>(false);
  const dummyData = [
    {
      invoiceNumber: 'INV-1001',
      amount: 2,
      price: 50,
      total: 100
    },
    {
      invoiceNumber: 'INV-1002',
      amount: 5,
      price: 20,
      total: 100
    },
    {
      invoiceNumber: 'INV-1003',
      amount: 1,
      price: 75,
      total: 75
    }
  ];

  //  const servicesAndProductsForPatient = [];
  const columns = [
    {
      key: 'invoiceNumber',
      title: 'Invoice Number'
    },
    {
      key: 'amount',
      title: 'Amount'
    },
    {
      key: 'price',
      title: 'Price'
    },
    {
      key: 'total',
      title: 'Total'
    }
  ];
  return (
    <div>
      <MyTable data={dummyData} columns={columns} loading={false} />
      <PaymentModal open={openPayModal} localPatient="" setOpen={setOpenPayModal} localVisit="" />
    </div>
  );
};
export default Receipt;
