import React, { useEffect, useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill } from '@fortawesome/free-solid-svg-icons';

import MyTable from '@/components/MyTable';
import PaymentModal from './PaymentModal';

import { useAppSelector } from '@/hooks';
import { useGetPatientInvoicesQuery } from '@/services/patient/patientBillingInvoiceService';
import { BillingInvoiceResponseVM } from '@/types/model-types-new';

type InvoicesProps = {
  patient?: any;
  onSimulatedInvoicePayment?: (amount: number) => void;
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
  encounterId?: number;
};

const Invoices: React.FC<InvoicesProps> = ({ patient, onSimulatedInvoicePayment }) => {
  const authSlice = useAppSelector(state => state.auth);

  const patientNumericId = Number(
    (patient?.id != null ? patient.id : patient?.key) ?? NaN
  );

  const { data, isLoading } = useGetPatientInvoicesQuery(
    {
      page: 0,
      size: 50,
      sort: 'id,desc',
      patientId: patientNumericId,
    },
    { skip: !Number.isFinite(patientNumericId) }
  );

  const invoices: any[] = Number.isFinite(patientNumericId) ? data?.data ?? [] : [];
  const [statusOverrides, setStatusOverrides] = useState<
    Record<number, InvoiceRow['status']>
  >({});

  const mapped: InvoiceRow[] = invoices.map(inv => {
    const statusRaw = String(inv.status ?? '').toUpperCase();
    const status: InvoiceRow['status'] =
      statusRaw === 'PAID'
        ? 'Paid'
        : statusRaw === 'PENDING' || statusRaw === 'NEW'
        ? 'Pending'
        : 'Partially';
    const invoiceId = Number(inv.id);
    return {
      id: invoiceId,
      invoiceNumber: inv.invoiceNumber ?? `INV-${inv.id}`,
      createdBy: inv.createdBy || 'systemadmin',
      createdAt:
        (inv.createdDate && String(inv.createdDate).substring(0, 10)) || '',
      amount: Number(inv.totalAmount ?? 0),
      status: statusOverrides[invoiceId] ?? status,
      method: 'N/A',
      patientKey: String(inv.patientKey ?? patient?.key ?? ''),
      encounterId: Number(inv.encounterId ?? inv.encounterKey ?? 0) || undefined,
    };
  });

  const [openPayModal, setOpenPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(
    null
  );

  useEffect(() => {
    setStatusOverrides({});
    setSelectedInvoice(null);
    setOpenPayModal(false);
  }, [patient?.id, patient?.key]);

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
        onSimulatedPaid={(invoiceId, nextStatus, paidAmount) => {
          setStatusOverrides(prev => ({ ...prev, [invoiceId]: nextStatus }));
          onSimulatedInvoicePayment?.(Number(paidAmount ?? 0));
        }}
        invoice={
          selectedInvoice
            ? {
                id: selectedInvoice.id,
                amount: selectedInvoice.amount,
                encounterId: selectedInvoice.encounterId,
              }
            : null
        }
      />
    </div>
  );
};

export default Invoices;
