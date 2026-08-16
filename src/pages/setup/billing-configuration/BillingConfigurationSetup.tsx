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

import {
  extractBillingConfigurationErrorMessage
} from './billingConfigurationErrorHandler';

import './styles.less';

type FilterCriteria =
  | ''
  | 'configurationKey'
  | 'status';

type BillingConfigurationFilter = {
  criteria:
    FilterCriteria;

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

  const activeQueryError =
    hasConfigurationKeyFilter
      ? configurationByKeyQuery.error
      : hasStatusFilter
        ? configurationsByStatusQuery.error
        : allConfigurationsQuery.error;

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

    setSelectedConfiguration({
      ...newBillingConfiguration
    });
  }, [
    facilityId
  ]);

  /*
   * Handle errors returned from list/filter queries.
   */
  useEffect(() => {
    if (
      !activeQueryError
    ) {
      return;
    }

    dispatch(
      notify({
        msg:
          extractBillingConfigurationErrorMessage(
            activeQueryError,
            'Failed to load billing configurations.'
          ),

        sev:
          'error'
      })
    );
  }, [
    activeQueryError,
    dispatch
  ]);

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
        !criteria
      ) {
        dispatch(
          notify({
            msg:
              'Please select filter criteria.',

            sev:
              'warning'
          })
        );

        return;
      }

      if (
        isInvalidConfigurationKeyFilter
      ) {
        dispatch(
          notify({
            msg:
              'Please select a configuration key.',

            sev:
              'warning'
          })
        );

        return;
      }

      if (
        isInvalidStatusFilter
      ) {
        dispatch(
          notify({
            msg:
              'Please select a status.',

            sev:
              'warning'
          })
        );

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
      if (
        !facilityId
      ) {
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

      setSelectedConfiguration({
        ...newBillingConfiguration,

        facilityId,

        valueType:
          'STRING',

        configurationValue:
          '',

        enumCode:
          null,

        active:
          true,

        status:
          'DRAFT'
      });

      setModalOpen(
        true
      );
    };

  const handleEdit = (
    row:
      BillingConfiguration
  ) => {
    setSelectedConfiguration({
      ...row
    });

    setModalOpen(
      true
    );
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
        dispatch(
          notify({
            msg:
              'Billing configuration ID is missing.',

            sev:
              'warning'
          })
        );

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
        error:
          any
      ) {
        dispatch(
          notify({
            msg:
              extractBillingConfigurationErrorMessage(
                error,
                'Failed to delete billing configuration.'
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
        BillingConfiguration
    ) => {
      if (
        !row.id
      ) {
        dispatch(
          notify({
            msg:
              'Billing configuration ID is missing.',

            sev:
              'warning'
          })
        );

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
                ? 'Billing configuration activated successfully'
                : 'Billing configuration deactivated successfully',

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
              extractBillingConfigurationErrorMessage(
                error,

                nextActive
                  ? 'Failed to activate billing configuration.'
                  : 'Failed to deactivate billing configuration.'
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

      setSelectedConfiguration({
        ...newBillingConfiguration
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

      try {
        await refetchActiveQuery();
      } catch (
        error:
          any
      ) {
        dispatch(
          notify({
            msg:
              extractBillingConfigurationErrorMessage(
                error,
                'Billing configuration was saved, but the list could not be refreshed.'
              ),

            sev:
              'error'
          })
        );
      }
    };

  const handlePageChange = (
    _event:
      unknown,

    newPage:
      number
  ) => {
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

    if (
      !Number.isFinite(
        newSize
      ) ||
      newSize <=
        0
    ) {
      dispatch(
        notify({
          msg:
            'Invalid rows per page value.',

          sev:
            'warning'
        })
      );

      return;
    }

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
        ) ||
        '-'
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
        'enumCode',

      title:
        <Translate>
          Enum Type
        </Translate>,

      flexGrow:
        3,

      render: (
        row:
          BillingConfiguration
      ) =>
        row.valueType ===
          'ENUM'
          ? (
              row.enumCode
                ? formatEnumString(
                    row.enumCode
                  )
                : '-'
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
                String(
                  row.configurationValue ??
                    ''
                )
              }
              className="billing-configuration-value"
            >
              {
                row.configurationValue ||
                '-'
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
              handleEdit(
                row
              )
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
            title={
              row.status ===
                'ACTIVE'
                ? 'Active configuration cannot be deleted'
                : 'Delete'
            }
            size={23}
            fill={
              row.status ===
                'ACTIVE'
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
            updated:
              any
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

            if (
              !nextCriteria
            ) {
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
              updated:
                any
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
              updated:
                any
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
        itemToDelete="Billing Configuration"
        actionButtonFunction={
          handleDelete
        }
        actionType="delete"
      />
    </Panel>
  );
};

export default BillingConfigurationSetup;