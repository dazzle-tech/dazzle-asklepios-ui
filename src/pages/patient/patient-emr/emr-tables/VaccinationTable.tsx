
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyLabel from '@/components/MyLabel';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useEnumOptions } from '@/services/enumsApi';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, Form, Loader } from 'rsuite';

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

  const [showCancelled, setShowCancelled] = useState(false);

  const [selectedVaccine, setSelectedVaccine] = useState<any>(null);
  const selectedVaccineId = Number(selectedVaccine?.id);

  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const patientId = Number(patient?.key);
  const { data: patientVaccineIdsResp, isFetching: isFetchingVaccineIds } = useGetPatientVaccineIdsQuery(
    { patientId },
    { skip: !patientId }
  );

  const patientVaccineIds: (number | string)[] = Array.isArray(patientVaccineIdsResp)
    ? patientVaccineIdsResp
    : (patientVaccineIdsResp as any)?.object ?? [];

  const ids = (patientVaccineIds ?? []).filter(x => x !== null && x !== undefined);

  const { data: vaccinesByIdsResp, isFetching: isFetchingVaccinesByIds } = useGetVaccinesByIdsQuery(
    { ids },
    { skip: ids.length === 0 }
  );

  
  const [triggerPatientVaccineDetails, { data: detailsResp, isFetching: isFetchingDetails }] =
    useLazyGetPatientVaccineDetailsQuery();

  const fetchDetailsForSelected = (opts?: { page?: number; size?: number; sort?: string }) => {
    if (!patientId) return;
    if (!selectedVaccineId || Number.isNaN(selectedVaccineId)) return;

    triggerPatientVaccineDetails({
      patientId,
      vaccineId: selectedVaccineId,
      includeCancelled: showCancelled ? true : false,
      page: opts?.page ?? 0,
      size: opts?.size ?? 1000,
      sort: opts?.sort ?? 'id,asc',
      timestamp: Date.now()
    } as any);
  };

  useEffect(() => {
    setPageIndex(0);
    if (selectedVaccineId) fetchDetailsForSelected({ page: 0 });
  }, [showCancelled]);


  const [triggerBrandsBulk] = useLazyGetVaccineBrandsByIdsQuery();
  const [triggerDosesBulk] = useLazyGetVaccineDosesByIdsQuery();

  const [brandsById, setBrandsById] = useState<Record<number, any>>({});
  const [dosesById, setDosesById] = useState<Record<number, any>>({});
  const bulkKeyRef = useRef<string>('');

  const allDetailsRecords = detailsResp?.records?.data ?? [];
  const brandIds = detailsResp?.brandIds ?? [];
  const doseIds = detailsResp?.doseIds ?? [];

  useEffect(() => {
    const key = `b=${(brandIds ?? []).join(',')};d=${(doseIds ?? []).join(',')}`;
    if (!brandIds.length && !doseIds.length) {
      setBrandsById({});
      setDosesById({});
      bulkKeyRef.current = '';
      return;
    }
    if (bulkKeyRef.current === key) return;
    bulkKeyRef.current = key;

    (async () => {
      try {
        const [brandsRaw, dosesRaw] = await Promise.all([
          brandIds.length ? triggerBrandsBulk({ ids: brandIds } as any).unwrap() : Promise.resolve([]),
          doseIds.length ? triggerDosesBulk({ ids: doseIds } as any).unwrap() : Promise.resolve([])
        ]);

        const brandsArr = normalizeArray(brandsRaw);
        const dosesArr = normalizeArray(dosesRaw);

        setBrandsById(Object.fromEntries((brandsArr ?? []).map((b: any) => [Number(b.id), b])));
        setDosesById(Object.fromEntries((dosesArr ?? []).map((d: any) => [Number(d.id), d])));
      } catch {
        setBrandsById({});
        setDosesById({});
      }
    })();
  }, [brandIds, doseIds, triggerBrandsBulk, triggerDosesBulk]);

  const detailsRecords = useMemo(() => {
    if (!showCancelled) return allDetailsRecords;
    return (allDetailsRecords ?? []).filter(isCancelledRow)
  }, [allDetailsRecords, showCancelled]);

  const getBrandId = (row: any) => row?.vaccineBrandId ?? row?.brandId;
  const getDoseId = (row: any) => row?.vaccineDoseId ?? row?.doseId;

  const columns = useMemo(
    () => [
      { key: 'idx', title: '#', width: 70, render: (_: any, i: number) => i + 1 },
      {
        key: 'brandName',
        title: 'BRAND NAME',
        render: (row: any) => {
          const id = Number(getBrandId(row));
          return id && brandsById[id] ? brandsById[id]?.name ?? brandsById[id]?.brandName ?? '' : '';
        }
      },
      {
        key: 'doseNumber',
        title: 'DOSE NUMBER',
        render: (row: any) => {
          const id = Number(getDoseId(row));
          const d = id && dosesById[id] ? dosesById[id] : null;
          return d?.doseNumber != null ? formatEnumString(String(d.doseNumber)) : '';
        }
      },
      {
        key: 'dateAdministered',
        title: 'DATE OF ADMINISTRATION',
        render: (row: any) => (!row?.dateAdministered ? '' : formatDateWithoutSeconds(row.dateAdministered))
      },
      {
        key: 'externalFacilityName',
        title: 'VACCINATION LOCATION',
        render: (row: any) => row?.externalFacilityName ?? row?.administeredLocation ?? ''
      },
      {
        key: 'status',
        title: 'STATUS',
        render: (row: any) => (row?.status ? formatEnumString(row.status) : '')
      },
      {
        key: 'cancellationReason',
        title: <Translate>CANCELLATION REASON</Translate>,
        expandable: true,
        render: (row: any) => row?.cancellationReason ?? ''
      }
    ],
    [brandsById, dosesById]
  );

  const handlePageChange = (_: unknown, newPage: number) => setPageIndex(newPage);

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageIndex(0);
  };

  const totalCount = detailsRecords.length;
  const paginatedData = detailsRecords.slice(pageIndex * rowsPerPage, pageIndex * rowsPerPage + rowsPerPage);

  return (
    <>
      <MyTable
        data={paginatedData}
        columns={columns}
        height={600}
        loading={false}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </>
  );
};

export default VaccineReccord;
