

import React, { useEffect, useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useGetPatientDiagnosesByPatientIdQuery
} from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';
import { useLazyGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';
import type { PatientDiagnosis as PatientDiagnosisType } from '@/types/model-types-new';
import Section from '@/components/Section';
import FullViewTable from './FullViewTable';

type PatientDiagnosisProps = {
  patient: any;
  encounter: any;
};

const PatientMajorProblem: React.FC<PatientDiagnosisProps> = ({
  patient,
  encounter,
}) => {
  const dispatch = useAppDispatch();

  const patientIdNumber: number | null = patient?.id ? Number(patient.id) : null;

 const [open, setOpen] = useState<boolean>(false);

  const [diagnosis, setDiagnosis] = useState<Partial<PatientDiagnosisType>>({
    diagnosisId: null,
    type: null,
    suspected: false,
    major: false
  });

  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    sort: 'createdDate,desc'
  });

  const {
    data: patientDiagnosesResp,
    isFetching: isFetchingTable,
    refetch: refetchTable
  } = useGetPatientDiagnosesByPatientIdQuery(
    {
      patientId: patientIdNumber as any,
      // page: pagination.page,
      // size: pagination.size,
      // sort: pagination.sort
    } as any,
    { skip: !patientIdNumber }
  );


  // ✅ FIX: backend returns array not Page
  const tableData = useMemo(
  () =>
    Array.isArray(patientDiagnosesResp)
      ? patientDiagnosesResp.filter(item => item?.major === true)
      : [],
  [patientDiagnosesResp]
);

  // ✅ FIX: totalCount from array length (or later from header if you implement it)
  const totalCount = tableData.length;

  const [fetchIcdByIds] = useLazyGetIcdDiagnosesByIdsQuery();
  const [icdMap, setIcdMap] = useState<Record<number, any>>({});

  const pageDiagnosisIds = useMemo(() => {
    const ids = (tableData ?? [])
      .map((r: any) => Number(r?.diagnosisId))
      .filter((v: any) => Number.isFinite(v) && v > 0);
    return Array.from(new Set(ids));
  }, [tableData]);

  

  const tableColumns = useMemo(
    () => [
      {
        key: 'diagnosisId',
        title: <Translate>Diagnosis Code</Translate>,
        flexGrow: 2,
        render: (row: any) => {
          const id = Number(row?.diagnosisId);
          const icd = id ? icdMap[id] : null;
          return icd?.icdCode ?? '';
        }
      },
      {
        key: 'diagnosisDesc',
        title: <Translate>Description</Translate>,
        flexGrow: 6,
        render: (row: any) => {
          const id = Number(row?.diagnosisId);
          const icd = id ? icdMap[id] : null;
          return icd?.icdShortDescription || icd?.icdFullDescription || '';
        }
      },
      
    ],
    [icdMap]
  );

  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPagination(prev => ({ ...prev, size: newSize, page: 0 }));
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!pageDiagnosisIds.length) return;

      const missing = pageDiagnosisIds.filter(id => !icdMap[id]);
      if (!missing.length) return;

      try {
        const resp = await fetchIcdByIds({ ids: missing, timestamp: Date.now() }).unwrap();
        if (cancelled) return;

        setIcdMap(prev => {
          const next = { ...prev };
          for (const dto of resp ?? []) {
            const id = Number((dto as any)?.id);
            if (Number.isFinite(id) && id > 0) next[id] = dto;
          }
          return next;
        });
      } catch {
        // ignore
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [pageDiagnosisIds, fetchIcdByIds, icdMap]);
  
 
    return (
    <Section
      isContainOnlyTable
      title="Patient Major Problem"
      content={
       <MyTable
            data={tableData}
            loading={isFetchingTable}
            columns={tableColumns}
          />
      }
      setOpen={setOpen}
      rightLink="Full View"
      openedContent={<FullViewTable open={open} setOpen={setOpen} data={tableData} icdMap={icdMap}/>}
    />
  );
};

export default PatientMajorProblem;