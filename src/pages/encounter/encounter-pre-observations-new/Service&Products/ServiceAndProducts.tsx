import React, { useEffect, useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import { useLocation } from 'react-router-dom';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { notify } from '@/utils/uiReducerActions';
import { PatientServiceAndProduct, ServiceSource } from '@/types/model-types-new';
import {
  useDeletePatientServiceOrProductMutation,
  useGetPatientServicesAndProductsByEncounterQuery,
} from '@/services/encounters/patientServicesAndProductsService';
import { useGetEncounterBillingSummaryQuery } from '@/services/billing/billingTransactionService';
import { isBillingChargeFinalized } from '@/pages/billing-module/accounting/utils/billingAccountingUtils';
import { formatEnumString } from '@/utils';
import { newPatientServiceAndProduct } from '@/types/model-types-constructor-new';

import { useLazyGetServicesBulkByIdsQuery } from '@/services/setup/serviceService';
import { useLazyGetProcedureByIdQuery } from '@/services/setup/procedure/procedureService';
import { useLazyGetBrandMedicationsByIdsQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import { useLazyGetDiagnosticTestsByIdsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import AddEditPatientServiceAndProduct from './AddEditPatientServiceAndProduct';
import { setDivContent, setPageCode } from '@/reducers/divSlice';

const LOCKED_PAYMENT_STATUSES = new Set([
  'RESERVED',
  'PARTIALLY_RESERVED',
  'PAID',
  'PARTIALLY_PAID',
  'DEBIT',
  'PARTIALLY_DEBIT',
  'EXEMPTED',
  'CANCELLED'
]);

const ServiceAndProductsTab = ({ edit: propEdit }) => {
  const location = useLocation();
  const encounter = location.state?.encounter;
  const dispatch = useAppDispatch();

  const [paginationParams, setPaginationParams] = useState({ page: 0, size: 15, sort: 'id,asc', });

  const [deletePatientServiceProduct] = useDeletePatientServiceOrProductMutation();

  const { data: patientServiceProductListResponse, refetch, isLoading } =
    useGetPatientServicesAndProductsByEncounterQuery(
      {
        encounterId: encounter?.id,
        ...paginationParams
      },
      {
        skip: !encounter?.id,
      }
    );

  const { data: billingSummary } = useGetEncounterBillingSummaryQuery(
    { encounterId: encounter?.id as number },
    { skip: !encounter?.id }
  );

  const billingFinalized = isBillingChargeFinalized(billingSummary ?? null);

  const state = location.state || {};
  const edit = propEdit ?? state.edit;
  const isReadOnly = Boolean(edit || billingFinalized);

  const [openModal, setOpenModal] = useState(false);
  const [popupOpen, setPopupOpen] = useState<boolean>(false);
  const [patientServiceAndProduct, setPatientServiceAndProduct] =
    useState<PatientServiceAndProduct>({ ...newPatientServiceAndProduct });
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  const rows = useMemo(
    () =>
      (patientServiceProductListResponse?.data ?? []).filter(
        row => row?.paymentStatus !== 'CANCELLED'
      ),
    [patientServiceProductListResponse?.data]
  );
  const totalCount = patientServiceProductListResponse?.totalCount ?? 0;

  const billingItemsByPspId = useMemo(() => {
    const map = new Map<number, any>();
    (billingSummary?.items ?? []).forEach((item: any) => {
      const pspId = Number(item?.patientServiceProductId);
      if (Number.isFinite(pspId) && pspId > 0) {
        map.set(pspId, item);
      }
    });
    return map;
  }, [billingSummary?.items]);

  const canMutateRow = (rowData: PatientServiceAndProduct) => {
    if (isReadOnly) return false;
    if (rowData?.serviceSource !== ServiceSource.SERVICE_AND_PRODUCT) return false;
    if (rowData?.isBilled) return false;

    const paymentStatus = String(rowData?.paymentStatus ?? '').toUpperCase();
    if (LOCKED_PAYMENT_STATUSES.has(paymentStatus)) return false;

    const billingItem = billingItemsByPspId.get(Number(rowData?.id));
    if (billingItem) {
      const reservedAmount = Number(billingItem.reservedAmount ?? 0);
      const allocatedAmount = Number(billingItem.allocatedAmount ?? 0);
      const lineStatus = String(billingItem.status ?? '').toUpperCase();

      // Reserved / allocated / closed charge lines must stay view-only to protect billing math.
      if (reservedAmount > 0 || allocatedAmount > 0) return false;
      if (lineStatus === 'CLOSED' || lineStatus === 'CANCELLED') return false;
    }

    return true;
  };

  const serviceIds = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .filter(row => row.billingItemType === 'SERVICE' && row.serviceId != null)
            .map(row => row.serviceId)
        )
      ),
    [rows]
  );

  const medicationIds = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .filter(row => row.billingItemType === 'MEDICATION' && row.brandMedicationId != null)
            .map(row => row.brandMedicationId)
        )
      ),
    [rows]
  );

  const diagnosticTestIds = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .filter(
              row =>
                ['LABORATORY', 'RADIOLOGY', 'PATHOLOGY'].includes(row.billingItemType) &&
                row.diagnosticTestId != null
            )
            .map(row => row.diagnosticTestId)
        )
      ),
    [rows]
  );

  const procedureIds = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .filter(row => row.billingItemType === 'PROCEDURE' && row.procedureId != null)
            .map(row => row.procedureId)
        )
      ),
    [rows]
  );

  const [fetchServicesBulk] = useLazyGetServicesBulkByIdsQuery();
  const [fetchDiagnosticTestsBulk] = useLazyGetDiagnosticTestsByIdsQuery();
  const [fetchBrandMedicationsBulk] = useLazyGetBrandMedicationsByIdsQuery();
  const [fetchProcedureById] = useLazyGetProcedureByIdQuery();

  const [servicesMap, setServicesMap] = useState<Record<number | string, any>>({});
  const [medicationsMap, setMedicationsMap] = useState<Record<number | string, any>>({});
  const [diagnosticTestsMap, setDiagnosticTestsMap] = useState<Record<number | string, any>>({});
  const [proceduresMap, setProceduresMap] = useState<Record<number | string, any>>({});

  const lookupKey = useMemo(
    () =>
      JSON.stringify({
        serviceIds,
        medicationIds,
        diagnosticTestIds,
        procedureIds
      }),
    [serviceIds, medicationIds, diagnosticTestIds, procedureIds]
  );

  useEffect(() => {
    let cancelled = false;

    const loadLookups = async () => {
      if (!rows.length) {
        setServicesMap({});
        setMedicationsMap({});
        setDiagnosticTestsMap({});
        setProceduresMap({});
        return;
      }

      const hasLookupTargets =
        serviceIds.length > 0 ||
        medicationIds.length > 0 ||
        diagnosticTestIds.length > 0 ||
        procedureIds.length > 0;

      if (!hasLookupTargets) {
        return;
      }

      try {
        const servicesPromise = serviceIds.length
          ? fetchServicesBulk(serviceIds, true).unwrap()
          : Promise.resolve([]);

        const medicationsPromise = medicationIds.length
          ? fetchBrandMedicationsBulk({ ids: medicationIds }, true).unwrap()
          : Promise.resolve([]);

        const diagnosticTestsPromise = diagnosticTestIds.length
          ? fetchDiagnosticTestsBulk({ ids: diagnosticTestIds }, true).unwrap()
          : Promise.resolve([]);

        const proceduresPromise = procedureIds.length
          ? Promise.all(
            procedureIds.map(async id => {
              const item = await fetchProcedureById({ id }, true).unwrap();
              return item;
            })
          )
          : Promise.resolve([]);

        const [servicesData, medicationsData, diagnosticTestsData, proceduresData] =
          await Promise.all([
            servicesPromise,
            medicationsPromise,
            diagnosticTestsPromise,
            proceduresPromise,
          ]);

        if (cancelled) {
          return;
        }

        const medicationsList = Array.isArray(medicationsData)
          ? medicationsData
          : medicationsData?.data ?? [];

        setServicesMap(
          Object.fromEntries((servicesData ?? []).map((item: any) => [item.id, item]))
        );

        setMedicationsMap(
          Object.fromEntries((medicationsList ?? []).map((item: any) => [item.id, item]))
        );

        setDiagnosticTestsMap(
          Object.fromEntries((diagnosticTestsData ?? []).map((item: any) => [item.id, item]))
        );

        setProceduresMap(
          Object.fromEntries((proceduresData ?? []).map((item: any) => [item.id, item]))
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setServicesMap({});
        setMedicationsMap({});
        setDiagnosticTestsMap({});
        setProceduresMap({});
      }
    };

    void loadLookups();

    return () => {
      cancelled = true;
    };
  }, [lookupKey, rows.length]);

  const isSelected = (rowData: PatientServiceAndProduct) => {
    if (rowData && patientServiceAndProduct && rowData.id === patientServiceAndProduct.id) {
      return 'selected-row';
    }
    return '';
  };

  const handleDelete = async () => {
    if (patientServiceAndProduct?.id === undefined) return;

    try {
      await deletePatientServiceProduct({
        id: patientServiceAndProduct?.id,
        encounterId: encounter?.id
      }).unwrap();

      dispatch(
        notify({ msg: 'Deleted Successfully', sev: 'success' })
      );

      setPatientServiceAndProduct({ ...newPatientServiceAndProduct });
      await refetch();
      setOpenModal(false);
    } catch (error) {
      dispatch(
        notify({ msg: 'Failed to delete Patient Service/Product', sev: 'error' })
      );
    }
  };

  const handlePageChange = (_event: unknown, newPage: number) => { setPaginationParams(prev => ({ ...prev, page: newPage, })); };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const newSize = Number(event.target.value); setPaginationParams(prev => ({ ...prev, size: newSize, page: 0, })); };

  const handleSortChange = (newSortColumn: string, newSortType: 'asc' | 'desc') => { setSortColumn(newSortColumn); setSortType(newSortType); setPaginationParams(prev => ({ ...prev, page: 0, sort: `${newSortColumn},${newSortType}`, })); };

  const getDisplayName = (rowData: PatientServiceAndProduct) => {
    switch (rowData.billingItemType) {
      case 'SERVICE':
        return servicesMap[rowData.serviceId!]?.name ?? '-';

      case 'MEDICATION':
        return medicationsMap[rowData.brandMedicationId!]?.name ?? '-';

      case 'LABORATORY':
      case 'RADIOLOGY':
      case 'PATHOLOGY':
        return diagnosticTestsMap[rowData.diagnosticTestId!]?.name ?? '-';

      case 'PROCEDURE':
        return proceduresMap[rowData.procedureId!]?.name ?? '-';

      default:
        return '-';
    }
  };

  const columns = [
    {
      key: 'billingItemType',
      title: 'Category',
      render: (rowData: PatientServiceAndProduct) => (
        <span>{formatEnumString(rowData.billingItemType)}</span>
      ),
    },
    {
      key: 'serviceSource',
      title: 'service Source',
      render: (rowData: PatientServiceAndProduct) => (
        <span>{formatEnumString(rowData.serviceSource)} Page</span>
      ),
    },
    {
      key: 'name',
      title: 'Name',
      isLink: true,
      render: (rowData: PatientServiceAndProduct) => (
        <span>{getDisplayName(rowData)}</span>
      ),
    },
    { key: 'quantity', title: 'Quantity' },
    {
      key: 'actions',
      title: '',
      render: (rowData: PatientServiceAndProduct) => (
        <div className="container-of-icons">
          {canMutateRow(rowData) && <MdModeEdit
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            className="icons-style"
            onClick={(event) => {
              event.stopPropagation();
              setPatientServiceAndProduct(rowData);
              setPopupOpen(true);
            }}
          />}

          {canMutateRow(rowData) && <MdDelete
            title="Delete"
            size={24}
            fill="var(--primary-pink)"
            className="icons-style"
            onClick={(event) => {
              event.stopPropagation();
              setPatientServiceAndProduct(rowData);
              setOpenModal(true);
            }}
          />}
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (!billingFinalized) return;
    setPopupOpen(false);
    setOpenModal(false);
  }, [billingFinalized]);

  useEffect(() => {
    dispatch(setPageCode('serviceandproducts'));
    dispatch(setDivContent('Service and Products'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  return (
    <div>
      <div className="bt-div">
        <div className="bt-right">
          <MyButton
            prefixIcon={() => <PlusIcon />}
            disabled={isReadOnly}
            onClick={() => {
              setPopupOpen(true);
              setPatientServiceAndProduct({ ...newPatientServiceAndProduct });
            }}
          >
            Add
          </MyButton>
        </div>
      </div>

      {billingFinalized && (
        <div className="billing-accounting__checkout-complete" style={{ marginBottom: 12 }}>
          Billing checkout is finalized for this encounter. Service & product lines are view-only.
        </div>
      )}

      <MyTable data={rows}
        columns={columns}
        rowClassName={isReadOnly ? undefined : isSelected}
        onRowClick={isReadOnly ? undefined : rowData => { setPatientServiceAndProduct(rowData); }}
        totalCount={totalCount}
        loading={isLoading}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange} />

      <AddEditPatientServiceAndProduct
        open={popupOpen && !isReadOnly}
        setOpen={setPopupOpen}
        patientServiceAndProduct={patientServiceAndProduct}
        setPatientServiceAndProduct={setPatientServiceAndProduct}
      />

      <DeletionConfirmationModal
        open={openModal}
        setOpen={setOpenModal}
        itemToDelete={'billing item'}
        actionButtonFunction={handleDelete}
        actionType="delete"
        confirmationQuestion="Are you sure you want to delete this billing item?"
        actionButtonLabel="Delete"
        cancelButtonLabel="Cancel"
      />
    </div>
  );
};

export default ServiceAndProductsTab;