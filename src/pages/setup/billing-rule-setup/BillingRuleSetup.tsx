import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import { Form, Panel } from 'rsuite';

import {
  MdDelete,
  MdModeEdit,
  MdStar,
  MdStarOutline
} from 'react-icons/md';

import AddOutlineIcon from '@rsuite/icons/AddOutline';

import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import { useAppDispatch } from '@/hooks';

import {
  setDivContent,
  setPageCode
} from '@/reducers/divSlice';

import { notify } from '@/utils/uiReducerActions';

import { formatEnumString } from '@/utils';
import dayjs from 'dayjs';

import {
  useDeleteBillingRuleMutation,
  useGetBillingRulesQuery,
  useLazyGetBillingRulesByCreatedDateQuery,
  useLazyGetBillingRulesByDefaultQuery,
  useLazyGetBillingRulesByItemTypeQuery,
  useLazyGetBillingRulesByNameQuery,
  useLazyGetBillingRulesByPaymentTypeQuery,
  useLazyGetBillingRulesByTriggerQuery,
  useSetBillingRuleDefaultMutation
} from '@/services/setup/billingRuleSetup/billingRuleSetupService';

import type {
  BillingItemType,
  BillingRule as BillingRuleModel
} from '@/types/model-types-new';

import {
  newBillingRule
} from '@/types/model-types-constructor-new';

import { useEnumOptions } from '@/services/enumsApi';
import { resolveEnumOptionLabel } from '@/hooks/useBillingEnumLabel';

import AddEditBillingRuleSetup from './AddEditBillingRuleSetup';

import './styles.less';

type FilterState = {
  filter: string;
  value: any;
};

const initialFilterState: FilterState = {
  filter: '',
  value: ''
};

const filterFields = [
  { label: 'Name', value: 'name' },
  { label: 'Item Type', value: 'billingItemType' },
  { label: 'Payment Type', value: 'paymentType' },
  { label: 'Billing Trigger', value: 'billingTrigger' },
  { label: 'Default', value: 'isDefault' },
  { label: 'Created Date', value: 'createdDate' }
];

const isEmptyFilterValue = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '');

const normalizeBillingRuleError = (
  error: any
) => {
  const data = error?.data ?? error ?? {};
  const errorKey = data?.errorKey ?? data?.message;

  switch (errorKey) {
    case 'name.exists':
      return 'A billing rule with this name already exists.';
    case 'default.delete':
      return 'Default billing rules cannot be deleted.';
    case 'rule.in.use':
      return 'This billing rule is linked to setup records and cannot be deleted.';
    case 'delete.failed':
      return 'Billing rule was not found or could not be deleted.';
    default:
      return (
        data?.detail ??
        data?.title ??
        data?.message ??
        'Unexpected billing rule error'
      );
  }
};

const BillingRuleSetup: React.FC = () => {
  const dispatch = useAppDispatch();

  const [
    selectedRule,
    setSelectedRule
  ] = useState<BillingRuleModel>({
    ...newBillingRule
  });

  const [
    headerModalOpen,
    setHeaderModalOpen
  ] = useState(false);

  const [
    deleteConfirmationOpen,
    setDeleteConfirmationOpen
  ] = useState(false);

  const [width, setWidth] = useState(
    typeof window !== 'undefined'
      ? window.innerWidth
      : 1200
  );

  // Filter being edited in the filter bar, and the one the table currently shows
  const [recordOfFilter, setRecordOfFilter] =
    useState<FilterState>(initialFilterState);
  const [activeFilter, setActiveFilter] =
    useState<FilterState>(initialFilterState);
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<BillingRuleModel[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Unfiltered pagination (main list)
  const [
    paginationParams,
    setPaginationParams
  ] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc',
    timestamp: Date.now()
  });

  // Filtered pagination (independent state)
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const [fetchByName] = useLazyGetBillingRulesByNameQuery();
  const [fetchByItemType] = useLazyGetBillingRulesByItemTypeQuery();
  const [fetchByPaymentType] = useLazyGetBillingRulesByPaymentTypeQuery();
  const [fetchByTrigger] = useLazyGetBillingRulesByTriggerQuery();
  const [fetchByDefault] = useLazyGetBillingRulesByDefaultQuery();
  const [fetchByCreatedDate] = useLazyGetBillingRulesByCreatedDateQuery();

  // Main list: all billing rules
  const {
    data: billingRulePage,
    isFetching,
    refetch
  } = useGetBillingRulesQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    timestamp: paginationParams.timestamp
  });

  const [
    deleteBillingRule
  ] = useDeleteBillingRuleMutation();

  const [
    setBillingRuleDefault
  ] = useSetBillingRuleDefaultMutation();

  const itemTypeOptions =
    useEnumOptions('BillingItemTypes') ??
    [];

  const billingTriggerOptions =
    useEnumOptions('BillingTrigger') ??
    [];

  const paymentTypeOptions =
    useEnumOptions('BillingRulePaymentType') ??
    [];

  const tableData = useMemo(
    () => (isFiltered ? filteredData : billingRulePage?.data ?? []),
    [isFiltered, filteredData, billingRulePage?.data]
  );

  const totalCount = isFiltered
    ? filteredTotal
    : billingRulePage?.totalCount ?? 0;

  useEffect(() => {
    dispatch(setPageCode('BillingRuleSetup'));
    dispatch(
      setDivContent('Billing Rule Setup')
    );

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const resizeHandler = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener(
      'resize',
      resizeHandler
    );

    return () => {
      window.removeEventListener(
        'resize',
        resizeHandler
      );
    };
  }, []);

  // ===== Filtering =====
  const runFilterQuery = async (
    fieldName: string,
    value: any,
    page: number,
    size: number,
    sort: string
  ) => {
    const pageParams = { page, size, sort };

    if (fieldName === 'name') {
      return await fetchByName({ ...pageParams, name: String(value).trim() }).unwrap();
    } else if (fieldName === 'billingItemType') {
      return await fetchByItemType({ ...pageParams, billingItemType: value }).unwrap();
    } else if (fieldName === 'paymentType') {
      return await fetchByPaymentType({ ...pageParams, paymentType: value }).unwrap();
    } else if (fieldName === 'billingTrigger') {
      return await fetchByTrigger({ ...pageParams, billingTrigger: value }).unwrap();
    } else if (fieldName === 'isDefault') {
      return await fetchByDefault({ ...pageParams, isDefault: value === true || value === 'true' }).unwrap();
    } else if (fieldName === 'createdDate') {
      // Whole selected day in the user's time zone
      const dayStart = dayjs(value).startOf('day');
      return await fetchByCreatedDate({
        ...pageParams,
        from: dayStart.toISOString(),
        to: dayStart.add(1, 'day').toISOString()
      }).unwrap();
    }

    return undefined;
  };

  // Reset to main list
  const resetToUnfiltered = () => {
    setIsFiltered(false);
    setActiveFilter(initialFilterState);
    setFilteredData([]);
    setFilteredTotal(0);
    setFilterPagination(prev => ({ ...prev, page: 0 }));
    setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
  };

  // Apply/Clear filters
  const handleFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort
  ) => {
    if (!fieldName || isEmptyFilterValue(value)) {
      resetToUnfiltered();
      return;
    }

    setIsFilterLoading(true);
    try {
      const resp = await runFilterQuery(fieldName, value, page, size, sort);
      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setActiveFilter({ filter: fieldName, value });
      setIsFiltered(true);
      setFilterPagination(prev => ({ ...prev, page, size, sort }));
    } catch (error: any) {
      dispatch(
        notify({
          msg: normalizeBillingRuleError(error),
          sev: 'error'
        })
      );
    } finally {
      setIsFilterLoading(false);
    }
  };

  // Reload whatever the table shows after add/edit/delete/default changes
  const refreshList = async () => {
    if (isFiltered) {
      await handleFilterChange(
        activeFilter.filter,
        activeFilter.value,
        filterPagination.page
      );
      return;
    }

    await refetch();
  };

  const handleSearch = () => {
    handleFilterChange(
      recordOfFilter.filter,
      recordOfFilter.value
    );
  };

  const handleNew = () => {
    setSelectedRule({
      ...newBillingRule,
      billingItemType:
        (isFiltered &&
          activeFilter.filter === 'billingItemType' &&
          (activeFilter.value as BillingItemType)) ||
        'SERVICE'
    });

    setHeaderModalOpen(true);
  };

  const handleEdit = (
    row: BillingRuleModel
  ) => {
    setSelectedRule({
      ...row
    });

    setHeaderModalOpen(true);
  };

  const handleDeleteRequest = (
    row: BillingRuleModel
  ) => {
    setSelectedRule({
      ...row
    });

    setDeleteConfirmationOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRule.id) {
      return;
    }

    try {
      await deleteBillingRule({
        id: selectedRule.id
      }).unwrap();

      dispatch(
        notify({
          msg:
            'Billing rule deleted successfully',
          sev: 'success'
        })
      );

      setDeleteConfirmationOpen(false);

      setSelectedRule({
        ...newBillingRule
      });

      await refreshList();
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            normalizeBillingRuleError(
              error
            ),
          sev: 'error'
        })
      );
    }
  };

  const handleSetDefault = async (
    row: BillingRuleModel
  ) => {
    if (!row.id || row.isDefault) {
      return;
    }

    try {
      await setBillingRuleDefault({
        id: row.id
      }).unwrap();

      dispatch(
        notify({
          msg:
            'Default billing rule updated successfully',
          sev: 'success'
        })
      );

      await refreshList();
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            normalizeBillingRuleError(
              error
            ),
          sev: 'error'
        })
      );
    }
  };

  const handleSaveSuccess = async () => {
    setHeaderModalOpen(false);
    await refreshList();
  };

  // Pagination
  const handlePageChange = (
    _: unknown,
    newPage: number
  ) => {
    if (isFiltered) {
      handleFilterChange(
        activeFilter.filter,
        activeFilter.value,
        newPage
      );
      return;
    }

    setPaginationParams(previous => ({
      ...previous,
      page: newPage,
      timestamp: Date.now()
    }));
  };

  // Rows per page
  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSize = Number(
      event.target.value
    );

    if (isFiltered) {
      handleFilterChange(
        activeFilter.filter,
        activeFilter.value,
        0,
        newSize
      );
      return;
    }

    setPaginationParams(previous => ({
      ...previous,
      page: 0,
      size: newSize,
      timestamp: Date.now()
    }));
  };

  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      flexGrow: 3
    },

    {
      key: 'billingItemType',
      title:
        <Translate>
          Item Type
        </Translate>,
      flexGrow: 2,

      render: (
        row: BillingRuleModel
      ) =>
        row.billingItemType
          ? formatEnumString(
              row.billingItemType
            )
          : '-'
    },

    {
      key: 'paymentType',
      title: <Translate>Payment Type</Translate>,
      flexGrow: 2,
      render: (row: BillingRuleModel) =>
        row.paymentType
          ? formatEnumString(row.paymentType)
          : 'Both'
    },

    {
      key: 'billingTrigger',
      title:
        <Translate>
          Billing Trigger
        </Translate>,
      flexGrow: 2,

      render: (
        row: BillingRuleModel
      ) =>
        row.billingTrigger
          ? resolveEnumOptionLabel(
              billingTriggerOptions,
              row.billingTrigger
            )
          : '-'
    },

    {
      key: 'isDefault',
      title:
        <Translate>
          Default
        </Translate>,
      width: 110,
      align: 'center' as const,

      render: (
        row: BillingRuleModel
      ) =>
        row.isDefault ? (
          <span className="default-badge">
            Default
          </span>
        ) : (
          '-'
        )
    },

    {
      key: 'createdDate',
      title:
        <Translate>
          Created Date
        </Translate>,
      flexGrow: 2,

      render: (
        row: BillingRuleModel
      ) =>
        row.createdDate
          ? new Date(
              row.createdDate
            ).toLocaleString()
          : '-'
    },

    {
      key: 'actions',
      title:
        <Translate>
          Actions
        </Translate>,
      width: 130,
      align: 'center' as const,

      render: (
        row: BillingRuleModel
      ) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={23}
            fill="var(--primary-gray)"
            onClick={() =>
              handleEdit(row)
            }
          />

          {row.isDefault ? (
            <MdStar
              className="icons-style icons-style--disabled"
              title="Already default"
              size={24}
              fill="#f59e0b"
            />
          ) : (
            <MdStarOutline
              className="icons-style"
              title="Set as default"
              size={24}
              fill="var(--deep-blue)"
              onClick={() =>
                handleSetDefault(row)
              }
            />
          )}

          <MdDelete
            className="icons-style"
            title="Delete"
            size={23}
            fill="var(--primary-pink)"
            onClick={() =>
              handleDeleteRequest(row)
            }
          />
        </div>
      )
    }
  ];

  const renderFilterValueInput = () => {
    const selectInput = (
      options: { label: string; value: any }[]
    ) => (
      <MyInput
        width={220}
        fieldName="value"
        fieldLabel=""
        fieldType="select"
        selectData={options}
        selectDataLabel="label"
        selectDataValue="value"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        searchable={false}
      />
    );

    switch (recordOfFilter.filter) {
      case 'billingItemType':
        return selectInput(itemTypeOptions);
      case 'paymentType':
        return selectInput(paymentTypeOptions);
      case 'billingTrigger':
        return selectInput(billingTriggerOptions);
      case 'isDefault':
        return selectInput([
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]);
      case 'createdDate':
        return (
          <MyInput
            width={220}
            fieldName="value"
            fieldLabel=""
            fieldType="date"
            record={recordOfFilter}
            setRecord={setRecordOfFilter}
            showLabel={false}
          />
        );
      default:
        return (
          <MyInput
            fieldName="value"
            fieldType="text"
            record={recordOfFilter}
            setRecord={setRecordOfFilter}
            showLabel={false}
            placeholder="Enter Value"
            width={220}
            enterClick={handleSearch}
          />
        );
    }
  };

  const filtersBar = (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={(updated: FilterState) =>
          setRecordOfFilter({
            filter: updated.filter,
            value: ''
          })
        }
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
        width="170px"
      />

      {renderFilterValueInput()}

      <MyButton
        color="var(--deep-blue)"
        onClick={handleSearch}
        width="80px"
      >
        Search
      </MyButton>
    </Form>
  );

  const selectedRowClass = (
    row: BillingRuleModel
  ) =>
    row?.id === selectedRule?.id
      ? 'selected-row'
      : '';

  const direction =
    localStorage.getItem('direction') ||
    'LTR';

  const dir =
    direction === 'RTL'
      ? 'rtl'
      : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isFiltered ? isFilterLoading : isFetching}
        columns={tableColumns}
        filters={filtersBar}
        rowClassName={selectedRowClass}
        onRowClick={row =>
          setSelectedRule(row)
        }
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={
          handleRowsPerPageChange
        }
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => (
                <AddOutlineIcon />
              )}
              color="var(--deep-blue)"
              onClick={handleNew}
              width="125px"
            >
              Add New
            </MyButton>
          </div>
        }
      />

      <AddEditBillingRuleSetup
        open={headerModalOpen}
        setOpen={setHeaderModalOpen}
        width={width}
        billingRule={selectedRule}
        setBillingRule={setSelectedRule}
        onSaveSuccess={handleSaveSuccess}
      />

      <DeletionConfirmationModal
        open={deleteConfirmationOpen}
        setOpen={setDeleteConfirmationOpen}
        itemToDelete="Billing Rule"
        actionButtonFunction={handleDelete}
        actionType="delete"
      />
    </Panel>
  );
};

export default BillingRuleSetup;
