import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import { Form, Panel } from 'rsuite';

import {
  MdCheckCircle,
  MdDelete,
  MdList,
  MdModeEdit
} from 'react-icons/md';

import AddOutlineIcon from '@rsuite/icons/AddOutline';

import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import { useAppDispatch } from '@/hooks';

import {
  setDivContent,
  setPageCode
} from '@/reducers/divSlice';

import { notify } from '@/utils/uiReducerActions';

import {
  extractApiErrorMessage,
  PRICE_LIST_SETUP_ERROR_MAP
} from '@/utils/apiErrorMessage';

import {
  conjureValueBasedOnIDFromList,
  formatEnumString
} from '@/utils';

import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetAllNphiesPayersQuery } from '@/services/setup/payer/NphiesPayerSetupService';
import { useEnumOptions } from '@/services/enumsApi';

import {
  useActivatePriceListSetupMutation,
  useDeletePriceListSetupMutation,
  useGetPriceListSetupsQuery,
  useLazyGetPriceListSetupsByFacilityQuery,
  useLazyGetPriceListSetupsByNameQuery,
  useLazyGetPriceListSetupsByTypeQuery,
  useLazyGetPriceListSetupsByPayerQuery,
  useLazyGetPriceListSetupsByVersionQuery,
  useLazyGetPriceListSetupsByEffectiveFromQuery,
  useLazyGetPriceListSetupsByEffectiveToQuery,
  useLazyGetPriceListSetupsByCurrencyQuery,
  useLazyGetPriceListSetupsByStatusQuery
} from '@/services/setup/priceListSetup/priceListSetupService';

import type {
  PriceListSetup as PriceListSetupModel
} from '@/types/model-types-new';

import {
  newPriceListSetup
} from '@/types/model-types-constructor-new';

import AddEditPriceListSetup from './AddEditPriceListSetup';
import PriceListSetupItems from './PriceListSetupItems';

import './styles.less';

const PriceListSetup: React.FC = () => {
  const dispatch = useAppDispatch();

  const tenant = JSON.parse(
    localStorage.getItem('tenant') || 'null'
  );

  const selectedFacility =
    tenant?.selectedFacility || null;

  const facilityId: number | undefined =
    selectedFacility?.id;

  const [
    selectedPriceList,
    setSelectedPriceList
  ] = useState<PriceListSetupModel>({
    ...newPriceListSetup
  });

  const [
    headerModalOpen,
    setHeaderModalOpen
  ] = useState(false);

  const [
    itemsModalOpen,
    setItemsModalOpen
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
    data: priceListPage,
    isFetching,
    refetch
  } = useGetPriceListSetupsQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    timestamp: paginationParams.timestamp
  });

  const {
    data: facilityListResponse
  } = useGetAllFacilitiesQuery({});

  const {
    data: payerListResponse
  } = useGetAllNphiesPayersQuery({
    page: 0,
    size: 500,
    sort: 'nameEn,asc'
  });

  const [recordOfFilter, setRecordOfFilter] = useState({
    filter: '',
    value: ''
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<PriceListSetupModel[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const [getByFacility] = useLazyGetPriceListSetupsByFacilityQuery();
  const [getByName] = useLazyGetPriceListSetupsByNameQuery();
  const [getByType] = useLazyGetPriceListSetupsByTypeQuery();
  const [getByPayer] = useLazyGetPriceListSetupsByPayerQuery();
  const [getByVersion] = useLazyGetPriceListSetupsByVersionQuery();
  const [getByEffectiveFrom] = useLazyGetPriceListSetupsByEffectiveFromQuery();
  const [getByEffectiveTo] = useLazyGetPriceListSetupsByEffectiveToQuery();
  const [getByCurrency] = useLazyGetPriceListSetupsByCurrencyQuery();
  const [getByStatus] = useLazyGetPriceListSetupsByStatusQuery();

  const typeOptions = useEnumOptions('PriceListSetupType');
  const statusOptions = useEnumOptions('PriceListSetupStatus');
  const currencyOptions = useEnumOptions('Currency');

  const [
    deletePriceListSetup
  ] = useDeletePriceListSetupMutation();

  const [
    activatePriceListSetup
  ] = useActivatePriceListSetupMutation();

  const tableData = useMemo(
    () => priceListPage?.data ?? [],
    [priceListPage?.data]
  );

  const totalCount =
    priceListPage?.totalCount ?? 0;

  useEffect(() => {
    dispatch(setPageCode('PriceListSetup'));
    dispatch(setDivContent('Price List Setup'));

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

  // ──────────────────────────── FILTER LOGIC ────────────────────────────
  const filterFields = [
    { label: 'Facility', value: 'facility' },
    { label: 'Name', value: 'name' },
    { label: 'Type', value: 'type' },
    { label: 'Payer', value: 'payer' },
    { label: 'Version', value: 'version' },
    { label: 'Effective From', value: 'effectiveFrom' },
    { label: 'Effective To', value: 'effectiveTo' },
    { label: 'Currency', value: 'currency' },
    { label: 'Status', value: 'status' }
  ];

  const handleFilterChange = async (
    field: string,
    value: string,
    page = 0,
    size?: number
  ) => {
    try {
      if (!field || value === '' || value == null) {
        setIsFiltered(false);
        setFilteredList([]);
        return;
      }

      const currentSize = size ?? filterPagination.size;

      let response;
      const params = {
        page,
        size: currentSize,
        sort: filterPagination.sort
      };

      if (field === 'facility') {
        response = await getByFacility({ facilityId: value, ...params }).unwrap();
      } else if (field === 'name') {
        response = await getByName({ name: value, ...params }).unwrap();
      } else if (field === 'type') {
        response = await getByType({ type: value, ...params }).unwrap();
      } else if (field === 'payer') {
        response = await getByPayer({ payerId: value, ...params }).unwrap();
      } else if (field === 'version') {
        response = await getByVersion({ versionNumber: value, ...params }).unwrap();
      } else if (field === 'effectiveFrom') {
        response = await getByEffectiveFrom({ effectiveFrom: value, ...params }).unwrap();
      } else if (field === 'effectiveTo') {
        response = await getByEffectiveTo({ effectiveTo: value, ...params }).unwrap();
      } else if (field === 'currency') {
        response = await getByCurrency({ currency: value, ...params }).unwrap();
      } else if (field === 'status') {
        response = await getByStatus({ status: value, ...params }).unwrap();
      }

      setFilteredList(response?.data ?? []);
      setFilteredTotal(response?.totalCount ?? 0);
      setIsFiltered(true);
      setFilterPagination({ ...filterPagination, page, size: currentSize });
    } catch (error) {
      console.error('Error filtering price lists:', error);
      dispatch(notify({ msg: 'Failed to filter price lists', sev: 'error' }));
      setIsFiltered(false);
    }
  };

  const refetchList = async () => {
    if (isFiltered) {
      await handleFilterChange(recordOfFilter.filter, recordOfFilter.value, filterPagination.page);
    }
    await refetch();
  };

  const handleNew = () => {
    setSelectedPriceList({
      ...newPriceListSetup,

      facilityId,

      currency:
        selectedFacility?.defaultCurrency
          ? String(
              selectedFacility.defaultCurrency
            ).toUpperCase()
          : undefined,

      versionNumber: 1,

      type: 'SELF_PAY',

      status: 'ACTIVE',

      isActive: true
    });

    setHeaderModalOpen(true);
  };

  const handleEdit = (
    row: PriceListSetupModel
  ) => {
    setSelectedPriceList({
      ...row
    });

    setHeaderModalOpen(true);
  };

  const handleOpenItems = (
    row: PriceListSetupModel
  ) => {
    setSelectedPriceList({
      ...row
    });

    setItemsModalOpen(true);
  };

  const handleDeleteRequest = (
    row: PriceListSetupModel
  ) => {
    setSelectedPriceList({
      ...row
    });

    setDeleteConfirmationOpen(true);
  };

  const handleActivate = async (
    row: PriceListSetupModel
  ) => {
    if (!row.id || row.status === 'ACTIVE') {
      return;
    }

    try {
      await activatePriceListSetup({
        id: row.id
      }).unwrap();

      dispatch(
        notify({
          msg: 'Price list activated. Billing will now use this list for matching coverage.',
          sev: 'success'
        })
      );

      if (isFiltered) {
        await handleFilterChange(recordOfFilter.filter, recordOfFilter.value, filterPagination.page);
      }
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            extractApiErrorMessage(
              error,
              PRICE_LIST_SETUP_ERROR_MAP
            ) || 'Failed to activate price list',
          sev: 'error'
        })
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedPriceList.id) {
      return;
    }

    try {
      await deletePriceListSetup({
        id: selectedPriceList.id
      }).unwrap();

      dispatch(
        notify({
          msg: 'Price list deleted successfully',
          sev: 'success'
        })
      );

      setDeleteConfirmationOpen(false);

      setSelectedPriceList({
        ...newPriceListSetup
      });

      await refetchList();
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            extractApiErrorMessage(
              error,
              PRICE_LIST_SETUP_ERROR_MAP
            ) || 'Failed to delete price list',
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

    await refetchList();
  };

  const handlePageChange = (
    _: unknown,
    newPage: number
  ) => {
    if (isFiltered) {
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, newPage);
      return;
    }

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

    if (isFiltered) {
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
      return;
    }

    setPaginationParams(previous => ({
      ...previous,
      page: 0,
      size: newSize,
      timestamp: Date.now()
    }));
  };

  const filters = () => (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        fieldName="filter"
        fieldType="select"
        selectData={filterFields}
        selectDataLabel="label"
        selectDataValue="value"
        record={recordOfFilter}
        setRecord={u => setRecordOfFilter({ filter: u.filter, value: '' })}
        placeholder="Select Filter"
        showLabel={false}
        width="180px"
      />

      {recordOfFilter.filter === 'facility' && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={facilityListResponse ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
          placeholder="Select Facility"
        />
      )}

      {recordOfFilter.filter === 'type' && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={typeOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
          placeholder="Select Type"
        />
      )}

      {recordOfFilter.filter === 'payer' && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={payerListResponse?.data ?? []}
          selectDataLabel="nameEn"
          selectDataValue="id"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
          placeholder="Select Payer"
        />
      )}

      {recordOfFilter.filter === 'version' && (
        <MyInput
          fieldName="value"
          fieldType="number"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value ?? '' })}
          showLabel={false}
          placeholder="Enter Version"
        />
      )}

      {(recordOfFilter.filter === 'effectiveFrom' || recordOfFilter.filter === 'effectiveTo') && (
        <MyInput
          fieldName="value"
          fieldType="date"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value ?? '' })}
          showLabel={false}
        />
      )}

      {recordOfFilter.filter === 'currency' && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={currencyOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
          placeholder="Select Currency"
        />
      )}

      {recordOfFilter.filter === 'status' && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={statusOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
          placeholder="Select Status"
        />
      )}

      {recordOfFilter.filter !== 'facility' &&
        recordOfFilter.filter !== 'type' &&
        recordOfFilter.filter !== 'payer' &&
        recordOfFilter.filter !== 'version' &&
        recordOfFilter.filter !== 'effectiveFrom' &&
        recordOfFilter.filter !== 'effectiveTo' &&
        recordOfFilter.filter !== 'currency' &&
        recordOfFilter.filter !== 'status' && (
          <MyInput
            fieldName="value"
            fieldType="text"
            record={recordOfFilter}
            setRecord={setRecordOfFilter}
            placeholder="Enter Value"
            showLabel={false}
          />
        )}

      <MyButton
        color="var(--deep-blue)"
        width="80px"
        onClick={() => handleFilterChange(recordOfFilter.filter, String(recordOfFilter.value ?? ''))}
      >
        Search
      </MyButton>
    </Form>
  );

  const tableColumns = [
    {
      key: 'facilityId',
      title: <Translate>Facility</Translate>,
      flexGrow: 3,

      render: (
        row: PriceListSetupModel
      ) =>
        conjureValueBasedOnIDFromList(
          facilityListResponse ?? [],
          row.facilityId,
          'name'
        )
    },

    {
      key: 'name',
      title: <Translate>Name</Translate>,
      flexGrow: 4
    },

    {
      key: 'type',
      title: <Translate>Type</Translate>,
      flexGrow: 2,

      render: (
        row: PriceListSetupModel
      ) =>
        row.type
          ? formatEnumString(row.type)
          : ''
    },

    {
      key: 'payerName',
      title: <Translate>Payer</Translate>,
      flexGrow: 3,

      render: (
        row: PriceListSetupModel
      ) => {
        if (row.payerName) {
          return row.payerName;
        }

        if (!row.payerId) {
          return '-';
        }

        const payer =
          payerListResponse?.data?.find(
            item =>
              Number(item.id) ===
              Number(row.payerId)
          );

        return (
          payer?.nameEn ||
          payer?.nameAr ||
          '-'
        );
      }
    },

    {
      key: 'versionNumber',
      title: <Translate>Version</Translate>,
      width: 90,
      align: 'center' as const
    },

    {
      key: 'effectiveFrom',
      title:
        <Translate>
          Effective From
        </Translate>,
      flexGrow: 2
    },

    {
      key: 'effectiveTo',
      title:
        <Translate>
          Effective To
        </Translate>,
      flexGrow: 2,

      render: (
        row: PriceListSetupModel
      ) =>
        row.effectiveTo || '-'
    },

    {
      key: 'currency',
      title: <Translate>Currency</Translate>,
      width: 100,
      align: 'center' as const
    },

    {
      key: 'status',
      title: <Translate>Status</Translate>,
      width: 110,

      render: (
        row: PriceListSetupModel
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
            row.status === 'ACTIVE'
              ? '#415be7'
              : row.status === 'CANCELLED'
              ? '#d9534f'
              : '#b1acac'
          }
        />
      )
    },

    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      width: 190,
      align: 'center' as const,

      render: (
        row: PriceListSetupModel
      ) => (
        <div className="container-of-icons">
          {row.status !== 'ACTIVE' ? (
            <MdCheckCircle
              className="icons-style"
              title="Activate for billing"
              size={23}
              fill="var(--primary-green, #28a745)"
              onClick={() => {
                void handleActivate(row);
              }}
            />
          ) : null}

          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={23}
            fill="var(--primary-gray)"
            onClick={() =>
              handleEdit(row)
            }
          />

          <MdList
            className="icons-style"
            title="Price List Items"
            size={24}
            fill="var(--deep-blue)"
            onClick={() =>
              handleOpenItems(row)
            }
          />

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
    row: PriceListSetupModel
  ) =>
    row?.id === selectedPriceList?.id
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
        data={isFiltered ? filteredList : tableData}
        totalCount={isFiltered ? filteredTotal : totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={selectedRowClass}
        onRowClick={row =>
          setSelectedPriceList(row)
        }
        filters={filters()}
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
              disabled={!facilityId}
            >
              Add New
            </MyButton>
          </div>
        }
      />

      <AddEditPriceListSetup
        open={headerModalOpen}
        setOpen={setHeaderModalOpen}
        width={width}
        priceList={selectedPriceList}
        setPriceList={setSelectedPriceList}
        onSaveSuccess={handleSaveSuccess}
      />

      <PriceListSetupItems
        open={itemsModalOpen}
        setOpen={setItemsModalOpen}
        priceListSetupId={
          selectedPriceList.id ?? 0
        }
        priceListName={
          selectedPriceList.name ?? ''
        }
        priceListType={
          selectedPriceList.type
        }
        facilityId={
          selectedPriceList.facilityId
        }
      />

      <DeletionConfirmationModal
        open={deleteConfirmationOpen}
        setOpen={setDeleteConfirmationOpen}
        itemToDelete="Price List"
        actionButtonFunction={handleDelete}
        actionType="delete"
      />
    </Panel>
  );
};

export default PriceListSetup;