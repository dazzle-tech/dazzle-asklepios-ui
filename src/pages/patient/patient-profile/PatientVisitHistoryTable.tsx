import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Tooltip, Form, Whisper } from 'rsuite';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';

import {
  useGetEncountersByPatientQuery,
  useCancelEncounterMutation,
  useCompleteEncounterMutation,
  useDischargeEncounterMutation
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
import { useGetDepartmentsBulkMutation } from '@/services/security/departmentService';

import './styles.less';

const PatientVisitHistoryTable = ({ localPatient }: any) => {
  const dispatch = useDispatch();
  const tooltipContainerRef = useRef<HTMLDivElement | null>(null);
  const getTooltipContainer = () => tooltipContainerRef.current || document.body;

  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [openCancelModal, setOpenCancelModal] = useState(false);

  const [quickAppointmentModel, setQuickAppointmentModel] = useState(false);
  const [quickInitialStep, setQuickInitialStep] = useState<number>(0);

  const [practitionersMap, setPractitionersMap] = useState<Record<number | string, Practitioner>>({});
  const [departmentsMap, setDepartmentsMap] = useState<Record<number | string, Department>>({});

  const [getPractitionersBulk] = useGetPractitionersBulkMutation();
  const [getDepartmentsBulk] = useGetDepartmentsBulkMutation();

  const { data, isFetching, refetch } = useGetEncountersByPatientQuery(
    {
      patientId: localPatient?.id,
      page: 0,
      size: 50,
      sort: 'createdDate,desc'
    },
    {
      refetchOnMountOrArgChange: true,
      skip: !localPatient?.id
      refetchOnFocus: true, 
      pollingInterval: 0
    }
  );

  const encounters = useMemo(() => data?.data ?? [], [data?.data]);

  const practitionerIds = useMemo(
    () =>
      Array.from(new Set(encounters.map((e: any) => e.practitionerId).filter((id: any) => id != null))),
    [encounters]
  );

  const departmentIds = useMemo(
    () =>
      Array.from(new Set(encounters.map((e: any) => e.departmentId).filter((id: any) => id != null))),
    [encounters]
  );

  const [cancelEncounter] = useCancelEncounterMutation();
  const [completeEncounter] = useCompleteEncounterMutation();
  const [dischargeEncounter] = useDischargeEncounterMutation();

  const handleCancel = async () => {
    if (!selectedVisit) return;
    try {
      await cancelEncounter({ id: selectedVisit.id }).unwrap();
      dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
      setOpenCancelModal(false);
      refetch();
    } catch {
      dispatch(notify({ msg: 'Error cancelling encounter', sev: 'error' }));
    }
  };

  const handleComplete = async (row: any) => {
    try {
      await completeEncounter({ id: row.id }).unwrap();
      dispatch(notify({ msg: 'Completed Successfully', sev: 'success' }));
      refetch();
    } catch {
      dispatch(notify({ msg: 'Error completing encounter', sev: 'error' }));
    }
  };

  const handleDischarge = async (row: any) => {
    try {
      await dischargeEncounter({ id: row.id }).unwrap();
      dispatch(notify({ msg: 'Discharged Successfully', sev: 'success' }));
      refetch();
    } catch {
      dispatch(notify({ msg: 'Error discharging encounter', sev: 'error' }));
    }
  };

  const handleEncounterSaved = async () => {
    await refetch();
  };

  useEffect(() => {
    let active = true;

    const loadPractitioners = async () => {
      if (!practitionerIds.length) {
        setPractitionersMap({});
        return;
      }

      try {
        const practitioners = await getPractitionersBulk(practitionerIds).unwrap();
        if (!active) return;

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
      } catch {
        if (active) setPractitionersMap({});
      }
    };

    loadPractitioners();

    return () => {
      active = false;
    };
  }, [practitionerIds, getPractitionersBulk]);

  useEffect(() => {
    let active = true;

    const loadDepartments = async () => {
      if (!departmentIds.length) {
        setDepartmentsMap({});
        return;
      }

      try {
        const departments = await getDepartmentsBulk(departmentIds).unwrap();
        if (!active) return;

        const nextMap = Object.fromEntries(departments.map((d: Department) => [d.id, d]));
        setDepartmentsMap(prev => {
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
      } catch {
        if (active) setDepartmentsMap({});
      }
    };

    loadDepartments();

    return () => {
      active = false;
    };
  }, [departmentIds, getDepartmentsBulk]);

  const columns = [
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
        const isClinicVisit = row.visitType === 'CLINIC';

        return (
          <Form className="visit-history__actions-form">
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

            {isOngoing && isClinicVisit && (
              <Whisper
                placement="top"
                speaker={<Tooltip>Complete</Tooltip>}
                container={getTooltipContainer}
              >
                <span className="visit-history__tooltip-trigger">
                  <MyButton appearance="subtle" size="small" onClick={() => handleComplete(row)}>
                    <FontAwesomeIcon icon={faCheckDouble} />
                  </MyButton>
                </span>
              </Whisper>
            )}

            {/* DISCHARGE فقط لغير CLINIC */}
            {isOngoing && !isClinicVisit && (
              <Whisper
                placement="top"
                speaker={<Tooltip>Discharge</Tooltip>}
                container={getTooltipContainer}
              >
                <span className="visit-history__tooltip-trigger">
                  <MyButton appearance="subtle" size="small" onClick={() => handleDischarge(row)}>
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
                  >
                    <FontAwesomeIcon icon={faFileInvoiceDollar} />
                  </MyButton>
                </span>
              </Whisper>
            )}
          </Form>
        );
      }
    }
  ];

  return (
    <div ref={tooltipContainerRef} className="visit-history__wrapper">
      <MyTable data={encounters} columns={columns} loading={isFetching} height={580} />

      <DeletionConfirmationModal
        open={openCancelModal}
        setOpen={setOpenCancelModal}
        actionButtonFunction={handleCancel}
        confirmationQuestion="Cancel this encounter?"
        actionButtonLabel="Cancel"
        cancelButtonLabel="Close"
      />

      {quickAppointmentModel && (
        <PatientQuickAppointment
          quickAppointmentModel={quickAppointmentModel}
          setQuickAppointmentModel={val => {
            setQuickAppointmentModel(val);
            if (!val) refetch();
          }}
          localPatient={localPatient}
          localVisit={selectedVisit}
          isDisabeld={quickInitialStep === 0}
          initialStep={quickInitialStep}
          onEncounterSaved={handleEncounterSaved}
        />
      )}
    </div>
  );
};

export default PatientVisitHistoryTable;