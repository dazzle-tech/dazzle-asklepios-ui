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
import { ApVaccine, ApWarehouse } from '@/types/model-types';
import { newApVaccine, newApWarehouse } from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import './styles.less';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from '@/utils';
import {
  useGetVaccineListQuery,
  useDeactiveActivVaccineMutation,
  useGetWarehouseQuery,
  useGetDepartmentsQuery,
  useSaveWarehouseMutation,
  useRemoveWarehouseMutation,
} from '@/services/setupService';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import AddEditWarehouse from './AddEditWarehouse';
import { FaClock, FaHourglass, FaUser } from 'react-icons/fa6';
import Users from './Users';
import WorkingHours from './WorkingHours';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { set } from 'lodash';
const WarehouseSetup = () => {
  const dispatch = useAppDispatch();
  const [warehouse, setWarehouse] = useState<ApWarehouse>({ ...newApWarehouse });
  const [openConfirmDeleteWarehouseModal, setOpenConfirmDeleteWarehouseModal] =
    useState<boolean>(false);
  const [saveWarehouse, saveWarehouseMutation] = useSaveWarehouseMutation();
  const [removeWarehouse, removeWarehouseMutation] = useRemoveWarehouseMutation();
  const [stateOfDeleteWarehouseModal, setStateOfDeleteWarehouseModal] = useState<string>('delete');
  const [openAddEditPopup, setOpenAddEditPopup] = useState(false);
  const [openAddEditUserPopup, setOpenAddEditUserPopup] = useState(false);
  const [openAddEditWorkingHoursPopup, setOpenAddEditWorkingHoursPopup] = useState(false);
 const [edit_new, setEdit_new] = useState(false);
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15
  });
   const [departmentListRequest] = useState<ListRequest>({
      ...initialListRequest
    });
  
  // Fetch warehouse list response
  const {
    data: warehouseListResponseLoading,
    refetch,
    isFetching
  } = useGetWarehouseQuery(listRequest);
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = warehouseListResponseLoading?.extraNumeric ?? 0;
  // Available fields for filtering
  const filterFields = [
    { label: 'Department Name', value: 'departmentName' },
    { label: 'Warehouse Name', value: 'warehouseName' },
    { label: 'Status', value: 'isValid' }
  ];
  // Header page setUp
  const divContent = (
    <div className='title'>
      <h5><Translate>Warehouse</Translate></h5>
    </div>
  );
  dispatch(setPageCode('Warehouse'));
  dispatch(setDivContent(divContent));
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && warehouse && warehouse.key === rowData.key) {
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

  // handle click om edit  
  const handleEdit = () => {
    setEdit_new(true);
    setOpenAddEditPopup(true);
  };
  // Fetch department list Response
    const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);
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
  // handle deactivate warehouse
  const handleDeactivateWarehouse = async data => {
    setOpenConfirmDeleteWarehouseModal(false);
    try {
      await removeWarehouse({
        ...warehouse
      })
        .unwrap()
        .then(() => {
          refetch();
          dispatch(
            notify({
              msg: 'The warehouse was successfully ' + stateOfDeleteWarehouseModal,
              sev: 'success'
            })
          );
        });
    } catch (error) {
      dispatch(
        notify({
          msg: 'Failed to ' + stateOfDeleteWarehouseModal + ' this warehouse',
          sev: 'error'
        })
      );
    }
  };
  //handle Reactivate warehouse
  const handleReactiveWarehouse = () => {
    setOpenConfirmDeleteWarehouseModal(false);
    const updatedWarehouse = { ...warehouse, deletedAt: null };
    saveWarehouse(updatedWarehouse)
      .unwrap()
      .then(() => {
         refetch();
        // display success message
        dispatch(notify({ msg: 'The warehouse has been activated successfully', sev: 'success' }));
      })
      .catch(() => {
        // display error message
        dispatch(notify({ msg: 'Failed to activated this warehouse', sev: 'error' }));
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
  // Filter table
  const filters = () => (<>
    <Form layout="inline" fluid className="container-of-filter-fields">
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
        <AdvancedSearchFilters searchFilter={true}/>
  </>);
  // Icons column (Edit, User, , reactive/Deactivate)
  const iconsForActions = (rowData: ApWarehouse) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => handleEdit()}
      />
       <FaClock
        className="icons"
        title="Working hours"
        size={22}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenAddEditWorkingHoursPopup(true);
        }}
      />
      <FaUser
        className="icons"
        title="Allowed Users"
        size={22}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenAddEditUserPopup(true);
        }}
      />
      {!rowData?.deletedAt ? (
        <MdDelete
          className="icons"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteWarehouseModal('deactivate');
            setOpenConfirmDeleteWarehouseModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteWarehouseModal('reactivate');
            setOpenConfirmDeleteWarehouseModal(true);
          }}
        />
      )}
    </div>
  );
  //Table columns
  const tableColumns = [ 
    {
      key: 'departmentKey',
      title: <Translate>Department</Translate>,
      flexGrow: 4,
            render: rowData => (
              <span>
                {conjureValueBasedOnKeyFromList(
                  departmentListResponse?.object ?? [],
                  rowData.departmentKey,
                  'name'
                )}
              </span>
            )
    },
    {
      key: 'warehouseName',
      title: <Translate>Warehouse Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'warehouseId',
      title: <Translate>Code</Translate>,
      flexGrow: 4
    },
  {
      key: 'isValid',
      title: <Translate>Default</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.isValid ? 'True' : 'False')
    },
    {
      key: 'isdefault',
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
  const tablebuttons = (<div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={() => {
            setOpenAddEditPopup(true), setWarehouse({ ...newApWarehouse }), setEdit_new(true);
          }}
          width="109px"
        >
          Add New
        </MyButton>
      </div>);
  return (
    <Panel>
      <MyTable
        height={450}
        data={warehouseListResponseLoading?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        tableButtons={tablebuttons}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setWarehouse(rowData);
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
      <AddEditWarehouse
        open={openAddEditPopup}
        setOpen={setOpenAddEditPopup}
        warehouse={warehouse}
        setWarehouse={setWarehouse}
        edit_new={edit_new}
        setEdit_new={setEdit_new}
        refetch={refetch}
      />
      <Users
        open={openAddEditUserPopup}
        setOpen={setOpenAddEditUserPopup}
        warehouse={warehouse}
        setWarehouse={setWarehouse}
        refetch={refetch}
      />
        <WorkingHours
        open={openAddEditWorkingHoursPopup}
        setOpen={setOpenAddEditWorkingHoursPopup}
        warehouse={warehouse}
        setWarehouse={setWarehouse}
        refetch={refetch}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteWarehouseModal}
        setOpen={setOpenConfirmDeleteWarehouseModal}
        itemToDelete="Warehouse"
        actionButtonFunction={
          stateOfDeleteWarehouseModal == 'deactivate'
            ? () => handleDeactivateWarehouse(warehouse)
            : handleReactiveWarehouse
        }
        actionType={stateOfDeleteWarehouseModal}
      />
    </Panel>
  );
};

export default WarehouseSetup;
