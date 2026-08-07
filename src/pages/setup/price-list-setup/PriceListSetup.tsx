import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import { Panel } from 'rsuite';

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

import {
  useActivatePriceListSetupMutation,
  useDeletePriceListSetupMutation,
  useGetPriceListSetupsQuery
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

      await refetch();
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
      key: 'payerId',
      title: <Translate>Payer ID</Translate>,
      flexGrow: 2,

      render: (
        row: PriceListSetupModel
      ) =>
        row.payerId ?? '-'
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
        data={tableData}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={selectedRowClass}
        onRowClick={row =>
          setSelectedPriceList(row)
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