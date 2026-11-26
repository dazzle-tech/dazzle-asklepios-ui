import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { PolicyDefinition } from '@/types/model-types-new';
import { newPolicyDefinition } from '@/types/model-types-constructor-new';
import {
  useGetAllPolicyDefinitionsQuery,
  useTogglePolicyDefinitionActiveMutation
} from '@/services/setup/policyDefinition/policyDefinitionService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import AddEditPolicy from './AddEditPolicy';

const PolicyDefinitions = () => {
  const dispatch = useAppDispatch();

  const [policy, setPolicy] = useState<PolicyDefinition>({ ...newPolicyDefinition });
  const [openAddEditPolicyModal, setOpenAddEditPolicyModal] = useState(false);
  const [openConfirmTogglePolicy, setOpenConfirmTogglePolicy] = useState(false);
  const [toggleActionType, setToggleActionType] = useState<'deactivate' | 'reactivate'>(
    'deactivate'
  );

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { facilityId: '', name: '', code: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const {
    data: policyDefinitionListResponse,
    isFetching,
    refetch
  } = useGetAllPolicyDefinitionsQuery({
    ...paginationParams,
    ...appliedFilters,
    isActive: activeFilter
  });
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

  const [togglePolicyActive] = useTogglePolicyDefinitionActiveMutation();

  useEffect(() => {
    dispatch(setPageCode('Policy_Definition'));
    dispatch(setDivContent('Policy Definition'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const isSelected = (rowData: PolicyDefinition) =>
    rowData && policy && rowData.id === policy.id ? 'selected-row' : '';

  const handlePageChange = (event: unknown, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(e.target.value);
    setPaginationParams(prev => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
  };

  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);
    const sortValue = `${column},${type}`;
    setPaginationParams(prev => ({ ...prev, sort: sortValue, page: 0, timestamp: Date.now() }));
  };

  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field],
    onSearchChange: (value: string) => setHeaderFilters(prev => ({ ...prev, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
  });

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  const handleNew = () => {
    setPolicy({ ...newPolicyDefinition });
    setOpenAddEditPolicyModal(true);
  };

  // After a save, reload the list with the current filters
  const handleAfterSave = (_action: 'create' | 'update') => {
    refetch();
  };

  const handleTogglePolicyActive = async () => {
    if (!policy?.id) return;
    try {
      dispatch(showSystemLoader());
      await togglePolicyActive(policy.id).unwrap();
      setOpenConfirmTogglePolicy(false);
      refetch();
      dispatch(
        notify({
          msg:
            toggleActionType === 'deactivate'
              ? 'Policy deactivated successfully'
              : 'Policy reactivated successfully',
          sev: 'success'
        })
      );
    } catch (error) {
      dispatch(
        notify({
          msg: 'Action failed, please try again',
          sev: 'warning'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const iconsForActions = (rowData: PolicyDefinition) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setPolicy(rowData);
          setOpenAddEditPolicyModal(true);
        }}
      />
      {rowData.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setPolicy(rowData);
            setToggleActionType('deactivate');
            setOpenConfirmTogglePolicy(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setPolicy(rowData);
            setToggleActionType('reactivate');
            setOpenConfirmTogglePolicy(true);
          }}
        />
      )}
    </div>
  );

  const tableColumns = [
    {
      key: 'facilityName',
      title: <Translate>Facility</Translate>,
      width: 200,
      ...headerSearch('facilityId'),
      searchType: 'select' as const,
      searchOptions: [
        { label: 'All', value: '' },
        ...(facilityListResponse ?? []).map((f: any) => ({ label: f.name, value: String(f.id) }))
      ]
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      width: 220,
      ...headerSearch('name', 'Search name')
    },
    {
      key: 'code',
      title: <Translate>Code</Translate>,
      width: 160,
      ...headerSearch('code', 'Search code')
    },
    {
      key: 'status',
      title: 'Status',
      width: 120,
      searchable: true,
      searchType: 'select' as const,
      searchOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'All', value: 'all' }
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) => setStatusFilter(value as 'active' | 'inactive' | 'all'),
      render: (row: PolicyDefinition) => (row.isActive ? 'Active' : 'Inactive')
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      render: (rowData: PolicyDefinition) => iconsForActions(rowData)
    }
  ];

  const totalCount = policyDefinitionListResponse?.totalCount ?? 0;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  return (
    <Panel>
      <MyTable
        data={policyDefinitionListResponse?.data ?? []}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => setPolicy(rowData)}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        tableButtons={
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
        }
      />

      <DeletionConfirmationModal
        open={openConfirmTogglePolicy}
        setOpen={setOpenConfirmTogglePolicy}
        itemToDelete="Policy"
        actionButtonFunction={handleTogglePolicyActive}
        actionType={toggleActionType}
      />

      <AddEditPolicy
        open={openAddEditPolicyModal}
        setOpen={setOpenAddEditPolicyModal}
        policy={policy}
        setPolicy={setPolicy}
        onSaved={handleAfterSave}
      />
    </Panel>
  );
};

export default PolicyDefinitions;
