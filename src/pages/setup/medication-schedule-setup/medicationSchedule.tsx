import React, { useState } from 'react';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, Panel } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import ReactDOMServer from 'react-dom/server';
import { useDispatch } from 'react-redux';
import { setPageCode, setDivContent } from '@/reducers/divSlice';
import { faPills } from '@fortawesome/free-solid-svg-icons';
import { MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const MedicationSchedule = () => {
  //
  const data = [
    { id: 0, frequency: 'Every 6 Hours', firstDoseTime: '08:00', status: 'Active', active: true },
    {
      id: 1,
      frequency: 'Every 4 Hours',
      firstDoseTime: '09:00',
      status: 'Deactive',
      active: false
    },
    { id: 2, frequency: 'Every 6 Hours', firstDoseTime: '11:00', status: 'Active', active: true },
    { id: 3, frequency: 'Every 4 Hours', firstDoseTime: '14:00', status: 'Active', active: true }
  ];

  //
  const columns = [
    {
      key: 'frequency',
      title: <Translate>Frequency</Translate>
    },
    {
      key: 'firstDoseTime',
      title: <Translate>First Dose Time</Translate>
    },
    {
      key: 'status',
      title: 'Status',
      dataKey: 'status',
    },
    {
      key: 'actions',
      title: '',
      width: 120,
      align: 'center',
      render: rowData => {
        return (
          <div className="container-of-icons">
            <MdModeEdit
              title="Edit"
              size={24}
              style={{ cursor: 'pointer' }}
              onClick={() => setOpenModal(true)}
            />
            {rowData.active ? (
              <MdDelete
                className="icons-style"
                title="Deactivate"
                size={24}
                style={{ fill: 'var(--primary-pink)', cursor: 'pointer' }}
                onClick={() => {
                  setSelectedItemId(rowData.id);
                  setActionType('deactivate');
                  setOpenConfirmDeleteModal(true);
                }}
              />
            ) : (
              <FaUndo
                className="icons-style"
                title="Reactivate"
                size={24}
                style={{
                  fill: 'var(--primary-gray)',
                  cursor: 'pointer',
                  transform: 'rotate(180deg)'
                }}
                onClick={() => {
                  setSelectedItemId(rowData.id);
                  setActionType('reactivate');
                  setOpenConfirmDeleteModal(true);
                }}
              />
            )}
          </div>
        );
      }
    }
  ];
  //
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState(false);
  const [actionType, setActionType] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [Data, setData] = useState(data);
  const dispatch = useDispatch();
  //
  const divContent = (
    <div className="page-title">
      <h5>Medication Schedule Setup</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Medication_Schedule_Setup'));
  dispatch(setDivContent(divContentHTML));
  //
  const handleDeleteConfirm = () => {
    if (selectedItemId !== null) {
      setData(prev =>
        prev.map(item =>
          item.id === selectedItemId
            ? {
                ...item,
                active: actionType === 'reactivate',
                status: actionType === 'reactivate' ? 'Active' : 'Deactive'
              }
            : item
        )
      );
    }
    setOpenConfirmDeleteModal(false);
    setSelectedItemId(null);
  };

  return (
    <>
      <Panel className="main-supplier-setup-page-gaps">
        <div className="add-new-supplier-button">
          <MyButton prefixIcon={() => <AddOutlineIcon />} onClick={() => setOpenModal(true)}>
            Add New
          </MyButton>
        </div>
      </Panel>
      <MyTable data={Data} columns={columns} />

      <MyModal
        open={openModal}
        setOpen={setOpenModal}
        title="Add Dose Info"
        position="right"
        content={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Form fluid>
              <MyInput
                fieldName="frequencyHours"
                fieldLabel="Every"
                fieldType="number"
                record={''}
                setRecord={{}}
                width={200}
                rightAddon={'hrs'}
                required
              />

              <MyInput
                fieldName="firstDoseTime"
                fieldLabel="First Dose Time"
                fieldType="time"
                record={''}
                setRecord={{}}
                width={245}
                required
              />
            </Form>
          </div>
        }
        hideActionBtn={false}
        actionButtonLabel="Save"
        size="18vw"
        steps={[{ title: 'Add Dose Details', icon: <FontAwesomeIcon icon={faPills} /> }]}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteModal}
        setOpen={setOpenConfirmDeleteModal}
        itemToDelete="Supplier"
        actionButtonFunction={handleDeleteConfirm}
        actionType={actionType}
      />
    </>
  );
};

export default MedicationSchedule;
