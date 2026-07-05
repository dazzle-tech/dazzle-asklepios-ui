import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Tooltip, Whisper } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';

import {
  useGetEncountersByPatientQuery,
  useCancelEncounterMutation,
  useCompleteEncounterMutation
} from '@/services/encounters/patientEncounterService';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRectangleXmark,
  faPowerOff,
  faCheckDouble,
  faFileInvoiceDollar
} from '@fortawesome/free-solid-svg-icons';

import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';

import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useGetPractitionersBulkMutation } from '@/services/setup/practitioner/PractitionerService';
import type { Practitioner, Department } from '@/types/model-types-new';
import PatientQuickAppointment from './PatientQuickAppoinment/PatientQuickAppointment';
import { formatEnumString } from '@/utils';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';
import EncounterDischarge from '@/pages/encounter/encounter-component/encounter-discharge';
import { useLazyGetDiagnosisFlagsByEncounterIdsQuery } from '@/services/medicalsheetsEncounter/clinicalVisit/patientDiagnosisService';
import './styles.less';

const EMPTY_ENCOUNTERS: any[] = [];

const PatientVisitHistoryTable = ({ localPatient, encounterRefetchTrigger }: any) => {
  const dispatch = useDispatch();
  const tooltipContainerRef = useRef<HTMLDivElement | null>(null);
  const getTooltipContainer = () => tooltipContainerRef.current || document.body;

  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openDischargeModal, setOpenDischargeModal] = useState(false);

  const [quickAppointmentModel, setQuickAppointmentModel] = useState(false);
  const [quickInitialStep, setQuickInitialStep] = useState<number>(0);
  const [practitionersMap, setPractitionersMap] = useState<Record<number | string, Practitioner>>(
    {}
  );

  const { data: departments = [] } = useGetAllDepartmentsWithoutPaginationQuery();

  const [getPractitionersBulk] = useGetPractitionersBulkMutation();
  const [fetchDiagnosisFlags, { data: diagnosisFlags }] =
    useLazyGetDiagnosisFlagsByEncounterIdsQuery();


  const departmentsMap = useMemo(
    () =>
      Object.fromEntries(
        departments.map((d: Department) => [d.id, d])
      ),
    [departments]
  );

  const { data, isFetching, refetch } = useGetEncountersByPatientQuery(
    {
      patientId: localPatient?.id,
      page: 0,
      size: 50,
      sort: 'createdDate,desc'
    },
    {
      skip: !localPatient?.id,
      refetchOnMountOrArgChange: true,
      pollingInterval: 0
    }
  );

  const encounters = data?.data ?? EMPTY_ENCOUNTERS;

  const [cancelEncounter] = useCancelEncounterMutation();
  const [completeEncounter] = useCompleteEncounterMutation();

  useEffect(() => {
    if (encounterRefetchTrigger > 0) {
      refetch();
    }
  }, [encounterRefetchTrigger, refetch]);

  const handleCancel = async () => {
    if (!selectedVisit) return;

    try {
      await cancelEncounter({ id: selectedVisit.id }).unwrap();
      dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
      setOpenCancelModal(false);
      refetch();
    } catch (err: any) {
      const errorMap: Record<string, string> = {
        'error.cancel.notAllowed.rule': 'Cancellation is not allowed for the current encounter status.',
        'error.cancel.notAllowed.hasObservation': 'Cannot cancel encounter with observations'
      };

      const backendMessage = err?.data?.message;
      const msg = errorMap[backendMessage] || 'Error cancelling encounter';

      dispatch(notify({ msg, sev: 'error' }));
    }
  };

  const handleComplete = async (row: any) => {
    try {
      await completeEncounter({ id: row.id }).unwrap();
      dispatch(notify({ msg: 'Completed Successfully', sev: 'success' }));
      refetch();
    } catch (err: any) {
      const errorMap: Record<string, string> = {
        'error.complete.notAllowed': 'Cannot complete unless status is ONGOING or TRIAGE STARTED',
        'error.id.notfound': 'Encounter not found'
      };

      const backendMessage = err?.data?.message;
      const msg = errorMap[backendMessage] || 'Error completing encounter';

      dispatch(notify({ msg, sev: 'error' }));
    }
  };

  const handleEncounterSaved = async () => {
    await refetch();
  };

  const practitionerIds = useMemo(
    () =>
      Array.from(
        new Set(encounters.map((e: any) => e.practitionerId).filter((id: any) => id != null))
      ),
    [encounters]
  );

  const encounterIds = useMemo(
    () => encounters.map((e: any) => e.id).filter((id: any) => id != null),
    [encounters]
  );

  useEffect(() => {
    if (!practitionerIds.length) {
      setPractitionersMap(prev => (Object.keys(prev).length ? {} : prev));
      return;
    }

    const load = async () => {
      try {
        const practitioners = await getPractitionersBulk(practitionerIds).unwrap();
        const nextMap = Object.fromEntries(practitioners.map((p: Practitioner) => [p.id, p]));

        setPractitionersMap(prev => {
          const prevKeys = Object.keys(prev);
          const nextKeys = Object.keys(nextMap);
          if (
            prevKeys.length === nextKeys.length &&
            prevKeys.every(key => prev[key] === nextMap[key])
          ) {
            return prev;
          }
          return nextMap;
        });
      } catch {}
    };

    load();
  }, [practitionerIds, getPractitionersBulk]);

  useEffect(() => {
    if (!encounterIds.length) return;
    fetchDiagnosisFlags({ encounterIds });
  }, [encounterIds, fetchDiagnosisFlags]);

  const diagnosisMap = useMemo(() => {
    return Object.fromEntries(
      diagnosisFlags?.map((item: any) => [item.encounterId, item.hasPrimaryDiagnoses]) || []
    );
  }, [diagnosisFlags]);

  const handleCloseQuickAppointment = useCallback(
    (val: boolean) => {
      setQuickAppointmentModel(val);
      if (!val) refetch();
    },
    [refetch]
  );

  const columns = useMemo(
    () => [
      {
        key: 'key',
        title: <Translate>Key</Translate>,
        render: (row: any) => (
          <a
            className="visit-history__encounter-link"
            onClick={() => {
              setSelectedVisit(row);
              setQuickInitialStep(0);
              setQuickAppointmentModel(true);
            }}
          >
            {row.encounterNumber}
          </a>
        )
      },
      { key: 'encounterDate', title: <Translate>Date</Translate>, dataKey: 'encounterDate' },
      {
        key: 'department',
        title: <Translate>Department</Translate>,
        render: (row: any) => departmentsMap[row.departmentId]?.name ?? ''
      },
      {
        key: 'practitioner',
        title: <Translate>Practitioner</Translate>,
        render: (row: any) => {
          const p = practitionersMap[row.practitionerId];
          if (!p) return '';
          return `${p.firstName} ${p.lastName ?? ''}`.trim();
        }
      },
      {
        key: 'reason',
        title: <Translate>Reason</Translate>,
        render: (row: any) => formatEnumString(row.encounterReason)
      },
      {
        key: 'priority',
        title: <Translate>Priority</Translate>,
        render: (row: any) => formatEnumString(row.priorityLevel)
      },
      {
        key: 'status',
        title: <Translate>Status</Translate>,
        render: (row: any) => formatEnumString(row.status)
      },
      {
        key: 'actions',
        title: '',
        render: (row: any) => {
          const isOngoing = row.status === 'ONGOING';
          const isNew = row.status === 'NEW';
          const isPendingPayment = row.status === 'PENDING_PAYMENT';

          const departmentType = departmentsMap[row.departmentId]?.type;
          const isOutpatient = departmentType === 'OUTPATIENT_CLINIC';
          const isEmergency =
            departmentType === 'EMERGENCY' || departmentType === 'EMERGENCY_ROOM';
          const Radiology = departmentType === 'RADIOLOGY';
          const Laboratory = departmentType === 'LABORATORY';
          const hasDiagnosis = diagnosisMap[row.id] ?? false;

          return (
            <div className="visit-history__actions-form">
              {isNew && (
                <Whisper
                  placement="top"
                  speaker={<Tooltip>Cancel</Tooltip>}
                  container={getTooltipContainer}
                >
                  <span className="visit-history__tooltip-trigger">
                    <MyButton
                      appearance="subtle"
                      size="small"
                      disabled={!row.id || localPatient?.patientStatus === 'MERGED'}
                      onClick={() => {
                        setSelectedVisit(row);
                        setOpenCancelModal(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faRectangleXmark} />
                    </MyButton>
                  </span>
                </Whisper>
              )}

              {((isOngoing && isOutpatient && hasDiagnosis)||(Radiology||Laboratory)) && (
                <Whisper
                  placement="top"
                  speaker={<Tooltip>Complete</Tooltip>}
                  container={getTooltipContainer}
                >
                  <span className="visit-history__tooltip-trigger">
                    <MyButton appearance="subtle" size="small" onClick={() => handleComplete(row)} disabled={localPatient?.patientStatus === 'MERGED'}>
                      <FontAwesomeIcon icon={faCheckDouble} />
                    </MyButton>
                  </span>
                </Whisper>
              )}

              {isOngoing && isEmergency && (
                <Whisper
                  placement="top"
                  speaker={<Tooltip>Discharge</Tooltip>}
                  container={getTooltipContainer}
                >
                  <span className="visit-history__tooltip-trigger">
                    <MyButton
                      appearance="subtle"
                      size="small"
                      onClick={() => {
                        setSelectedVisit(row);
                        setOpenDischargeModal(true);
                      }}
                      disabled={localPatient?.patientStatus === 'MERGED'}
                    >
                      <FontAwesomeIcon icon={faPowerOff} />
                    </MyButton>
                  </span>
                </Whisper>
              )}

              {isPendingPayment && (
                <Whisper
                  placement="top"
                  speaker={<Tooltip>Pay</Tooltip>}
                  container={getTooltipContainer}
                >
                  <span className="visit-history__tooltip-trigger">
                    <MyButton
                      appearance="subtle"
                      size="small"
                      onClick={() => {
                        setSelectedVisit(row);
                        setQuickInitialStep(1);
                        setQuickAppointmentModel(true);
                      }}
                      disabled={localPatient?.patientStatus === 'MERGED'}
                    >
                      <FontAwesomeIcon icon={faFileInvoiceDollar} />
                    </MyButton>
                  </span>
                </Whisper>
              )}

              {isPendingPayment && (
                <Whisper
                  placement="top"
                  speaker={<Tooltip>Cancel</Tooltip>}
                  container={getTooltipContainer}
                >
                  <span className="visit-history__tooltip-trigger">
                    <MyButton
                      appearance="subtle"
                      size="small"
                      onClick={() => {
                        setSelectedVisit(row);
                        setOpenCancelModal(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faCircleXmark} />
                    </MyButton>
                  </span>
                </Whisper>
              )}
            </div>
          );
        }
      }
    ],
    [departmentsMap, practitionersMap, diagnosisMap, handleComplete]
  );

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';
  return (
    <div dir={dir}>
      <div ref={tooltipContainerRef} className="visit-history__wrapper">
        <MyTable
          data={encounters}
          columns={columns}
          loading={isFetching && encounters.length === 0}
          height={580}
        />

        <DeletionConfirmationModal
          open={openCancelModal}
          setOpen={setOpenCancelModal}
          actionButtonFunction={handleCancel}
          confirmationQuestion="Cancel this encounter?"
          actionButtonLabel="Cancel"
          cancelButtonLabel="Close"
        />

        <EncounterDischarge
          open={openDischargeModal}
          setOpen={setOpenDischargeModal}
          encounter={selectedVisit}
        />

        {quickAppointmentModel && (
          <PatientQuickAppointment
            quickAppointmentModel={quickAppointmentModel}
            setQuickAppointmentModel={handleCloseQuickAppointment}
            localPatient={localPatient}
            localVisit={selectedVisit}
            isDisabeld={quickInitialStep === 0}
            initialStep={quickInitialStep}
            onEncounterSaved={handleEncounterSaved}
          />
        )}
      </div>
    </div>
  );
};

export default PatientVisitHistoryTable;