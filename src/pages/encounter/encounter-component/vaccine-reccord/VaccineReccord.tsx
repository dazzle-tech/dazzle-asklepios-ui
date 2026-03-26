
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form, Checkbox, Loader } from 'rsuite';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import './styles.less';
import MyLabel from '@/components/MyLabel';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useLocation } from 'react-router-dom';
import { useEnumOptions } from '@/services/enumsApi';

import {
  useGetPatientVaccineIdsQuery,
  useLazyGetPatientVaccineDetailsQuery
} from '@/services/encounterMedical/encounterVaccinationService';
import { useGetVaccinesByIdsQuery } from '@/services/vaccine/vaccineService';
import { useLazyGetVaccineBrandsByIdsQuery } from '@/services/vaccine/vaccineBrandsService';
import { useLazyGetVaccineDosesByIdsQuery } from '@/services/vaccine/vaccineDosesService';

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

const VaccineReccord = () => {
  const location = useLocation();
  const { patient } = (location.state as any) || {};

  const [showCancelled, setShowCancelled] = useState(false);

  const [selectedVaccine, setSelectedVaccine] = useState<any>(null);
  const selectedVaccineId = Number(selectedVaccine?.id);

  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const typeEnumOptions = useEnumOptions('VaccineType');
  const roa = useEnumOptions('RouteOfAdministration');
  const numberOfDoses = useEnumOptions('NumberOfDoses', {
    labelOverrides: {
      ONE: '1',
      TWO: '2',
      THREE: '3',
      FOUR: '4',
      FIVE: '5',
      SIX: '6',
      SEVEN: '7',
      EIGHT: '8',
      NINE: '9',
      TEN: '10'
    }
  });


  const patientId = Number(patient?.id);

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

  const vaccinesByIds: any[] = Array.isArray(vaccinesByIdsResp)
    ? vaccinesByIdsResp
    : (vaccinesByIdsResp as any)?.object ?? [];

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

  const isLoadingAny = isFetchingVaccineIds || isFetchingVaccinesByIds || isFetchingDetails;


          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      {isLoadingAny && vaccinesByIds.length === 0 && (
        <div className="loader">
          <Loader content="Loading Vaccines ..." />
        </div>
      )}

      <div className="main-container-btns">
        {vaccinesByIds.map((v: any, index: number) => (
          <MyButton
            key={v?.id ?? index}
            className="main-content-btn"
            onClick={() => {
              setSelectedVaccine(v);
              setPageIndex(0);
              triggerPatientVaccineDetails({
                patientId,
                vaccineId: Number(v.id),
                includeCancelled: showCancelled ? true : false,
                page: 0,
                size: 1000,
                sort: 'id,asc',
                timestamp: Date.now()
              } as any);
            }}
            appearance={selectedVaccine?.id === v?.id ? 'primary' : 'ghost'}
          >
            {v?.name ?? v?.vaccineName ?? ''}
          </MyButton>
        ))}
      </div>

      {isFetchingDetails && (
        <div className="loader">
          <Loader content="Loading Vaccine Details ..." />
        </div>
      )}

      <Form layout="inline" fluid className="form-content-vaccine-fields">
        <Form layout="inline" fluid>
          <MyInput column disabled fieldType="text" fieldLabel="ATC Code" fieldName="atcCode" record={selectedVaccine} />
          <MyInput
            column
            fieldLabel="Type"
            fieldType="select"
            fieldName="type"
            selectData={typeEnumOptions ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={selectedVaccine}
            disabled
          />
          <MyInput
            column
            fieldLabel="Number of Doses"
            fieldType="select"
            fieldName="numberOfDoses"
            selectData={numberOfDoses ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={selectedVaccine}
            disabled
          />
          <MyInput
            column
            fieldLabel="ROA"
            fieldType="select"
            fieldName="roa"
            selectData={roa ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            record={selectedVaccine}
            disabled
          />
          <MyInput column fieldLabel="Site of Administration" fieldName="siteOfAdministration" record={selectedVaccine} disabled />
        </Form>

        <div className="cancel-checkbox-container">
          <Checkbox
            checked={showCancelled}
            onChange={(_value, checked) => {
              setShowCancelled(Boolean(checked));
              setPageIndex(0);
            }}
          />
          <MyLabel label="Show Cancelled Vaccine Doses" />
        </div>
      </Form>

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
    </div>
  );
};

export default VaccineReccord;
