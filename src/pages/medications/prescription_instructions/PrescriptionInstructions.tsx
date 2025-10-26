import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import {
  useGetPrescriptionInstructionQuery,
  useSavePrescriptionInstructionMutation,
} from '@/services/medicationsSetupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApPrescriptionInstruction } from '@/types/model-types';
import { newApPrescriptionInstruction } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddEditPrescriptionInstructions from './AddEditPrescriptionInstructions';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';
const PrescriptionInstructions = () => {
  const dispatch = useAppDispatch();
  const [prescriptionInstructions, setPrescriptionInstructions] =
    useState<ApPrescriptionInstruction>({ ...newApPrescriptionInstruction });
  const [popupOpen, setPopupOpen] = useState(false);
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [openConfirmDeletePrescriptionInstruction, setOpenConfirmDeletePrescriptionInstruction] =
    useState<boolean>(false);
  const [stateOfDeletePrescriptionInstruction, setStateOfDeletePrescriptionInstruction] =
    useState<string>('delete');
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [width, setWidth] = useState<number>(window.innerWidth);
  // Fetch  prescription instruction list response
  const { data: prescriptionInstructionListResponse, isFetching } =
    useGetPrescriptionInstructionQuery(listRequest);
  // save prescription instruction
  const [savePrescriptionInstruction, savePrescriptionInstructionMutation] =
    useSavePrescriptionInstructionMutation();

  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = prescriptionInstructionListResponse?.extraNumeric ?? 0;
  // Available fields for filtering
  const filterFields = [
    { label: 'Category', value: 'categoryLkey' },
    { label: 'Dose', value: 'dose' },
    { label: 'Unit', value: 'unitLkey' },
    { label: 'Rout', value: 'routLkey' },
    { label: 'Frequency', value: 'frequencyLkey' },
    { label: 'Status', value: 'deleted_at' }
  ];
 // Header page setUp
  const divContent = (
    <div className='page-title'>
      <h5><Translate>Prescription Instructions</Translate></h5>
    </div>
  );
  dispatch(setPageCode('Prescription_Instructions'));
  dispatch(setDivContent(divContent));
   // class name for selected row
   const isSelected = rowData => {
    if (rowData && prescriptionInstructions && rowData.key === prescriptionInstructions.key) {
      return 'selected-row';
    } else return '';
  };

  // Filter table
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

  // Icons column (Edit, reactive/Deactivate)
  const iconsForActions = (rowData: ApPrescriptionInstruction) => (
    <div className="container-of-icons">
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
            setStateOfDeletePrescriptionInstruction('deactivate');
            setOpenConfirmDeletePrescriptionInstruction(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeletePrescriptionInstruction('reactivate');
            setOpenConfirmDeletePrescriptionInstruction(true);
          }}
        />
      )}
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'categoryLkey',
      title: <Translate>Category</Translate>,
      render: rowData =>
        rowData.categoryLvalue ? rowData.categoryLvalue.lovDisplayVale : rowData.categoryLkey
    },
    {
      key: 'dose',
      title: <Translate>Dose</Translate>
    },
    {
      key: 'unitLkey',
      title: <Translate>Unit</Translate>,
      render: rowData => (rowData.unitLvalue ? rowData.unitLvalue.lovDisplayVale : rowData.unitLkey)
    },
    {
      key: 'routLkey',
      title: <Translate>Rout</Translate>,
      render: rowData => (rowData.routLvalue ? rowData.routLvalue.lovDisplayVale : rowData.routLkey)
    },
    {
      key: 'frequencyLkey',
      title: <Translate>Frequency</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.frequencyLvalue ? rowData.frequencyLvalue.lovDisplayVale : rowData.frequencyLkey
    },
    {
      key: 'deleted_at',
      title: <Translate>Status</Translate>,
      render: rowData => (rowData.deletedAt === null ? 'Active' : 'InActive')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  
  // handle click on add new button
  const handleNew = () => {
    setPrescriptionInstructions({ ...newApPrescriptionInstruction });
    setPopupOpen(true);
  };

  // handle save prescription instruction
  const handleSave = () => {
    setPopupOpen(false);
    savePrescriptionInstruction(prescriptionInstructions)
      .unwrap()
      .then(() => {
        dispatch(
          notify({
            msg: 'The Prescription Instruction has been saved successfully',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to save this Prescription Instruction', sev: 'error' }));
      });
  };

  // handle deactivate prescription instruction
  const handleDeactivate = () => {
    setOpenConfirmDeletePrescriptionInstruction(false);
    savePrescriptionInstruction({ ...prescriptionInstructions, isValid: false })
      .unwrap()
      .then(() => {
        dispatch(
          notify({
            msg: 'The Prescription Instruction was successfully Deactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Deactivate this Prescription Instruction',
            sev: 'error'
          })
        );
      });
  };
  // handle reactivate prescription instruction
  const handleReactivate = () => {
    setOpenConfirmDeletePrescriptionInstruction(false);
    savePrescriptionInstruction({ ...prescriptionInstructions, isValid: true })
      .unwrap()
      .then(() => {
        dispatch(
          notify({
            msg: 'The Prescription Instruction was successfully Reactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Reactivate this Prescription Instruction',
            sev: 'error'
          })
        );
      });
  };
  // Handle page change in navigation
  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };
  // Handle change rows per page in navigation
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };
  // handle filter change
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };
  // Effects
  // change the width variable when the size of window is changed
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // update list when the filter is changed
  useEffect(() => {
    if (recordOfFilter['filter']) {
      handleFilterChange(recordOfFilter['filter'], recordOfFilter['value']);
    } else {
      setListRequest({
        ...initialListRequest,
        pageSize: listRequest.pageSize,
        pageNumber: 1
      });
    }
  }, [recordOfFilter]);
  
  // update list when save prescription instruction
  useEffect(() => {
    if (savePrescriptionInstructionMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [savePrescriptionInstructionMutation.data]);
  
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

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
        data={prescriptionInstructionListResponse?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setPrescriptionInstructions(rowData);
        }}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
      <AddEditPrescriptionInstructions
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        prescriptionInstructions={prescriptionInstructions}
        setPrescriptionInstructions={setPrescriptionInstructions}
        handleSave={handleSave}
      />
      <DeletionConfirmationModal
        open={openConfirmDeletePrescriptionInstruction}
        setOpen={setOpenConfirmDeletePrescriptionInstruction}
        itemToDelete="Vaccine"
        actionButtonFunction={
          stateOfDeletePrescriptionInstruction == 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeletePrescriptionInstruction}
      />
    </Panel>
  );
};

export default PrescriptionInstructions;
