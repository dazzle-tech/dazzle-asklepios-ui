import React, { useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useGetPatientDiagnosesByPatientIdQuery } from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';
import { useGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';
import { useNavigate } from 'react-router-dom';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { useDispatch } from 'react-redux';
import { useLazyGetEncounterByIdQuery } from '@/services/encounters/patientEncounterService';

type Props = {
  patient: any;
};

const DiagnosisTable: React.FC<Props> = ({ patient }) => {
  const navigate = useNavigate();
const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
    const [getEncounterById] = useLazyGetEncounterByIdQuery();

  // 🔥 API call (array response)
  const { data, isLoading } = useGetPatientDiagnosesByPatientIdQuery(
    {
      patientId: patient?.id,
      page,
      size
    },
    { skip: !patient?.id }
  );

  console.log('Diagnosis API:', data);

  // 🔥 API returns array مباشرة
  const diagnoses = data ?? [];
  const totalCount = diagnoses.length;

  // 🔥 ICD IDs (عشان نجيب الاسم)
  const diagnosisIds = useMemo(() => {
    const ids = diagnoses.map((d: any) => Number(d.diagnosisId)).filter(id => !isNaN(id));
    return Array.from(new Set(ids));
  }, [diagnoses]);

  // 🔥 ICD lookup
  const { data: icdDiagnoses } = useGetIcdDiagnosesByIdsQuery(
    { ids: diagnosisIds },
    { skip: !diagnosisIds.length }
  );

  const icdMap = useMemo(() => {
    const map = new Map();
    (icdDiagnoses ?? []).forEach((d: any) =>
      map.set(d.id ?? d.icdDiagnosisUid, d)
    );
    return map;
  }, [icdDiagnoses]);

    const openVisit = async (row: any) => {
    try {
        const fullEncounter = await getEncounterById({ id: row.encounterId }).unwrap();

        dispatch(setEncounter(fullEncounter));
        dispatch(setPatient(patient));

        navigate('/encounter', {
        state: {
            info: 'toEncounter',
            fromPage: 'PatientEMR',
            patient,
            encounter: fullEncounter, // 🔥 كامل
            viewMode: 'readOnly'
        }
        });
    } catch (e) {
        console.error('Failed to load encounter', e);
    }
    };

  const columns = useMemo(() => [
    {
      key: 'encounterId',
      title: <Translate>Encounter ID</Translate>,
      flexGrow: 1,
      render: (row: any) => (
        <span
          style={{
            color: '#0d6efd',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
            onClick={(e) => {
            e.stopPropagation();
            openVisit(row);
            }}
            >
          {row?.encounterId ?? '-'}
        </span>
      )
    },
    {
      key: 'diagnosis',
      title: <Translate>Diagnosis</Translate>,
      flexGrow: 2,
      render: (row: any) => {
        const diag = icdMap.get(Number(row.diagnosisId));
        return diag?.icdShortDescription || diag?.icdCode || row?.diagnosisId || '-';
      }
    },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      flexGrow: 1,
      render: (row: any) => formatEnumString(row?.type)
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: () => '-' // API ما فيه status
    },
    {
      key: 'createdAt',
      title: <Translate>Date</Translate>,
      flexGrow: 1,
      render: (row: any) =>
        row?.createdDate
          ? formatDateWithoutSeconds(row.createdDate)
          : '-'
    }
  ], [icdMap]);

  return (
    <MyTable
      columns={columns}
      data={diagnoses}
      loading={isLoading}
      page={page}
      rowsPerPage={size}
      totalCount={totalCount}
      onPageChange={(_, p) => setPage(p)}
      onRowsPerPageChange={(e) => {
        setSize(Number(e.target.value));
        setPage(0);
      }}
      height={400}
    />
  );
};

export default DiagnosisTable;