import React, { useEffect, useState } from 'react';
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

const PatientVisitHistoryTable = ({ localPatient }: any) => {
  const dispatch = useDispatch();

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

  const { data, isFetching } = useGetEncountersByPatientQuery(
    {
      patientId: localPatient?.id,
      page: 0,
      size: 50,
      sort: 'createdDate,desc'
    },
    {
      refetchOnMountOrArgChange: true
    }
  );

  const encounters = data?.data ?? [];

  const [cancelEncounter] = useCancelEncounterMutation();
  const [completeEncounter] = useCompleteEncounterMutation();
  const [dischargeEncounter] = useDischargeEncounterMutation();

  const handleCancel = async () => {
    if (!selectedVisit) return;

    try {
      await cancelEncounter({ id: selectedVisit.id }).unwrap();
      dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
      setOpenCancelModal(false);
    } catch {
      dispatch(notify({ msg: 'Error cancelling encounter', sev: 'error' }));
    }
  };

  const handleComplete = async (row: any) => {
    try {
      await completeEncounter({ id: row.id }).unwrap();
      dispatch(notify({ msg: 'Completed Successfully', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Error completing encounter', sev: 'error' }));
    }
  };

  const handleDischarge = async (row: any) => {
    try {
      await dischargeEncounter({ id: row.id }).unwrap();
      dispatch(notify({ msg: 'Discharged Successfully', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Error discharging encounter', sev: 'error' }));
    }
  };

  useEffect(() => {
    const loadPractitioners = async () => {
      if (!encounters.length) {
        setPractitionersMap({});
        return;
      }

      const uniqueIds = Array.from(
        new Set(
          encounters
            .map(encounterRow => encounterRow.practitionerId)
            .filter(practitionerId => practitionerId !== null && practitionerId !== undefined)
        )
      );

      if (!uniqueIds.length) return;

      try {
        const practitioners = await getPractitionersBulk(uniqueIds).unwrap();
        const practitionersById = Object.fromEntries(
          practitioners.map(practitioner => [practitioner.id, practitioner])
        );
        setPractitionersMap(practitionersById);
      } catch {
        // silent
      }
    };

    loadPractitioners();
  }, [encounters]);

  useEffect(() => {
    const loadDepartments = async () => {
      if (!encounters.length) {
        setDepartmentsMap({});
        return;
      }

      const uniqueIds = Array.from(
        new Set(
          encounters
            .map(encounterRow => encounterRow.departmentId)
            .filter(departmentId => departmentId !== null && departmentId !== undefined)
        )
      );

      if (!uniqueIds.length) return;

      try {
        const departments = await getDepartmentsBulk(uniqueIds).unwrap();
        const departmentsById = Object.fromEntries(
          departments.map(department => [department.id, department])
        );
        setDepartmentsMap(departmentsById);
      } catch {
        // silent
      }
    };

    loadDepartments();
  }, [encounters, getDepartmentsBulk]);

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
      render: (row: any) => {
        const department = departmentsMap[row.departmentId];
        if (!department) return '';
        return department.name ?? '';
      }
    },
    {
      key: 'practitioner',
      title: <Translate>Practitioner</Translate>,
      render: (row: any) => {
        const practitioner = practitionersMap[row.practitionerId];
        if (!practitioner) return '';
        return `${practitioner.firstName} ${practitioner.lastName ?? ''}`.trim();
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
        const encounterStatus = row.status;

        const isOngoing = encounterStatus === 'ONGOING';
        const isNew = encounterStatus === 'NEW';
        const isPendingPayment = encounterStatus === 'PENDING_PAYMENT';

        return (
          <Form className="visit-history__actions-form">
            {isNew && (
              <Whisper placement="top" speaker={<Tooltip>Cancel</Tooltip>}>
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
              </Whisper>
            )}

            {isOngoing && (
              <Whisper placement="top" speaker={<Tooltip>Complete</Tooltip>}>
                <MyButton
                  appearance="subtle"
                  size="small"
                  onClick={() => handleComplete(row)}
                >
                  <FontAwesomeIcon icon={faCheckDouble} />
                </MyButton>
              </Whisper>
            )}

            {isOngoing && (
              <Whisper placement="top" speaker={<Tooltip>Discharge</Tooltip>}>
                <MyButton
                  appearance="subtle"
                  size="small"
                  onClick={() => handleDischarge(row)}
                >
                  <FontAwesomeIcon icon={faPowerOff} />
                </MyButton>
              </Whisper>
            )}

            {isPendingPayment && (
              <Whisper placement="top" speaker={<Tooltip>Pay</Tooltip>}>
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
              </Whisper>
            )}
          </Form>
        );
      }
    }
  ];

  return (
    <>
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
          setQuickAppointmentModel={setQuickAppointmentModel}
          localPatient={localPatient}
          localVisit={selectedVisit}
          isDisabeld={quickInitialStep === 0}
          initialStep={quickInitialStep}
        />
      )}
    </>
  );
};

export default PatientVisitHistoryTable;