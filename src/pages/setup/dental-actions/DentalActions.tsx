import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import './styles.less';
import { Panel } from 'rsuite';
import { useGetDentalActionsQuery, useSaveDentalActionMutation } from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApDentalAction } from '@/types/model-types';
import { newApDentalAction } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { PiToothFill } from 'react-icons/pi';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import AddEditDentalAction from './AddEditDentalAction';
import MyButton from '@/components/MyButton/MyButton';
import TreatmentLinkedProcedures from './TreatmentLinkedProcedures';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
const DentalActions = () => {
  const dispatch = useAppDispatch();
  const [dentalAction, setDentalAction] = useState<ApDentalAction>({ ...newApDentalAction });
  const [popupOpen, setPopupOpen] = useState(false); // open add/edit dental action pop up
  const [proceduresOpen, setProceduresOpen] = useState(false);
  const [openConfirmDeleteDentalAction, setOpenConfirmDeleteDentalAction] =
    useState<boolean>(false);
  const [stateOfDeleteDentalAction, setStateOfDeleteDentalAction] = useState<string>('delete');
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15
  });

  // save dental actoion
  const [saveDentalAction, saveDentalActionMutation] = useSaveDentalActionMutation();
  // Fetch dental action list response
  const {
    data: dentalActionListResponse,
    isLoading: isDentalActionLoading,
    isFetching: isDentalActionFetching
  } = useGetDentalActionsQuery(listRequest);
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = dentalActionListResponse?.extraNumeric ?? 0;
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  // Available fields for filtering
  const filterFields = [
    { label: 'Key', value: 'key' },
    { label: 'Type', value: 'type' },
    { label: 'imageName', value: 'imageName' }
  ];
  // Header page setUp
  const divContent = (
    <div className="title-dental">
      <h5>Dental Actions</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Dental_Actions'));
  dispatch(setDivContent(divContentHTML));
  
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && dentalAction && rowData.key === dentalAction.key) {
      return 'selected-row';
    } else return '';
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
  // handle click on add new button (open the pop up of add/edit dental action)
  const handleNew = () => {
    setDentalAction({ ...newApDentalAction });
    setPopupOpen(true);
  };
  // handle save dental action and close the pop up
  const handleSave = () => {
    setPopupOpen(false);
    saveDentalAction(dentalAction)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'The Dental Action has been saved successfully', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to save this Dental Action', sev: 'error' }));
      });
  };
  // handle deactivate/reactivate dental action (need to handle from the back)
  const handleDeactiveReactivateDentalAction = () => {
    setOpenConfirmDeleteDentalAction(false);
  };
  // handle filter change (in table)
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'startsWithIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };
  // Icons column (Linked Procedures, Edit, reactive/Deactivate)
  const iconsForActions = (rowData: ApDentalAction) => (
    <div className="container-of-icons-dental">
      <PiToothFill
        className="icons-dental"
        title="Linked Procedures"
        size={24}
        fill="var(--primary-gray)"
        style={{
          cursor: !rowData.key || rowData.type !== 'treatment' ? 'not-allowed' : 'pointer',
          color: 'var(--primary-gray)'
        }}
        onClick={() => {
          if (!(!rowData.key || rowData.type !== 'treatment')) setProceduresOpen(true);
        }}
      />
      <MdModeEdit
        className="icons-dental"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setPopupOpen(true)}
      />
      {!rowData?.deletedAt ? (
        <MdDelete
          className="icons-dental"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteDentalAction('deactivate');
            setOpenConfirmDeleteDentalAction(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-dental"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteDentalAction('reactivate');
            setOpenConfirmDeleteDentalAction(true);
          }}
        />
      )}
    </div>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'key',
      title: <Translate>Key</Translate>,
      flexGrow: 4
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      flexGrow: 4
    },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      flexGrow: 4
    },
    {
      key: 'imageName',
      title: <Translate>Image Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  // Filter table
  const filters = () => (
    <Form layout="inline" fluid className="container-of-filter-fields-dental">
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

  // Effects
  // change the width variable when the size of window is changed
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // update list when save dental action
  useEffect(() => {
    if (saveDentalActionMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDentalActionMutation.data]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);
  // update the list when the filter is changed
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
    if (isDentalActionLoading || isDentalActionFetching) {
      dispatch(showSystemLoader());
    } else {
      dispatch(hideSystemLoader());
    }
    return () => {
      dispatch(hideSystemLoader());
    };
  }, [isDentalActionLoading, isDentalActionFetching]);

  return (
    <Panel>
      <div className="container-of-add-new-button-dental">
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
        data={dentalActionListResponse?.object ?? []}
        loading={isDentalActionFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setDentalAction(rowData);
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
        open={openConfirmDeleteDentalAction}
        setOpen={setOpenConfirmDeleteDentalAction}
        itemToDelete="Dental Action"
        actionButtonFunction={handleDeactiveReactivateDentalAction}
        actionType={stateOfDeleteDentalAction}
      />
      <AddEditDentalAction
        open={popupOpen}
        setOpen={setPopupOpen}
        dentalAction={dentalAction}
        setDentalAction={setDentalAction}
        handleSave={handleSave}
        width={width}
      />
      <TreatmentLinkedProcedures
        open={proceduresOpen}
        setOpen={setProceduresOpen}
        dentalAction={dentalAction}
        setDentalAction={setDentalAction}
        width={width}
        //  refetch={refetch}
        listRequest={listRequest}
        setListRequest={setListRequest}
      />
    </Panel>
  );
};

export default DentalActions;
