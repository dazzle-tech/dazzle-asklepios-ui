import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './styles.less';
import {
  useCancelEncounterMutation,
  useGetEncountersByPatientQuery
} from '@/services/encounters/patientEncounterService';

import { notify } from '@/utils/uiReducerActions';
import { useDispatch } from 'react-redux';

import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';
import { useGetPractitionersBulkMutation } from '@/services/setup/practitioner/PractitionerService';
import type { Department, Practitioner } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';
import { skipToken } from '@reduxjs/toolkit/query';
import PatientQuickAppointment from '../../patient-profile/PatientQuickAppoinment/PatientQuickAppointment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserNurse, faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import { Tooltip, Whisper, Form } from 'rsuite';
import { faCommentMedical } from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import EncounterModalContent from './EncounterModalContent';
import NurseStationModalContent from './NurseStationModalContent';
import UrgentCareViewTriage from '@/pages/encounter/urgent-care/triage-urgent-care/UrgentCareViewTriage';

type Props = {
  localPatient: any;
  departmentType?: string;
};

const PatientVisitHistoryTable: React.FC<Props> = ({ localPatient, departmentType }) => {
  const dispatch = useDispatch();
  const tooltipContainerRef = useRef<HTMLDivElement | null>(null);

  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openTriageModal, setOpenTriageModal] = useState(false);
  const [quickAppointmentModel, setQuickAppointmentModel] = useState(false);
  const [quickInitialStep, setQuickInitialStep] = useState<number>(0);

  const [openEncounterModal, setOpenEncounterModal] = useState(false);
  const [openNurseModal, setOpenNurseModal] = useState(false);
  const [modalRow, setModalRow] = useState<any>(null);

  const [practitionersMap, setPractitionersMap] = useState<Record<number | string, Practitioner>>(
    {}
  );

  const [getPractitionersBulk] = useGetPractitionersBulkMutation();
  const { data: departments = [] } = useGetAllDepartmentsWithoutPaginationQuery();

  const departmentsMap = useMemo(
    () =>
      Object.fromEntries(
        departments.map(d => [d.id, d])
      ),
    [departments]
  );

  const { data, isFetching, refetch } = useGetEncountersByPatientQuery(
    localPatient?.id
      ? {
          patientId: localPatient.id,
          page: 0,
          size: 50,
          sort: 'createdDate,desc'
        }
      : skipToken
  );

  const encountersRaw = useMemo(() => data?.data ?? [], [data?.data]);

    const encounters = useMemo(() => {
      if (!departmentType) return encountersRaw;

      return encountersRaw.filter(e => {
        const dept = departmentsMap[e.departmentId];
        return dept?.departmentType === departmentType;
      });
    }, [encountersRaw, departmentsMap, departmentType]);


  const [cancelEncounter] = useCancelEncounterMutation();

  const handleCancel = async () => {
    if (!selectedVisit) return;

    try {
      await cancelEncounter({ id: selectedVisit.id }).unwrap();
      dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
      setOpenCancelModal(false);
      refetch();
    } catch (err: any) {
      dispatch(notify({ msg: 'Error cancelling encounter', sev: 'error' }));
    }
  };

  const handleEncounterSaved = async () => {
    await refetch();
  };

  const handleViewDoctorVisit = (row: any) => {
    dispatch(setPatient(localPatient));
    dispatch(setEncounter(row));
    setModalRow(row);
    setOpenEncounterModal(true);
  };

  const handleViewNurseStation = (row: any) => {
    dispatch(setPatient(localPatient));
    dispatch(setEncounter(row));
    setModalRow(row);
    setOpenNurseModal(true);
  };

const handleViewTriage = (row: any) => {
  dispatch(setPatient(localPatient));
  dispatch(setEncounter(row));

  setModalRow(row);
  setOpenTriageModal(true);
};

  useEffect(() => {
    const loadPractitioners = async () => {
      const uniqueIds = Array.from(
        new Set(encountersRaw.map(e => e.practitionerId).filter(id => id != null))
      );

      if (!uniqueIds.length) return;

      try {
        const practitioners = await getPractitionersBulk(uniqueIds).unwrap();
        setPractitionersMap(Object.fromEntries(practitioners.map(p => [p.id, p])));
      } catch {}
    };

    loadPractitioners();
  }, [encountersRaw]);


  const columns = [
    {
      key: 'key',
      title: <Translate>Key</Translate>,
      render: (row: any) => (
        <a
          style={{ cursor: 'pointer', color: '#1677ff', fontWeight: 500 }}
          onClick={() => {
            setSelectedVisit(row);
            setQuickAppointmentModel(true);
          }}
        >
          {row.encounterNumber}
        </a>
      )
    },
    {
      key: 'encounterDate',
      title: <Translate>Date</Translate>,
      dataKey: 'encounterDate'
    },
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
        return p ? `${p.firstName} ${p.lastName ?? ''}` : '';
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
      title: <Translate>Actions</Translate>,
      render: (row: any) => {
        const isUrgentCare = departmentType === 'EMERGENCY_ROOM';

        return (
          <Form layout="inline">
            <div className="visit-history-actions-icons">
              {/* View Triage */}
              {isUrgentCare && (
                <Whisper trigger="hover" placement="top" speaker={<Tooltip>View Triage</Tooltip>}>
                  <div>
                    <MyButton size="small" onClick={() => handleViewTriage(row)}>
                      <FontAwesomeIcon icon={faCommentMedical} />
                    </MyButton>
                  </div>
                </Whisper>
              )}

              {/* Nurse */}
              <Whisper trigger="hover" placement="top" speaker={<Tooltip>Nurse Station</Tooltip>}>
                <div>
                  <MyButton
                    size="small"
                    backgroundColor="black"
                    onClick={() => handleViewNurseStation(row)}
                  >
                    <FontAwesomeIcon icon={faUserNurse} />
                  </MyButton>
                </div>
              </Whisper>

              {/* Doctor */}
              <Whisper trigger="hover" placement="top" speaker={<Tooltip>Doctor Visit</Tooltip>}>
                <div>
                  <MyButton size="small" onClick={() => handleViewDoctorVisit(row)}>
                    <FontAwesomeIcon icon={faUserDoctor} />
                  </MyButton>
                </div>
              </Whisper>
            </div>
          </Form>
        );
      }
    }
  ];

  return (
    <div ref={tooltipContainerRef}>
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
          onEncounterSaved={handleEncounterSaved}
        />
      )}

      <MyModal
        open={openTriageModal}
        setOpen={setOpenTriageModal}
        title="View Triage"
        size="95vw"
        bodyheight="80vh"
        hideActionBtn
        cancelButtonLabel="Close"
        enforceFocus={false}
        content={
          modalRow ? (
            <UrgentCareViewTriage
              patient={localPatient}
              encounter={modalRow}
            />
          ) : null
        }
      />

      <MyModal
        open={openEncounterModal}
        setOpen={setOpenEncounterModal}
        title="Doctor Visit"
        size="95vw"
        bodyheight="80vh"
        hideActionBtn
        cancelButtonLabel="Close"
        enforceFocus={false}
        content={
          modalRow ? (
            <EncounterModalContent patient={localPatient} encounter={modalRow} />
          ) : null
        }
      />

      <MyModal
        open={openNurseModal}
        setOpen={setOpenNurseModal}
        title="Nurse Station"
        size="95vw"
        bodyheight="80vh"
        hideActionBtn
        cancelButtonLabel="Close"
        enforceFocus={false}
        content={
          modalRow ? (
            <NurseStationModalContent patient={localPatient} encounter={modalRow} />
          ) : null
        }
      />
    </div>
  );
};

export default PatientVisitHistoryTable;
