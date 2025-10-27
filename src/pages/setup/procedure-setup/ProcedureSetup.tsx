import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useAppDispatch } from '@/hooks';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import './styles.less';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import {
  useGetProcedureListQuery,
  useRemoveProcedureMutation,
  useSaveProcedureMutation
} from '@/services/setupService';
import { ApProcedureSetup } from '@/types/model-types';
import {
  newApProcedureSetup
} from '@/types/model-types-constructor';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import AddEditProcedure from './AddEditProcedure';

const ProcedureSetup = () => {
  const dispatch = useAppDispatch();
  const [popupOpen, setPopupOpen] = useState(false); // open add/edit pop up
  const [openConfirmDeleteProcedureModal, setOpenConfirmDeleteProcedureModal] =
    useState<boolean>(false);
  const [stateOfDeleteProcedureModal, setStateOfDeleteProcedureModal] = useState<string>('delete');
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [procedure, setProcedure] = useState<ApProcedureSetup>({ ...newApProcedureSetup });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15
  });
  // Fetch procedure list response
  const { data: procedureQueryResponse, refetch: profetch, isFetching } = useGetProcedureListQuery(listRequest);
  // remove procedure
  const [removeProcedure] = useRemoveProcedureMutation();
  // save procedure
  const [saveProcedure] = useSaveProcedureMutation();
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = procedureQueryResponse?.extraNumeric ?? 0;
  // Available fields for filtering
  const filterFields = [
    { label: 'Procedure Name', value: 'name' },
    { label: 'Category', value: 'category' }
  ];
  // Header page setUp
  const divContent = (
   "Procedure Setup"
  );
  dispatch(setPageCode('Procedure_Setup'));
  dispatch(setDivContent(divContent));
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && procedure && rowData.key === procedure.key) {
      return 'selected-row';
    } else return '';
  };
  // handle Reactivate procedure
  const handleReactivate = () => {
    saveProcedure({ ...procedure, deletedAt: null })
      .unwrap()
      .then(() => {
        profetch();
      });
      setOpenConfirmDeleteProcedureModal(false);
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
  // handle click on add new button
  const handleNew = () => {
    setProcedure({ ...newApProcedureSetup, categoryLkey: null });
    setPopupOpen(true);
  };
   // handle deactivate procedure
   const handleDeactivate = () => {
    removeProcedure({ ...procedure })
      .unwrap()
      .then(() => {
        profetch();
      });
      setOpenConfirmDeleteProcedureModal(false);
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
  const iconsForActions = (rowData: ApProcedureSetup) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setPopupOpen(true)}
      />
      {!rowData?.deletedAt ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteProcedureModal('deactivate');
            setOpenConfirmDeleteProcedureModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteProcedureModal('reactivate');
            setOpenConfirmDeleteProcedureModal(true);
          }}
        />
      )}
    </div>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Procedure Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'code',
      title: <Translate>Procedure Code</Translate>,
      flexGrow: 4
    },
    {
      key: 'category',
      title: <Translate>Category</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.categoryLkey ? rowData.categoryLvalue.lovDisplayVale : rowData.categoryLkey
    },
    {
      key: 'isAppointable',
      title: <Translate>Appointable</Translate>,
      flexGrow: 4,
      render: rowData => (rowData?.isAppointable ? 'YES' : 'NO')
    },
    {
      key: 'isValid',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: rowData => (!rowData.deletedAt ? 'Valid' : 'InValid')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // Effects
  // update list when filter is changed
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
        data={procedureQueryResponse?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setProcedure(rowData);
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
      <DeletionConfirmationModal
        open={openConfirmDeleteProcedureModal}
        setOpen={setOpenConfirmDeleteProcedureModal}
        itemToDelete="Procedure"
        actionButtonFunction={!procedure?.deletedAt ? handleDeactivate : handleReactivate}
        actionType={stateOfDeleteProcedureModal}
      />
      
      <AddEditProcedure
       open={popupOpen}
       setOpen={setPopupOpen}
       procedure={procedure}
       setProcedure={setProcedure}
       profetch={profetch}
      />
    </Panel>
  );
};
export default ProcedureSetup;
