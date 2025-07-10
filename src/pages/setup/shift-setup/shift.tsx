import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { FaUndo } from 'react-icons/fa';
import {} from '@fortawesome/free-solid-svg-icons';
import { MdDelete } from 'react-icons/md';
import { MdModeEdit } from 'react-icons/md';
import { ApFacility } from '@/types/model-types';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import './styles.less';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddEditShift from './AddEditShift';
const Shifts = () => {
  const dispatch = useAppDispatch();
  const [popupOpen, setPopupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [shift, setShift] = useState({});
  const [openConfirmDeleteShift, setOpenConfirmDeleteShift] = useState<boolean>(false);
  const [stateOfDeleteShift, setStateOfDeleteShift] = useState<string>('delete');

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && shift && rowData.key === shift.key) {
      return 'selected-row';
    } else return '';
  };
  // dummy data
   const data = [
    {
      key: '1',
      facility: 'fac1',
      shiftType: 'type1',
      startTime: 'stime1',
      endTime: 'etime1',
      createdAt: 'ca1',
      createdBy: 'cb1',
      isValid: true
    },
    {
      key: '2',
      facility: 'fac2',
      shiftType: 'type2',
      startTime: 'stime2',
      endTime: 'etime2',
      createdAt: 'ca2',
      createdBy: 'cb2',
      isValid: true
    },
    {
      key: '3',
      facility: 'fac3',
      shiftType: 'type3',
      startTime: 'stime3',
      endTime: 'etime3',
      createdAt: 'ca3',
      createdBy: 'cb3',
      isValid: false
    },
    {
      key: '4',
      facility: 'fac4',
      shiftType: 'type4',
      startTime: 'stime4',
      endTime: 'etime4',
      createdAt: 'ca4',
      createdBy: 'cb4',
      isValid: true
    },
    {
      key: '5',
      facility: 'fac5',
      shiftType: 'type5',
      startTime: 'stime5',
      endTime: 'etime5',
      createdAt: 'ca5',
      createdBy: 'cb5',
      isValid: false
    }
  ];

  // Handle click on Add New Button
  const handleNew = () => {
    setPopupOpen(true);
  };

  //icons column (Edite, Active/Deactivate)
  const iconsForActions = (rowData: ApFacility) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setPopupOpen(true);
        }}
      />
      {!rowData?.isValid ? (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteShift('reactivate');
            setOpenConfirmDeleteShift(true);
          }}
        />
      ) : (
        <MdDelete
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteShift('deactivate');
            setOpenConfirmDeleteShift(true);
          }}
          className="icons-style"
        />
      )}
    </div>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'facility',
      title: <Translate>Facility</Translate>
    },
    {
      key: 'shiftType',
      title: <Translate>Shift Type</Translate>
    },
    {
      key: 'startTime',
      title: <Translate>Start Time</Translate>
    },
    {
      key: 'endTime',
      title: <Translate>End Time</Translate>
    },
    {
      key: 'createdAt',
      title: <Translate>Created At</Translate>
    },
    {
      key: 'createdBy',
      title: <Translate>Created By</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (rowData: ApFacility) => iconsForActions(rowData)
    }
  ];

  // handle deactivate 
  const handleDeactivate = () => {
    setOpenConfirmDeleteShift(false);
  };

  // handle reactivate 
  const handleReactivate = () => {
    setOpenConfirmDeleteShift(false);
  };

  
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
        <h5>Shift Setup</h5>
      </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('Shift Setup'));
    dispatch(setDivContent(divContentHTML));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  return (
    <Panel>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
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
          setShift(rowData);
        }}
      />
      <AddEditShift
        open={popupOpen}
        setOpen={setPopupOpen}
        shift={shift}
        setShift={setShift}
        width={width}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteShift}
        setOpen={setOpenConfirmDeleteShift}
        itemToDelete="Catalog"
        actionButtonFunction={
          stateOfDeleteShift == 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeleteShift}
      />
    </Panel>
  );
};

export default Shifts;
