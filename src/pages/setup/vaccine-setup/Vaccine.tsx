import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Form, Panel } from 'rsuite';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { FaSyringe } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { notify } from '@/utils/uiReducerActions';
import { ApVaccine } from '@/types/model-types';
import { newApVaccine } from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import './styles.less';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import {
  useGetVaccineListQuery,
  useDeactiveActivVaccineMutation,
} from '@/services/setupService';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddEditVaccine from './AddEditVaccine';
import MyButton from '@/components/MyButton/MyButton';
import DoesSchedule from './DoesSchedule';
const Vaccine = () => {
  const dispatch = useAppDispatch();
  const [vaccine, setVaccine] = useState<ApVaccine>({ ...newApVaccine });
  const [openConfirmDeleteVaccineModal, setOpenConfirmDeleteVaccineModal] =
    useState<boolean>(false);
  const [stateOfDeleteVaccineModal, setStateOfDeleteVaccineModal] = useState<string>('delete');
  const [openAddEditPopup, setOpenAddEditPopup] = useState(false);
  const [dossPopupOpen, setDossPopupOpen] = useState(false);
  const [edit_new, setEdit_new] = useState(false);
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15
  });
  // Fetch vaccine list response
  const {
    data: vaccineListResponseLoading,
    refetch,
    isFetching
  } = useGetVaccineListQuery(listRequest);
   // deactivate/reactivate vaccine
  const [deactiveVaccine] = useDeactiveActivVaccineMutation();
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = vaccineListResponseLoading?.extraNumeric ?? 0;
  // Available fields for filtering
  const filterFields = [
    { label: 'Vaccine Name', value: 'vaccineName' },
    { label: 'Code', value: 'vaccineCode' },
    { label: 'Type', value: 'typeLkey' },
    { label: 'ATC Code', value: 'atcCode' },
    { label: 'Doses Number', value: 'numberOfDosesLkey' },
    { label: 'Status', value: 'isValid' }
  ];
  // Header page setUp
  const divContent = (
    <div className='page-title'>
      <h5>Vaccine</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Vaccine'));
  dispatch(setDivContent(divContentHTML));
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && vaccine && vaccine.key === rowData.key) {
      return 'selected-row';
    } else return '';
  };

  //useEffect
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

  // handle click om edit vaccine 
  const handleEdit = () => {
    setEdit_new(true);
    setOpenAddEditPopup(true);
  };
  // handle filter change
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
   // handle Deactive Reactivate Vaccine
  const handleDeactiveReactivateVaccine = () => {
    deactiveVaccine(vaccine)
      .unwrap()
      .then(() => {
        refetch();
        if (vaccine.isValid) {
          dispatch(notify('Vaccine Deactived Successfully'));
        } else {
          dispatch(notify('Vaccine Activated Successfully'));
        }
        setVaccine(newApVaccine);
      });
    setOpenConfirmDeleteVaccineModal(false);
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
  // Icons column (Edit,Does Schedule, reactive/Deactivate)
  const iconsForActions = (rowData: ApVaccine) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => handleEdit()}
      />
      <FaSyringe
        className="icons-style"
        title="Does Schedule"
        size={22}
        fill="var(--primary-gray)"
        onClick={() => {
          setDossPopupOpen(true);
        }}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteVaccineModal('deactivate');
            setOpenConfirmDeleteVaccineModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteVaccineModal('reactivate');
            setOpenConfirmDeleteVaccineModal(true);
          }}
        />
      )}
    </div>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'vaccineName',
      title: <Translate>Vaccine Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'vaccineCode',
      title: <Translate>Code</Translate>,
      flexGrow: 4
    },
    {
      key: 'typeLkey',
      title: <Translate>Type</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.typeLvalue ? rowData.typeLvalue.lovDisplayVale : rowData.typeLkey)
    },
    {
      key: 'atcCode',
      title: <Translate>ATC Code</Translate>,
      flexGrow: 4
    },
    {
      key: 'numberOfDosesLkey',
      title: <Translate>Doses Number</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData?.numberOfDosesLvalue
          ? rowData.numberOfDosesLvalue.lovDisplayVale
          : rowData.numberOfDosesLkey
    },
    {
      key: 'isValid',
      title: <Translate>Status</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.isValid ? 'Valid' : 'InValid')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  return (
    <Panel>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={() => {
            setOpenAddEditPopup(true), setVaccine({ ...newApVaccine }), setEdit_new(true);
          }}
          width="109px"
        >
          Add New
        </MyButton>
      </div>
      <MyTable
        height={450}
        data={vaccineListResponseLoading?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setVaccine(rowData);
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
      <AddEditVaccine
        open={openAddEditPopup}
        setOpen={setOpenAddEditPopup}
        vaccine={vaccine}
        setVaccine={setVaccine}
        edit_new={edit_new}
        setEdit_new={setEdit_new}
        refetch={refetch}
      />
      <DoesSchedule
        open={dossPopupOpen}
        setOpen={setDossPopupOpen}
        vaccine={vaccine}
        setVaccine={setVaccine}
        refetch={refetch}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteVaccineModal}
        setOpen={setOpenConfirmDeleteVaccineModal}
        itemToDelete="Vaccine"
        actionButtonFunction={handleDeactiveReactivateVaccine}
        actionType={stateOfDeleteVaccineModal}
      />
    </Panel>
  );
};

export default Vaccine;
