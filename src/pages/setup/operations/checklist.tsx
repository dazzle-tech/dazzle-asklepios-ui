import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { FaUndo } from 'react-icons/fa';
import { ApModule } from '@/types/model-types';
import { MdOutlineChecklistRtl } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { MdModeEdit } from 'react-icons/md';
import MyButton from '@/components/MyButton/MyButton';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddEditCheckList from './AddEditCheckList';
import LinkCheckList from './LinkCheckList';
import './styles.less';
const Checklist = () => {
  const dispatch = useAppDispatch();
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [checklist, setChecklist] = useState({});
  const [openAddEditPopup, setOpenAddEditPopup] = useState<boolean>(false);
  const [openLinkCheckListPopup, setOpenLinkCheckListPopup] = useState<boolean>(false);
  const [openConfirmDeleteChecklist, setOpenConfirmDeleteChecklist] = useState<boolean>(false);
  const [stateOfDeleteChecklist, setStateOfDeleteChecklist] = useState<string>('delete');
  // dummy data
  const data = [
    { key: '1', operationName: 'op1', checkListName: 'ch1', isValid: true },
    { key: '2', operationName: 'op2', checkListName: 'ch2', isValid: true },
    { key: '3', operationName: 'op2', checkListName: 'ch3', isValid: true },
    { key: '4', operationName: 'op2', checkListName: 'ch4', isValid: false }
  ];

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
      // Header page setUp
      const divContent = (
        <div className="page-title">
          <h5><Translate>Checklists</Translate></h5>
        </div>
      );
      dispatch(setPageCode('Checklists'));
      dispatch(setDivContent(divContent));
  
      return () => {
        dispatch(setPageCode(''));
        dispatch(setDivContent(''));
      };
    }, [dispatch]);

  // handling click on Add New Button
  const handleAddNew = () => {
    setOpenAddEditPopup(true);
    setChecklist({});
  };
  // className for selected row
  const isSelected = rowData => {
    if (rowData && checklist && rowData.key === checklist.key) {
      return 'selected-row';
    } else return '';
  };

  // handle reactivate checklist
  const handleReactivate = () => {
    setOpenConfirmDeleteChecklist(false);
  };

  // handle deactivate checklist
  const handleDeactivate = () => {
    setOpenConfirmDeleteChecklist(false);
  };

  //icons column for(edit, deactivate)
  const iconsForActions = (rowData: ApModule) => (
    <div className="container-of-icons">
      <MdOutlineChecklistRtl
        title="Link cheklist"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => setOpenLinkCheckListPopup(true)}
      />
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => setOpenAddEditPopup(true)}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteChecklist('deactivate');
            setOpenConfirmDeleteChecklist(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteChecklist('reactivate');
            setOpenConfirmDeleteChecklist(true);
          }}
        />
      )}
    </div>
  );

  //table columns
  const tableColumns = [
    {
      key: 'operationName',
      title: <Translate>Operation Name</Translate>
    },
    {
      key: 'checkListName',
      title: <Translate>cheklist Name</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: rowData => iconsForActions(rowData)
    }
  ];
  return (
    <Panel>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleAddNew}
          width="109px"
        >
          Add New
        </MyButton>
      </div>
      <MyTable
        height={450}
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setChecklist(rowData);
        }}
      />
      <AddEditCheckList
        open={openAddEditPopup}
        setOpen={setOpenAddEditPopup}
        width={width}
        checklist={checklist}
        setChecklist={setChecklist}
      />
      <LinkCheckList
        open={openLinkCheckListPopup}
        setOpen={setOpenLinkCheckListPopup}
        width={width}
        checklist={checklist}
        setChecklist={setChecklist}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteChecklist}
        setOpen={setOpenConfirmDeleteChecklist}
        itemToDelete="CheckList"
        actionButtonFunction={
          stateOfDeleteChecklist == 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeleteChecklist}
      />
    </Panel>
  );
};
export default Checklist;
