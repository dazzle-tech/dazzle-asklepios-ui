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
      // refetchOnMountOrArgChange();
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
          encounters.map(row => row.practitionerId).filter(id => id !== null && id !== undefined)
        )
      );

      if (!uniqueIds.length) return;

      try {
        const practitioners = await getPractitionersBulk(uniqueIds).unwrap();
        const map = Object.fromEntries(practitioners.map(p => [p.id, p]));
        setPractitionersMap(map);
      } catch (e) {
        console.error('Bulk practitioner load failed', e);
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
          encounters.map(row => row.departmentId).filter(id => id !== null && id !== undefined)
        )
      );

      if (!uniqueIds.length) return;

      try {
        const departments = await getDepartmentsBulk(uniqueIds).unwrap();
        const map = Object.fromEntries(departments.map(d => [d.id, d]));
        setDepartmentsMap(map);
      } catch (e) {
        console.error('Bulk department load failed', e);
      }
    };

    loadDepartments();
  }, [encounters, getDepartmentsBulk]);

  const columns = [
    {
      key: 'key',
      title: <Translate>Key</Translate>,
      // render: (row: any) => {
      //   const d = departmentsMap[row.encounterNumber];
      //   if (!d) return row.encounterNumber ?? '';
      //   return d.name ?? row.encounterNumber ?? '';
      // }
      render: (row: any) => (
        <a
          style={{ cursor: 'pointer' }}
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
        const d = departmentsMap[row.departmentId];
        if (!d) return '';
        return d.name ?? '';
      }
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
        const status = row.status;

        const isOngoing = status === 'ONGOING';
        const isNew = status === 'NEW';
        const isPendingPayment = status === 'PENDING_PAYMENT';

        const dischargeResources = ['INPATIENT_ADMISSION', 'DAY_CASE', 'EMERGENCY'];

        const isDischargeResource = dischargeResources.includes(row.encounterType);

        return (
          <Form style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
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
                  onClick={() => {
                    handleComplete(row);
                  }}
                >
                  <FontAwesomeIcon icon={faCheckDouble} />
                </MyButton>
              </Whisper>
            )}

            {isOngoing && (
              <Whisper placement="top" speaker={<Tooltip>Discharge</Tooltip>}>
                <MyButton appearance="subtle" size="small" onClick={() => handleDischarge(row)}>
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
          // onEncounterSaved={refetch}
          initialStep={quickInitialStep}
        />
      )}
    </>
  );
};

export default PatientVisitHistoryTable;
