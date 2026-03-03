import React, { useMemo, useState } from 'react';
import '../styles.less';
import Translate from '@/components/Translate';
import { PlusRound } from '@rsuite/icons';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddEditNextOfKin from './AddEditNextOfKin';

// ✅ hooks من RTK Query service
import {
  useGetNextOfKinByPatientQuery,
  useDeleteNextOfKinMutation
} from '@/services/patients/NextOfKinService'; 
import { newNextOfKin } from '@/types/model-types-constructor-new';

const NextOfKin = ({ patient, isClick }) => {
  const dispatch = useAppDispatch();

  const patientId = patient?.id; 

  const [open, setOpen] = useState(false);
  const [nextOfKin, setNextOfKin] = useState({...newNextOfKin}); 
  const [openConfirmationDeleteNextOfKinModal, setOpenConfirmationDeleteNextOfKinModal] =
    useState(false);

  // ✅ fetch list
  const {
    data: data = [],
    isFetching,
    isLoading,
    isError
  } = useGetNextOfKinByPatientQuery(
    { patientId },
    { skip: !patientId }
  );

  // ✅ delete mutation
  const [deleteNextOfKin, { isLoading: isDeleting }] = useDeleteNextOfKinMutation();

  const iconsForActions = rowData => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setNextOfKin(rowData);
          setOpen(true);
        }}
      />
      <MdDelete
        className="icons"
        title="Delete"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setNextOfKin(rowData);
          setOpenConfirmationDeleteNextOfKinModal(true);
        }}
      />
    </div>
  );

  // Table columns
  const columns = useMemo(
    () => [
      { key: 'name', title: <Translate>Name</Translate> },
      { key: 'relationship', title: <Translate>Relationship</Translate> },
      { key: 'address', title: <Translate>Address</Translate> },
      { key: 'email', title: <Translate>Email</Translate> },
      { key: 'mobileNumber', title: <Translate>Mobile Number</Translate> },
      { key: 'telephone', title: <Translate>Telephone</Translate> },
      { key: 'internationalNumber', title: <Translate>International Number</Translate> },
      { key: 'landlineNumber', title: <Translate>Landline Number</Translate> },
      {
        key: 'icons',
        title: <Translate></Translate>,
        flexGrow: 3,
        render: rowData => iconsForActions(rowData) // ✅ مهم
      }
    ],
    []
  );

  // selected row class
  const isSelected = rowData => {
    if (rowData && nextOfKin && nextOfKin?.id === rowData?.id) return 'selected-row';
    return '';
  };

  // Add new
  const handleNewNextOfKin = () => {
    setNextOfKin({...newNextOfKin}); // reset form
    setOpen(true);
  };

  // Delete action
  const handleDeleteNextOfKin = async () => {
    if (!nextOfKin?.id || !patientId) return;

    try {
      await deleteNextOfKin({ id: nextOfKin.id, patientId }).unwrap();
      dispatch(notify({ msg: 'Next Of Kin Deleted Successfully', sev: 'success' }));
    } catch (e) {
      dispatch(notify({ msg: 'Delete failed', sev: 'warning' }));
      console.error('Delete Next Of Kin error:', e);
    } finally {
      setOpenConfirmationDeleteNextOfKinModal(false);
      setNextOfKin({...newNextOfKin});
    }
  };

  return (
    <div className="tab-main-container">
      <div className="tab-content-btns">
        <AddEditNextOfKin
          open={open}
          setOpen={setOpen}
          patientId={patientId}
          nextOfKin={nextOfKin}
          setNextOfKin={setNextOfKin}
        />

        <MyButton onClick={handleNewNextOfKin} disabled={isClick || !patientId} prefixIcon={() => <PlusRound />}>
          Add
        </MyButton>
      </div>

      {/* optional status */}
      {isError && (
        <div style={{ padding: 8 }}>
          <Translate>Failed to load Next Of Kin</Translate>
        </div>
      )}

      <MyTable
        data={patientId ? data : []}
        columns={columns}
        loading={isLoading || isFetching}
        onRowClick={rowData => setNextOfKin(rowData)}
        rowClassName={isSelected}
      />

      <DeletionConfirmationModal
        open={openConfirmationDeleteNextOfKinModal}
        setOpen={setOpenConfirmationDeleteNextOfKinModal}
        itemToDelete="Next Of Kin"
        actionButtonFunction={handleDeleteNextOfKin}
      />
    </div>
  );
};

export default NextOfKin;