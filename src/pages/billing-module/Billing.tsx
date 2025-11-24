import React, { useState } from 'react';
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

type BillingProps = {
  data: BillingItem[];
  patient?: any; // Patient object from your system
  onCreateInvoice: (ids: string[]) => void;
};

const Billing: React.FC<BillingProps> = ({ data, patient, onCreateInvoice }) => {
  const toaster = useToaster();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [openDiscountModal, setOpenDiscountModal] = useState<boolean>(false);
  const [openRefundModal, setOpenRefundModal] = useState<boolean>(false);
  const [openChangePriceListModal, setOpenChangePriceListModal] = useState<boolean>(false);
  const [forAllServises, setForAllServices] = useState<boolean>(false);

  // RTK Query mutation
  const [generateInvoicePdf, { isLoading: isGeneratingPdf }] = useGenerateInvoicePdfMutation();

  // Handle selection
  const handleCheckboxChange = (key: string) => {
    setSelectedRows((prev) => {
      if (prev.includes(key)) {
        return prev.filter((item) => item !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  console.log('patient', patient);

  // Generate Invoice PDF
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

    try {
      // Filter selected items
      const selectedItems = data.filter((item) => selectedRows.includes(item.id));

      // Calculate total
      const totalAmount = selectedItems.reduce((sum, item) => {
        const discountedPrice = item.price - (item.price * item.discount) / 100;
        return sum + discountedPrice;
      }, 0);

      // Generate invoice number (you can customize this)
      const invoiceNumber = `INV-${Date.now()}`;

      // Build patient full name
      const patientFullName = patient
        ? `${patient.firstName || ''} ${patient.secondName || ''} ${patient.thirdName || ''} ${patient.lastName || ''}`.trim()
        : 'N/A';

      // Get gender display value
      const genderDisplay = patient?.genderLvalue?.lovDisplayVale || 'Not specified';

      // Calculate age
      const ageDisplay = patient?.dob ? calculateAgeFormat(patient.dob) : 'N/A';

      // Get phone number
      const phoneNumber = patient?.phoneNumber || patient?.mobileNumber || patient?.homePhone || 'N/A';

      // Prepare data for backend
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
          visitType: 'General'
        },
        invoiceInfo: {
          invoiceNumber: invoiceNumber || 'N/A',
          totalAmount: totalAmount.toFixed(2) || '0.00',
          currency: selectedItems[0]?.currency || 'USD',
        },
        items: selectedItems.map((item) => ({
          chargeDate: item.chargeDate || 'N/A',
          clinic: item.clinic || 'N/A',
          name: item.name || 'N/A',
          type: item.type || 'N/A',
          price: item.price || 0,
          currency: item.currency || 'USD',
          discount: item.discount || 0,
        })),
      };

      console.log('Sending invoice data:', invoiceData);

      // Call API
      const blob = await generateInvoicePdf(invoiceData).unwrap();

      // Download PDF
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

      // Clear selection
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

  console.log('Billing data:', data);

  const tableButtons = (
    <div style={{ display: 'flex', gap: '10px' }}>
      <MyButton
        disabled={selectedRows.length === 0 || isGeneratingPdf}
        onClick={handleCreateInvoice}
        loading={isGeneratingPdf}
      >
        {isGeneratingPdf ? 'Generating...' : 'Invoice'}
      </MyButton>

      <MyButton
        onClick={() => {
          setOpenChangePriceListModal(true);
          setForAllServices(true);
        }}
      >
        Bulk Price List Change
      </MyButton>

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
      title: '',
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
      <MyTable data={data} columns={columns} loading={false} tableButtons={tableButtons} />

      <DiscountModal
        open={openDiscountModal}
        setOpen={setOpenDiscountModal}
        record=""
        setRecord=""
      />
      <RefundModal open={openRefundModal} setOpen={setOpenRefundModal} record="" setRecord="" />
      <ChangePriceListModal
        open={openChangePriceListModal}
        setOpen={setOpenChangePriceListModal}
        record=""
        setRecord=""
        forAllServises={forAllServises}
      />
    </div>
  );
};

export default Billing;