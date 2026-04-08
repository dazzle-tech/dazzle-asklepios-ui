import React, { useEffect, useState } from 'react';
import { Checkbox, Message, useToaster } from 'rsuite';
import { CiDiscount1 } from 'react-icons/ci';
import { MdOutlinePriceChange } from 'react-icons/md';

import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';

import DiscountModal from './DiscountModal';
import RefundModal from './RefundModal';
import ChangePriceListModal from './ChangePriceListModal';

import { useGenerateInvoicePdfMutation } from '@/services/setup/invoiceReportApi';
import { calculateAgeFormat } from '@/utils';
import type { BillingItem } from '@/types/model-types-new';


type BillingProps = {
  data: BillingItem[];
  patient: any;
  onCreateInvoice: (selectedIds: string[]) => Promise<void>;
};

const Billing = ({ data, patient, onCreateInvoice }: BillingProps) => {
  const toaster = useToaster();
  const [currentRecord, setCurrentRecord] = useState(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [openDiscountModal, setOpenDiscountModal] = useState<boolean>(false);
  const [openRefundModal, setOpenRefundModal] = useState<boolean>(false);
  const [openChangePriceListModal, setOpenChangePriceListModal] =
    useState<boolean>(false);
  const [forAllServises, setForAllServices] = useState<boolean>(false);

  const [generateInvoicePdf, { isLoading: isGeneratingPdf }] =
    useGenerateInvoicePdfMutation();

  useEffect(() => {
    if (!patient?.id) return;
    console.log('[Billing] rows received for selected patient', {
      patientId: patient.id,
      totalRows: data?.length ?? 0,
      rows: data,
    });
  }, [patient?.id, data]);

  const handleCheckboxChange = (key: string) => {
    setSelectedRows(prev => {
      if (prev.includes(key)) {
        return prev.filter(item => item !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
    } else {
      const allIds = data.map(item => item.id);
      setSelectedRows(allIds);
    }
  };

  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const isIndeterminate =
    selectedRows.length > 0 && selectedRows.length < data.length;

  const handleCreateInvoice = async () => {
    if (selectedRows.length === 0) {
      toaster.push(
        <Message showIcon type="warning" closable>
          Please select at least one item
        </Message>,
        { placement: 'topEnd', duration: 3000 }
      );
      return;
    }

    await onCreateInvoice(selectedRows);

    try {
      const selectedItems = data.filter(item => selectedRows.includes(item.id));

      const totalAmount = selectedItems.reduce((sum, item) => {
        const discountedPrice =
          item.price - (item.price * (item.discount || 0)) / 100;
        return sum + discountedPrice;
      }, 0);

      const invoiceNumber = `INV-${Date.now()}`;

      const patientFullName = patient
        ? `${patient.firstName || ''} ${patient.secondName || ''} ${patient.thirdName || ''
          } ${patient.lastName || ''}`.trim()
        : 'N/A';

      const genderDisplay =
        patient?.genderLvalue?.lovDisplayVale || 'Not specified';

      const ageDisplay = patient?.dob
        ? calculateAgeFormat(patient.dob)
        : 'N/A';

      const phoneNumber =
        patient?.phoneNumber ||
        patient?.mobileNumber ||
        patient?.homePhone ||
        'N/A';

      const invoiceData = {
        patientInfo: {
          name: patientFullName || 'N/A',
          mrn: patient?.patientMrn || 'N/A',
          dob: patient?.dob || 'N/A',
          age: ageDisplay || 'N/A',
          gender: genderDisplay || 'N/A',
          phoneNumber: phoneNumber || 'N/A',
        },
        visitInfo: {
          visitDate: new Date().toLocaleDateString('en-GB'),
          visitType: 'General',
        },
        invoiceInfo: {
          invoiceNumber: invoiceNumber || 'N/A',
          totalAmount: totalAmount.toFixed(2) || '0.00',
          currency: selectedItems[0]?.currency || 'USD',
        },
        items: selectedItems.map(item => ({
          chargeDate: item.chargeDate || 'N/A',
          clinic: item.clinic || 'N/A',
          name: item.name || 'N/A',
          type: item.type || 'N/A',
          price: item.price || 0,
          currency: item.currency || 'USD',
          discount: item.discount || 0,
          quantity: item.quantity || 1,
        })),
      };

      const blob = await generateInvoicePdf(invoiceData).unwrap();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invoiceNumber}_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toaster.push(
        <Message showIcon type="success" closable>
          Invoice PDF generated successfully!
        </Message>,
        { placement: 'topEnd', duration: 3000 }
      );

      setSelectedRows([]);
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      toaster.push(
        <Message showIcon type="error" closable>
          Failed to generate invoice: {error?.message || 'Unknown error'}
        </Message>,
        { placement: 'topEnd', duration: 5000 }
      );
    }
  };

  const tableButtons = (
    <div style={{ display: 'flex', gap: '10px' }}>
      <MyButton
        disabled={selectedRows.length === 0 || isGeneratingPdf}
        onClick={handleCreateInvoice}
        loading={isGeneratingPdf}
      >
        {isGeneratingPdf ? 'Generating...' : 'Invoice'}
      </MyButton>

      {/* <MyButton
        onClick={() => {
          setOpenChangePriceListModal(true);
          setForAllServices(true);
        }}
      >
        Bulk Price List Change
      </MyButton> */}

      <MyButton onClick={() => setOpenRefundModal(true)}>Refund</MyButton>
    </div>
  );

  const iconsForActions = () => (
    <div className="container-of-icons">
      <CiDiscount1
        size={22}
        onClick={() => setOpenDiscountModal(true)}
        className="icons-style"
        title="Discount"
      />
      <MdOutlinePriceChange
        size={22}
        onClick={() => {
          setOpenChangePriceListModal(true);
          setForAllServices(false);
        }}
        className="icons-style"
        title="Change Price List"
      />
    </div>
  );

  const columns = [
    {
      key: 'select',
      title: (
        <Checkbox
          checked={allSelected}
          indeterminate={isIndeterminate}
          onChange={handleToggleSelectAll}
        />
      ),
      render: (rowData: BillingItem) => (
        <Checkbox
          checked={selectedRows.includes(rowData.id)}
          onChange={() => handleCheckboxChange(rowData.id)}
        />
      ),
    },
    { key: 'clinic', title: 'Clinic' },
    { key: 'chargeDate', title: 'Charge Date' },
    { key: 'type', title: 'Type' },
    { key: 'name', title: 'Name' },
    { key: 'price', title: 'Price' },
    { key: 'currency', title: 'Currency' },
    { key: 'quantity', title: 'Quantity' },
    { key: 'totalPrice', title: 'Total Price' },
    { key: 'discount', title: 'Discount' },
    { key: 'priceList', title: 'Price List' },
    {
      key: 'actions',
      title: '',
      render: () => iconsForActions(),
    },
  ];

  return (
    <div>
      <MyTable
        data={data}
        columns={columns}
        onRowClick={(row) => {
          setCurrentRecord(row);
        }}
        loading={false}
        tableButtons={tableButtons}
      />

      <DiscountModal
        open={openDiscountModal}
        setOpen={setOpenDiscountModal}
        record=""
        setRecord=""
      />
      <RefundModal
        open={openRefundModal}
        setOpen={setOpenRefundModal}
        record=""
        setRecord=""
      />
      <ChangePriceListModal
        open={openChangePriceListModal}
        setOpen={setOpenChangePriceListModal}
        record={currentRecord}
        setRecord={setCurrentRecord}
        forAllServises={forAllServises}
      />
    </div>
  );
};

export default Billing;

