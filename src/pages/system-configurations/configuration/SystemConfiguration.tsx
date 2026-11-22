
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddEditConfiguration from './AddEditConfiguration';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useGetConfigurationsQuery,
  useUpdateConfigurationMutation,
} from '@/services/setup/systemConfiguration/systemConfigurationService';
import { Configuration, ConfigurationUser } from '@/types/model-types-new';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { formatEnumString } from '@/utils';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { useEnumOptions } from '@/services/enumsApi';

// Header filters: draft values typed in the inputs, applied on Enter / select change.
// Everything is sent to one endpoint and combined with AND.
const emptyHeaderFilters = {
  scopeType: '',
  facilityId: '',
  key: '',
  valueType: '',
  value: '',
  referenceType: '',
  description: ''
};
type HeaderFilterField = keyof typeof emptyHeaderFilters;

const levelOptions = [
  { label: 'Organization', value: 'ORGANIZATION' },
  { label: 'Facility', value: 'FACILITY' },
  { label: 'User', value: 'USER' }
];

const SystemConfiguration = () => {
  const dispatch = useAppDispatch();

  const [selectedConfig, setSelectedConfig] = useState<Configuration | null>(null);
  const [popupOpen, setPopupOpen] = useState<boolean>(false);
  const [openConfirmDeactivateReactivate, setOpenConfirmDeactivateReactivate] = useState(false);
  const [stateOfDeleteModal, setStateOfDeleteModal] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [width, setWidth] = useState<number>(window.innerWidth);

  // Pagination
  const [paginationParams, setPaginationParams] = useState({ page: 0, size: 5, sort: 'id,asc', timestamp: Date.now() });

  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  // Data
  const { data: configListResponse, refetch, isFetching } = useGetConfigurationsQuery({
    ...paginationParams,
    ...appliedFilters,
    isActive: activeFilter
  });
  const { data: facilityList } = useGetAllFacilitiesQuery({});
  const [updateConfiguration] = useUpdateConfigurationMutation();

  // Enums
  const configurationValueTypeEnumList = useEnumOptions('ConfigurationValueType');
  const configurationreferenceTypeEnumList = useEnumOptions('ConfigurationReferenceType');
  const configurationKeyEnumList = useEnumOptions('ConfigurationKeys');

  // Page Header
  dispatch(setPageCode('SystemConfiguration'));
  dispatch(setDivContent('System Configuration'));

  const totalCount = configListResponse?.totalCount ?? 0;

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

  const headerSelect = (field: HeaderFilterField, options: { label: string; value: string }[]) => ({
    ...headerSearch(field),
    searchType: 'select' as const,
    searchOptions: [{ label: 'All', value: '' }, ...options]
  });

  const facilityOptions = (facilityList ?? []).map((f: any) => ({ label: f.name, value: String(f.id) }));

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  // Row selected
  const isSelected = (rowData: Configuration) => rowData?.id === selectedConfig?.id ? 'selected-row' : '';

  // Icons
  const iconsForActions = (rowData: Configuration) => (
    <div className="container-of-icons">
      <MdModeEdit className="icons-style" title="Edit" size={24} fill="var(--primary-gray)" onClick={() => setPopupOpen(true)} />
      {rowData?.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => { setStateOfDeleteModal('deactivate'); setOpenConfirmDeactivateReactivate(true); }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => { setStateOfDeleteModal('reactivate'); setOpenConfirmDeactivateReactivate(true); }}
        />
      )}
    </div>
  );

  const userLabel = (user?: ConfigurationUser) => {
    if (!user) return '';
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return name || user.login || '';
  };

  const levelOf = (rowData: Configuration) => {
    if (rowData.scopeType) return formatEnumString(rowData.scopeType);
    if (rowData.users?.length) return 'User';
    if (rowData.facility) return 'Facility';
    return 'Organization';
  };

  const tableColumns = [
    { key: 'scopeType', title: 'Level', width: 140, ...headerSelect('scopeType', levelOptions), render: (rowData: Configuration) => <p>{levelOf(rowData)}</p> },
    { key: 'facilityId', title: 'Facility', width: 170, ...headerSelect('facilityId', facilityOptions), render: (rowData: Configuration) => <p>{rowData?.facility?.name}</p> },
    {
      key: 'user',
      title: 'User',
      width: 160,
      render: (rowData: Configuration) => (
        <p>{(rowData.users ?? []).map(userLabel).filter(Boolean).join(', ')}</p>
      )
    },
    { key: 'key', title: 'Key', width: 200, ...headerSelect('key', configurationKeyEnumList ?? []), render: (rowData: Configuration) => formatEnumString(rowData.key) },
    { key: 'valueType', title: 'Value Type', width: 140, ...headerSelect('valueType', configurationValueTypeEnumList ?? []), render: (rowData: Configuration) => formatEnumString(rowData.valueType) },
    { key: 'value', title: 'Value', width: 150, ...headerSearch('value') },
    { key: 'referenceType', title: 'Reference Type', width: 160, ...headerSelect('referenceType', configurationreferenceTypeEnumList ?? []), render: (rowData: Configuration) => formatEnumString(rowData.referenceType) },
    { key: 'description', title: 'Description', width: 200, ...headerSearch('description') },
    {
      key: 'isActive',
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
      render: (rowData: Configuration) => <p>{rowData?.isActive ? 'Active' : 'Inactive'}</p>
    },
    { key: 'icons', title: '', render: rowData => iconsForActions(rowData) }
  ];

  const handleNew = () => {
    setSelectedConfig(null);
    setPopupOpen(true);
  };

  //handle deativate/reactivate
  const handleDeactivateReactivate = () => {
    if (!selectedConfig) return;

    const toUpdate = {
      id: selectedConfig.id,
      key: selectedConfig.key,
      value: selectedConfig.value,
      valueType: selectedConfig.valueType,
      referenceType: selectedConfig.referenceType,
      description: selectedConfig.description,
      facilityId: selectedConfig.facility?.id,
      userIds: (selectedConfig.users ?? []).map(user => user.id),
      isActive: stateOfDeleteModal === 'reactivate'
    };

    updateConfiguration({ id: selectedConfig.id, body: toUpdate })
      .unwrap()
      .then(() => { dispatch(notify({ msg: 'Configuration updated successfully', sev: 'success' })); refetch(); })
      .catch(() => dispatch(notify({ msg: 'Failed to update configuration', sev: 'error' })));

    setOpenConfirmDeactivateReactivate(false);
  };

  const handlePageChange = (event, newPage) => {
    setPaginationParams({ ...paginationParams, page: newPage });
  };

  const handleRowsPerPageChange = e => {
    const newSize = Number(e.target.value);
    setPaginationParams({ ...paginationParams, size: newSize, page: 0 });
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  return (
    <Panel>
      <MyTable
        height={450}
        rowClassName={isSelected}
        totalCount={totalCount}
        data={configListResponse?.data ?? []}
        loading={isFetching}
        columns={tableColumns}
        onRowClick={rowData => setSelectedConfig(rowData)}

        page={paginationParams.page}
        rowsPerPage={paginationParams.size}

        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton prefixIcon={() => <AddOutlineIcon />} color="var(--deep-blue)" onClick={handleNew} width="109px">
              Add New
            </MyButton>
          </div>
        }
      />

      <AddEditConfiguration open={popupOpen} setOpen={setPopupOpen} configuration={selectedConfig} width={width} />

      <DeletionConfirmationModal
        open={openConfirmDeactivateReactivate}
        setOpen={setOpenConfirmDeactivateReactivate}
        itemToDelete="Configuration"
        actionButtonFunction={handleDeactivateReactivate}
        actionType={stateOfDeleteModal}
      />
    </Panel>
  );
};

export default SystemConfiguration;
