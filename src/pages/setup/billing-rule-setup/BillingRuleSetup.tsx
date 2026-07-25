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

import {
  useDeleteBillingRuleMutation,
  useGetBillingRulesQuery,
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

import AddEditBillingRuleSetup from './AddEditBillingRuleSetup';

import './styles.less';

type FilterState = {
  billingItemType: BillingItemType | '';
  name: string;
};

const initialFilterState: FilterState = {
  billingItemType: '',
  name: ''
};

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

  const [filters, setFilters] =
    useState<FilterState>(
      initialFilterState
    );

  const [
    appliedFilters,
    setAppliedFilters
  ] = useState<FilterState>(
    initialFilterState
  );

  const [
    paginationParams,
    setPaginationParams
  ] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc',
    timestamp: Date.now()
  });

  const {
    data: billingRulePage,
    isFetching,
    refetch
  } = useGetBillingRulesQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    timestamp: paginationParams.timestamp,
    billingItemType:
      appliedFilters.billingItemType,
    name: appliedFilters.name
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

  const tableData = useMemo(
    () => billingRulePage?.data ?? [],
    [billingRulePage?.data]
  );

  const totalCount =
    billingRulePage?.totalCount ?? 0;

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

  const handleNew = () => {
    setSelectedRule({
      ...newBillingRule,
      billingItemType:
        filters.billingItemType ||
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

      await refetch();
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

      await refetch();
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

    setPaginationParams(previous => ({
      ...previous,
      page: 0,
      timestamp: Date.now()
    }));

    await refetch();
  };

  const handlePageChange = (
    _: unknown,
    newPage: number
  ) => {
    setPaginationParams(previous => ({
      ...previous,
      page: newPage,
      timestamp: Date.now()
    }));
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSize = Number(
      event.target.value
    );

    setPaginationParams(previous => ({
      ...previous,
      page: 0,
      size: newSize,
      timestamp: Date.now()
    }));
  };

  const handleFilterChange = (
    updatedFilters: FilterState
  ) => {
    setFilters(updatedFilters);

    setAppliedFilters(previous => ({
      ...previous,
      billingItemType:
        updatedFilters.billingItemType
    }));

    setPaginationParams(previous => ({
      ...previous,
      page: 0,
      timestamp: Date.now()
    }));
  };

  const handleNameChange = (
    updatedFilters: FilterState
  ) => {
    setFilters(previous => ({
      ...previous,
      name: updatedFilters.name ?? ''
    }));
  };

  const handleSearch = () => {
    setAppliedFilters(filters);

    setPaginationParams(previous => ({
      ...previous,
      page: 0,
      timestamp: Date.now()
    }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilterState);
    setAppliedFilters(initialFilterState);

    setPaginationParams(previous => ({
      ...previous,
      page: 0,
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
          ? formatEnumString(
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
      <Form fluid className="billing-rule-filter-bar">
        <MyInput
          column
          fieldLabel="Rule Name"
          fieldName="name"
          record={filters}
          setRecord={handleNameChange}
          enterClick={handleSearch}
        />

        <MyInput
          column
          fieldLabel="Item Type"
          fieldType="select"
          fieldName="billingItemType"
          selectData={[
            {
              label: 'All Item Types',
              value: ''
            },
            ...itemTypeOptions
          ]}
          selectDataLabel="label"
          selectDataValue="value"
          record={filters}
          setRecord={handleFilterChange}
          searchable={false}
        />

        <MyButton
          appearance="primary"
          onClick={handleSearch}
        >
          Search
        </MyButton>

        <MyButton
          appearance="subtle"
          onClick={
            handleResetFilters
          }
        >
          Reset
        </MyButton>
      </Form>

      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={selectedRowClass}
        onRowClick={row =>
          setSelectedRule(row)
        }
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
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
