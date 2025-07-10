import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Checkbox, Panel } from 'rsuite';
import { MdModeEdit } from 'react-icons/md';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import './styles.less';
import AddEditMdtNote from './AddEditMdtNote';
import CancellationModal from '@/components/CancellationModal';
const MultidisciplinaryTeamNotes = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openCancellationReasonModel, setOpenCancellationReasonModel] = useState(false);
  const [mdtNote, setMdtNode] = useState({});

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && mdtNote && rowData.key === mdtNote.key) {
      return 'selected-row';
    } else return '';
  };

  // dummy data
   const data = [
    {
      key: '1',
      shift: 'shuft1',
      role: 'role1',
      name: 'name1',
      note: 'note1',
      createdAt: '01:01',
      createdBy: 'Rawan',
      deletedAt: '11:11',
      deletedBy: 'Hanan',
      updatedAt: '05:05',
      updatedBy: 'Bushra',
      cancelledReason: 'no reason'
    },
    {
      key: '2',
      shift: 'shuft2',
      role: 'role2',
      name: 'name2',
      note: 'note2',
      createdAt: '02:02',
      createdBy: 'Batool',
      deletedAt: '',
      deletedBy: '',
      updatedAt: '06:06',
      updatedBy: 'Hanan',
      cancelledReason: 'test'
    },
    {
      key: '3',
      shift: 'shuft3',
      role: 'role3',
      name: 'name3',
      note: 'note3',
      createdAt: '03:03',
      createdBy: 'Bushra',
      deletedAt: '13:13',
      deletedBy: 'Bushra',
      updatedAt: '07:07',
      updatedBy: 'Walaa',
      cancelledReason: 'no reason'
    },
    {
      key: '4',
      shift: 'shuft4',
      role: 'role4',
      name: 'name4',
      note: 'note4',
      createdAt: '04:04',
      createdBy: 'Walaa',
      deletedAt: '14:14',
      deletedBy: 'Walaa',
      updatedAt: '08:08',
      updatedBy: 'Batool',
      cancelledReason: 'test'
    }
  ];
  

  // Handle click on Add New Button
  const handleNew = () => {
    setPopupOpen(true);
    setMdtNode({});
  };

  //icons column (Medical sheets, Edite, Active/Deactivate)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setPopupOpen(true);
        }}
      />
    </div>
  );
  // table Columns
  const tableColumns = [
    {
      key: 'shift',
      title: <Translate>Shift</Translate>
    },
    {
      key: 'role',
      title: <Translate>Role</Translate>
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>
    },
    {
      key: 'note',
      title: <Translate>Note</Translate>
    },
    {
      key: '',
      title: <Translate>Created At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.createdAt + '/' + rowData.createdBy}</span>
          </>
        );
      }
    },
    {
      key: '',
      title: <Translate>Cancelled At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.deletedAt + '/' + rowData.deletedBy}</span>
          </>
        );
      }
    },
    {
      key: '',
      title: <Translate>Updated At/By</Translate>,
      expandable: true,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.updatedAt + '/' + rowData.createdBy}</span>
          </>
        );
      }
    },
    {
      key: 'cancelledReason',
      title: <Translate>Cancelled Reason</Translate>,
      expandable: true
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 4,
      render: () => iconsForActions()
    }
  ];
  
  // handle cancel
  const handleCancle = async () => {
    setOpenCancellationReasonModel(false);
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Panel>
      <div className="container-of-header-action-mdt">
        <div>
          <MyButton
            prefixIcon={() => <CloseOutlineIcon />}
            onClick={() => setOpenCancellationReasonModel(true)}
            disabled={mdtNote?.key == null ? true : false}
          >
            Cancel
          </MyButton>

          <Checkbox>Show Cancelled</Checkbox>
        </div>
        <MyButton
          prefixIcon={() => <PlusIcon />}
          onClick={handleNew}
        >
          Add New
        </MyButton>
      </div>
      <MyTable
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setMdtNode(rowData);
        }}
      />
      <AddEditMdtNote
        open={popupOpen}
        setOpen={setPopupOpen}
        mdtNote={mdtNote}
        setMdtNote={setMdtNode}
        width={width}
      />
      <CancellationModal
        open={openCancellationReasonModel}
        setOpen={setOpenCancellationReasonModel}
        object={mdtNote}
        setObject={setMdtNode}
        handleCancle={handleCancle}
        fieldName="cancelledReason"
        fieldLabel={'Cancelled Reason'}
        title={'Cancellation'}
      ></CancellationModal>
    </Panel>
  );
};

export default MultidisciplinaryTeamNotes;
