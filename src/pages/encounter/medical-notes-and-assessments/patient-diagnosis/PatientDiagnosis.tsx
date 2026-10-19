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
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
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

const extractRows = (resp: any): any[] => {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.content)) return resp.content;
  if (Array.isArray(resp?.items)) return resp.items;
  return [];
};

const extractTotal = (resp: any, rows: any[]): number => {
  if (typeof resp?.totalElements === 'number') return resp.totalElements;
  if (typeof resp?.totalCount === 'number') return resp.totalCount;
  if (typeof resp?.count === 'number') return resp.count;
  return rows.length;
};

/** One paginated list of the patient's diagnoses, optionally limited to (or excluding) one encounter. */
const useDiagnosesPage = (
  patientId: number | null,
  encounterId: number | null,
  currentEncounter: boolean,
  skip = false
) => {
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    sort: 'createdDate,desc'
  });

  const { data, isFetching, refetch } = useGetPatientDiagnosesByPatientIdQuery(
    {
      patientId: patientId as any,
      ...(encounterId ? { encounterId, currentEncounter } : {}),
      page: pagination.page,
      size: pagination.size,
      sort: pagination.sort
    },
    { skip: skip || !patientId }
  );

  const rows = useMemo(() => (skip ? [] : extractRows(data)), [data, skip]);
  const totalCount = useMemo(() => extractTotal(data, rows), [data, rows]);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPagination(prev => ({ ...prev, size: newSize, page: 0 }));
  };

  return { rows, totalCount, isFetching, refetch, pagination, handlePageChange, handleRowsPerPageChange };
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

  // Diagnoses added in this visit (all patient diagnoses when there is no encounter)
  const currentVisit = useDiagnosesPage(patientIdNumber, encounterIdNumber, true);
  // Diagnoses added in the patient's previous visits
  const previousVisits = useDiagnosesPage(patientIdNumber, encounterIdNumber, false, !encounterIdNumber);

  const refetchTables = async () => {
    await Promise.all([
      currentVisit.refetch(),
      encounterIdNumber ? previousVisits.refetch() : Promise.resolve()
    ]);
  };

  const [fetchIcdByIds] = useLazyGetIcdDiagnosesByIdsQuery();
  const [icdMap, setIcdMap] = useState<Record<number, any>>({});

  const pageDiagnosisIds = useMemo(() => {
    const ids = [...currentVisit.rows, ...previousVisits.rows]
      .map((r: any) => Number(r?.diagnosisId))
      .filter((v: any) => Number.isFinite(v) && v > 0);

    return Array.from(new Set(ids));
  }, [currentVisit.rows, previousVisits.rows]);

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
      await refetchTables();

      onDiagnosisSaved?.();
    } catch (error: any) {
      showApiError(error);
    }
  };


  const UserDateCell = ({
    login,
    date
  }: {
    login?: string;
    date?: string;
  }) => {
    const { data: fullName } = useGetUserFullNameByLoginQuery(login, {
      skip: !login
    });

    if (!date && !login) return null;

    return (
      <>
        {fullName || login || ''}
        <br />
        <span className="date-table-style">
          {date ? formatDateWithoutSeconds(date) : ''}
        </span>
      </>
    );
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
          <UserDateCell
            login={row.createdBy}
            date={row.createdDate}
          />
        )
      },
      {
        key: 'actions',
        title: <Translate>Actions</Translate>,
        flexGrow: 1,
        render: (row: any) => {
          const canDelete =
            Number(row.encounterId) === encounterIdNumber;

          return (
            <button
              type="button"
              className="pd-delete-btn"
              onClick={() => handleOpenDeleteModal(row)}
              disabled={disabled || isDeleting || !canDelete}
              style={{
                border: 'none',
                background: 'transparent',
                cursor:
                  disabled || isDeleting || !canDelete
                    ? 'not-allowed'
                    : 'pointer'
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          );
        }
      }
    ],
    [icdMap, disabled, isDeleting, encounterIdNumber]
  );

  const previousTableColumns = useMemo(
    () => tableColumns.filter(col => col.key !== 'actions'),
    [tableColumns]
  );

  const savingBusy = isFetchingLatest || isSaving;

useEffect(() => {
  console.log('DIAGNOSIS', diagnosis);
}, [diagnosis]);

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

      dispatch(
        notify({
          msg: 'Diagnosis saved successfully',
          sev: 'success'
        })
      );

      clearForm();
      console.log('CLEARED');
      await refetchTables();

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
                <MyInput
                  width="15vw"
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

                <MyInput
                  width="100%"
                  fieldLabel="Suspected"
                  fieldType="checkbox"
                  fieldName="suspected"
                  record={diagnosis}
                  setRecord={setDiagnosis}
                  disabled={disabled}
                />

                <MyInput
                  width="100%"
                  fieldLabel="Chronic"
                  fieldType="checkbox"
                  fieldName="major"
                  record={diagnosis}
                  setRecord={setDiagnosis}
                  disabled={disabled}
                />
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
            <Translate>{encounterIdNumber ? 'Current Visit Diagnoses' : 'Diagnoses'}</Translate>
          </div>

          <MyTable
            data={currentVisit.rows}
            totalCount={currentVisit.totalCount}
            loading={currentVisit.isFetching}
            columns={tableColumns}
            page={currentVisit.pagination.page}
            rowsPerPage={currentVisit.pagination.size}
            onPageChange={currentVisit.handlePageChange}
            onRowsPerPageChange={currentVisit.handleRowsPerPageChange}
          />

          {encounterIdNumber && (
            <div className="pd-section">
              <div className="pd-card-title">
                <Translate>Previous Visits Diagnoses</Translate>
              </div>

              <MyTable
                data={previousVisits.rows}
                totalCount={previousVisits.totalCount}
                loading={previousVisits.isFetching}
                columns={previousTableColumns}
                page={previousVisits.pagination.page}
                rowsPerPage={previousVisits.pagination.size}
                onPageChange={previousVisits.handlePageChange}
                onRowsPerPageChange={previousVisits.handleRowsPerPageChange}
              />
            </div>
          )}
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