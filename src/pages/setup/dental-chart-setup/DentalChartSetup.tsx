import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import './styles.less';
import { Panel, Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { extractErrorMessage } from '@/utils/extractErrorMessage';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import AddEditDentalChartAgeRule from './AddEditDentalChartAgeRule';
import { newDentalChartAgeRule } from '@/types/model-types-constructor-new';
import { DentalChartAgeRule } from '@/types/model-types-new';
import {
  useGetAllDentalChartAgeRulesQuery,
  useGetDentalChartAgeRulesByNameQuery,
  useGetDentalChartAgeRulesByChartTypeQuery,
  useCreateDentalChartAgeRuleMutation,
  useUpdateDentalChartAgeRuleMutation,
  useToggleDentalChartAgeRuleActiveMutation
} from '@/services/setup/dental-chart-age-rule/dentalChartAgeRuleService';
import { skipToken } from '@reduxjs/toolkit/query';
import {
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
  const [isFiltered, setIsFiltered] = useState(false);
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  const [createRule] = useCreateDentalChartAgeRuleMutation();
  const [updateRule] = useUpdateDentalChartAgeRuleMutation();
  const [toggleActive] = useToggleDentalChartAgeRuleActiveMutation();

  const filterFields = [
    { label: 'Name', value: 'name' },
    { label: 'Chart Type', value: 'chartType' }
  ];

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
    isFetching: isListFetching
  } = useGetAllDentalChartAgeRulesQuery(!isFiltered ? paginationParams : skipToken);

  const {
    data: filteredNameResponse,
    isFetching: isFetchingFilteredName
  } = useGetDentalChartAgeRulesByNameQuery(
    isFiltered && recordOfFilter.filter === 'name'
      ? {
          name: recordOfFilter.value,
          page: filterPagination.page,
          size: filterPagination.size,
          sort: filterPagination.sort
        }
      : skipToken
  );

  const {
    data: filteredTypeResponse,
    isFetching: isFetchingFilteredType
  } = useGetDentalChartAgeRulesByChartTypeQuery(
    isFiltered && recordOfFilter.filter === 'chartType'
      ? {
          chartType: recordOfFilter.value,
          page: filterPagination.page,
          size: filterPagination.size,
          sort: filterPagination.sort
        }
      : skipToken
  );

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

  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      flexGrow: 3
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
      flexGrow: 2,
      render: (rowData: DentalChartAgeRule) => chartTypeLabel(rowData.chartType)
    },
    {
      key: 'numberingSystem',
      title: <Translate>Numbering</Translate>,
      flexGrow: 2,
      render: (rowData: DentalChartAgeRule) =>
        numberingSystemLabel(rowData.numberingSystem)
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
      flexGrow: 1,
      render: (rowData: DentalChartAgeRule) => (rowData.isActive ? 'Yes' : 'No')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: DentalChartAgeRule) => iconsForActions(rowData)
    }
  ];

  const handleFilterChange = (field: string, value: string, page = 0, size?: number) => {
    if (!field || !value) {
      setIsFiltered(false);
      return;
    }
    setIsFiltered(true);
    setFilterPagination({
      ...filterPagination,
      page,
      size: size ?? filterPagination.size
    });
    setRecordOfFilter({ filter: field, value });
  };

  const handlePageChange = (_event, newPage) => {
    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, page: newPage }));
    } else {
      setPaginationParams(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);
    const sortValue = `${column},${type}`;
    if (isFiltered) {
      setFilterPagination({ ...filterPagination, sort: sortValue, page: 0 });
    } else {
      setPaginationParams({ ...paginationParams, sort: sortValue, page: 0 });
    }
  };

  const filters = () => (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={updatedRecord => {
          setRecordOfFilter({ filter: updatedRecord.filter, value: '' });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />

      {recordOfFilter.filter === 'chartType' ? (
        <MyInput
          width="9vw"
          fieldName="value"
          fieldType="select"
          selectData={chartTypeOptions}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          searchable={false}
        />
      ) : (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Search"
        />
      )}

      <MyButton
        color="var(--deep-blue)"
        width="80px"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
      >
        Search
      </MyButton>
    </Form>
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const tableData = isFiltered
    ? recordOfFilter.filter === 'chartType'
      ? filteredTypeResponse?.data ?? []
      : filteredNameResponse?.data ?? []
    : listResponse?.data ?? [];

  const totalCount = isFiltered
    ? recordOfFilter.filter === 'chartType'
      ? filteredTypeResponse?.totalCount ?? 0
      : filteredNameResponse?.totalCount ?? 0
    : listResponse?.totalCount ?? 0;

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
        loading={isListFetching || isFetchingFilteredName || isFetchingFilteredType}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData: DentalChartAgeRule) => setRule(rowData)}
        filters={filters()}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={e => {
          const newSize = Number(e.target.value);
          if (isFiltered) {
            setFilterPagination({ ...filterPagination, size: newSize, page: 0 });
            handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
          } else {
            setPaginationParams({ ...paginationParams, size: newSize, page: 0 });
          }
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
