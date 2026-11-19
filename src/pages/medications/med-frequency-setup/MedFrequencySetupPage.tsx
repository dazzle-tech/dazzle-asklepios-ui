import React, { useEffect, useState } from 'react';
import { Panel, Tooltip, Whisper } from 'rsuite';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import {
  MedFrequencySetup,
  newMedFrequencySetup,
  useGetAllMedFrequencySetupsQuery,
  useToggleMedFrequencySetupActiveMutation
} from '@/services/setup/med-frequency-setup/medFrequencySetupService';
import AddEditMedFrequencySetup from './AddEditMedFrequencySetup';
import './styles.less';

/**
 * Setup of how each MedFrequency value is split into doses,
 * e.g. Every 2 Hours -> Frequency Number 2, Frequency Unit Hours.
 */
const MedFrequencySetupPage = () => {
  const dispatch = useAppDispatch();

  const [setup, setSetup] = useState<MedFrequencySetup>({ ...newMedFrequencySetup });
  const [openAddEdit, setOpenAddEdit] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [width, setWidth] = useState<number>(window.innerWidth);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { frequency: '', frequencyNumber: '', frequencyUnit: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const { data: setupsResponse, isFetching, refetch } = useGetAllMedFrequencySetupsQuery({
    ...paginationParams,
    ...appliedFilters,
    isActive: activeFilter
  });

  const [toggleActive] = useToggleMedFrequencySetupActiveMutation();

  const frequencyEnumList = useEnumOptions('MedFrequency');
  const frequencyUnitEnumList = useEnumOptions('FrequencyList');

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

  useEffect(() => {
    dispatch(setPageCode('Med_Frequency_Setup'));
    dispatch(setDivContent('Frequency Setup'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNew = () => {
    setSetup({ ...newMedFrequencySetup });
    setOpenAddEdit(true);
  };

  const handleToggle = async () => {
    if (!setup?.id) return;
    try {
      await toggleActive(setup.id).unwrap();
      dispatch(
        notify({
          msg: setup.isActive ? 'Frequency setup deactivated' : 'Frequency setup activated',
          sev: 'success'
        })
      );
    } catch {
      dispatch(notify({ msg: 'Failed to update status', sev: 'error' }));
    } finally {
      setOpenConfirm(false);
      refetch();
    }
  };

  const isSelected = (row: MedFrequencySetup) => (row?.id === setup?.id ? 'selected-row' : '');

  const iconsForActions = (row: MedFrequencySetup) => (
    <div className="container-of-icons">
      <Whisper placement="top" speaker={<Tooltip><Translate>Edit</Translate></Tooltip>}>
        <MdModeEdit
          className="icons-style"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setSetup({ ...row });
            setOpenAddEdit(true);
          }}
        />
      </Whisper>
      {row?.isActive ? (
        <Whisper placement="top" speaker={<Tooltip><Translate>Deactivate</Translate></Tooltip>}>
          <MdDelete
            className="icons-style"
            size={24}
            fill="var(--primary-pink)"
            onClick={() => {
              setSetup({ ...row });
              setConfirmAction('deactivate');
              setOpenConfirm(true);
            }}
          />
        </Whisper>
      ) : (
        <Whisper placement="top" speaker={<Tooltip><Translate>Activate</Translate></Tooltip>}>
          <FaUndo
            className="icons-style"
            size={22}
            fill="var(--primary-gray)"
            onClick={() => {
              setSetup({ ...row });
              setConfirmAction('reactivate');
              setOpenConfirm(true);
            }}
          />
        </Whisper>
      )}
    </div>
  );

  const tableColumns = [
    {
      key: 'frequency',
      title: <Translate>Frequency</Translate>,
      width: 220,
      ...headerSearch('frequency'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...(frequencyEnumList ?? [])],
      render: (row: MedFrequencySetup) => formatEnumString(row?.frequency) || '-'
    },
    {
      key: 'frequencyNumber',
      title: <Translate>Frequency Number</Translate>,
      width: 150,
      ...headerSearch('frequencyNumber', 'Number')
    },
    {
      key: 'frequencyUnit',
      title: <Translate>Frequency Unit</Translate>,
      width: 160,
      ...headerSearch('frequencyUnit'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...(frequencyUnitEnumList ?? [])],
      render: (row: MedFrequencySetup) => formatEnumString(row?.frequencyUnit) || '-'
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
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
      render: (row: MedFrequencySetup) =>
        row?.isActive ? (
          <MyBadgeStatus contant="Active" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Inactive" color="#969fb0" />
        )
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 2,
      render: (row: MedFrequencySetup) => iconsForActions(row)
    }
  ];

  const dir = (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        height={450}
        data={setupsResponse?.data ?? []}
        totalCount={setupsResponse?.totalCount ?? 0}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(row: MedFrequencySetup) => setSetup(row)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={(_: unknown, newPage: number) => {
          setPaginationParams(prev => ({ ...prev, page: newPage, timestamp: Date.now() }));
        }}
        onRowsPerPageChange={(e: any) => {
          const newSize = Number(e.target.value);
          setPaginationParams(prev => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
        }}
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

      <AddEditMedFrequencySetup
        open={openAddEdit}
        setOpen={setOpenAddEdit}
        width={width}
        setup={setup}
        setSetup={setSetup}
      />

      <DeletionConfirmationModal
        open={openConfirm}
        setOpen={setOpenConfirm}
        itemToDelete="Frequency Setup"
        actionButtonFunction={handleToggle}
        actionType={confirmAction}
      />
    </Panel>
  );
};

export default MedFrequencySetupPage;
