import React, { useState } from 'react';
import '../styles.less';
import Translate from '@/components/Translate';
import { PlusRound } from '@rsuite/icons';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddEditNextOfKin from './AddEditNextOfKin';
const NextOfKin = ({ patient, isClick }) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [nextOfKin, setNextOfKin] = useState({});
  const [id, setId] = useState(5);
  const [openConfirmationDeleteNextOfKinModal, setOpenConfirmationDeleteNextOfKinModal] = useState(false);
  

  //Table Content Column
  const columns = [
    {
      key: 'name',
      title: <Translate>Name</Translate>,
     
    },
    {
      key: 'relationship',
      title: <Translate>Relationship</Translate>,
    },
    {
      key: 'address',
      title: <Translate>Address</Translate>,
    },
    {
      key: 'email',
      title: <Translate>Email</Translate>,
    },
    {
      key: 'mobileNumber',
      title: <Translate>Mobile Number</Translate>,
    },
    {
      key: 'telephone',
      title: <Translate>Telephone</Translate>,
    },
     {
      key: 'internationalNumber',
      title: <Translate>International Number</Translate>,
    },
     {
      key: 'landlineNumber',
      title: <Translate>Landline Number</Translate>,
    },
     {
          key: 'icons',
          title: <Translate></Translate>,
          flexGrow: 3,
          render: () => iconsForActions()
        }
  ];
  const [data,setData] = useState([
  {
    id: "1",
    name: "Rawan Yahya",
    relationship: "Friend",
    address: "123 Main St, Gaza",
    email: "rawan@example.com",
    mobileNumber: "0591234567",
    telephone: "081234567",
    internationalNumber: "970591234567",
    landlineNumber: "087654321"
  },
  {
    id: "2",
    name: "Ahmad Khalil",
    relationship: "Brother",
    address: "45 Al-Nasser St, Ramallah",
    email: "ahmad@example.com",
    mobileNumber: "0599876543",
    telephone: "029876543",
    internationalNumber: "970599876543",
    landlineNumber: "021234567"
  },
  {
    id: "3",
    name: "Lina Saeed",
    relationship: "Father",
    address: "78 Al-Quds St, Nablus",
    email: "lina@example.com",
    mobileNumber: "0591122334",
    telephone: "091122334",
    internationalNumber: "970591122334",
    landlineNumber: "094433221"
  },
  {
    id: "4",
    name: "Omar Fathi",
    relationship: "Cousin",
    address: "12 Al-Hussein St, Hebron",
    email: "omar@example.com",
    mobileNumber: "0595566778",
    telephone: "025566778",
    internationalNumber: "970595566778",
    landlineNumber: "028877665"
  },
  {
    id: "5",
    name: "Sara Nabil",
    relationship: "Sister",
    address: "90 Al-Amal St, Jenin",
    email: "sara@example.com",
    mobileNumber: "0593344556",
    telephone: "093344556",
    internationalNumber: "970593344556",
    landlineNumber: "095566778"
  }
]);

 // Icons column (Edit, Delete)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setOpen(true)}
      />
        <MdDelete
          className="icons"
          title="Delete"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setOpenConfirmationDeleteNextOfKinModal(true);
          }}
        />
    </div>
  );

  // Function to check if the current row is the selected one
  const isSelected = rowData => {
    if (rowData && nextOfKin && nextOfKin?.id === rowData?.id) {
      return 'selected-row';
    } else return '';
  };
 
  // Handle adding a new next of kin
  const handleNewNextOfKit = () => {
    setNextOfKin({ });
    setOpen(true);
  };

  // Handle deleting a next of kin
  const handleDeleteNextOfKin = () => {
    const newData = data.filter(item => item?.id !== nextOfKin?.id);
    setData(newData);

  dispatch(
    notify({ msg: 'Next Of Kin Deleted Successfully', sev: 'success' })
  );

  setOpenConfirmationDeleteNextOfKinModal(false);
  setNextOfKin({});
  };
  

  return (
    <div className="tab-main-container">
      <div className="tab-content-btns">
        <AddEditNextOfKin
          open={open}
          setOpen={setOpen}
          nextOfKin={nextOfKin}
          setNextOfKin={setNextOfKin}
          data={data}
          setData={setData}
          id={id}
          setId={setId}
        />
        <MyButton
          onClick={handleNewNextOfKit}
          disabled={isClick}
          prefixIcon={() => <PlusRound />}
        >
          Add
        </MyButton>
      </div>
      <MyTable
        data={patient?.key ? data : []}
        columns={columns}
        onRowClick={rowData => {
          setNextOfKin(rowData);
        }}
        rowClassName={isSelected}
      />
      <DeletionConfirmationModal
        open={openConfirmationDeleteNextOfKinModal}
        setOpen={setOpenConfirmationDeleteNextOfKinModal}
        itemToDelete="Next Of Kin"
        actionButtonFunction={handleDeleteNextOfKin}
      ></DeletionConfirmationModal>
    </div>
  );
};

export default NextOfKin;
