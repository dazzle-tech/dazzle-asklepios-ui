import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import './styles.less';
import { Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils/extractErrorMessage';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddEditDentalChartAgeRule from './AddEditDentalChartAgeRule';
import { newDentalChartAgeRule } from '@/types/model-types-constructor-new';
import { DentalChartAgeRule } from '@/types/model-types-new';
import {
  useGetAllDentalChartAgeRulesQuery,
  useCreateDentalChartAgeRuleMutation,
  useUpdateDentalChartAgeRuleMutation,
  useToggleDentalChartAgeRuleActiveMutation
} from '@/services/setup/dental-chart-age-rule/dentalChartAgeRuleService';
import { useGetAllDentalToothNumberingMethodsQuery } from '@/services/setup/dental-tooth-numbering/dentalToothNumberingService';
import {
  MIXED_MAX_TEETH_PER_ARCH,
  MIXED_MAX_TEETH_TOTAL,
  mixedPositionConflicts,
  mixedToothCounts,
  numberingSystemLabel,
  toothIdsForChartType
} from '@/utils/toothNumberingSystems';

const chartTypeOptions = [
  { label: 'Adult', value: 'ADULT' },
  { label: 'Pediatric', value: 'CHILD' },
  { label: 'Mixed', value: 'MIXED' }
];

const chartTypeLabel = (value?: string | null) => {
  if (value === 'ADULT') return 'Adult';
  if (value === 'CHILD') return 'Pediatric';
  if (value === 'MIXED') return 'Mixed';
  return value || '-';
};

const toOptionalAge = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const DentalChartSetup = () => {
  const dispatch = useAppDispatch();
  const [rule, setRule] = useState<DentalChartAgeRule>({ ...newDentalChartAgeRule });
  const [popupOpen, setPopupOpen] = useState(false);
  const [openConfirmToggle, setOpenConfirmToggle] = useState(false);
  const [toggleAction, setToggleAction] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [width, setWidth] = useState<number>(window.innerWidth);
  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { name: '', chartType: '' };
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
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  // Method names for the Numbering column (custom methods are referenced by id).
  const { data: numberingMethods } = useGetAllDentalToothNumberingMethodsQuery({
    page: 0,
    size: 500,
    sort: 'name,asc'
  });
  const numberingMethodName = (id?: number | null) =>
    (numberingMethods?.data ?? []).find((m: any) => m.id === id)?.name ?? `Method #${id}`;

  const [createRule] = useCreateDentalChartAgeRuleMutation();
  const [updateRule] = useUpdateDentalChartAgeRuleMutation();
  const [toggleActive] = useToggleDentalChartAgeRuleActiveMutation();

  useEffect(() => {
    dispatch(setPageCode('Dental_Chart_Setup'));
    dispatch(setDivContent('Dental Chart Setup'));
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

  const {
    data: listResponse,
    isFetching: isListFetching,
    refetch
  } = useGetAllDentalChartAgeRulesQuery({ ...paginationParams, ...appliedFilters, isActive: activeFilter });

  const validateClient = (payload: DentalChartAgeRule): string | null => {
    if (!payload.name?.trim()) return 'Name is required';
    if (payload.ageFrom === null || payload.ageFrom === undefined || payload.ageFrom === ('' as any)) {
      return 'Age From is required';
    }
    const ageFrom = Number(payload.ageFrom);
    if (!Number.isInteger(ageFrom) || ageFrom < 0) {
      return 'Age From must be a nonnegative integer';
    }
    const ageTo = toOptionalAge(payload.ageTo);
    if (ageTo !== null && (!Number.isInteger(ageTo) || ageTo < 0)) {
      return 'Age To must be a nonnegative integer';
    }
    if (ageTo !== null && ageFrom >= ageTo) {
      return 'Age From must be less than Age To';
    }
    if (
      payload.chartType !== 'ADULT' &&
      payload.chartType !== 'CHILD' &&
      payload.chartType !== 'MIXED'
    ) {
      return 'Chart Type must be Adult, Pediatric, or Mixed';
    }
    if (
      payload.numberingSystem !== 'UNIVERSAL' &&
      payload.numberingSystem !== 'FDI' &&
      payload.numberingSystem !== 'PALMER'
    ) {
      return 'Tooth Numbering System must be Universal, FDI, or Palmer';
    }
    const toothNumbers = Array.isArray(payload.toothNumbers)
      ? payload.toothNumbers
      : [];
    if (toothNumbers.length < 1) {
      return 'Select at least one tooth';
    }
    const allowed = new Set(toothIdsForChartType(payload.chartType));
    if (toothNumbers.some(id => !allowed.has(id))) {
      return 'One or more selected teeth are invalid for the chart type';
    }
    if (new Set(toothNumbers).size !== toothNumbers.length) {
      return 'Duplicate teeth are not allowed';
    }
    const counts = mixedToothCounts(toothNumbers);
    if (
      counts.total > MIXED_MAX_TEETH_TOTAL ||
      counts.upper > MIXED_MAX_TEETH_PER_ARCH ||
      counts.lower > MIXED_MAX_TEETH_PER_ARCH
    ) {
      return `At most ${MIXED_MAX_TEETH_PER_ARCH} teeth per arch and ${MIXED_MAX_TEETH_TOTAL} in total`;
    }
    if (mixedPositionConflicts(toothNumbers).length > 0) {
      return 'A primary and a permanent tooth cannot both occupy the same position; remove one first';
    }
    return null;
  };

  const handleNew = () => {
    setRule({ ...newDentalChartAgeRule, numberingSystem: 'UNIVERSAL', toothNumbers: [] });
    setPopupOpen(true);
  };

  const handleSave = async () => {
    const ageFrom = toOptionalAge(rule.ageFrom);
    const ageTo = toOptionalAge(rule.ageTo);
    const chartType = rule.chartType;
    const toothNumbers = Array.isArray(rule.toothNumbers) ? rule.toothNumbers : [];
    const payload: DentalChartAgeRule = {
      name: rule.name?.trim() ?? '',
      ageFrom,
      ageTo,
      chartType,
      numberingSystem: rule.numberingSystem || 'UNIVERSAL',
      numberingMethodId: rule.numberingMethodId ?? null,
      toothNumbers,
      isActive: rule.isActive ?? true
    };

    const clientError = validateClient(payload);
    if (clientError) {
      dispatch(notify({ msg: clientError, sev: 'warning' }));
      return;
    }

    try {
      dispatch(showSystemLoader());
      if (rule.id) {
        await updateRule({
          id: rule.id,
          body: { ...payload, id: rule.id }
        }).unwrap();
        dispatch(notify({ msg: 'Dental chart rule updated successfully', sev: 'success' }));
      } else {
        await createRule(payload).unwrap();
        dispatch(notify({ msg: 'Dental chart rule created successfully', sev: 'success' }));
      }
      setPopupOpen(false);
      refetch();
    } catch (err) {
      const msg = extractErrorMessage(err) || 'Failed to save dental chart rule';
      dispatch(notify({ msg, sev: 'error' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleToggle = async () => {
    if (!rule.id) return;
    try {
      dispatch(showSystemLoader());
      await toggleActive(rule.id).unwrap();
      dispatch(
        notify({
          msg:
            toggleAction === 'deactivate'
              ? 'Dental chart rule deactivated successfully'
              : 'Dental chart rule reactivated successfully',
          sev: 'success'
        })
      );
      setOpenConfirmToggle(false);
      refetch();
    } catch (err) {
      const msg = extractErrorMessage(err) || 'Action failed, please try again';
      dispatch(notify({ msg, sev: 'error' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const isSelected = (rowData: DentalChartAgeRule) =>
    rowData && rule && rowData.id === rule.id ? 'selected-row' : '';

  const iconsForActions = (rowData: DentalChartAgeRule) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setRule({
            ...rowData,
            numberingSystem: rowData.numberingSystem || 'UNIVERSAL',
            // Preserve exact saved inventory; never reset MIXED (or any) rule to defaults on edit.
            toothNumbers: Array.isArray(rowData.toothNumbers) ? rowData.toothNumbers : []
          });
          setPopupOpen(true);
        }}
      />
      {rowData.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setRule(rowData);
            setToggleAction('deactivate');
            setOpenConfirmToggle(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setRule(rowData);
            setToggleAction('reactivate');
            setOpenConfirmToggle(true);
          }}
        />
      )}
    </div>
  );

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

  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      width: 200,
      ...headerSearch('name', 'Search name')
    },
    {
      key: 'ageFrom',
      title: <Translate>Age From (years, inclusive)</Translate>,
      flexGrow: 2
    },
    {
      key: 'ageTo',
      title: <Translate>Age To (years, exclusive)</Translate>,
      flexGrow: 2,
      render: (rowData: DentalChartAgeRule) =>
        rowData.ageTo === null || rowData.ageTo === undefined ? 'Open-ended' : rowData.ageTo
    },
    {
      key: 'chartType',
      title: <Translate>Chart Type</Translate>,
      width: 150,
      ...headerSearch('chartType'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...chartTypeOptions],
      render: (rowData: DentalChartAgeRule) => chartTypeLabel(rowData.chartType)
    },
    {
      key: 'numberingSystem',
      title: <Translate>Numbering</Translate>,
      flexGrow: 2,
      render: (rowData: DentalChartAgeRule) =>
        rowData.numberingMethodId
          ? numberingMethodName(rowData.numberingMethodId)
          : numberingSystemLabel(rowData.numberingSystem)
    },
    {
      key: 'toothNumbers',
      title: <Translate>Teeth</Translate>,
      flexGrow: 1,
      render: (rowData: DentalChartAgeRule) =>
        Array.isArray(rowData.toothNumbers) ? rowData.toothNumbers.length : 0
    },
    {
      key: 'isActive',
      title: <Translate>Active</Translate>,
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
      render: (rowData: DentalChartAgeRule) => (rowData.isActive ? 'Yes' : 'No')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: DentalChartAgeRule) => iconsForActions(rowData)
    }
  ];

  const handlePageChange = (_event, newPage) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);
    const sortValue = `${column},${type}`;
    setPaginationParams(prev => ({ ...prev, sort: sortValue, page: 0 }));
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const tableData = listResponse?.data ?? [];
  const totalCount = listResponse?.totalCount ?? 0;

  return (
    <Panel dir={dir}>
      <p className="dental-chart-setup-hint">
        Configure age ranges (completed years) that map patients to Adult, Pediatric, or Mixed dental charts.
        Choose a tooth numbering system and the teeth included for each rule. Age From is inclusive;
        Age To is exclusive. Empty Age To means open-ended. Active ranges must not overlap.
      </p>
      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isListFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData: DentalChartAgeRule) => setRule(rowData)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={e => {
          const newSize = Number(e.target.value);
          setPaginationParams(prev => ({ ...prev, size: newSize, page: 0 }));
        }}
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
        open={openConfirmToggle}
        setOpen={setOpenConfirmToggle}
        itemToDelete="Dental Chart Rule"
        actionButtonFunction={handleToggle}
        actionType={toggleAction}
      />

      <AddEditDentalChartAgeRule
        open={popupOpen}
        setOpen={setPopupOpen}
        rule={rule}
        setRule={setRule}
        handleSave={handleSave}
        width={width}
      />
    </Panel>
  );
};

export default DentalChartSetup;
