import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { ApService } from '@/types/model-types';
import { newApService } from '@/types/model-types-constructor';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { FaUndo } from 'react-icons/fa';
import { MdDelete, MdMedicalServices, MdModeEdit } from 'react-icons/md';
import { useLocation } from 'react-router-dom';
import { Form, Panel } from 'rsuite';
import AddEditKits from './AddEditKits';
import LinkedItems from './LinkedItems';

const SurgicalKitsSetup: React.FC = () => {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();

  const [surgicalKits, setSurgicalKits] = useState<any>({});
  const [popupOpen, setPopupOpen] = useState(false);
  const [addItemPopupOpen, setAddItemPopupOpen] = useState(false);
  const [openConfirmDeleteSurgicalKits, setOpenConfirmDeleteSurgicalKits] =
    useState<boolean>(false);
  const [stateOfDeleteSurgicalKits, setStateOfDeleteSurgicalKits] = useState<
    'delete' | 'deactivate' | 'reactivate'
  >('delete');
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: string }>({
    filter: '',
    value: ''
  });

  // ---- Header page setup (inside useEffect) ----
  useEffect(() => {
    const divContent = (
     "Surgical Kits Setup"
    );
    
    dispatch(setPageCode('Surgical_Kits_Setup'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);

  // Available fields for filtering
  const filterFields = [
    { label: 'Code', value: 'code' },
    { label: 'Name', value: 'name' }
  ];

  // class name for selected row
  const isSelected = (rowData: any) => {
    if (rowData && surgicalKits && rowData.key === surgicalKits.key) {
      return 'selected-row';
    } else return '';
  };

  // dummy data
  const data: any[] = [
    {
      key: '0',
      code: 'KIT001',
      name: 'Basic Surgery Kit',
      isValid: true,
      items: [
        { key: '0', kitCode: 'KIT001', lookup: 'ZOCOR 10MG', quantity: 1 },
        { key: '1', kitCode: 'KIT001', lookup: 'Syringe', quantity: 5 }
      ]
    },
    {
      key: '1',
      code: 'KIT002',
      name: 'Emergency Kit',
      isValid: false,
      items: [
        { key: '0', kitCode: 'KIT002', lookup: 'BSM Kit', quantity: 2 },
        { key: '1', kitCode: 'KIT002', lookup: 'Artificial Joint', quantity: 2 }
      ]
    },
    {
      key: '2',
      code: 'KIT003',
      name: 'Orthopedic Kit',
      isValid: true,
      items: [
        { key: '0', kitCode: 'KIT003', lookup: 'ZOCOR 10MG', quantity: 4 },
        { key: '1', kitCode: 'KIT003', lookup: 'BSM Kit', quantity: 1 }
      ]
    },
    {
      key: '3',
      code: 'KIT004',
      name: 'ENT Surgery Kit',
      isValid: true,
      items: [
        { key: '0', kitCode: 'KIT004', lookup: 'Syringe', quantity: 2 },
        { key: '1', kitCode: 'KIT004', lookup: 'Artificial Joint', quantity: 1 }
      ]
    }
  ];

  // Icons column (Edit, Add Items, Reactivate/Deactivate)
  const iconsForActions = (rowData: ApService) => (
    <div className="container-of-icons">
      <MdMedicalServices
        className="icons-style"
        title="Add Items"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setAddItemPopupOpen(true)}
      />
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setPopupOpen(true)}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteSurgicalKits('deactivate');
            setOpenConfirmDeleteSurgicalKits(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteSurgicalKits('reactivate');
            setOpenConfirmDeleteSurgicalKits(true);
          }}
        />
      )}
    </div>
  );

  // Table columns
  const tableColumns = [
    {
      key: 'code',
      title: <Translate>Code</Translate>
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: (rowData: ApService) => iconsForActions(rowData)
    }
  ];

  // Filters UI
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={updatedRecord => {
          setRecordOfFilter({
            ...recordOfFilter,
            filter: updatedRecord.filter,
            value: ''
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />
      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );

  // handle save
  const handleSave = () => {
    setPopupOpen(false);
  };

  // handle deactivate/reactivate Surgical Kit
  const handleDeactivate = () => {
    setOpenConfirmDeleteSurgicalKits(false);
  };
  const handleReactivate = () => {
    setOpenConfirmDeleteSurgicalKits(false);
  };

  // handle click on add new button
  const handleNew = () => {
    setSurgicalKits({ ...newApService });
    setPopupOpen(true);
  };

  // Effects
  // change the width variable when the size of window is changed
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        filters={filters()}
        onRowClick={rowData => {
          setSurgicalKits(rowData);
        }}
      />
      <AddEditKits
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        surgicalKits={surgicalKits}
        setSurgicalKits={setSurgicalKits}
        handleSave={handleSave}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteSurgicalKits}
        setOpen={setOpenConfirmDeleteSurgicalKits}
        itemToDelete="Surgical Kit"
        actionButtonFunction={
          stateOfDeleteSurgicalKits == 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeleteSurgicalKits}
      />
      <LinkedItems
        open={addItemPopupOpen}
        setOpen={setAddItemPopupOpen}
        surgicalKits={surgicalKits}
      />
    </Panel>
  );
};

export default SurgicalKitsSetup;
