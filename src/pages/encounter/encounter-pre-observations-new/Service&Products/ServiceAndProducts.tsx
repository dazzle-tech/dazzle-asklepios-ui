import React, { useEffect, useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import { useLocation } from 'react-router-dom';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { notify } from '@/utils/uiReducerActions';
import { PatientServiceAndProduct } from '@/types/model-types-new';
import {
  useDeletePatientServiceOrProductMutation,
  useGetPatientServicesAndProductsByEncounterQuery,
} from '@/services/encounters/patientServicesAndProductsService';
import { formatEnumString } from '@/utils';
import { newPatientServiceAndProduct } from '@/types/model-types-constructor-new';

import { useLazyGetServicesBulkByIdsQuery } from '@/services/setup/serviceService';
import { useLazyGetProcedureByIdQuery } from '@/services/setup/procedure/procedureService';
import { useLazyGetBrandMedicationsByIdsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
import { useLazyGetDiagnosticTestsByIdsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import AddEditPatientServiceAndProduct from './AddEditPatientServiceAndProduct';

const ServiceAndProductsTab = ({ edit: propEdit }) => {
  const location = useLocation();
  const encounter = location.state?.encounter;
  const dispatch = useAppDispatch();

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

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

  const state = location.state || {};
  const edit = propEdit ?? state.edit;

  const [openModal, setOpenModal] = useState(false);
  const [popupOpen, setPopupOpen] = useState<boolean>(false);
  const [patientServiceAndProduct, setPatientServiceAndProduct] =
    useState<PatientServiceAndProduct>({ ...newPatientServiceAndProduct });
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [lookupsLoading, setLookupsLoading] = useState(false);

  const rows = patientServiceProductListResponse?.data ?? [];
  const totalCount = patientServiceProductListResponse?.totalCount ?? 0;

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

  useEffect(() => {
    const loadLookups = async () => {
      if (!rows.length) {
        setServicesMap({});
        setMedicationsMap({});
        setDiagnosticTestsMap({});
        setProceduresMap({});
        setLookupsLoading(false);
        return;
      }

      setLookupsLoading(true);

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
        setServicesMap({});
        setMedicationsMap({});
        setDiagnosticTestsMap({});
        setProceduresMap({});
      } finally {
        setLookupsLoading(false);
      }
    };

    loadLookups();
  }, [
    rows,
    serviceIds,
    medicationIds,
    diagnosticTestIds,
    procedureIds,
    fetchServicesBulk,
    fetchBrandMedicationsBulk,
    fetchDiagnosticTestsBulk,
    fetchProcedureById,
  ]);

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
      }).unwrap();

      dispatch(
        notify({ msg: 'Deleted Successfully', sev: 'success' })
      );

      setPatientServiceAndProduct({ ...newPatientServiceAndProduct });
      refetch();
      setOpenModal(false);
    } catch (error) {
      dispatch(
        notify({ msg: 'Failed to delete Patient Service/Product', sev: 'error' })
      );
    }
  };

  const handlePageChange = (event, newPage) => {
    setPaginationParams({ ...paginationParams, page: newPage });
  };

  const handleSortChange = (newSortColumn: string, newSortType: 'asc' | 'desc') => {
    setSortColumn(newSortColumn);
    setSortType(newSortType);

    const sortValue = `${newSortColumn},${newSortType}`;
    setPaginationParams({
      ...paginationParams,
      sort: sortValue,
      page: 0,
      timestamp: Date.now()
    });
  };

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
      key: 'name',
      title: 'Name',
      isLink: true,
      render: (rowData: PatientServiceAndProduct) => (
        <span>{getDisplayName(rowData)}</span>
      ),
    },
    {
      key: 'unitPrice',
      title: 'Price',
      render: (rowData: PatientServiceAndProduct) => (
        <span>{rowData.unitPrice != null ? Number(rowData.unitPrice).toFixed(2) : '-'}</span>
      ),
    },
    {
      key: 'currency',
      title: 'Currency',
      render: (rowData: PatientServiceAndProduct) => (
        <span>{rowData.currency ?? '-'}</span>
      ),
    },
    { key: 'quantity', title: 'Quantity' },
    {
      key: 'actions',
      title: '',
      render: (rowData: PatientServiceAndProduct) => (
        <div className="container-of-icons">
          <MdModeEdit
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            className="icons-style"
            onClick={() => {
              setPatientServiceAndProduct(rowData);
              setPopupOpen(true);
            }}
          />
          <MdDelete
            title="Delete"
            size={24}
            fill="var(--primary-pink)"
            className="icons-style"
            onClick={() => {
              setPatientServiceAndProduct(rowData);
              setOpenModal(true);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="bt-div">
        <div className="bt-right">
          <MyButton
            prefixIcon={() => <PlusIcon />}
            disabled={edit}
            onClick={() => {
              setPopupOpen(true);
              setPatientServiceAndProduct({ ...newPatientServiceAndProduct });
            }}
          >
            Add
          </MyButton>
        </div>
      </div>

      <MyTable
        data={lookupsLoading ? [] : rows}
        columns={columns}
        rowClassName={isSelected}
        onRowClick={(rowData) => {
          setPatientServiceAndProduct(rowData);
        }}
        totalCount={totalCount}
        loading={isLoading || lookupsLoading}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={e => {
          const newSize = Number(e.target.value);
          setPaginationParams({
            ...paginationParams,
            size: newSize,
            page: 0,
            timestamp: Date.now()
          });
        }}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
      />

      <AddEditPatientServiceAndProduct
        open={popupOpen}
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