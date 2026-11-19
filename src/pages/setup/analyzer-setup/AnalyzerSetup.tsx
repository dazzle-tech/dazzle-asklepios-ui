import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyButton from '@/components/MyButton/MyButton';
import LovValueCell from '@/components/LovValueCell';
import AddEditAnalyzer from './AddEditAnalyzer';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useGetAnalyzersQuery,
  useAddAnalyzerMutation,
  useUpdateAnalyzerMutation,
  useToggleAnalyzerIsActiveMutation
} from '@/services/setup/analyzerService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { Analyzer } from '@/types/model-types-new';
import { newAnalyzer } from '@/types/model-types-constructor-new';

const AnalyzerSetup: React.FC = () => {
  const dispatch = useAppDispatch();

  // Row state
  const [analyzer, setAnalyzer] = useState<Analyzer>({ ...newAnalyzer });

  // UI state
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [popupOpen, setPopupOpen] = useState(false);
  const [openConfirmDeleteAnalyzer, setOpenConfirmDeleteAnalyzer] = useState<boolean>(false);
  const [stateOfDeleteAnalyzer, setStateOfDeleteAnalyzer] = useState<
    'delete' | 'deactivate' | 'reactivate'
  >('delete');

  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { code: '', type: '' };
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

  // API hooks
  const {
    data: analyzersPage,
    isFetching,
    refetch
  } = useGetAnalyzersQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    isActive: activeFilter,
    ...appliedFilters
  });

  const [addAnalyzer] = useAddAnalyzerMutation();
  const [updateAnalyzer] = useUpdateAnalyzerMutation();
  const [toggleAnalyzerIsActive] = useToggleAnalyzerIsActiveMutation();

  // Analyzer type LOV (used for the filter dropdown) - same LAB_CATEGORIES list
  // as the Add/Edit form's type field.
  const { data: analyzerTypeLov } = useGetLovValuesByCodeQuery('LAB_CATEGORIES');
  const analyzerTypeOptions = useMemo(
    () => analyzerTypeLov?.object ?? [],
    [analyzerTypeLov]
  );

  const totalCount = analyzersPage?.totalCount ?? 0;
  const tableData = useMemo(() => analyzersPage?.data ?? [], [analyzersPage?.data]);

  // CRUD handlers
  const handleNew = () => {
    setAnalyzer({ ...newAnalyzer });
    setPopupOpen(true);
  };

  const handleSave = async () => {
    setPopupOpen(false);
    const isUpdate = !!analyzer.id;

    const payload: any = {
      ...analyzer,
      code: (analyzer.code || '').trim(),
      isActive: !!analyzer.isActive
    };

    try {
      if (isUpdate) {
        const updated = await updateAnalyzer({ id: analyzer.id!, ...payload }).unwrap();
        dispatch(notify({ msg: 'Analyzer updated successfully', sev: 'success' }));
        setAnalyzer(prev => (prev?.id === updated?.id ? { ...prev, ...updated } : prev));
        refetch();
      } else {
        const created = await addAnalyzer(payload).unwrap();
        dispatch(notify({ msg: 'Analyzer added successfully', sev: 'success' }));
        setAnalyzer(created);
        // Reload the list with the current filters
        refetch();
      }
    } catch (err: any) {
      const data = err?.data ?? {};
      const traceId = data?.traceId || data?.requestId || data?.correlationId;
      const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

      const isValidation =
        data?.message === 'error.validation' ||
        data?.title === 'Method argument not valid' ||
        (typeof data?.type === 'string' && data.type.includes('constraint-violation'));

      if (isValidation && Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
        const fieldLabels: Record<string, string> = {
          id: 'Id',
          code: 'Code',
          type: 'Type',
          isActive: 'Active'
        };
        const normalizeMsg = (msg: string) => {
          const m = (msg || '').toLowerCase();
          if (m.includes('must not be null')) return 'is required';
          if (m.includes('must not be blank')) return 'must not be blank';
          if (m.includes('size must be between')) return 'length is out of range';
          return msg || 'invalid value';
        };

        const lines = data.fieldErrors.map((fe: any) => {
          const label = fieldLabels[fe.field] ?? fe.field;
          return `• ${label}: ${normalizeMsg(fe.message)}`;
        });

        dispatch(
          notify({
            msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
            sev: 'error'
          })
        );
        return;
      }

      const messageProp: string = data?.message || '';
      const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : undefined;
      const keyMap: Record<string, string> = {
        'payload.required': 'Analyzer payload is required.',
        'unique.code': 'Analyzer code already exists.',
        'db.constraint': 'Database constraint violation.',
        notfound: 'Analyzer not found.'
      };

      const humanMsg =
        (errorKey && keyMap[errorKey]) ||
        data?.detail ||
        data?.title ||
        data?.message ||
        'Unexpected error';

      dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
    }
  };

  const doToggle = async () => {
    try {
      if (!analyzer?.id) return;
      const toggledId = analyzer.id as number;
      const res = await toggleAnalyzerIsActive({ id: toggledId as any }).unwrap();
      const newIsActive =
        res && typeof (res as any).isActive === 'boolean'
          ? (res as any).isActive
          : !analyzer.isActive;

      setAnalyzer(prev =>
        prev && prev.id === toggledId ? { ...prev, isActive: newIsActive } : prev
      );

      refetch();

      dispatch(
        notify({
          msg:
            stateOfDeleteAnalyzer === 'deactivate'
              ? 'The Analyzer was successfully Deactivated'
              : 'The Analyzer was successfully Reactivated',
          sev: 'success'
        })
      );
    } catch {
      dispatch(
        notify({
          msg:
            stateOfDeleteAnalyzer === 'deactivate'
              ? 'Failed to Deactivate this Analyzer'
              : 'Failed to Reactivate this Analyzer',
          sev: 'error'
        })
      );
    }
  };

  const handleDeactivate = () => {
    setOpenConfirmDeleteAnalyzer(false);
    setStateOfDeleteAnalyzer('deactivate');
    doToggle();
  };

  const handleReactivate = () => {
    setOpenConfirmDeleteAnalyzer(false);
    setStateOfDeleteAnalyzer('reactivate');
    doToggle();
  };

  // Pagination handlers
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

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  // Row selection style
  const isSelected = (rowData: any) =>
    rowData && analyzer && rowData.id === analyzer.id ? 'selected-row' : '';

  // Columns
  const tableColumns = [
    {
      key: 'code',
      title: <Translate>Analyzer Code</Translate>,
      width: 220,
      ...headerSearch('code', 'Search code')
    },
    {
      key: 'type',
      title: <Translate>Analyzer Type</Translate>,
      width: 220,
      ...headerSearch('type'),
      searchType: 'select' as const,
      searchOptions: [
        { label: 'All', value: '' },
        ...analyzerTypeOptions.map((o: any) => ({ label: o.lovDisplayVale, value: String(o.key) }))
      ],
      render: (rowData: any) => <LovValueCell valueKey={rowData.type} />
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
      render: (rowData: any) => (
        <MyBadgeStatus
          contant={rowData?.isActive ? 'Active' : 'Inactive'}
          color={rowData?.isActive ? '#415be7' : '#b1acacff'}
        />
      )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (rowData: any) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setAnalyzer(rowData);
              setPopupOpen(true);
            }}
          />
          {rowData?.isActive ? (
            <MdDelete
              className="icons-style"
              title="Deactivate"
              size={24}
              fill="var(--primary-pink)"
              onClick={() => {
                setAnalyzer(rowData);
                setStateOfDeleteAnalyzer('deactivate');
                setOpenConfirmDeleteAnalyzer(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              title="Activate"
              size={20}
              fill="var(--primary-gray)"
              onClick={() => {
                setAnalyzer(rowData);
                setStateOfDeleteAnalyzer('reactivate');
                setOpenConfirmDeleteAnalyzer(true);
              }}
            />
          )}
        </div>
      )
    }
  ];

  // Effects
  useEffect(() => {
    dispatch(setPageCode('Analyzer'));
    dispatch(setDivContent('Analyzer'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        height={450}
        data={tableData}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData: any) => setAnalyzer(rowData)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
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
        dontTranslateData
      />

      <AddEditAnalyzer
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        analyzer={analyzer as any}
        setAnalyzer={setAnalyzer as any}
        handleSave={handleSave}
      />

      <DeletionConfirmationModal
        open={openConfirmDeleteAnalyzer}
        setOpen={setOpenConfirmDeleteAnalyzer}
        itemToDelete="Analyzer"
        actionButtonFunction={
          stateOfDeleteAnalyzer === 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeleteAnalyzer}
      />
    </Panel>
  );
};

export default AnalyzerSetup;
