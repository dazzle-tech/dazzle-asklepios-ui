import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import type { Practitioner } from '@/types/model-types-new';
import PatientQuickAppointment from './PatientQuickAppoinment/PatientQuickAppointment';
import { formatEnumString } from '@/utils';
import { useGetDepartmentsBulkMutation } from '@/services/security/departmentService';
import type { Department } from '@/types/model-types-new';

import './styles.less';

// ✅ Added encounterRefetchTrigger to props
const PatientVisitHistoryTable = ({ localPatient, encounterRefetchTrigger }: any) => {
  const dispatch = useDispatch();
  const tooltipContainerRef = useRef<HTMLDivElement | null>(null);
  const getTooltipContainer = () => tooltipContainerRef.current || document.body;

  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [openCancelModal, setOpenCancelModal] = useState(false);

  const [quickAppointmentModel, setQuickAppointmentModel] = useState(false);
  const [quickInitialStep, setQuickInitialStep] = useState<number>(0);
  const [practitionersMap, setPractitionersMap] = useState<Record<number | string, Practitioner>>(
    {}
  );
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
      refetchOnFocus: true,
      pollingInterval: 0
    }
  );

  const encounters = data?.data ?? [];

  const [cancelEncounter] = useCancelEncounterMutation();
  const [completeEncounter] = useCompleteEncounterMutation();
  const [dischargeEncounter] = useDischargeEncounterMutation();

  // ✅ NEW: whenever the parent bumps encounterRefetchTrigger, refetch the table
  useEffect(() => {
    if (encounterRefetchTrigger > 0) {
      refetch();
    }
  }, [encounterRefetchTrigger]);

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

  const practitionerIds = React.useMemo(
    () =>
      Array.from(
        new Set(encounters.map((e: any) => e.practitionerId).filter((id: any) => id != null))
      ),
    [encounters]
  );

  useEffect(() => {
    if (!practitionerIds.length) return;

    const load = async () => {
      try {
        const practitioners = await getPractitionersBulk(practitionerIds).unwrap();
        setPractitionersMap(Object.fromEntries(practitioners.map((p: Practitioner) => [p.id, p])));
      } catch {}
    };

    load();
  }, [practitionerIds]);

  useEffect(() => {
    const loadDepartments = async () => {
      if (!encounters.length) {
        setDepartmentsMap({});
        return;
      }
      const uniqueIds = Array.from(
        new Set(encounters.map((e: any) => e.departmentId).filter((id: any) => id != null))
      );
      if (!uniqueIds.length) return;
      try {
        const departments = await getDepartmentsBulk(uniqueIds).unwrap();
        setDepartmentsMap(Object.fromEntries(departments.map((d: Department) => [d.id, d])));
      } catch (err) {
        console.error('getDepartmentsBulk error:', err);
      }
    };
    loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounters]);

  const handleCloseQuickAppointment = useCallback(
    (val: boolean) => {
      setQuickAppointmentModel(val);
      if (!val) refetch();
    },
    [refetch]
  );

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

        const departmentType = departmentsMap[row.departmentId]?.type;
        const isOutpatient = departmentType === 'OUTPATIENT_CLINIC';
        const isEmergency = departmentType === 'EMERGENCY' || departmentType === 'EMERGENCY_ROOM';

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

            {/* OUTPATIENT_CLINIC → Complete */}
            {isOngoing && isOutpatient && (
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

            {/* EMERGENCY → Discharge */}
            {isOngoing && isEmergency && (
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
  );
};

export default PatientVisitHistoryTable;