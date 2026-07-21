// src/pages/setup/BillingConfiguration/BillingConfigurationSetup.tsx

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Form,
  Panel
} from 'rsuite';

import {
  MdDelete,
  MdModeEdit,
  MdToggleOff,
  MdToggleOn
} from 'react-icons/md';

import AddOutlineIcon from '@rsuite/icons/AddOutline';

import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
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
  useChangeBillingConfigurationActivationStatusMutation,
  useDeleteBillingConfigurationMutation,
  useGetBillingConfigurationByFacilityAndKeyQuery,
  useGetBillingConfigurationsByFacilityQuery,
  useGetBillingConfigurationsByStatusQuery
} from '@/services/billing/billingConfigurationService';

import type {
  BillingConfiguration,
  BillingConfigurationKey,
  BillingConfigurationStatus
} from '@/types/model-types-new';

import {
  newBillingConfiguration
} from '@/types/model-types-constructor-new';

import AddEditBillingConfiguration from './AddEditBillingConfiguration';

import './styles.less';

type FilterCriteria =
  | ''
  | 'configurationKey'
  | 'status';

type BillingConfigurationFilter = {
  criteria: FilterCriteria;

  configurationKey:
    BillingConfigurationKey | '';

  status:
    BillingConfigurationStatus | '';
};

const filterCriteriaOptions = [
  {
    label:
      'Configuration Key',

    value:
      'configurationKey'
  },
  {
    label:
      'Status',

    value:
      'status'
  }
];

const initialBillingConfigurationFilter:
BillingConfigurationFilter = {
  criteria:
    '',

  configurationKey:
    '',

  status:
    ''
};

const BillingConfigurationSetup:
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

  const configurationKeyOptions =
    useEnumOptions(
      'BillingConfigurationKey'
    );

  const statusOptions =
    useEnumOptions(
      'BillingConfigurationStatus'
    );

  const [
    selectedConfiguration,
    setSelectedConfiguration
  ] =
    useState<
      BillingConfiguration
    >({
      ...newBillingConfiguration
    });

  const [
    modalOpen,
    setModalOpen
  ] =
    useState(false);

  const [
    deleteConfirmationOpen,
    setDeleteConfirmationOpen
  ] =
    useState(false);

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

  const [
    billingConfigurationFilter,
    setBillingConfigurationFilter
  ] =
    useState<
      BillingConfigurationFilter
    >({
      ...initialBillingConfigurationFilter
    });

  const [
    appliedBillingConfigurationFilter,
    setAppliedBillingConfigurationFilter
  ] =
    useState<
      BillingConfigurationFilter
    >({
      ...initialBillingConfigurationFilter
    });

  const hasConfigurationKeyFilter =
    appliedBillingConfigurationFilter
      .criteria ===
      'configurationKey' &&
    Boolean(
      appliedBillingConfigurationFilter
        .configurationKey
    );

  const hasStatusFilter =
    appliedBillingConfigurationFilter
      .criteria ===
      'status' &&
    Boolean(
      appliedBillingConfigurationFilter
        .status
    );

  /*
   * Default paginated query.
   */
  const allConfigurationsQuery =
    useGetBillingConfigurationsByFacilityQuery(
      {
        facilityId:
          facilityId as number,

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
          !facilityId ||
          hasConfigurationKeyFilter ||
          hasStatusFilter
      }
    );

  /*
   * Paginated status query.
   */
  const configurationsByStatusQuery =
    useGetBillingConfigurationsByStatusQuery(
      {
        facilityId:
          facilityId as number,

        status:
          appliedBillingConfigurationFilter
            .status as
            BillingConfigurationStatus,

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
          !facilityId ||
          !hasStatusFilter
      }
    );

  /*
   * Configuration Key is unique per facility, so this endpoint returns
   * one record instead of a paginated list.
   */
  const configurationByKeyQuery =
    useGetBillingConfigurationByFacilityAndKeyQuery(
      {
        facilityId:
          facilityId as number,

        configurationKey:
          appliedBillingConfigurationFilter
            .configurationKey as
            BillingConfigurationKey
      },
      {
        skip:
          !facilityId ||
          !hasConfigurationKeyFilter
      }
    );

  const {
    data:
      facilityListResponse
  } =
    useGetAllFacilitiesQuery({});

  const [
    deleteBillingConfiguration,
    {
      isLoading:
        isDeleting
    }
  ] =
    useDeleteBillingConfigurationMutation();

  const [
    changeActivationStatus,
    {
      isLoading:
        isChangingActivation
    }
  ] =
    useChangeBillingConfigurationActivationStatusMutation();

  /*
   * Choose the currently active query response.
   */
  const activeResponse =
    useMemo(() => {
      if (
        hasConfigurationKeyFilter
      ) {
        return {
          data:
            configurationByKeyQuery
              .data
              ? [
                  configurationByKeyQuery
                    .data
                ]
              : [],

          totalCount:
            configurationByKeyQuery
              .data
              ? 1
              : 0
        };
      }

      if (
        hasStatusFilter
      ) {
        return {
          data:
            configurationsByStatusQuery
              .data?.data ??
            [],

          totalCount:
            configurationsByStatusQuery
              .data?.totalCount ??
            0
        };
      }

      return {
        data:
          allConfigurationsQuery
            .data?.data ??
          [],

        totalCount:
          allConfigurationsQuery
            .data?.totalCount ??
          0
      };
    }, [
      hasConfigurationKeyFilter,
      hasStatusFilter,
      configurationByKeyQuery.data,
      configurationsByStatusQuery.data,
      allConfigurationsQuery.data
    ]);

  const isFetching =
    allConfigurationsQuery
      .isFetching ||
    configurationsByStatusQuery
      .isFetching ||
    configurationByKeyQuery
      .isFetching;

  const refetchActiveQuery =
    async () => {
      if (
        hasConfigurationKeyFilter
      ) {
        await configurationByKeyQuery
          .refetch();

        return;
      }

      if (
        hasStatusFilter
      ) {
        await configurationsByStatusQuery
          .refetch();

        return;
      }

      await allConfigurationsQuery
        .refetch();
    };

  useEffect(() => {
    dispatch(
      setPageCode(
        'BillingConfigurationSetup'
      )
    );

    dispatch(
      setDivContent(
        'Billing Configuration'
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
  }, [dispatch]);

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

  useEffect(() => {
    setPaginationParams(
      previous => ({
        ...previous,

        page:
          0,

        timestamp:
          Date.now()
      })
    );

    setBillingConfigurationFilter({
      ...initialBillingConfigurationFilter
    });

    setAppliedBillingConfigurationFilter({
      ...initialBillingConfigurationFilter
    });
  }, [facilityId]);

  const handleResetFilter =
    () => {
      setBillingConfigurationFilter({
        ...initialBillingConfigurationFilter
      });

      setAppliedBillingConfigurationFilter({
        ...initialBillingConfigurationFilter
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
    };

  const handleSearch =
    () => {
      const {
        criteria,
        configurationKey,
        status
      } =
        billingConfigurationFilter;

      const isInvalidConfigurationKeyFilter =
        criteria ===
          'configurationKey' &&
        !configurationKey;

      const isInvalidStatusFilter =
        criteria ===
          'status' &&
        !status;

      if (
        !criteria ||
        isInvalidConfigurationKeyFilter ||
        isInvalidStatusFilter
      ) {
        handleResetFilter();

        return;
      }

      setAppliedBillingConfigurationFilter({
        criteria,

        configurationKey,

        status
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
    };

  const handleNew =
    () => {
      setSelectedConfiguration({
        ...newBillingConfiguration,

        facilityId,

        valueType:
          'STRING',

        configurationValue:
          '',

        active:
          true,

        status:
          'DRAFT'
      });

      setModalOpen(true);
    };

  const handleEdit = (
    row:
      BillingConfiguration
  ) => {
    setSelectedConfiguration({
      ...row
    });

    setModalOpen(true);
  };

  const handleDeleteRequest = (
    row:
      BillingConfiguration
  ) => {
    setSelectedConfiguration({
      ...row
    });

    setDeleteConfirmationOpen(
      true
    );
  };

  const handleDelete =
    async () => {
      if (
        !selectedConfiguration
          .id
      ) {
        return;
      }

      try {
        await deleteBillingConfiguration({
          id:
            selectedConfiguration
              .id
        }).unwrap();

        dispatch(
          notify({
            msg:
              'Billing configuration deleted successfully',

            sev:
              'success'
          })
        );

        setDeleteConfirmationOpen(
          false
        );

        setSelectedConfiguration({
          ...newBillingConfiguration
        });

        await refetchActiveQuery();
      } catch (
        error: any
      ) {
        dispatch(
          notify({
            msg:
              error?.data
                ?.detail ||
              error?.data
                ?.title ||
              error?.data
                ?.message ||
              'Failed to delete billing configuration',

            sev:
              'error'
          })
        );
      }
    };

  const handleActivationChange =
    async (
      row:
        BillingConfiguration
    ) => {
      if (!row.id) {
        return;
      }

      try {
        await changeActivationStatus({
          id:
            row.id,

          active:
            !Boolean(
              row.active
            )
        }).unwrap();

        dispatch(
          notify({
            msg:
              row.active
                ? 'Billing configuration deactivated successfully'
                : 'Billing configuration activated successfully',

            sev:
              'success'
          })
        );

        await refetchActiveQuery();
      } catch (
        error: any
      ) {
        dispatch(
          notify({
            msg:
              error?.data
                ?.detail ||
              error?.data
                ?.title ||
              error?.data
                ?.message ||
              'Failed to update activation status',

            sev:
              'error'
          })
        );
      }
    };

  const handleSaveSuccess =
    async () => {
      setModalOpen(false);

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
    _event: unknown,
    newPage: number
  ) => {
    /*
     * Configuration Key returns a single unique record,
     * so pagination is not needed for this filter.
     */
    if (
      hasConfigurationKeyFilter
    ) {
      return;
    }

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
    if (
      hasConfigurationKeyFilter
    ) {
      return;
    }

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
    column: string,
    type:
      'asc' | 'desc'
  ) => {
    setSortColumn(column);

    setSortType(type);

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
        3,

      render: (
        row:
          BillingConfiguration
      ) =>
        conjureValueBasedOnIDFromList(
          facilityListResponse ??
            [],
          row.facilityId,
          'name'
        )
    },
    {
      key:
        'configurationKey',

      title:
        <Translate>
          Configuration Key
        </Translate>,

      flexGrow:
        4,

      sortable:
        true,

      render: (
        row:
          BillingConfiguration
      ) =>
        row.configurationKey
          ? formatEnumString(
              row.configurationKey
            )
          : '-'
    },
    {
      key:
        'valueType',

      title:
        <Translate>
          Value Type
        </Translate>,

      flexGrow:
        2,

      sortable:
        true,

      render: (
        row:
          BillingConfiguration
      ) =>
        row.valueType
          ? formatEnumString(
              row.valueType
            )
          : '-'
    },
    {
      key:
        'configurationValue',

      title:
        <Translate>
          Default Value
        </Translate>,

      flexGrow:
        3,

      render: (
        row:
          BillingConfiguration
      ) => {
        if (
          row.valueType ===
          'BOOLEAN'
        ) {
          const isTrue =
            String(
              row.configurationValue
            ).toLowerCase() ===
            'true';

          return (
            <MyBadgeStatus
              contant={
                isTrue
                  ? 'True'
                  : 'False'
              }
              color={
                isTrue
                  ? '#415be7'
                  : '#b1acac'
              }
            />
          );
        }

        if (
          row.valueType ===
          'JSON'
        ) {
          return (
            <span
              title={
                row.configurationValue
              }
              className="billing-configuration-value"
            >
              {
                row.configurationValue
              }
            </span>
          );
        }

        return (
          row.configurationValue ??
          '-'
        );
      }
    },
    {
      key:
        'status',

      title:
        <Translate>
          Status
        </Translate>,

      width:
        110,

      sortable:
        true,

      render: (
        row:
          BillingConfiguration
      ) => (
        <MyBadgeStatus
          contant={
            row.status
              ? formatEnumString(
                  row.status
                )
              : 'Draft'
          }
          color={
            row.status ===
            'ACTIVE'
              ? '#415be7'
              : row.status ===
                  'INACTIVE'
                ? '#d9534f'
                : '#b1acac'
          }
        />
      )
    },
    {
      key:
        'active',

      title:
        <Translate>
          Active
        </Translate>,

      width:
        90,

      align:
        'center' as const,

      render: (
        row:
          BillingConfiguration
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
        150,

      align:
        'center' as const,

      render: (
        row:
          BillingConfiguration
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
            title="Delete"
            size={23}
            fill="var(--primary-pink)"
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

  const filters =
    () => (
      <Form
        fluid
        className="form-of-filters-set-up"
      >
        <MyInput
          width="190px"
          fieldName="criteria"
          fieldType="select"
          selectData={
            filterCriteriaOptions
          }
          selectDataLabel="label"
          selectDataValue="value"
          record={
            billingConfigurationFilter
          }
          setRecord={(
            updated: any
          ) => {
            const next =
              typeof updated ===
              'function'
                ? updated(
                    billingConfigurationFilter
                  )
                : updated;

            const nextCriteria =
              (
                next?.criteria ??
                ''
              ) as
                FilterCriteria;

            if (!nextCriteria) {
              handleResetFilter();

              return;
            }

            setBillingConfigurationFilter({
              criteria:
                nextCriteria,

              configurationKey:
                '',

              status:
                ''
            });
          }}
          showLabel={false}
          placeholder="Select Criteria"
          searchable={false}
        />

        {billingConfigurationFilter
          .criteria ===
          'configurationKey' && (
          <MyInput
            width="290px"
            fieldName="configurationKey"
            fieldType="select"
            selectData={
              configurationKeyOptions
            }
            selectDataLabel="label"
            selectDataValue="value"
            record={
              billingConfigurationFilter
            }
            setRecord={(
              updated: any
            ) => {
              const next =
                typeof updated ===
                'function'
                  ? updated(
                      billingConfigurationFilter
                    )
                  : updated;

              const nextValue =
                (
                  next
                    ?.configurationKey ??
                  ''
                ) as
                  BillingConfigurationKey
                  | '';

              if (!nextValue) {
                handleResetFilter();

                return;
              }

              setBillingConfigurationFilter(
                previous => ({
                  ...previous,

                  configurationKey:
                    nextValue
                })
              );
            }}
            showLabel={false}
            placeholder="Select Configuration Key"
            searchable
          />
        )}

        {billingConfigurationFilter
          .criteria ===
          'status' && (
          <MyInput
            width="220px"
            fieldName="status"
            fieldType="select"
            selectData={
              statusOptions
            }
            selectDataLabel="label"
            selectDataValue="value"
            record={
              billingConfigurationFilter
            }
            setRecord={(
              updated: any
            ) => {
              const next =
                typeof updated ===
                'function'
                  ? updated(
                      billingConfigurationFilter
                    )
                  : updated;

              const nextStatus =
                (
                  next?.status ??
                  ''
                ) as
                  BillingConfigurationStatus
                  | '';

              if (!nextStatus) {
                handleResetFilter();

                return;
              }

              setBillingConfigurationFilter(
                previous => ({
                  ...previous,

                  status:
                    nextStatus
                })
              );
            }}
            showLabel={false}
            placeholder="Select Status"
            searchable={false}
          />
        )}

        <MyButton
          color="var(--deep-blue)"
          onClick={
            handleSearch
          }
          width="80px"
        >
          Search
        </MyButton>

        <MyButton
          color="var(--primary-gray)"
          onClick={
            handleResetFilter
          }
          width="80px"
        >
          Clear
        </MyButton>
      </Form>
    );

  const selectedRowClass = (
    row:
      BillingConfiguration
  ) =>
    row?.id ===
    selectedConfiguration?.id
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
          isChangingActivation
        }
        columns={
          tableColumns
        }
        rowClassName={
          selectedRowClass
        }
        onRowClick={row =>
          setSelectedConfiguration(
            row
          )
        }
        filters={
          filters()
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

      <AddEditBillingConfiguration
        open={
          modalOpen
        }
        setOpen={
          setModalOpen
        }
        width={
          width
        }
        billingConfiguration={
          selectedConfiguration
        }
        setBillingConfiguration={
          setSelectedConfiguration
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
        itemToDelete={
          'Billing Configuration'
        }
        actionButtonFunction={
          handleDelete
        }
        actionType="delete"
      />
    </Panel>
  );
};

export default BillingConfigurationSetup;