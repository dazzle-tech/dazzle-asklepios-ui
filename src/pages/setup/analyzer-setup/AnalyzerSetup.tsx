import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
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
  useToggleAnalyzerIsActiveMutation,
  useLazyGetAnalyzersByTypeQuery,
  useLazyGetAnalyzersByCodeQuery
} from '@/services/setup/analyzerService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
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

  // Filters state
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({
    filter: '',
    value: ''
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<Analyzer[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined);

  // Pagination (unfiltered list via Link headers)
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  // Pagination for filtered mode
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  // API hooks
  const {
    data: analyzersPage,
    isFetching,
    refetch
  } = useGetAnalyzersQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort
  });

  const [addAnalyzer] = useAddAnalyzerMutation();
  const [updateAnalyzer] = useUpdateAnalyzerMutation();
  const [toggleAnalyzerIsActive] = useToggleAnalyzerIsActiveMutation();

  const [fetchByType] = useLazyGetAnalyzersByTypeQuery();
  const [fetchByCode] = useLazyGetAnalyzersByCodeQuery();

  // Analyzer type LOV (used for the filter dropdown) - same LAB_CATEGORIES list
  // as the Add/Edit form's type field.
  const { data: analyzerTypeLov } = useGetLovValuesByCodeQuery('LAB_CATEGORIES');
  const analyzerTypeOptions = useMemo(
    () => analyzerTypeLov?.object ?? [],
    [analyzerTypeLov]
  );

  // Derived data
  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : analyzersPage?.totalCount ?? 0),
    [isFiltered, filteredTotal, analyzersPage?.totalCount]
  );
  const links = (isFiltered ? filteredLinks : analyzersPage?.links) || {};
  const tableData = useMemo(
    () => (isFiltered ? filteredData : analyzersPage?.data ?? []),
    [isFiltered, filteredData, analyzersPage?.data]
  );

  // Filter fields
  const filterFields = [
    { label: 'Analyzer Type', value: 'type' },
    { label: 'Analyzer Code', value: 'code' }
  ];

  // Helpers
  const resetToUnfiltered = () => {
    setIsFiltered(false);
    setFilteredData([]);
    setFilteredTotal(0);
    setFilteredLinks(undefined);
    setFilterPagination(prev => ({ ...prev, page: 0 }));
    setPaginationParams(prev => ({ ...prev, page: 0, sort: 'id,asc', timestamp: Date.now() }));
    refetch();
  };

  const runFilterQuery = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort
  ) => {
    if (!value && value !== 0) return undefined;

    if (fieldName === 'type') {
      return await fetchByType({ type: String(value), page, size, sort }).unwrap();
    } else if (fieldName === 'code') {
      return await fetchByCode({ code: String(value), page, size, sort }).unwrap();
    }
    return undefined;
  };

  const handleFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort
  ) => {
    if (!value) {
      resetToUnfiltered();
      return;
    }
    try {
      const resp = await runFilterQuery(fieldName, value, page, size, sort);
      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setIsFiltered(true);
      setFilterPagination(prev => ({ ...prev, page, size, sort }));
    } catch {
      resetToUnfiltered();
    }
  };

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
        if (isFiltered) {
          setFilteredData(prev => prev.map(row => (row.id === updated.id ? updated : row)));
        } else {
          setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
          refetch();
        }
      } else {
        const created = await addAnalyzer(payload).unwrap();
        dispatch(notify({ msg: 'Analyzer added successfully', sev: 'success' }));
        if (isFiltered) {
          const filterField = recordOfFilter.filter;
          const filterValue = recordOfFilter.value;
          let matchesFilter = false;

          if (filterField === 'type') {
            matchesFilter = created.type === String(filterValue);
          } else if (filterField === 'code') {
            matchesFilter = (created.code ?? '')
              .toLowerCase()
              .includes(String(filterValue).toLowerCase());
          }

          if (matchesFilter) {
            setFilteredData(prev => [created, ...prev]);
            setFilteredTotal(prev => prev + 1);
            setFilterPagination(prev => ({ ...prev, page: 0 }));
          } else {
            dispatch(
              notify({
                msg: 'Analyzer added but does not match current filter',
                sev: 'info'
              })
            );
          }
        } else {
          setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
          refetch();
        }
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

      if (isFiltered) {
        setFilteredData(prev =>
          prev.map(row => (row.id === toggledId ? { ...row, isActive: newIsActive } : row))
        );
      } else {
        refetch();
      }

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
    if (isFiltered) {
      handleFilterChange(
        recordOfFilter.filter,
        recordOfFilter.value,
        newPage,
        filterPagination.size,
        filterPagination.sort
      );
      return;
    }

    const currentPage = paginationParams.page;
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && links.next) targetLink = links.next;
    else if (newPage < currentPage && links.prev) targetLink = links.prev;
    else if (newPage === 0 && links.first) targetLink = links.first;
    else if (newPage > currentPage + 1 && links.last) targetLink = links.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams(prev => ({
        ...prev,
        page,
        size,
        timestamp: Date.now()
      }));
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);

    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
      handleFilterChange(
        recordOfFilter.filter,
        recordOfFilter.value,
        0,
        newSize,
        filterPagination.sort
      );
    } else {
      setPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0,
        timestamp: Date.now()
      }));
    }
  };

  // Row selection style
  const isSelected = (rowData: any) =>
    rowData && analyzer && rowData.id === analyzer.id ? 'selected-row' : '';

  // Columns
  const tableColumns = [
    { key: 'code', title: <Translate>Analyzer Code</Translate>, flexGrow: 4 },
    {
      key: 'type',
      title: <Translate>Analyzer Type</Translate>,
      flexGrow: 4,
      render: (rowData: any) => <LovValueCell valueKey={rowData.type} />
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

  // Filters UI
  const filters = () => {
    const selected = recordOfFilter.filter;

    const dynamicInput =
      selected === 'type' ? (
        <MyInput
          width={220}
          fieldName="value"
          fieldLabel=""
          fieldType="select"
          selectData={analyzerTypeOptions}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
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
          width={220}
        />
      );

    return (
      <Form fluid className="form-of-filters-set-up">
        <MyInput
          selectDataValue="value"
          selectDataLabel="label"
          selectData={filterFields}
          fieldName="filter"
          fieldType="select"
          record={recordOfFilter}
          setRecord={(updatedRecord: any) => {
            setRecordOfFilter({ filter: updatedRecord.filter, value: '' });
          }}
          showLabel={false}
          placeholder="Select Filter"
          searchable={false}
          width="180px"
        />
        {dynamicInput}
        <MyButton
          color="var(--deep-blue)"
          onClick={() => {
            if (!recordOfFilter.value && recordOfFilter.value !== 0) {
              resetToUnfiltered();
            } else {
              handleFilterChange(
                recordOfFilter.filter,
                recordOfFilter.value,
                0,
                filterPagination.size,
                filterPagination.sort
              );
            }
          }}
          width="80px"
        >
          Search
        </MyButton>
      </Form>
    );
  };

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

  // If user clears value manually, revert to unfiltered list
  useEffect(() => {
    if (!recordOfFilter.value && isFiltered) {
      resetToUnfiltered();
    }
  }, [recordOfFilter.value]); // eslint-disable-line react-hooks/exhaustive-deps

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
        filters={filters()}
        onRowClick={(rowData: any) => setAnalyzer(rowData)}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
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
