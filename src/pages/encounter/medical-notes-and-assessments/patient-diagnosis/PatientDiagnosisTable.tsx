import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';

import {
  useGetPatientDiagnosesByPatientIdQuery,
  useHardDeletePatientDiagnosisMutation
} from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';
import { useLazyGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';

import type { PatientDiagnosis as PatientDiagnosisType } from '@/types/model-types-new';

type PatientDiagnosisTableProps = {
  patient: any;
  disabled?: boolean;
  width?: string;
  onDiagnosisDeleted?: () => void;
  onSelectDiagnosis?: (ids: number[]) => void;
  selectMode?: boolean;
};

const PatientDiagnosisTable: React.FC<PatientDiagnosisTableProps> = ({
  patient,
  disabled = false,
  width = '100%',
  onDiagnosisDeleted,
  onSelectDiagnosis,
  selectMode = false
}) => {
  const dispatch = useAppDispatch();

  const patientIdNumber: number | null = patient?.id ? Number(patient.id) : null;
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
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

  const tableData = useMemo(() => {
    if (Array.isArray(patientDiagnosesResp)) return patientDiagnosesResp;
    if (Array.isArray((patientDiagnosesResp as any)?.data)) {
      return (patientDiagnosesResp as any).data;
    }
    if (Array.isArray((patientDiagnosesResp as any)?.content)) {
      return (patientDiagnosesResp as any).content;
    }
    if (Array.isArray((patientDiagnosesResp as any)?.items)) {
      return (patientDiagnosesResp as any).items;
    }
    return [];
  }, [patientDiagnosesResp]);

  const totalCount = useMemo(() => {
    if (typeof (patientDiagnosesResp as any)?.totalElements === 'number') {
      return (patientDiagnosesResp as any).totalElements;
    }
    if (typeof (patientDiagnosesResp as any)?.totalCount === 'number') {
      return (patientDiagnosesResp as any).totalCount;
    }
    if (typeof (patientDiagnosesResp as any)?.count === 'number') {
      return (patientDiagnosesResp as any).count;
    }
    return tableData.length;
  }, [patientDiagnosesResp, tableData]);

  const [fetchIcdByIds] = useLazyGetIcdDiagnosesByIdsQuery();
  const [icdMap, setIcdMap] = useState<Record<number, any>>({});

  const [hardDeletePatientDiagnosis, { isLoading: isDeleting }] =
    useHardDeletePatientDiagnosisMutation();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDiagnosisToDelete, setSelectedDiagnosisToDelete] =
    useState<PatientDiagnosisType | null>(null);

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
        const resp = await fetchIcdByIds({
          ids: missing,
          timestamp: Date.now()
        }).unwrap();

        if (cancelled) return;

        setIcdMap(prev => {
          const next = { ...prev };
          for (const dto of resp ?? []) {
            const id = Number((dto as any)?.id);
            if (Number.isFinite(id) && id > 0) {
              next[id] = dto;
            }
          }
          return next;
        });
      } catch {
        //
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [pageDiagnosisIds, fetchIcdByIds, icdMap]);

  const handleOpenDeleteModal = (row: PatientDiagnosisType) => {
    setSelectedDiagnosisToDelete(row);
    setDeleteModalOpen(true);
  };

  const handleConfirmHardDelete = async () => {
    if (!selectedDiagnosisToDelete?.id) {
      dispatch(notify({ msg: 'Diagnosis id is required.', sev: 'warning' }));
      return;
    }

    try {
      await hardDeletePatientDiagnosis({ id: selectedDiagnosisToDelete.id }).unwrap();

      dispatch(notify({ msg: 'Diagnosis deleted successfully', sev: 'success' }));
      setDeleteModalOpen(false);
      setSelectedDiagnosisToDelete(null);

      await refetchTable();
      onDiagnosisDeleted?.();
    } catch (error: any) {
      const data = error?.data ?? {};
      const humanMessage =
        data?.detail || data?.title || data?.message || error?.error || 'Unexpected error';

      dispatch(notify({ msg: humanMessage, sev: 'error' }));
    }
  };

  const tableColumns = useMemo(() => [
    {
      key: 'select',
      title: '',
      width: 50,
      align: 'center',
      render: (row: any) => {
        console.log('🧾 ROW DATA:', row);

        return (
          <input
            type="checkbox"
            checked={selectedIds.includes(row.diagnosisId)}
            onChange={() => {
              const icdId = row.diagnosisId;
              const patientKey = row?.patient?.id;
              const visitKey = row?.encounterId;

              console.log('🔥 SELECTED FULL DATA:', {
                icdId,
                patientKey,
                visitKey
              });

              setSelectedIds([icdId]);

              if (selectMode && onSelectDiagnosis) {
                onSelectDiagnosis([icdId]);
              }

              // 🔥 أهم خطوة
              setPrescriptionMedications(prev => ({
                ...prev,
                indicationIcd: icdId,
                patientKey: patientKey,
                visitKey: visitKey
              }));
            }}
          />
        );
      }
    },
    {
      key: 'diagnosisId',
      title: <Translate>Code</Translate>,
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
      render: (row: any) => formatEnumString(row?.type ?? '')
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
    },
    {
      key: 'created',
      title: <Translate>Created</Translate>,
      flexGrow: 2,
      render: (row: any) =>
        row.createdDate ? formatDateWithoutSeconds(row.createdDate) : ''
    }
  ], [icdMap, selectedIds]);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPagination(prev => ({ ...prev, size: newSize, page: 0 }));
  };

  useEffect(() => {
    console.log('🧠 ICD MAP:', icdMap);
  }, [icdMap]);

  return (
    <div style={width ? { width } : {}}>

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

      <DeletionConfirmationModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        itemToDelete="diagnosis"
        actionType="delete"
        confirmationQuestion="Are you sure you want to permanently delete this diagnosis?"
        actionButtonLabel={isDeleting ? 'Deleting...' : 'Delete'}
        actionButtonFunction={handleConfirmHardDelete}
      />
    </div>
  );
};

export default PatientDiagnosisTable;