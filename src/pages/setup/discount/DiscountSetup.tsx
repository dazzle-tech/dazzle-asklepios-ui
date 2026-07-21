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
  MdStar,
  MdStarBorder,
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
  useChangeDiscountActivationStatusMutation,
  useDeleteDiscountMutation,
  useGetDiscountsByApplicableOnQuery,
  useGetDiscountsByCodeQuery,
  useGetDiscountsByFacilityQuery,
  useGetDiscountsByNameQuery,
  useGetDiscountsByTypeQuery,
  useSetDefaultDiscountMutation
} from '@/services/billing/discountService';

import type {
  Discount,
  DiscountApplicableOn,
  DiscountType
} from '@/types/model-types-new';

import {
  newDiscount
} from '@/types/model-types-constructor-new';

import AddEditDiscount from './AddEditDiscount';

import {
  extractDiscountErrorMessage
} from './discountErrorHandler';

import './styles.less';

type FilterCriteria =
  | ''
  | 'code'
  | 'name'
  | 'discountType'
  | 'applicableOn';

type DiscountFilter = {
  criteria:
    FilterCriteria;

  textValue:
    string;

  discountType:
    DiscountType | '';

  applicableOn:
    DiscountApplicableOn | '';
};

const filterCriteriaOptions = [
  {
    label:
      'Code',

    value:
      'code'
  },
  {
    label:
      'Name',

    value:
      'name'
  },
  {
    label:
      'Discount Type',

    value:
      'discountType'
  },
  {
    label:
      'Applicable On',

    value:
      'applicableOn'
  }
];

const initialDiscountFilter:
DiscountFilter = {
  criteria:
    '',

  textValue:
    '',

  discountType:
    '',

  applicableOn:
    ''
};

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

  const [
    discountFilter,
    setDiscountFilter
  ] =
    useState<DiscountFilter>({
      ...initialDiscountFilter
    });

  const [
    appliedDiscountFilter,
    setAppliedDiscountFilter
  ] =
    useState<DiscountFilter>({
      ...initialDiscountFilter
    });

  const hasCodeFilter =
    appliedDiscountFilter.criteria ===
      'code' &&
    Boolean(
      appliedDiscountFilter
        .textValue
        .trim()
    );

  const hasNameFilter =
    appliedDiscountFilter.criteria ===
      'name' &&
    Boolean(
      appliedDiscountFilter
        .textValue
        .trim()
    );

  const hasTypeFilter =
    appliedDiscountFilter.criteria ===
      'discountType' &&
    Boolean(
      appliedDiscountFilter
        .discountType
    );

  const hasApplicableOnFilter =
    appliedDiscountFilter.criteria ===
      'applicableOn' &&
    Boolean(
      appliedDiscountFilter
        .applicableOn
    );

  const hasAnyFilter =
    hasCodeFilter ||
    hasNameFilter ||
    hasTypeFilter ||
    hasApplicableOnFilter;

  const allDiscountsQuery =
    useGetDiscountsByFacilityQuery(
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
          hasAnyFilter
      }
    );

  const discountsByCodeQuery =
    useGetDiscountsByCodeQuery(
      {
        facilityId:
          facilityId as number,

        value:
          appliedDiscountFilter
            .textValue,

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
          !hasCodeFilter
      }
    );

  const discountsByNameQuery =
    useGetDiscountsByNameQuery(
      {
        facilityId:
          facilityId as number,

        value:
          appliedDiscountFilter
            .textValue,

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
          !hasNameFilter
      }
    );

  const discountsByTypeQuery =
    useGetDiscountsByTypeQuery(
      {
        facilityId:
          facilityId as number,

        discountType:
          appliedDiscountFilter
            .discountType as
            DiscountType,

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
          !hasTypeFilter
      }
    );

  const discountsByApplicableOnQuery =
    useGetDiscountsByApplicableOnQuery(
      {
        facilityId:
          facilityId as number,

        applicableOn:
          appliedDiscountFilter
            .applicableOn as
            DiscountApplicableOn,

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
          !hasApplicableOnFilter
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

  const activeResponse =
    useMemo(() => {
      if (
        hasCodeFilter
      ) {
        return {
          data:
            discountsByCodeQuery
              .data?.data ??
            [],

          totalCount:
            discountsByCodeQuery
              .data
              ?.totalCount ??
            0
        };
      }

      if (
        hasNameFilter
      ) {
        return {
          data:
            discountsByNameQuery
              .data?.data ??
            [],

          totalCount:
            discountsByNameQuery
              .data
              ?.totalCount ??
            0
        };
      }

      if (
        hasTypeFilter
      ) {
        return {
          data:
            discountsByTypeQuery
              .data?.data ??
            [],

          totalCount:
            discountsByTypeQuery
              .data
              ?.totalCount ??
            0
        };
      }

      if (
        hasApplicableOnFilter
      ) {
        return {
          data:
            discountsByApplicableOnQuery
              .data?.data ??
            [],

          totalCount:
            discountsByApplicableOnQuery
              .data
              ?.totalCount ??
            0
        };
      }

      return {
        data:
          allDiscountsQuery
            .data?.data ??
          [],

        totalCount:
          allDiscountsQuery
            .data
            ?.totalCount ??
          0
      };
    }, [
      hasCodeFilter,
      hasNameFilter,
      hasTypeFilter,
      hasApplicableOnFilter,
      discountsByCodeQuery.data,
      discountsByNameQuery.data,
      discountsByTypeQuery.data,
      discountsByApplicableOnQuery.data,
      allDiscountsQuery.data
    ]);

  const isFetching =
    allDiscountsQuery
      .isFetching ||
    discountsByCodeQuery
      .isFetching ||
    discountsByNameQuery
      .isFetching ||
    discountsByTypeQuery
      .isFetching ||
    discountsByApplicableOnQuery
      .isFetching;

  const activeQueryError =
    hasCodeFilter
      ? discountsByCodeQuery.error
      : hasNameFilter
        ? discountsByNameQuery.error
        : hasTypeFilter
          ? discountsByTypeQuery.error
          : hasApplicableOnFilter
            ? discountsByApplicableOnQuery.error
            : allDiscountsQuery.error;

  const refetchActiveQuery =
    async () => {
      if (
        hasCodeFilter
      ) {
        await discountsByCodeQuery
          .refetch();

        return;
      }

      if (
        hasNameFilter
      ) {
        await discountsByNameQuery
          .refetch();

        return;
      }

      if (
        hasTypeFilter
      ) {
        await discountsByTypeQuery
          .refetch();

        return;
      }

      if (
        hasApplicableOnFilter
      ) {
        await discountsByApplicableOnQuery
          .refetch();

        return;
      }

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

  useEffect(() => {
    setDiscountFilter({
      ...initialDiscountFilter
    });

    setAppliedDiscountFilter({
      ...initialDiscountFilter
    });

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

  const handleResetFilter =
    () => {
      setDiscountFilter({
        ...initialDiscountFilter
      });

      setAppliedDiscountFilter({
        ...initialDiscountFilter
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
        textValue,
        discountType,
        applicableOn
      } =
        discountFilter;

      const valid =
        (
          (
            criteria ===
              'code' ||
            criteria ===
              'name'
          ) &&
          Boolean(
            textValue.trim()
          )
        ) ||
        (
          criteria ===
            'discountType' &&
          Boolean(
            discountType
          )
        ) ||
        (
          criteria ===
            'applicableOn' &&
          Boolean(
            applicableOn
          )
        );

      if (!valid) {
        dispatch(
          notify({
            msg:
              'Please complete the selected filter.',

            sev:
              'warning'
          })
        );

        return;
      }

      setAppliedDiscountFilter({
        criteria,

        textValue:
          textValue.trim(),

        discountType,

        applicableOn
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

      title:
        <Translate>
          Code
        </Translate>,

      flexGrow:
        2,

      sortable:
        true
    },
    {
      key:
        'name',

      title:
        <Translate>
          Name
        </Translate>,

      flexGrow:
        3,

      sortable:
        true
    },
    {
      key:
        'discountType',

      title:
        <Translate>
          Discount Type
        </Translate>,

      flexGrow:
        2,

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

      title:
        <Translate>
          Discount Value
        </Translate>,

      flexGrow:
        2,

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

      title:
        <Translate>
          Applicable On
        </Translate>,

      flexGrow:
        2,

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

      title:
        <Translate>
          Approval
        </Translate>,

      width:
        100,

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

      title:
        <Translate>
          Default
        </Translate>,

      width:
        95,

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

      title:
        <Translate>
          Active
        </Translate>,

      width:
        95,

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
            discountFilter
          }
          setRecord={(
            updated:
              any
          ) => {
            const next =
              typeof updated ===
              'function'
                ? updated(
                    discountFilter
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

            setDiscountFilter({
              ...initialDiscountFilter,

              criteria:
                nextCriteria
            });
          }}
          showLabel={false}
          placeholder="Select Criteria"
          searchable={false}
        />

        {(
          discountFilter.criteria ===
            'code' ||
          discountFilter.criteria ===
            'name'
        ) && (
          <MyInput
            width="240px"
            fieldName="textValue"
            record={
              discountFilter
            }
            setRecord={
              setDiscountFilter
            }
            showLabel={false}
            placeholder={
              discountFilter.criteria ===
                'code'
                ? 'Enter Discount Code'
                : 'Enter Discount Name'
            }
          />
        )}

        {discountFilter.criteria ===
          'discountType' && (
          <MyInput
            width="220px"
            fieldName="discountType"
            fieldType="select"
            selectData={
              discountTypeOptions
            }
            selectDataLabel="label"
            selectDataValue="value"
            record={
              discountFilter
            }
            setRecord={
              setDiscountFilter
            }
            showLabel={false}
            placeholder="Select Discount Type"
            searchable={false}
          />
        )}

        {discountFilter.criteria ===
          'applicableOn' && (
          <MyInput
            width="220px"
            fieldName="applicableOn"
            fieldType="select"
            selectData={
              applicableOnOptions
            }
            selectDataLabel="label"
            selectDataValue="value"
            record={
              discountFilter
            }
            setRecord={
              setDiscountFilter
            }
            showLabel={false}
            placeholder="Select Applicable On"
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