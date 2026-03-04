// import React, { useState } from 'react';
// import { Divider, Text } from 'rsuite';
// import MyButton from '@/components/MyButton/MyButton';
// import '../styles.less';
// import MyTable from '@/components/MyTable';
// import { useGetPatientDiagnosisQuery } from '@/services/encounterService';
// import { initialListRequest } from '@/types/types';
// import FullViewTable from './FullViewTable';
// import Section from '@/components/Section';
// const PatientMajorProblem = ({ patient }) => {
//   const [open, setOpen] = useState(false);

//   // Define a list request state with pagination, sorting, and filters to fetch major diagnoses for a patient
//   const [listRequest] = useState({
//     ...initialListRequest,
//     pageSize: 100, // Limit the number of results to 100
//     timestamp: new Date().getMilliseconds(), // Use current timestamp to prevent caching
//     sortBy: 'createdAt', // Sort results by creation date
//     sortType: 'desc', // Show the most recent first
//     filters: [
//       {
//         fieldName: 'patient_key',
//         operator: 'match',
//         value: patient?.key // Filter by the current patient
//       },
//       {
//         fieldName: 'is_major',
//         operator: 'match',
//         value: true // Only include major diagnoses
//       }
//     ]
//   });

//   // Fetch major diagnoses based on the defined request
//   const { data: majorDiagnoses } = useGetPatientDiagnosisQuery(listRequest);
//   // Extract the diagnoses list from the response
//   const majorDiagnosesCodes = majorDiagnoses?.object.map(diagnose => diagnose);
//   // Table Columns
//   const diagnosesColumns = [
//     {
//       key: 'icdCode',
//       title: 'PROBLEM CODE',
//       render: (rowData: any) => rowData.diagnosisObject?.icdCode || ''
//     },
//     {
//       key: 'description',
//       title: 'DESCRIPTION',
//       render: (rowData: any) => rowData.diagnosisObject?.description || ''
//     }
//   ];
//   return (
//     <Section
//       isContainOnlyTable
//       title="Patient Major Problem"
//       content={
//         <MyTable
//           data={majorDiagnosesCodes ?? []}
//           columns={diagnosesColumns}
//           height={250}
//           onRowClick={rowData => {}}
//         />
//       }
//       setOpen={setOpen}
//       rightLink="Full View"
//       openedContent={<FullViewTable open={open} setOpen={setOpen} data={majorDiagnosesCodes} />}
//     />
//   );
// };
// export default PatientMajorProblem;

import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';

import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import Icd10DiagnosisSearch from '@/components/Icd10DiagnosisSearch/Icd10DiagnosisSearch';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import {
  useCreatePatientDiagnosisMutation,
  useGetLatestPatientDiagnosisQuery,
  useGetPatientDiagnosesByPatientIdQuery
} from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';

import { useEnumOptions } from '@/services/enumsApi';
import { useLazyGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';

import type { PatientDiagnosis as PatientDiagnosisType } from '@/types/model-types-new';
// import './styles.less';
import Section from '@/components/Section';
import FullViewTable from './FullViewTable';

type PatientDiagnosisProps = {
  patient: any;
  encounter: any;
  disabled?: boolean;
  title?: React.ReactNode;
  width?: string;
};

const PatientMajorProblem: React.FC<PatientDiagnosisProps> = ({
  patient,
  encounter,
  disabled = false,
  title = 'Patient Diagnosis',
  width = '100%'
}) => {
  const dispatch = useAppDispatch();

  const patientIdNumber: number | null = patient?.id ? Number(patient.id) : null;
  const encounterIdNumber: number | null = encounter?.id ? Number(encounter.id) : null;

  const diagnosisTypeOptions = useEnumOptions('DiagnosisType');

  const {
    data: latestDiagnosis,
    isFetching: isFetchingLatest,
    refetch: refetchLatest,
    error: latestError
  } = useGetLatestPatientDiagnosisQuery(
    { encounterId: encounterIdNumber as any },
    { skip: !encounterIdNumber }
  );

  const [createPatientDiagnosis, { isLoading: isSaving }] = useCreatePatientDiagnosisMutation();

  const [diagnosis, setDiagnosis] = useState<Partial<PatientDiagnosisType>>({
    diagnosisId: null,
    type: null,
    suspected: false,
    major: false
  });
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    setDiagnosis({
      diagnosisId: latestDiagnosis?.diagnosisId ?? null,
      type: latestDiagnosis?.type ?? null,
      suspected: latestDiagnosis?.suspected ?? false,
      major: latestDiagnosis?.major ?? false
    });
  }, [latestDiagnosis?.id, encounterIdNumber]);

  const clearForm = () => {
    setDiagnosis({
      diagnosisId: null,
      type: null,
      suspected: false,
      major: false
    });
  };

  const showApiError = (error: any) => {
    const data = error?.data ?? {};
    const messageProperty: string = data?.message || '';
    const errorKey = messageProperty.startsWith('error.') ? messageProperty.substring(6) : undefined;

    const keyMap: Record<string, string> = {
      'payload.required': 'Patient diagnosis payload is required.',
      'encounterId.required': 'Encounter id is required.',
      notfound: 'No patient diagnosis found for this encounter.',
      'fk.patient': 'Invalid patient_id (patient does not exist).',
      'fk.diagnosis': 'Invalid diagnosis_id (diagnosis does not exist).',
      duplicate: 'This diagnosis already exists for the same patient and encounter with the same attributes.',
      'required.fields': 'Required fields are missing.',
      'db.constraint': 'Database constraint violated while saving patient diagnosis.',
      'http.500': 'Internal server error.'
    };

    const humanMessage =
      (errorKey && keyMap[errorKey]) ||
      data?.detail ||
      data?.title ||
      data?.message ||
      error?.error ||
      'Unexpected error';

    dispatch(notify({ msg: humanMessage, sev: 'error' }));
  };

  useEffect(() => {
    const status = (latestError as any)?.status;
    if (status === 404) return;
    if (latestError) showApiError(latestError);
  }, [latestError]);

  const payload: PatientDiagnosisType = useMemo(() => {
    return {
      patientId: patientIdNumber,
      encounterId: encounterIdNumber,
      diagnosisId: (diagnosis.diagnosisId as any) ?? null,
      type: (diagnosis.type as any) ?? null,
      suspected: diagnosis.suspected ?? false,
      major: diagnosis.major ?? false
    } as PatientDiagnosisType;
  }, [patientIdNumber, encounterIdNumber, diagnosis]);

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
      page: pagination.page,
      size: pagination.size,
      sort: pagination.sort
    } as any,
    { skip: !patientIdNumber }
  );

  // ✅ FIX: backend returns array not Page
  const tableData = useMemo(
    () => (Array.isArray(patientDiagnosesResp) ? patientDiagnosesResp : []),
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
      {
        key: 'type',
        title: <Translate>Type</Translate>,
        flexGrow: 2,
        render: (row: any) => row?.type ?? ''
      },
      {
        key: 'suspected',
        title: <Translate>Suspected</Translate>,
        flexGrow: 2,
        render: (row: any) => (row?.suspected ? 'Yes' : 'No')
      },
      {
        key: 'major',
        title: <Translate>Major</Translate>,
        flexGrow: 2,
        render: (row: any) => (row?.major ? 'Yes' : 'No')
      }
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

  const savingBusy = isFetchingLatest || isSaving;

  const handleSave = async () => {
    if (!payload.patientId) {
      dispatch(notify({ msg: 'Patient id is required.', sev: 'warning' }));
      return;
    }
    if (!payload.encounterId) {
      dispatch(notify({ msg: 'Encounter id is required.', sev: 'warning' }));
      return;
    }
    if (!payload.diagnosisId) {
      dispatch(notify({ msg: 'Diagnosis is required.', sev: 'warning' }));
      return;
    }
    if (!payload.type) {
      dispatch(notify({ msg: 'Type is required.', sev: 'warning' }));
      return;
    }

    try {
      await createPatientDiagnosis(payload as any).unwrap();
      dispatch(notify({ msg: 'Diagnosis saved successfully', sev: 'success' }));
      refetchLatest();
      refetchTable();
      clearForm();
    } catch (error: any) {
      showApiError(error);
    }
  };

  // return (
  //   <div className="pd-root" style={width ? { width } : {}}>
  //         <MyTable
  //           data={tableData}
  //           totalCount={totalCount}
  //           loading={isFetchingTable}
  //           columns={tableColumns}
  //           page={pagination.page}
  //           rowsPerPage={pagination.size}
  //           onPageChange={handlePageChange}
  //           onRowsPerPageChange={handleRowsPerPageChange}
  //         />
  //     </div>
  // );
    return (
    <Section
      isContainOnlyTable
      title="Patient Major Problem"
      content={
       <MyTable
            data={tableData}
            totalCount={totalCount}
            loading={isFetchingTable}
            columns={tableColumns}
            page={pagination.page}
            rowsPerPage={pagination.size}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
      }
      setOpen={setOpen}
      rightLink="Full View"
      openedContent={<FullViewTable open={open} setOpen={setOpen} data={tableData} />}
    />
  );
};

export default PatientMajorProblem;