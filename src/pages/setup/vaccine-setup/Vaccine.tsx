import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useGetVaccinesQuery,
  useToggleVaccineActiveMutation
} from '@/services/vaccine/vaccineService';
import { newVaccine as newVaccineModel } from '@/types/model-types-constructor-new';
import { Vaccine as VaccineModel } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useMemo, useState } from 'react';
import { FaSyringe, FaUndo } from 'react-icons/fa';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { Panel } from 'rsuite';
import AddEditVaccine from './AddEditVaccine';
import DoesSchedule from './DoesSchedule';
import './styles.less';

const Vaccine: React.FC = () => {
  const dispatch = useAppDispatch();

  // Core state
  const [vaccine, setVaccine] = useState<VaccineModel>({ ...newVaccineModel });
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [openAddEdit, setOpenAddEdit] = useState(false);
  const [dosesPopupOpen, setDosesPopupOpen] = useState(false);
  const [edit_new, setEdit_new] = useState(false);

  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { name: '', type: '', roa: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  // Enums
  const vaccineTypeOptions = useEnumOptions('VaccineType', {
    labelOverrides: {
      MRNA: 'mRNA'
    }
  });  const roa = useEnumOptions('RouteOfAdministration');

  // Data (main)
  const {
    data: pageData,
    isFetching,
    refetch
  } = useGetVaccinesQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    isActive: activeFilter,
    ...appliedFilters
  });

  const totalCount = pageData?.totalCount ?? 0;
  const tableData = useMemo(() => pageData?.data ?? [], [pageData?.data]);

  // Header page setUp
  useEffect(() => {
    dispatch(setPageCode('Vaccine'));
    dispatch(setDivContent('Vaccine'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  // Reload the list with the current filters (used after add/edit)
  const refetchList = async () => {
    await refetch();
  };

  // Sorting
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [sortColumn, setSortColumn] = useState('id');
  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);
    const sortValue = `${column},${type}`;
    setPaginationParams(prev => ({ ...prev, sort: sortValue, page: 0 }));
  };

  // Pagination
  const handlePageChange = (_: unknown, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPaginationParams(prev => ({ ...prev, size: newSize, page: 0 }));
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

  const headerSelect = (field: HeaderFilterField, options: { label: string; value: string }[]) => ({
    ...headerSearch(field),
    searchType: 'select' as const,
    searchOptions: [{ label: 'All', value: '' }, ...options]
  });

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  // Actions
  const handleEdit = (row?: VaccineModel) => {
    if (row?.id) setVaccine(row);
    setEdit_new(true);
    setOpenAddEdit(true);
  };

  const [toggleActive] = useToggleVaccineActiveMutation();
  const handleToggleActive = async () => {
    if (!vaccine?.id) return;
    try {
      const res = await toggleActive({ id: vaccine.id }).unwrap();
      await refetch();

      dispatch(
        notify({
          msg: res.isActive ? 'Vaccine Activated Successfully' : 'Vaccine Deactivated Successfully',
          sev: 'success'
        })
      );
      setVaccine({ ...newVaccineModel });
    } finally {
      setOpenConfirm(false);
    }
  };

  // Selected row helper
  const isSelected = (row: VaccineModel) => (row?.id === vaccine?.id ? 'selected-row' : '');

  // Columns
  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Vaccine Name</Translate>,
      width: 220,
      ...headerSearch('name', 'Search name')
    },
    {
      key: 'roa',
      title: <Translate>ROA</Translate>,
      width: 170,
      ...headerSelect('roa', roa ?? []),
      render: (row: VaccineModel) => formatEnumString(row?.roa)
    },
    { key: 'atcCode', title: <Translate>ATC Code</Translate>, flexGrow: 3 },
    { key: 'code', title: <Translate>Code</Translate>, flexGrow: 3 },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      width: 160,
      ...headerSelect('type', vaccineTypeOptions ?? []),
      render: (row: VaccineModel) => {
        const value = formatEnumString(row?.type);
        if (String(row?.type).toUpperCase() === 'MRNA') {
          return 'mRNA';
        }

        return value;
      }
    },
    {
      key: 'numberOfDoses',
      title: <Translate>Doses Number</Translate>,
      flexGrow: 2,
      render: (row: VaccineModel) => formatEnumString(row?.numberOfDoses)
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
      render: rowData =>
        rowData.isActive ? (
          <MyBadgeStatus contant="Active" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Inactive" color="#969fb0" />
        )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (row: VaccineModel) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => handleEdit(row)}
          />
          <FaSyringe
            className="icons-style"
            title="Does Schedule"
            size={22}
            fill="var(--primary-gray)"
            onClick={() => {
              setVaccine(row);
              if (!row?.id) {
                dispatch(notify('Please select a vaccine first.'));
                return;
              }
              setDosesPopupOpen(true);
            }}
          />
          {row?.isActive ? (
            <MdDelete
              className="icons-style"
              title="Deactivate"
              size={24}
              fill="var(--primary-pink)"
              onClick={() => {
                setVaccine(row);
                setConfirmMode('deactivate');
                setOpenConfirm(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              title="Activate"
              size={24}
              fill="var(--primary-gray)"
              onClick={() => {
                setVaccine(row);
                setConfirmMode('reactivate');
                setOpenConfirm(true);
              }}
            />
          )}
        </div>
      )
    }
  ];

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Panel dir={dir}>
      <MyTable
        height={450}
        data={tableData}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(row: VaccineModel) => setVaccine(row)}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={() => {
                setOpenAddEdit(true);
                setVaccine({ ...newVaccineModel });
                setEdit_new(true);
              }}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
        }
      />

      <AddEditVaccine
        open={openAddEdit}
        setOpen={setOpenAddEdit}
        vaccine={vaccine}
        setVaccine={setVaccine}
        edit_new={edit_new}
        setEdit_new={setEdit_new}
        refetch={refetchList}
      />

      <DoesSchedule open={dosesPopupOpen} setOpen={setDosesPopupOpen} vaccine={vaccine} />

      <DeletionConfirmationModal
        open={openConfirm}
        setOpen={setOpenConfirm}
        itemToDelete="Vaccine"
        actionButtonFunction={handleToggleActive}
        actionType={confirmMode}
      />
    </Panel>
  );
};

export default Vaccine;
