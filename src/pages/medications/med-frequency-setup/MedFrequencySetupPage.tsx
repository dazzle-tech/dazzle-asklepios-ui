import React, { useEffect, useState } from 'react';
import { Form, Panel, Tooltip, Whisper } from 'rsuite';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
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
  useLazyGetMedFrequencySetupByFrequencyQuery,
  useLazyGetMedFrequencySetupsByFrequencyNumberQuery,
  useLazyGetMedFrequencySetupsByFrequencyUnitQuery,
  useLazyGetMedFrequencySetupsByStatusQuery,
  useToggleMedFrequencySetupActiveMutation
} from '@/services/setup/med-frequency-setup/medFrequencySetupService';
import AddEditMedFrequencySetup from './AddEditMedFrequencySetup';
import './styles.less';

// Available fields for filtering
const FILTER_FIELDS = [
  { label: 'Frequency', value: 'frequency' },
  { label: 'Frequency Number', value: 'frequencyNumber' },
  { label: 'Frequency Unit', value: 'frequencyUnit' },
  { label: 'Status', value: 'isActive' }
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' }
];

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

  const { data: setupsResponse, isFetching } = useGetAllMedFrequencySetupsQuery(paginationParams);

  const [toggleActive] = useToggleMedFrequencySetupActiveMutation();

  // ──────────────────────────── FILTERS ────────────────────────────
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<MedFrequencySetup[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [filterPagination, setFilterPagination] = useState({ page: 0, size: 15, sort: 'id,asc' });

  const [fetchByFrequency] = useLazyGetMedFrequencySetupByFrequencyQuery();
  const [fetchByFrequencyNumber] = useLazyGetMedFrequencySetupsByFrequencyNumberQuery();
  const [fetchByFrequencyUnit] = useLazyGetMedFrequencySetupsByFrequencyUnitQuery();
  const [fetchByStatus] = useLazyGetMedFrequencySetupsByStatusQuery();

  const frequencyEnumList = useEnumOptions('MedFrequency');
  const frequencyUnitEnumList = useEnumOptions('FrequencyList');

  const handleFilterChange = async (field: string, value: string, page = 0, size?: number) => {
    if (!field || !value) {
      setIsFiltered(false);
      setFilteredList([]);
      return;
    }

    const currentSize = size ?? filterPagination.size;
    const params = { page, size: currentSize, sort: filterPagination.sort };

    try {
      let response: { data: MedFrequencySetup[]; totalCount: number };

      if (field === 'frequency') {
        // Frequency is unique: one setup, or none (404)
        try {
          const found = await fetchByFrequency(value).unwrap();
          response = { data: [found], totalCount: 1 };
        } catch (err: any) {
          if (err?.status !== 404) throw err;
          response = { data: [], totalCount: 0 };
        }
      } else if (field === 'frequencyNumber') {
        response = await fetchByFrequencyNumber({ frequencyNumber: value, ...params }).unwrap();
      } else if (field === 'frequencyUnit') {
        response = await fetchByFrequencyUnit({ frequencyUnit: value, ...params }).unwrap();
      } else {
        response = await fetchByStatus({ isActive: value, ...params }).unwrap();
      }

      setFilteredList(response.data ?? []);
      setFilteredTotal(response.totalCount ?? 0);
      setIsFiltered(true);
      setFilterPagination({ ...filterPagination, page, size: currentSize });
    } catch {
      dispatch(notify({ msg: 'Failed to filter frequency setups', sev: 'error' }));
      setIsFiltered(false);
    }
  };

  // Re-run the active filter so the filtered list shows the latest changes
  const refreshFilter = () => {
    if (isFiltered) {
      handleFilterChange(
        recordOfFilter.filter,
        String(recordOfFilter.value),
        filterPagination.page,
        filterPagination.size
      );
    }
  };

  useEffect(() => {
    if (!openAddEdit) refreshFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAddEdit]);

  const filterValueInput = () => {
    const common = {
      fieldName: 'value',
      record: recordOfFilter,
      setRecord: setRecordOfFilter,
      showLabel: false,
      width: 220
    };

    switch (recordOfFilter.filter) {
      case 'frequency':
        return (
          <MyInput
            {...common}
            fieldType="select"
            selectData={frequencyEnumList ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            placeholder="Select Frequency"
          />
        );
      case 'frequencyNumber':
        return <MyInput {...common} fieldType="number" placeholder="Enter Number" />;
      case 'frequencyUnit':
        return (
          <MyInput
            {...common}
            fieldType="select"
            selectData={frequencyUnitEnumList ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            placeholder="Select Unit"
            searchable={false}
          />
        );
      case 'isActive':
        return (
          <MyInput
            {...common}
            fieldType="select"
            selectData={STATUS_OPTIONS}
            selectDataLabel="label"
            selectDataValue="value"
            placeholder="Select Status"
            searchable={false}
          />
        );
      default:
        return <MyInput {...common} fieldType="text" placeholder="Enter Value" />;
    }
  };

  const filters = () => (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={FILTER_FIELDS}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={(updated: any) => setRecordOfFilter({ filter: updated.filter, value: '' })}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
        width="170px"
      />
      {filterValueInput()}
      <MyButton
        color="var(--deep-blue)"
        onClick={() => handleFilterChange(recordOfFilter.filter, String(recordOfFilter.value ?? ''))}
        width="80px"
      >
        Search
      </MyButton>
    </Form>
  );

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
      refreshFilter();
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
      flexGrow: 4,
      render: (row: MedFrequencySetup) => formatEnumString(row?.frequency) || '-'
    },
    {
      key: 'frequencyNumber',
      title: <Translate>Frequency Number</Translate>,
      flexGrow: 2
    },
    {
      key: 'frequencyUnit',
      title: <Translate>Frequency Unit</Translate>,
      flexGrow: 2,
      render: (row: MedFrequencySetup) => formatEnumString(row?.frequencyUnit) || '-'
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
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
        data={isFiltered ? filteredList : setupsResponse?.data ?? []}
        totalCount={isFiltered ? filteredTotal : setupsResponse?.totalCount ?? 0}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(row: MedFrequencySetup) => setSetup(row)}
        filters={filters()}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        onPageChange={(_: unknown, newPage: number) => {
          if (isFiltered) {
            handleFilterChange(recordOfFilter.filter, String(recordOfFilter.value), newPage);
          } else {
            setPaginationParams(prev => ({ ...prev, page: newPage, timestamp: Date.now() }));
          }
        }}
        onRowsPerPageChange={(e: any) => {
          const newSize = Number(e.target.value);
          if (isFiltered) {
            handleFilterChange(recordOfFilter.filter, String(recordOfFilter.value), 0, newSize);
          } else {
            setPaginationParams(prev => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
          }
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
