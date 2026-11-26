import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import { Panel } from 'rsuite';

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
import { resolveEnumOptionLabel } from '@/hooks/useBillingEnumLabel';

import AddEditBillingRuleSetup from './AddEditBillingRuleSetup';

import './styles.less';

// Header filters: draft values typed in the inputs, applied on Enter / select change.
// Everything is sent to one endpoint and combined with AND.
const emptyHeaderFilters = {
  name: '',
  billingItemType: '',
  paymentType: '',
  billingTrigger: '',
  isDefault: '',
  createdDate: ''
};
type HeaderFilterField = keyof typeof emptyHeaderFilters;

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

  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);

  const [
    paginationParams,
    setPaginationParams
  ] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc',
    timestamp: Date.now()
  });

  // Billing rules with the applied header filters
  const {
    data: billingRulePage,
    isFetching,
    refetch
  } = useGetBillingRulesQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    timestamp: paginationParams.timestamp,
    ...appliedFilters,
    billingItemType: appliedFilters.billingItemType as BillingItemType | ''
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
    () => billingRulePage?.data ?? [],
    [billingRulePage?.data]
  );

  const totalCount = billingRulePage?.totalCount ?? 0;

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

  // ===== Header filters =====
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

  // Reload the table after add/edit/delete/default changes
  const refreshList = async () => {
    await refetch();
  };

  const handleNew = () => {
    setSelectedRule({
      ...newBillingRule,
      billingItemType:
        (appliedFilters.billingItemType as BillingItemType) ||
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
      width: 220,
      ...headerSearch('name')
    },

    {
      key: 'billingItemType',
      title:
        <Translate>
          Item Type
        </Translate>,
      width: 170,
      ...headerSelect('billingItemType', itemTypeOptions),

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
      width: 160,
      ...headerSelect('paymentType', paymentTypeOptions),
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
      width: 190,
      ...headerSelect('billingTrigger', billingTriggerOptions),

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
      ...headerSelect('isDefault', [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' }
      ]),
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
      width: 190,
      ...headerSearch('createdDate'),
      searchType: 'date' as const,

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
