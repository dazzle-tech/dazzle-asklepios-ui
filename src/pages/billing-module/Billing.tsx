import React, { useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { Checkbox } from 'rsuite';
import DiscountModal from './DiscountModal';
import RefundModal from './RefundModal';
import { CiDiscount1 } from 'react-icons/ci';
import { MdOutlinePriceChange } from 'react-icons/md';
import ChangePriceListModal from './ChangePriceListModal';
const Billing = () => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [openDiscountModal, setOpenDiscountModal] = useState<boolean>(false);
  const [openRefundModal, setOpenRefundModal] = useState<boolean>(false);
  const [openChangePriceListModal, setOpenChangePriceListModal] = useState<boolean>(false);
  const [forAllServises, setForAllServices] = useState<boolean>(false);
  const dummyData = [
    {
      id: '1',
      clinic: 'Dental Clinic',
      chargeDate: '2025-11-23',
      type: 'Service1',
      name: 'Initial Checkup',
      price: 50,
      currency: 'USD',
      discount: 0,
      priceList: 'Standard'
    },
    {
      id: '2',
      clinic: 'Dental Clinic',
      chargeDate: '2025-11-23',
      type: 'Service2',
      name: 'Initial Checkup',
      price: 50,
      currency: 'USD',
      discount: 0,
      priceList: 'Standard'
    },
    {
      id: '3',
      clinic: 'Dental Clinic',
      chargeDate: '2025-11-23',
      type: 'Service3',
      name: 'Initial Checkup',
      price: 50,
      currency: 'USD',
      discount: 0,
      priceList: 'Standard'
    }
  ];

  const tableButtons = (
    <div style={{ display: 'flex', gap: '10px' }}>
      <MyButton disabled={!(selectedRows.length >= 3)}>Invoice</MyButton>
      {/* <MyButton onClick={() => setOpenDiscountModal(true)}>Discount</MyButton> */}
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
  // Handle test selection by checking the checkbox
  const handleCheckboxChange = key => {
    setSelectedRows(prev => {
      if (prev.includes(key)) {
        return prev.filter(item => item !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  // Icons column (Edite, reactive/Deactivate)
  const iconsForActions = () => (
    <div className="container-of-icons">
      {/* deactivate/activate  when click on one of these icon */}
      {/* {!rowData?.deletedAt ? (
          <MdDelete
            className="icons-style"
            title="Deactivate"
            size={24}
            fill="var(--primary-pink)"
            onClick={() => {
              setStateOfDeleteUserModal('deactivate');
              setOpenConfirmDeleteUserModal(true);
            }}
          />
        ) : (
          <FaUndo
            className="icons-style"
            title="Activate"
            size={20}
            fill="var(--primary-gray)"
            onClick={() => {
              setStateOfDeleteUserModal('reactivate');
              setOpenConfirmDeleteUserModal(true);
            }}
          />
        )} */}
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
  //  const servicesAndProductsForPatient = [];
  const columns = [
    {
      key: '',
      title: '',
      render: rowData => (
        <Checkbox
          checked={selectedRows.includes(rowData.id)}
          onChange={() => handleCheckboxChange(rowData.id)}
        />
      )
    },
    {
      key: 'clinic',
      title: 'Clinic'
    },
    {
      key: 'chargeDate',
      title: 'Charge Date'
    },
    {
      key: 'type',
      title: 'Type'
    },
    {
      key: 'name',
      title: 'Name'
    },
    {
      key: 'price',
      title: 'Price'
    },
    {
      key: 'currency',
      title: 'Currency'
    },
    {
      key: 'discount',
      title: 'Discount'
    },
    {
      key: 'priceList',
      title: 'Price List'
    },
    {
      key: '',
      title: '',
      render: () => iconsForActions()
    }
  ];
  return (
    <div>
      <MyTable data={dummyData} columns={columns} loading={false} tableButtons={tableButtons} />
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
