import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  useGetPatientVaccineIdsQuery,
  useLazyGetPatientVaccineDetailsQuery
} from '@/services/encounterMedical/encounterVaccinationService';

import { useLazyGetVaccineBrandsByIdsQuery } from '@/services/vaccine/vaccineBrandsService';
import { useLazyGetVaccineDosesByIdsQuery } from '@/services/vaccine/vaccineDosesService';
import { useGetVaccinesByIdsQuery } from '@/services/vaccine/vaccineService';

const normalizeArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.object)) return res.object;

  return [];
};

const isCancelledRow = (row: any) => {
  return (
    row?.status === 'CANCELLED' ||
    row?.apEncounterVaccination?.status === 'CANCELLED' ||
    row?.apEncounterVaccination?.statusLkey === 'CANCELLED'
  );
};

interface Props {
  patient: any;
}

const VaccineReccord: React.FC<Props> = ({ patient }) => {
  // =========================================================
  // State
  // =========================================================

  const [showCancelled] = useState(false);

  const [selectedVaccine, setSelectedVaccine] =
    useState<any>(null);

  const [pageIndex, setPageIndex] =
    useState(0);

  const [rowsPerPage, setRowsPerPage] =
    useState(5);

  const patientId = Number(
    patient?.id ?? patient?.key
  );

  const selectedVaccineId = Number(
    selectedVaccine?.id
  );

  const {
    data: patientVaccineIdsResp,
    isFetching: isFetchingVaccineIds
  } = useGetPatientVaccineIdsQuery(
    { patientId },
    {
      skip: !patientId
    }
  );

  const patientVaccineIds: (number | string)[] =
    Array.isArray(patientVaccineIdsResp)
      ? patientVaccineIdsResp
      : (patientVaccineIdsResp as any)?.object ?? [];

  const ids = (
    patientVaccineIds ?? []
  ).filter(
    x =>
      x !== null &&
      x !== undefined
  );

  const {
    data: vaccinesByIdsResp,
    isFetching: isFetchingVaccines
  } = useGetVaccinesByIdsQuery(
    { ids },
    {
      skip: ids.length === 0
    }
  );

  const vaccinesByIds: any[] =
    Array.isArray(vaccinesByIdsResp)
      ? vaccinesByIdsResp
      : (vaccinesByIdsResp as any)?.object ?? [];

  useEffect(() => {
    if (
      vaccinesByIds.length === 0
    ) {
      setSelectedVaccine(null);
      return;
    }

    const currentExists =
      selectedVaccine?.id &&
      vaccinesByIds.some(
        (v: any) =>
          Number(v?.id) ===
          Number(selectedVaccine.id)
      );

    if (!currentExists) {
      setSelectedVaccine(
        vaccinesByIds[0]
      );

      setPageIndex(0);
    }
  }, [
    vaccinesByIds,
    selectedVaccine?.id
  ]);

  const [
    triggerPatientVaccineDetails,
    {
      data: detailsResp,
      isFetching: isFetchingDetails
    }
  ] =
    useLazyGetPatientVaccineDetailsQuery();

  useEffect(() => {
    if (!patientId) {
      return;
    }

    if (
      !selectedVaccineId ||
      Number.isNaN(selectedVaccineId)
    ) {
      return;
    }

    setPageIndex(0);

    triggerPatientVaccineDetails({
      patientId,
      vaccineId: selectedVaccineId,
      includeCancelled: showCancelled,
      page: 0,
      size: 1000,
      sort: 'id,asc',
      timestamp: Date.now()
    } as any);
  }, [
    patientId,
    selectedVaccineId,
    showCancelled,
    triggerPatientVaccineDetails
  ]);

  const [triggerBrandsBulk] =
    useLazyGetVaccineBrandsByIdsQuery();

  const [triggerDosesBulk] =
    useLazyGetVaccineDosesByIdsQuery();

  const [brandsById, setBrandsById] =
    useState<Record<number, any>>({});

  const [dosesById, setDosesById] =
    useState<Record<number, any>>({});

  const bulkKeyRef =
    useRef<string>('');

  // =========================================================
  // Details Response
  // =========================================================

  const allDetailsRecords =
    detailsResp?.records?.data ?? [];

  const brandIds =
    detailsResp?.brandIds ?? [];

  const doseIds =
    detailsResp?.doseIds ?? [];

  useEffect(() => {
    const key =
      `b=${(brandIds ?? []).join(',')};d=${(doseIds ?? []).join(',')}`;

    if (
      !brandIds.length &&
      !doseIds.length
    ) {
      setBrandsById({});
      setDosesById({});
      bulkKeyRef.current = '';

      return;
    }

    if (
      bulkKeyRef.current === key
    ) {
      return;
    }

    bulkKeyRef.current = key;

    const loadBrandsAndDoses =
      async () => {
        try {
          const [
            brandsRaw,
            dosesRaw
          ] = await Promise.all([
            brandIds.length
              ? triggerBrandsBulk({
                  ids: brandIds
                } as any).unwrap()
              : Promise.resolve([]),

            doseIds.length
              ? triggerDosesBulk({
                  ids: doseIds
                } as any).unwrap()
              : Promise.resolve([])
          ]);

          const brandsArr =
            normalizeArray(
              brandsRaw
            );

          const dosesArr =
            normalizeArray(
              dosesRaw
            );

          setBrandsById(
            Object.fromEntries(
              brandsArr.map(
                (b: any) => [
                  Number(b.id),
                  b
                ]
              )
            )
          );

          setDosesById(
            Object.fromEntries(
              dosesArr.map(
                (d: any) => [
                  Number(d.id),
                  d
                ]
              )
            )
          );
        } catch (error) {
          console.error(
            'Failed to load vaccine brands/doses:',
            error
          );

          setBrandsById({});
          setDosesById({});
        }
      };

    loadBrandsAndDoses();
  }, [
    brandIds,
    doseIds,
    triggerBrandsBulk,
    triggerDosesBulk
  ]);

  const detailsRecords =
    useMemo(() => {
      if (!showCancelled) {
        return allDetailsRecords;
      }

      return (
        allDetailsRecords ?? []
      ).filter(
        isCancelledRow
      );
    }, [
      allDetailsRecords,
      showCancelled
    ]);

  const getBrandId = (
    row: any
  ) =>
    row?.vaccineBrandId ??
    row?.brandId;

  const getDoseId = (
    row: any
  ) =>
    row?.vaccineDoseId ??
    row?.doseId;

  const columns = useMemo(
    () => [
      {
        key: 'idx',
        title: '#',
        width: 70,

        render: (
          _row: any,
          index: number
        ) =>
          pageIndex *
            rowsPerPage +
          index +
          1
      },

      {
        key: 'brandName',
        title: 'BRAND NAME',

        render: (
          row: any
        ) => {
          const id =
            Number(
              getBrandId(row)
            );

          if (
            !id ||
            !brandsById[id]
          ) {
            return '';
          }

          return (
            brandsById[id]?.name ??
            brandsById[id]?.brandName ??
            ''
          );
        }
      },

      {
        key: 'doseNumber',
        title: 'DOSE NUMBER',

        render: (
          row: any
        ) => {
          const id =
            Number(
              getDoseId(row)
            );

          const dose =
            id &&
            dosesById[id]
              ? dosesById[id]
              : null;

          return dose?.doseNumber != null
            ? formatEnumString(
                String(
                  dose.doseNumber
                )
              )
            : '';
        }
      },

      {
        key: 'dateAdministered',
        title:
          'DATE OF ADMINISTRATION',

        render: (
          row: any
        ) =>
          !row?.dateAdministered
            ? ''
            : formatDateWithoutSeconds(
                row.dateAdministered
              )
      },

      {
        key: 'externalFacilityName',
        title:
          'VACCINATION LOCATION',

        render: (
          row: any
        ) =>
          row?.externalFacilityName ??
          row?.administeredLocation ??
          ''
      },

      {
        key: 'status',
        title: 'STATUS',

        render: (
          row: any
        ) =>
          row?.status
            ? formatEnumString(
                row.status
              )
            : ''
      },

      {
        key: 'cancellationReason',

        title: (
          <Translate>
            CANCELLATION REASON
          </Translate>
        ),

        expandable: true,

        render: (
          row: any
        ) =>
          row?.cancellationReason ??
          ''
      }
    ],
    [
      brandsById,
      dosesById,
      pageIndex,
      rowsPerPage
    ]
  );

  const handleVaccineSelect = (
    vaccine: any
  ) => {
    setSelectedVaccine(
      vaccine
    );

    setPageIndex(0);

    if (!patientId) {
      return;
    }

    if (!vaccine?.id) {
      return;
    }

    triggerPatientVaccineDetails({
      patientId,
      vaccineId:
        Number(vaccine.id),
      includeCancelled:
        showCancelled,
      page: 0,
      size: 1000,
      sort: 'id,asc',
      timestamp: Date.now()
    } as any);
  };

  const handlePageChange = (
    _event: unknown,
    newPage: number
  ) => {
    setPageIndex(
      newPage
    );
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newRowsPerPage =
      parseInt(
        event.target.value,
        10
      );

    setRowsPerPage(
      newRowsPerPage
    );

    setPageIndex(0);
  };

  const totalCount =
    detailsRecords.length;

  const paginatedData =
    detailsRecords.slice(
      pageIndex *
        rowsPerPage,

      pageIndex *
          rowsPerPage +
        rowsPerPage
    );

  const isLoading =
    isFetchingVaccineIds ||
    isFetchingVaccines ||
    isFetchingDetails;

  return (
    <>
      {/* =====================================================
          Vaccines
      ====================================================== */}

      {vaccinesByIds.length > 0 && (
        <div className="main-container-btns">
          {vaccinesByIds.map(
            (
              vaccine: any,
              index: number
            ) => (
              <MyButton
                key={
                  vaccine?.id ??
                  index
                }
                className="main-content-btn filter-form-disable-fix"
                appearance={
                  Number(
                    selectedVaccine?.id
                  ) ===
                  Number(
                    vaccine?.id
                  )
                    ? 'primary'
                    : 'ghost'
                }
                onClick={() =>
                  handleVaccineSelect(
                    vaccine
                  )
                }
              >
                {vaccine?.name ??
                  vaccine?.vaccineName ??
                  ''}
              </MyButton>
            )
          )}
        </div>
      )}

      {/* =====================================================
          Table
      ====================================================== */}

      <MyTable
        data={
          paginatedData
        }
        columns={
          columns
        }
        height={600}
        loading={
          isLoading
        }
        page={
          pageIndex
        }
        rowsPerPage={
          rowsPerPage
        }
        totalCount={
          totalCount
        }
        onPageChange={
          handlePageChange
        }
        onRowsPerPageChange={
          handleRowsPerPageChange
        }
      />
    </>
  );
};

export default VaccineReccord;
