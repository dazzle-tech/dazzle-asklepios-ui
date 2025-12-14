import React, { useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill } from '@fortawesome/free-solid-svg-icons';

import MyTable from '@/components/MyTable';
import PaymentModal from './PaymentModal';

import { useAppSelector } from '@/hooks';
import { useGetInvoicesQuery } from '@/services/billing/BillingService';
import { BillingInvoiceResponseVM } from '@/types/model-types-new';

type InvoicesProps = {
  patient?: any;
};

type InvoiceRow = {
  id: number;
  invoiceNumber: string;
  createdBy: string;
  createdAt: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Partially';
  method: string;
  patientKey: string;
};

const Invoices: React.FC<InvoicesProps> = ({ patient }) => {
  const authSlice = useAppSelector(state => state.auth);

  const { data, isLoading } = useGetInvoicesQuery(
    {
      page: 0,
      size: 50,
      sort: 'id,desc',
      patientKey: patient?.key,
      facilityId: authSlice?.tenant?.selectedFacility?.id,
    },
    { skip: !patient?.key }
  );

  const invoices: BillingInvoiceResponseVM[] = data?.data ?? [];

  const mapped: InvoiceRow[] = invoices.map(inv => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    createdBy: inv.createdBy || 'systemadmin',
    createdAt: inv.createdDate?.substring(0, 10) ?? '',
    amount: Number(inv.totalAmount),
    status:
      inv.status === 'PENDING'
        ? 'Pending'
        : inv.status === 'PAID'
        ? 'Paid'
        : 'Partially',
    method: 'N/A',
    patientKey: inv.patientKey || '',
  }));

  const [openPayModal, setOpenPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(
    null
  );

  const iconsForActions = (rowData: InvoiceRow) => (
    <div className="container-of-icons">
      <MdDelete
        className="icons-style"
        title="Delete"
        style={{
          cursor: rowData.status !== 'Pending' ? 'not-allowed' : 'pointer',
          color: 'var(--primary-gray)',
        }}
        size={24}
        fill={rowData.status !== 'Pending' ? '#D4D4D4' : 'var(--primary-pink)'}
        onClick={() => {
          if (rowData.status !== 'Pending') return;
          // TODO: delete/cancel endpoint
        }}
      />

      <FontAwesomeIcon
        icon={faMoneyBill}
        className="icons-style"
        onClick={() => {
          setSelectedInvoice(rowData);
          setOpenPayModal(true);
        }}
        title="Pay"
        color="var(--icon-gray)"
      />
    </div>
  );

  const columns = [
    {
      key: 'invoiceNumber',
      title: 'Invoice Number',
    },
    {
      key: 'createdByAt',
      title: 'Created By/At',
      render: (rowData: InvoiceRow) => (
        <>
          {rowData.createdBy}
          <br />
          <span className="date-table-style">{rowData.createdAt}</span>
        </>
      ),
    },
    {
      key: 'amount',
      title: 'RequestAmount',
    },
    {
      key: 'status',
      title: 'Status',
    },
    {
      key: 'method',
      title: 'Method',
    },
    {
      key: 'actions',
      title: '',
      render: (rowData: InvoiceRow) => iconsForActions(rowData),
    },
  ];

  return (
    <div>
      <MyTable data={mapped} columns={columns} loading={isLoading} />
      <PaymentModal
        open={openPayModal}
        setOpen={setOpenPayModal}
        localPatient={patient}
        invoice={
          selectedInvoice
            ? { id: selectedInvoice.id, amount: selectedInvoice.amount }
            : null
        }
      />
    </div>
  );
};

export default Invoices;
