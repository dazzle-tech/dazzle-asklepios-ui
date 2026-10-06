import React, { useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { Form, Message } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useGetAmendmentSummariesQuery,
  useGetEncountersByPatientQuery,
  useFinishAmendmentMutation,
  useStartAmendmentMutation,
  type EncounterAmendmentSummary
} from '@/services/encounters/patientEncounterService';
import { useGetDepartmentByIdQuery } from '@/services/security/departmentService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetPractitionerByIdQuery } from '@/services/setup/practitioner/PractitionerService';
import type { Patient, PatientEncounter } from '@/types/model-types-new';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import {
  getEncounterLifecycleStatus,
  getEncounterTreatmentStatus
} from '@/utils/encounterStatusHelpers';
import { notify } from '@/utils/uiReducerActions';
import { useNavigate } from 'react-router-dom';
import AmendmentHistoryModal from './AmendmentHistoryModal';

const AMENDABLE_STATUSES = new Set(['COMPLETED', 'DISCHARGED']);

const DepartmentName = ({ id }: { id?: number }) => {
  const { currentData, isFetching, isError } = useGetDepartmentByIdQuery(id ?? skipToken);
  if (isFetching) return <Translate>Loading...</Translate>;
  if (isError) return <Translate>Unavailable</Translate>;
  return <>{currentData?.name || '-'}</>;
};

const PractitionerName = ({ id }: { id?: number }) => {
  const { currentData, isFetching, isError } = useGetPractitionerByIdQuery(id ?? skipToken);
  if (isFetching) return <Translate>Loading...</Translate>;
  if (isError) return <Translate>Unavailable</Translate>;
  return <>{[currentData?.firstName, currentData?.lastName].filter(Boolean).join(' ') || '-'}</>;
};

const PatientVisits = ({ patient }: { patient: Patient }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [amendTarget, setAmendTarget] = useState<PatientEncounter | null>(null);
  const [finishTarget, setFinishTarget] = useState<{
    encounterId: number;
    sessionId: number;
    sessionNumber?: number | null;
    typeOfReopen?: string | null;
    reason?: string | null;
  } | null>(null);
  const [reasonForm, setReasonForm] = useState<{ typeOfReopen: string; reason: string }>({
    typeOfReopen: '',
    reason: ''
  });
  const typeOfReopenOptions = useEnumOptions('TypeOfReopen');
  const [historyEncounterId, setHistoryEncounterId] = useState<number | null>(null);
  const patientId = patient.id;
  const { currentData, isFetching, isError, refetch } = useGetEncountersByPatientQuery(
    { patientId: patientId ?? 0, page, size: rowsPerPage, sort: 'createdDate,desc' },
    { skip: patientId == null, refetchOnMountOrArgChange: true }
  );
  const encounterIds = useMemo(
    () => (currentData?.data ?? []).map(row => Number(row.id)).filter(id => Number.isFinite(id)),
    [currentData]
  );
  const { currentData: summaries } = useGetAmendmentSummariesQuery(encounterIds, {
    skip: encounterIds.length === 0
  });
  const summaryByEncounter = useMemo(() => {
    const map = new Map<number, EncounterAmendmentSummary>();
    (summaries ?? []).forEach(summary => map.set(Number(summary.encounterId), summary));
    return map;
  }, [summaries]);
  const [startAmendment, { isLoading: isStartingAmendment }] = useStartAmendmentMutation();
  const [finishAmendment, { isLoading: isFinishingAmendment }] = useFinishAmendmentMutation();

  const openEncounter = (row: PatientEncounter, amendmentOpen: boolean) => {
    const encounter = amendmentOpen
      ? { ...row, status: 'ONGOING', treatmentStatus: 'ONGOING' }
      : row;
    navigate('/encounter', {
      state: {
        info: 'toEncounter',
        fromPage: 'Encounter_Status_Management',
        patient,
        encounter,
        viewMode: amendmentOpen ? undefined : 'readOnly',
        isAmendmentOpen: amendmentOpen
      }
    });
  };

  const confirmAmendment = async () => {
    if (amendTarget?.id == null) return;
    const typeOfReopen = String(reasonForm.typeOfReopen ?? '').trim();
    const reason = String(reasonForm.reason ?? '').trim();
    if (!typeOfReopen) {
      dispatch(notify({ msg: 'A type of reopen is required to amend a visit.', sev: 'warning' }));
      return;
    }
    if (!reason) {
      dispatch(notify({ msg: 'A reason is required to amend a visit.', sev: 'warning' }));
      return;
    }
    try {
      await startAmendment({ encounterId: amendTarget.id, typeOfReopen, reason }).unwrap();
      dispatch(notify({ msg: 'Visit amendment started', sev: 'success' }));
      const target = amendTarget;
      setAmendTarget(null);
      setReasonForm({ typeOfReopen: '', reason: '' });
      openEncounter(target, true);
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || error?.data?.message || 'Unable to start the visit amendment',
          sev: 'warning'
        })
      );
    }
  };

  const confirmFinish = async () => {
    if (finishTarget == null) return;
    try {
      await finishAmendment({
        encounterId: finishTarget.encounterId,
        sessionId: finishTarget.sessionId
      }).unwrap();
      dispatch(notify({ msg: 'Visit amendment finished', sev: 'success' }));
      setFinishTarget(null);
      refetch();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || error?.data?.message || 'Unable to finish the visit amendment',
          sev: 'warning'
        })
      );
    }
  };

  const columns = [
    {
      key: 'encounterNumber',
      title: <Translate>Encounter Number</Translate>,
      render: (row: PatientEncounter) => row.encounterNumber || '-'
    },
    {
      key: 'encounterDate',
      title: <Translate>Visit Date</Translate>,
      render: (row: PatientEncounter) =>
        row.encounterDate ? formatDateWithoutSeconds(row.encounterDate) : '-'
    },
    {
      key: 'encounterType',
      title: <Translate>Encounter Type</Translate>,
      render: (row: PatientEncounter) => formatEnumString(row.encounterType) || '-'
    },
    {
      key: 'practitioner',
      title: <Translate>Practitioner</Translate>,
      render: (row: PatientEncounter) => <PractitionerName id={row.practitionerId} />
    },
    {
      key: 'encounterStatus',
      title: <Translate>Status</Translate>,
      render: (row: PatientEncounter) => formatEnumString(getEncounterLifecycleStatus(row)) || '-'
    },
    {
      key: 'treatmentStatus',
      title: <Translate>Treatment Status</Translate>,
      render: (row: PatientEncounter) => formatEnumString(getEncounterTreatmentStatus(row)) || '-'
    },
    {
      key: 'department',
      title: <Translate>Department</Translate>,
      render: (row: PatientEncounter) => <DepartmentName id={row.departmentId} />
    },
    {
      key: 'amendments',
      title: <Translate>Amendments</Translate>,
      render: (row: PatientEncounter) => summaryByEncounter.get(Number(row.id))?.amendmentCount ?? 0
    },
    {
      key: 'amendmentStatus',
      title: <Translate>Amendment Status</Translate>,
      render: (row: PatientEncounter) => {
        const summary = summaryByEncounter.get(Number(row.id));
        if (!summary || summary.amendmentCount === 0) return '-';
        return summary.amendmentOpen ? 'OPEN' : 'CLOSED';
      }
    },
    {
      key: 'latestTypeOfReopen',
      title: <Translate>Type Of Reopen</Translate>,
      render: (row: PatientEncounter) => {
        const typeOfReopen = summaryByEncounter.get(Number(row.id))?.latestTypeOfReopen;
        return typeOfReopen ? formatEnumString(typeOfReopen) : '-';
      }
    },
    {
      key: 'latestReason',
      title: <Translate>Latest Reason</Translate>,
      render: (row: PatientEncounter) => summaryByEncounter.get(Number(row.id))?.latestReason || '-'
    },
    {
      key: 'amendedBy',
      title: <Translate>Amended By</Translate>,
      render: (row: PatientEncounter) => summaryByEncounter.get(Number(row.id))?.amendedBy || '-'
    },
    {
      key: 'amendedAt',
      title: <Translate>Amended At</Translate>,
      render: (row: PatientEncounter) => {
        const amendedAt = summaryByEncounter.get(Number(row.id))?.amendedAt;
        return amendedAt ? formatDateWithoutSeconds(amendedAt) : '-';
      }
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      render: (row: PatientEncounter) => {
        const summary = summaryByEncounter.get(Number(row.id));
        const amendmentOpen = Boolean(summary?.amendmentOpen);
        const canAmend =
          !amendmentOpen && AMENDABLE_STATUSES.has(getEncounterTreatmentStatus(row));
        return (
          <div className="admin-visit-actions">
            <MyButton size="small" appearance="ghost" onClick={() => openEncounter(row, false)}>
              <Translate>View</Translate>
            </MyButton>
            {amendmentOpen && (
              <MyButton size="small" onClick={() => openEncounter(row, true)}>
                <Translate>Open Amendment</Translate>
              </MyButton>
            )}
            {amendmentOpen && summary?.openSessionId != null && (
              <MyButton
                size="small"
                appearance="ghost"
                onClick={() =>
                  setFinishTarget({
                    encounterId: Number(row.id),
                    sessionId: Number(summary.openSessionId),
                    sessionNumber: summary.latestSessionNumber,
                    typeOfReopen: summary.latestTypeOfReopen,
                    reason: summary.latestReason
                  })
                }
              >
                <Translate>Finish Amendment</Translate>
              </MyButton>
            )}
            {canAmend && (
              <MyButton
                size="small"
                onClick={() => {
                  setReasonForm({ typeOfReopen: '', reason: '' });
                  setAmendTarget(row);
                }}
              >
                <Translate>Amend Visit</Translate>
              </MyButton>
            )}
            {(summary?.amendmentCount ?? 0) > 0 && (
              <MyButton
                size="small"
                appearance="ghost"
                onClick={() => setHistoryEncounterId(Number(row.id))}
              >
                <Translate>Amendment History</Translate>
              </MyButton>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <SectionContainer
      title={<Translate>Patient Visits</Translate>}
      content={
        <>
          {isError && (
            <Message type="error">
              <Translate>Unable to load patient visits.</Translate>{' '}
              <MyButton appearance="link" onClick={() => refetch()}>
                Retry
              </MyButton>
            </Message>
          )}
          <MyTable
            data={currentData?.data ?? []}
            columns={columns}
            loading={isFetching}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={currentData?.totalCount ?? 0}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={event => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
            dontTranslateData
          />
          <MyModal
            open={amendTarget != null}
            setOpen={open => {
              if (!open) {
                setAmendTarget(null);
                setReasonForm({ typeOfReopen: '', reason: '' });
              }
            }}
            title={<Translate>Amend Visit</Translate>}
            size="36vw"
            bodyheight="auto"
            actionButtonLabel="Confirm"
            actionButtonLoading={isStartingAmendment}
            isDisabledActionBtn={
              !String(reasonForm.typeOfReopen ?? '').trim() || !String(reasonForm.reason ?? '').trim()
            }
            actionButtonFunction={confirmAmendment}
            content={
              <Form fluid>
                <MyInput
                  width="100%"
                  fieldType="select"
                  fieldLabel="Type Of Reopen"
                  fieldName="typeOfReopen"
                  selectData={typeOfReopenOptions}
                  record={reasonForm}
                  setRecord={setReasonForm}
                  required
                />
                <MyInput
                  width="100%"
                  fieldType="textarea"
                  fieldLabel="Reason"
                  fieldName="reason"
                  height={120}
                  record={reasonForm}
                  setRecord={setReasonForm}
                  required
                />
              </Form>
            }
          />
          <AmendmentHistoryModal
            open={historyEncounterId != null}
            encounterId={historyEncounterId}
            onClose={() => setHistoryEncounterId(null)}
          />
          <MyModal
            open={finishTarget != null}
            setOpen={open => {
              if (!open) setFinishTarget(null);
            }}
            title={<Translate>Finish Amendment</Translate>}
            size="36vw"
            bodyheight="auto"
            actionButtonLabel="Finish Amendment"
            actionButtonLoading={isFinishingAmendment}
            actionButtonFunction={confirmFinish}
            content={
              <div>
                <p>
                  <Translate>Are you sure you want to finish this amendment?</Translate>
                </p>
                <p>
                  <Translate>Amendment</Translate> #{finishTarget?.sessionNumber ?? '-'}
                </p>
                <p>
                  <Translate>Type Of Reopen</Translate>:{' '}
                  {finishTarget?.typeOfReopen ? formatEnumString(finishTarget.typeOfReopen) : '-'}
                </p>
                <p>
                  <Translate>Reason</Translate>: {finishTarget?.reason || '-'}
                </p>
              </div>
            }
          />
        </>
      }
    />
  );
};

export default PatientVisits;
