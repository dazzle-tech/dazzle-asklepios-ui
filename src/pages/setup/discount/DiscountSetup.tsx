import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Panel
} from 'rsuite';

import {
  MdDelete,
  MdModeEdit,
  MdStar,
  MdStarBorder,
  MdToggleOff,
  MdToggleOn
} from 'react-icons/md';

import AddOutlineIcon from '@rsuite/icons/AddOutline';

import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import {
  useAppDispatch
} from '@/hooks';

import {
  setDivContent,
  setPageCode
} from '@/reducers/divSlice';

import {
  notify
} from '@/utils/uiReducerActions';

import {
  conjureValueBasedOnIDFromList,
  formatEnumString
} from '@/utils';

import {
  useEnumOptions
} from '@/services/enumsApi';

import {
  useGetAllFacilitiesQuery
} from '@/services/security/facilityService';

import {
  useChangeDiscountActivationStatusMutation,
  useDeleteDiscountMutation,
  useGetDiscountsByFacilityQuery,
  useSetDefaultDiscountMutation
} from '@/services/billing/discountService';

import type {
  Discount
} from '@/types/model-types-new';

import {
  newDiscount
} from '@/types/model-types-constructor-new';

import AddEditDiscount from './AddEditDiscount';

import {
  extractDiscountErrorMessage
} from './discountErrorHandler';

import './styles.less';

// Header filters: draft values typed in the inputs, applied on Enter / select change.
// Everything is sent to one endpoint and combined with AND.
const emptyHeaderFilters = {
  code: '',
  name: '',
  discountType: '',
  value: '',
  applicableOn: '',
  requiresApproval: '',
  isDefault: ''
};
type HeaderFilterField = keyof typeof emptyHeaderFilters;

const DiscountSetup:
React.FC = () => {
  const dispatch =
    useAppDispatch();

  const tenant =
    JSON.parse(
      localStorage.getItem(
        'tenant'
      ) || 'null'
    );

  const selectedFacility =
    tenant?.selectedFacility ||
    null;

  const facilityId:
    number | undefined =
    selectedFacility?.id;

  const discountTypeOptions =
    useEnumOptions(
      'DiscountType'
    );

  const applicableOnOptions =
    useEnumOptions(
      'DiscountApplicableOn'
    );

  const [
    selectedDiscount,
    setSelectedDiscount
  ] =
    useState<Discount>({
      ...newDiscount
    });

  const [
    modalOpen,
    setModalOpen
  ] =
    useState(
      false
    );

  const [
    deleteConfirmationOpen,
    setDeleteConfirmationOpen
  ] =
    useState(
      false
    );

  const [
    width,
    setWidth
  ] =
    useState(
      typeof window !==
        'undefined'
        ? window.innerWidth
        : 1200
    );

  const [
    paginationParams,
    setPaginationParams
  ] =
    useState({
      page:
        0,

      size:
        15,

      sort:
        'id,desc',

      timestamp:
        Date.now()
    });

  const [
    sortColumn,
    setSortColumn
  ] =
    useState<string>(
      'id'
    );

  const [
    sortType,
    setSortType
  ] =
    useState<
      'asc' | 'desc'
    >(
      'desc'
    );

  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no active param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  // Discounts of the facility with the applied header filters
  const allDiscountsQuery =
    useGetDiscountsByFacilityQuery(
      {
        facilityId:
          facilityId as number,

        filters: {
          ...appliedFilters,
          active: activeFilter
        },

        page:
          paginationParams.page,

        size:
          paginationParams.size,

        sort:
          paginationParams.sort,

        timestamp:
          paginationParams.timestamp
      },
      {
        skip:
          !facilityId
      }
    );

  const {
    data:
      facilityListResponse
  } =
    useGetAllFacilitiesQuery({});

  const [
    deleteDiscount,
    {
      isLoading:
        isDeleting
    }
  ] =
    useDeleteDiscountMutation();

  const [
    changeActivationStatus,
    {
      isLoading:
        isChangingActivation
    }
  ] =
    useChangeDiscountActivationStatusMutation();

  const [
    setDefaultDiscount,
    {
      isLoading:
        isSettingDefault
    }
  ] =
    useSetDefaultDiscountMutation();

  const activeResponse = useMemo(
    () => ({
      data: allDiscountsQuery.data?.data ?? [],
      totalCount: allDiscountsQuery.data?.totalCount ?? 0
    }),
    [allDiscountsQuery.data]
  );

  const isFetching = allDiscountsQuery.isFetching;

  const activeQueryError = allDiscountsQuery.error;

  // ===== Header filters =====
  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setPaginationParams(previous => ({ ...previous, page: 0 }));
  };

  const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field],
    onSearchChange: (value: string) => setHeaderFilters(previous => ({ ...previous, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
  });

  const headerSelect = (field: HeaderFilterField, options: { label: string; value: string }[]) => ({
    ...headerSearch(field),
    searchType: 'select' as const,
    searchOptions: [{ label: 'All', value: '' }, ...options]
  });

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(previous => ({ ...previous, page: 0 }));
  }, [statusFilter]);

  // Reload the table after add/edit/delete/default/activation changes
  const refetchActiveQuery =
    async () => {
      await allDiscountsQuery
        .refetch();
    };

  useEffect(() => {
    dispatch(
      setPageCode(
        'DiscountSetup'
      )
    );

    dispatch(
      setDivContent(
        'Discount Setup'
      )
    );

    return () => {
      dispatch(
        setPageCode('')
      );

      dispatch(
        setDivContent('')
      );
    };
  }, [
    dispatch
  ]);

  useEffect(() => {
    const resizeHandler =
      () => {
        setWidth(
          window.innerWidth
        );
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

  // Another facility starts again from the first page
  useEffect(() => {
    setSelectedDiscount({
      ...newDiscount
    });

    setPaginationParams(
      previous => ({
        ...previous,

        page:
          0,

        timestamp:
          Date.now()
      })
    );
  }, [
    facilityId
  ]);

  useEffect(() => {
    if (
      !activeQueryError
    ) {
      return;
    }

    dispatch(
      notify({
        msg:
          extractDiscountErrorMessage(
            activeQueryError,
            'Failed to load discounts.'
          ),

        sev:
          'error'
      })
    );
  }, [
    activeQueryError,
    dispatch
  ]);

  const handleNew =
    () => {
      if (!facilityId) {
        dispatch(
          notify({
            msg:
              'Please select a facility first.',

            sev:
              'warning'
          })
        );

        return;
      }

      setSelectedDiscount({
        ...newDiscount,

        facilityId,

        discountType:
          'PERCENTAGE',

        applicableOn:
          'INVOICE',

        validFrom:
          new Date()
            .toISOString()
            .slice(
              0,
              10
            ),

        requiresReason:
          false,

        requiresApproval:
          false,

        combinable:
          false,

        isDefault:
          false,

        active:
          true
      });

      setModalOpen(
        true
      );
    };

  const handleEdit = (
    row:
      Discount
  ) => {
    setSelectedDiscount({
      ...row
    });

    setModalOpen(
      true
    );
  };

  const handleDeleteRequest = (
    row:
      Discount
  ) => {
    setSelectedDiscount({
      ...row
    });

    setDeleteConfirmationOpen(
      true
    );
  };

  const handleDelete =
    async () => {
      if (
        !selectedDiscount.id
      ) {
        return;
      }

      try {
        await deleteDiscount({
          id:
            selectedDiscount.id
        }).unwrap();

        dispatch(
          notify({
            msg:
              'Discount deleted successfully',

            sev:
              'success'
          })
        );

        setDeleteConfirmationOpen(
          false
        );

        setSelectedDiscount({
          ...newDiscount
        });

        await refetchActiveQuery();
      } catch (
        error:
          any
      ) {
        dispatch(
          notify({
            msg:
              extractDiscountErrorMessage(
                error,
                'Failed to delete discount'
              ),

            sev:
              'error'
          })
        );
      }
    };

  const handleActivationChange =
    async (
      row:
        Discount
    ) => {
      if (!row.id) {
        return;
      }

      const nextActive =
        !Boolean(
          row.active
        );

      try {
        await changeActivationStatus({
          id:
            row.id,

          active:
            nextActive
        }).unwrap();

        dispatch(
          notify({
            msg:
              nextActive
                ? 'Discount activated successfully'
                : 'Discount deactivated successfully',

            sev:
              'success'
          })
        );

        await refetchActiveQuery();
      } catch (
        error:
          any
      ) {
        dispatch(
          notify({
            msg:
              extractDiscountErrorMessage(
                error,
                'Failed to update discount activation status'
              ),

            sev:
              'error'
          })
        );
      }
    };

  const handleSetDefault =
    async (
      row:
        Discount
    ) => {
      if (
        !row.id ||
        row.isDefault
      ) {
        return;
      }

      try {
        await setDefaultDiscount({
          id:
            row.id
        }).unwrap();

        dispatch(
          notify({
            msg:
              'Default discount updated successfully',

            sev:
              'success'
          })
        );

        await refetchActiveQuery();
      } catch (
        error:
          any
      ) {
        dispatch(
          notify({
            msg:
              extractDiscountErrorMessage(
                error,
                'Failed to set default discount'
              ),

            sev:
              'error'
          })
        );
      }
    };

  const handleSaveSuccess =
    async () => {
      setModalOpen(
        false
      );

      setSelectedDiscount({
        ...newDiscount
      });

      setPaginationParams(
        previous => ({
          ...previous,

          page:
            0,

          timestamp:
            Date.now()
        })
      );

      await refetchActiveQuery();
    };

  const handlePageChange = (
    _event:
      unknown,

    newPage:
      number
  ) => {
    setPaginationParams(
      previous => ({
        ...previous,

        page:
          newPage,

        timestamp:
          Date.now()
      })
    );
  };

  const handleRowsPerPageChange = (
    event:
      React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSize =
      Number(
        event.target.value
      );

    setPaginationParams(
      previous => ({
        ...previous,

        page:
          0,

        size:
          newSize,

        timestamp:
          Date.now()
      })
    );
  };

  const handleSortChange = (
    column:
      string,

    type:
      'asc' | 'desc'
  ) => {
    setSortColumn(
      column
    );

    setSortType(
      type
    );

    setPaginationParams(
      previous => ({
        ...previous,

        sort:
          `${column},${type}`,

        page:
          0,

        timestamp:
          Date.now()
      })
    );
  };

  const tableColumns = [
    {
      key:
        'facilityId',

      title:
        <Translate>
          Facility
        </Translate>,

      flexGrow:
        2,

      render: (
        row:
          Discount
      ) =>
        conjureValueBasedOnIDFromList(
          facilityListResponse ??
            [],

          row.facilityId,

          'name'
        ) ||
        '-'
    },
    {
      key:
        'code',

      ...headerSearch('code'),

      title:
        <Translate>
          Code
        </Translate>,

      width:
        130,

      sortable:
        true
    },
    {
      key:
        'name',

      ...headerSearch('name'),

      title:
        <Translate>
          Name
        </Translate>,

      width:
        180,

      sortable:
        true
    },
    {
      key:
        'discountType',

      ...headerSelect('discountType', discountTypeOptions ?? []),

      title:
        <Translate>
          Discount Type
        </Translate>,

      width:
        160,

      sortable:
        true,

      render: (
        row:
          Discount
      ) =>
        row.discountType
          ? formatEnumString(
              row.discountType
            )
          : '-'
    },
    {
      key:
        'value',

      ...headerSearch('value', 'Value'),

      title:
        <Translate>
          Discount Value
        </Translate>,

      width:
        130,

      render: (
        row:
          Discount
      ) => {
        if (
          row.discountType ===
            'PERCENTAGE'
        ) {
          return `${row.percentage ?? 0}%`;
        }

        return `${row.fixedAmount ?? 0} ${row.currency ?? ''}`.trim();
      }
    },
    {
      key:
        'applicableOn',

      ...headerSelect('applicableOn', applicableOnOptions ?? []),

      title:
        <Translate>
          Applicable On
        </Translate>,

      width:
        170,

      sortable:
        true,

      render: (
        row:
          Discount
      ) =>
        row.applicableOn
          ? formatEnumString(
              row.applicableOn
            )
          : '-'
    },
    {
      key:
        'requiresApproval',

      ...headerSelect('requiresApproval', [
        { label: 'Required', value: 'true' },
        { label: 'No', value: 'false' }
      ]),

      title:
        <Translate>
          Approval
        </Translate>,

      width:
        120,

      align:
        'center' as const,

      render: (
        row:
          Discount
      ) => (
        <MyBadgeStatus
          contant={
            row.requiresApproval
              ? 'Required'
              : 'No'
          }
          color={
            row.requiresApproval
              ? '#415be7'
              : '#b1acac'
          }
        />
      )
    },
    {
      key:
        'isDefault',

      ...headerSelect('isDefault', [
        { label: 'Default', value: 'true' },
        { label: 'No', value: 'false' }
      ]),

      title:
        <Translate>
          Default
        </Translate>,

      width:
        110,

      align:
        'center' as const,

      render: (
        row:
          Discount
      ) => (
        <MyBadgeStatus
          contant={
            row.isDefault
              ? 'Default'
              : 'No'
          }
          color={
            row.isDefault
              ? '#415be7'
              : '#b1acac'
          }
        />
      )
    },
    {
      key:
        'active',

      searchable: true,
      searchType: 'select' as const,
      searchOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'All', value: 'all' }
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) => setStatusFilter(value as 'active' | 'inactive' | 'all'),

      title:
        <Translate>
          Active
        </Translate>,

      width:
        120,

      align:
        'center' as const,

      render: (
        row:
          Discount
      ) => (
        <MyBadgeStatus
          contant={
            row.active
              ? 'Active'
              : 'Inactive'
          }
          color={
            row.active
              ? '#415be7'
              : '#b1acac'
          }
        />
      )
    },
    {
      key:
        'actions',

      title:
        <Translate>
          Actions
        </Translate>,

      width:
        185,

      align:
        'center' as const,

      render: (
        row:
          Discount
      ) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={23}
            fill="var(--primary-gray)"
            onClick={() =>
              handleEdit(
                row
              )
            }
          />

          {row.isDefault ? (
            <MdStar
              className="icons-style"
              title="Default Discount"
              size={24}
              fill="var(--deep-blue)"
            />
          ) : (
            <MdStarBorder
              className="icons-style"
              title={
                row.active
                  ? 'Set as Default'
                  : 'Activate discount first'
              }
              size={24}
              fill={
                row.active
                  ? 'var(--primary-gray)'
                  : '#b1acac'
              }
              onClick={() =>
                handleSetDefault(
                  row
                )
              }
            />
          )}

          {row.active ? (
            <MdToggleOn
              className="icons-style"
              title="Deactivate"
              size={28}
              fill="var(--deep-blue)"
              onClick={() =>
                handleActivationChange(
                  row
                )
              }
            />
          ) : (
            <MdToggleOff
              className="icons-style"
              title="Activate"
              size={28}
              fill="var(--primary-gray)"
              onClick={() =>
                handleActivationChange(
                  row
                )
              }
            />
          )}

          <MdDelete
            className="icons-style"
            title={
              row.active
                ? 'Deactivate discount before deleting'
                : 'Delete'
            }
            size={23}
            fill={
              row.active
                ? '#b1acac'
                : 'var(--primary-pink)'
            }
            onClick={() =>
              handleDeleteRequest(
                row
              )
            }
          />
        </div>
      )
    }
  ];

  const selectedRowClass = (
    row:
      Discount
  ) =>
    row?.id ===
    selectedDiscount?.id
      ? 'selected-row'
      : '';

  const direction =
    localStorage.getItem(
      'direction'
    ) ||
    'LTR';

  const dir =
    direction ===
      'RTL'
      ? 'rtl'
      : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        data={
          activeResponse.data
        }
        totalCount={
          activeResponse.totalCount
        }
        loading={
          isFetching ||
          isDeleting ||
          isChangingActivation ||
          isSettingDefault
        }
        columns={
          tableColumns
        }
        rowClassName={
          selectedRowClass
        }
        onRowClick={row =>
          setSelectedDiscount(
            row
          )
        }
        page={
          paginationParams.page
        }
        rowsPerPage={
          paginationParams.size
        }
        onPageChange={
          handlePageChange
        }
        onRowsPerPageChange={
          handleRowsPerPageChange
        }
        sortColumn={
          sortColumn
        }
        sortType={
          sortType
        }
        onSortChange={
          handleSortChange
        }
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => (
                <AddOutlineIcon />
              )}
              color="var(--deep-blue)"
              onClick={
                handleNew
              }
              width="125px"
              disabled={
                !facilityId
              }
            >
              Add New
            </MyButton>
          </div>
        }
      />

      <AddEditDiscount
        open={
          modalOpen
        }
        setOpen={
          setModalOpen
        }
        width={
          width
        }
        discount={
          selectedDiscount
        }
        setDiscount={
          setSelectedDiscount
        }
        onSaveSuccess={
          handleSaveSuccess
        }
      />

      <DeletionConfirmationModal
        open={
          deleteConfirmationOpen
        }
        setOpen={
          setDeleteConfirmationOpen
        }
        itemToDelete="Discount"
        actionButtonFunction={
          handleDelete
        }
        actionType="delete"
      />
    </Panel>
  );
};

export default DiscountSetup;