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
  useGetDiscountsByFacilityQuery,
  useLazyGetDiscountsByActiveQuery,
  useLazyGetDiscountsByApplicableOnQuery,
  useLazyGetDiscountsByCodeQuery,
  useLazyGetDiscountsByDefaultQuery,
  useLazyGetDiscountsByNameQuery,
  useLazyGetDiscountsByRequiresApprovalQuery,
  useLazyGetDiscountsByTypeQuery,
  useLazyGetDiscountsByValueQuery,
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

type FilterState = {
  filter: string;
  value: any;
};

const initialFilterState: FilterState = {
  filter: '',
  value: ''
};

const filterFields = [
  { label: 'Code', value: 'code' },
  { label: 'Name', value: 'name' },
  { label: 'Discount Type', value: 'discountType' },
  { label: 'Discount Value', value: 'value' },
  { label: 'Applicable On', value: 'applicableOn' },
  { label: 'Approval', value: 'requiresApproval' },
  { label: 'Default', value: 'isDefault' },
  { label: 'Active', value: 'active' }
];

const isEmptyFilterValue = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '');

const toBoolean = (value: unknown) =>
  value === true || value === 'true';

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

  // Filter being edited in the filter bar, and the one the table currently shows
  const [recordOfFilter, setRecordOfFilter] =
    useState<FilterState>(initialFilterState);
  const [activeFilter, setActiveFilter] =
    useState<FilterState>(initialFilterState);
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<Discount[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Filtered pagination (independent state)
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const [fetchByCode] = useLazyGetDiscountsByCodeQuery();
  const [fetchByName] = useLazyGetDiscountsByNameQuery();
  const [fetchByType] = useLazyGetDiscountsByTypeQuery();
  const [fetchByValue] = useLazyGetDiscountsByValueQuery();
  const [fetchByApplicableOn] = useLazyGetDiscountsByApplicableOnQuery();
  const [fetchByRequiresApproval] = useLazyGetDiscountsByRequiresApprovalQuery();
  const [fetchByDefault] = useLazyGetDiscountsByDefaultQuery();
  const [fetchByActive] = useLazyGetDiscountsByActiveQuery();

  // Main list: all discounts of the facility
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
    () =>
      isFiltered
        ? { data: filteredData, totalCount: filteredTotal }
        : {
            data: allDiscountsQuery.data?.data ?? [],
            totalCount: allDiscountsQuery.data?.totalCount ?? 0
          },
    [isFiltered, filteredData, filteredTotal, allDiscountsQuery.data]
  );

  const isFetching = isFiltered
    ? isFilterLoading
    : allDiscountsQuery.isFetching;

  const activeQueryError = allDiscountsQuery.error;

  // ===== Filtering =====
  const runFilterQuery = async (
    fieldName: string,
    value: any,
    page: number,
    size: number,
    sort: string
  ) => {
    const params = { facilityId: facilityId as number, page, size, sort };

    if (fieldName === 'code') {
      return await fetchByCode({ ...params, value: String(value).trim() }).unwrap();
    } else if (fieldName === 'name') {
      return await fetchByName({ ...params, value: String(value).trim() }).unwrap();
    } else if (fieldName === 'discountType') {
      return await fetchByType({ ...params, discountType: value }).unwrap();
    } else if (fieldName === 'value') {
      return await fetchByValue({ ...params, value: Number(value) }).unwrap();
    } else if (fieldName === 'applicableOn') {
      return await fetchByApplicableOn({ ...params, applicableOn: value }).unwrap();
    } else if (fieldName === 'requiresApproval') {
      return await fetchByRequiresApproval({ ...params, value: toBoolean(value) }).unwrap();
    } else if (fieldName === 'isDefault') {
      return await fetchByDefault({ ...params, value: toBoolean(value) }).unwrap();
    } else if (fieldName === 'active') {
      return await fetchByActive({ ...params, value: toBoolean(value) }).unwrap();
    }

    return undefined;
  };

  // Reset to main list
  const resetToUnfiltered = () => {
    setIsFiltered(false);
    setActiveFilter(initialFilterState);
    setFilteredData([]);
    setFilteredTotal(0);
    setFilterPagination(previous => ({ ...previous, page: 0 }));
    setPaginationParams(previous => ({ ...previous, page: 0, timestamp: Date.now() }));
  };

  // Apply/Clear filters
  const handleFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort
  ) => {
    if (!facilityId) {
      return;
    }

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
      setFilterPagination(previous => ({ ...previous, page, size, sort }));
    } catch (error: any) {
      dispatch(
        notify({
          msg: extractDiscountErrorMessage(error, 'Failed to load discounts.'),
          sev: 'error'
        })
      );
    } finally {
      setIsFilterLoading(false);
    }
  };

  // Reload whatever the table shows after add/edit/delete/default/activation changes
  const refetchActiveQuery =
    async () => {
      if (isFiltered) {
        await handleFilterChange(
          activeFilter.filter,
          activeFilter.value,
          filterPagination.page
        );
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
    setRecordOfFilter(initialFilterState);
    setActiveFilter(initialFilterState);
    setIsFiltered(false);
    setFilteredData([]);
    setFilteredTotal(0);

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

  const handleSearch = () => {
    handleFilterChange(
      recordOfFilter.filter,
      recordOfFilter.value
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
    if (isFiltered) {
      handleFilterChange(
        activeFilter.filter,
        activeFilter.value,
        newPage
      );
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
    const newSize =
      Number(
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

    if (isFiltered) {
      handleFilterChange(
        activeFilter.filter,
        activeFilter.value,
        0,
        filterPagination.size,
        `${column},${type}`
      );
      return;
    }

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
      case 'discountType':
        return selectInput(discountTypeOptions ?? []);
      case 'applicableOn':
        return selectInput(applicableOnOptions ?? []);
      case 'requiresApproval':
        return selectInput([
          { label: 'Required', value: true },
          { label: 'No', value: false }
        ]);
      case 'isDefault':
        return selectInput([
          { label: 'Default', value: true },
          { label: 'No', value: false }
        ]);
      case 'active':
        return selectInput([
          { label: 'Active', value: true },
          { label: 'Inactive', value: false }
        ]);
      case 'value':
        return (
          <MyInput
            fieldName="value"
            fieldType="number"
            record={recordOfFilter}
            setRecord={setRecordOfFilter}
            showLabel={false}
            placeholder="Enter Value"
            width={220}
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

  const filters = () => (
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
          isFiltered
            ? filterPagination.page
            : paginationParams.page
        }
        rowsPerPage={
          isFiltered
            ? filterPagination.size
            : paginationParams.size
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