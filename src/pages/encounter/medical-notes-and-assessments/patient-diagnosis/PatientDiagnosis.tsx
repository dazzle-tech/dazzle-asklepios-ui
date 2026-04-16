import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import Icd10DiagnosisSearch from '@/components/Icd10DiagnosisSearch/Icd10DiagnosisSearch';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import {
  useCreatePatientDiagnosisMutation,
  useGetLatestPatientDiagnosisQuery,
  useGetPatientDiagnosesByPatientIdQuery,
  useHardDeletePatientDiagnosisMutation
} from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';

import { useEnumOptions } from '@/services/enumsApi';
import { useLazyGetIcdDiagnosesByIdsQuery } from '@/services/setup/icdTreeService';

import type { PatientDiagnosis as PatientDiagnosisType } from '@/types/model-types-new';
import './styles.less';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';

type PatientDiagnosisProps = {
  patient: any;
  encounter: any;
  disabled?: boolean;
  title?: React.ReactNode;
  width?: string;
  onDiagnosisSaved?: () => void;
};

const PatientDiagnosis: React.FC<PatientDiagnosisProps> = ({
  patient,
  encounter,
  disabled = false,
  title = 'Patient Diagnosis',
  width = '100%',
  onDiagnosisSaved
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
  const [hardDeletePatientDiagnosis, { isLoading: isDeleting }] =
    useHardDeletePatientDiagnosisMutation();

  const [diagnosis, setDiagnosis] = useState<Partial<PatientDiagnosisType>>({
    diagnosisId: null,
    type: null,
    suspected: false,
    major: false
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDiagnosisToDelete, setSelectedDiagnosisToDelete] =
    useState<PatientDiagnosisType | null>(null);

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
      'primary.already.exists': 'Only one PRIMARY diagnosis is allowed per encounter.',
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

      await refetchLatest();
      await refetchTable();

      onDiagnosisSaved?.();
    } catch (error: any) {
      showApiError(error);
    }
  };

  const tableColumns = useMemo(
    () => [
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
        title: <Translate>Chronic</Translate>,
        flexGrow: 2,
        render: (row: any) => (row?.major ? 'Yes' : 'No')
      },
      {
        key: 'created',
        title: <Translate>Created By / At</Translate>,
        expandable: true,
        flexGrow: 2,
        render: row => (
          <>
            {row.createdBy}
            <br />
            <span className="date-table-style">
              {row.createdDate ? formatDateWithoutSeconds(row.createdDate) : ''}
            </span>
          </>
        )
      },
      {
        key: 'actions',
        title: <Translate>Actions</Translate>,
        flexGrow: 1,
        render: (row: any) => (
          <button
            type="button"
            className="pd-delete-btn"
            onClick={() => handleOpenDeleteModal(row)}
            disabled={disabled || isDeleting}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: disabled || isDeleting ? 'not-allowed' : 'pointer'
            }}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        )
      }
    ],
    [icdMap, disabled, isDeleting]
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
      const createResponse = await createPatientDiagnosis(payload as any).unwrap();

      setDiagnosis(previousDiagnosis => ({
        ...previousDiagnosis,
        ...createResponse,
        patientId: patientIdNumber,
        encounterId: encounterIdNumber,
        id: undefined
      }));

      dispatch(notify({ msg: 'Diagnosis saved successfully', sev: 'success' }));

      await refetchLatest();
      await refetchTable();

      onDiagnosisSaved?.();
    } catch (error: any) {
      showApiError(error);
    }
  };

  const handleClear = () => {
    clearForm();
  };

  return (
    <div className="pd-root" style={width ? { width } : {}}>
      <div className="pd-grid">
        <div className="pd-card">
          <div className="pd-card-title">
            <Translate>{title}</Translate>
          </div>

          <Form fluid>
            <Icd10DiagnosisSearch
              diagnosisId={(diagnosis.diagnosisId as any) ?? null}
              setDiagnosisId={(id: number | null) =>
                setDiagnosis(prev => ({ ...prev, diagnosisId: id }))
              }
              label=""
              disabled={disabled}
            />

            <div className="pd-fields-inline">
              <div className="pd-field">
                <MyInput
                  required
                  fieldType="select"
                  selectData={diagnosisTypeOptions ?? []}
                  selectDataLabel="label"
                  selectDataValue="value"
                  fieldName="type"
                  record={diagnosis}
                  setRecord={setDiagnosis}
                  fieldLabel="Type"
                  disabled={disabled}
                />
              </div>

              <div className="pd-field-switch">
                <MyInput
                  fieldLabel="Suspected"
                  fieldType="checkbox"
                  fieldName="suspected"
                  record={diagnosis}
                  setRecord={setDiagnosis}
                  disabled={disabled}
                />
              </div>

              <div className="pd-field-switch">
                <MyInput
                  fieldLabel="Chronic"
                  fieldType="checkbox"
                  fieldName="major"
                  record={diagnosis}
                  setRecord={setDiagnosis}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="pd-footer">
              <MyButton onClick={handleSave} disabled={disabled || savingBusy}>
                Save
              </MyButton>

              <MyButton onClick={handleClear} disabled={disabled || savingBusy}>
                Clear
              </MyButton>
            </div>
          </Form>
        </div>

        <div className="pd-card">
          <div className="pd-card-title">
            <Translate>Diagnoses</Translate>
          </div>

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
        </div>
      </div>

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

export default PatientDiagnosis;