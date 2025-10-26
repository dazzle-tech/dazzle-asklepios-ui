import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Form, Panel } from 'rsuite';
import { useGetPractitionersQuery, useDeactiveActivePractitionerMutation, useGetUsersQuery } from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApPractitioner } from '@/types/model-types';
import { newApPractitioner } from '@/types/model-types-constructor';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName} from '@/utils';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import AddEditPractitioner from './AddEditPractitioner';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import './styles.less';

const Practitioners = () => {
  const dispatch = useAppDispatch();
  const [practitioner, setPractitioner] = useState<ApPractitioner>({ ...newApPractitioner });
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openAddEditPractitioner, setOpenAddEditPractitioner] = useState<boolean>(false);
  const [openConfirmDeleteUserModal, setOpenConfirmDeleteUserModal] = useState<boolean>(false);
  const [stateOfDeleteUserModal, setStateOfDeleteUserModal] = useState<string>('delete');
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ],
    pageSize: 15
  });
  const [departmentListRequest, setDepartmentListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });
  const [userListRequest, setUserListRequest] = useState<ListRequest>({
    ...initialListRequest,
  });
   // Fetch users list response
  const {data: userListResponse } = useGetUsersQuery(userListRequest);
  // Fetch practitioners list response
  const {data: practitionerListResponse, refetch: refetchPractitioners, isFetching} = useGetPractitionersQuery(listRequest);
  // Deactivate/Reactivate practitioner
  const [dactivePractitioner] = useDeactiveActivePractitionerMutation();

  // Header page setUp
  const divContent = (
    "Practitioners"
  );
  dispatch(setPageCode('Practitioners'));
  dispatch(setDivContent(divContent));
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = practitionerListResponse?.extraNumeric ?? 0;
  // Available fields for filtering
  const filterFields = [
    { label: 'Prcatitioner Name', value: 'practitionerFullName' },
    { label: 'Linked User', value: 'linkedUser' },
    { label: 'Specialty', value: 'specialty' },
    { label: 'Job Role', value: 'jobRole' },
    { label: 'status', value: 'isValid' }
  ];

  // Effects
  useEffect(() => {
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

  useEffect(() => {
    if (recordOfFilter['filter']) {
      handleFilterChange(recordOfFilter['filter'], recordOfFilter['value']);
    } else {
      setListRequest({
        ...initialListRequest,
        filters: [
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
        ],
        pageSize: listRequest.pageSize,
        pageNumber: 1
      });
    }
  }, [recordOfFilter]);

  useEffect(() => {
    if (practitioner.primaryFacilityKey) {
      setDepartmentListRequest(
        addFilterToListRequest('facility_key', 'match', practitioner.primaryFacilityKey, {
          ...departmentListRequest,
          ignore: false
        })
      );
    }
  }, [practitioner.primaryFacilityKey]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

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
  // Class Name for selected row
  const isSelected = rowData => {
    if (rowData && practitioner && rowData.key === practitioner.key) {
      return 'selected-row';
    } else return '';
  };
  // Filter table
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
      setListRequest({
        ...listRequest,
        filters: [
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
        ]
      });
    }
  };
  // Handle deactivate/reactivate
  const handleDeactive = () => {
    dactivePractitioner(practitioner)
      .unwrap()
      .then(() => {
        refetchPractitioners();
        setPractitioner(newApPractitioner);
        setOpenConfirmDeleteUserModal(false);
        dispatch(
          notify({
            msg: 'The Practitioner was successfully ' + stateOfDeleteUserModal,
            sev: 'success'
          })
        );
      })
      .catch(() => {
        setOpenConfirmDeleteUserModal(false);
      });
  };
  //Table columns
  const tableColumns = [
    {
      key: 'practitionerFullName',
      title: <Translate>Practitioner Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'linkedUser',
      title: <Translate>Linked User</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            userListResponse?.object ?? [],
            rowData.linkedUser,
            'fullName'
          )}
        </span>
      )
    },
    {
      key: 'specialty',
      title: <Translate>Specialty</Translate>,
      flexGrow: 3
    },
    {
      key: 'jobRoleLkey',
      title: <Translate>Job Role</Translate>,
      flexGrow: 3,
       render: rowData => rowData.jobRoleLkey ? rowData?.jobRoleLvalue?.lovDisplayVale : rowData?.categoryLkey
    },
    {
      key: 'isValid',
      title: <Translate>Status</Translate>,
      flexGrow: 3,
      render: rowData => <span>{rowData?.isValid ? 'Active' : 'InActive'}</span>
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  // Icons column (Edite, reactive/Deactivate)
  const iconsForActions = (rowData: ApPractitioner) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenAddEditPractitioner(true);
        }}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteUserModal('deactivate');
            setOpenConfirmDeleteUserModal(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteUserModal('reactivate');
            setOpenConfirmDeleteUserModal(true);
          }}
        />
      )}
    </div>
  );
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
  return (
    <div>
      <Panel>
        <div className="container-of-add-new-button">
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={() => {
              setPractitioner({ ...newApPractitioner });
              setOpenAddEditPractitioner(true);
            }}
            width="109px"
          >
            Add New
          </MyButton>
        </div>
        <MyTable
          height={450}
          data={practitionerListResponse?.object ?? []}
          loading={isFetching}
          columns={tableColumns}
          rowClassName={isSelected}
          filters={filters()}
          onRowClick={rowData => {
            setPractitioner(rowData);
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
      </Panel>
      <AddEditPractitioner
        open={openAddEditPractitioner}
        setOpen={setOpenAddEditPractitioner}
        practitioner={practitioner}
        setPractitioner={setPractitioner}
        refetchPractitioners={refetchPractitioners}
        userListResponse={userListResponse}
        listRequest={userListRequest}
        setListRequest={setUserListRequest}
        width={width}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteUserModal}
        setOpen={setOpenConfirmDeleteUserModal}
        itemToDelete="Practitioner"
        actionButtonFunction={handleDeactive}
        actionType={stateOfDeleteUserModal}
      />
    </div>
  );
};

export default Practitioners;
