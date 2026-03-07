import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Form } from 'rsuite';

import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTab from '@/components/MyTab';
import SectionContainer from '@/components/SectionsoContainer';

import ReviewOfSystems from '../../medical-notes-and-assessments/review-of-systems';
import PatientPlan from '../../medical-notes-and-assessments/patient-plan/PatientPlan';
import PatientHistorySummary from '../patient-history/MedicalHistory/PatientHistorySummary';
import EncounterAssessmentSection from '../../medical-notes-and-assessments/encounter-assessments';
import PatientDiagnosis from '../../medical-notes-and-assessments/patient-diagnosis';

import { useAppDispatch } from '@/hooks';
import { notify, showSystemLoader, hideSystemLoader } from '@/utils/uiReducerActions';

import {
  useGetEncounterByIdQuery,
  useUpdateEncounterMutation,
} from '@/services/encounters/patientEncounterService';

import { useGetLatestPatientObservationsComplaintsByEncounterIdQuery } from '@/services/medicalsheetsEncounter/observations/patientObservationsComplaintsService';

import type { PatientEncounter } from '@/types/model-types-new';

const SOAP = (props) => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const patient = props.patient || location.state?.patient;
  const encounterFromNav = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;

  const encounterId = encounterFromNav?.id || location.state?.encounter?.id;

  const [localEncounter, setLocalEncounter] = useState<any>(encounterFromNav || {});

  const { data: encounterFromServer, isLoading, isFetching } = useGetEncounterByIdQuery(
    { id: encounterId },
    {
      skip: !encounterId,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }
  );

  const { data: nurseComplaints } = useGetLatestPatientObservationsComplaintsByEncounterIdQuery(
    { encounterId },
    { skip: !encounterId }
  );

  useEffect(() => {
    if (encounterFromServer) {
      setLocalEncounter({
        ...encounterFromServer,
        chiefComplaint:
          encounterFromServer.chiefComplaint ||
          nurseComplaints?.reasonOfVisit ||
          '',
      });
    }
  }, [encounterFromServer, nurseComplaints]);

  const [updateEncounter] = useUpdateEncounterMutation();

  const toEncounterPayload = (encounter: any): PatientEncounter => ({
    id: Number(encounter?.id),

    patientId: Number(encounter?.patientId ?? encounter?.patient?.id),

    encounterNumber: encounter?.encounterNumber ?? null,

    facilityId: Number(encounter?.facilityId),
    departmentId: Number(encounter?.departmentId),

    practitionerId: encounter?.practitionerId ?? null,

    paymentDate: encounter?.paymentDate,
    amount: encounter?.amount,

    encounterType: encounter?.encounterType,
    encounterReason: encounter?.encounterReason,

    followUpEncounterId: encounter?.followUpEncounterId ?? encounter?.followUpEncounter?.id ?? null,

    priorityLevel: encounter?.priorityLevel,

    originType: encounter?.originType ?? null,
    originName: encounter?.originName ?? null,

    notes: encounter?.notes ?? null,

    departmentDailySequenceNumber: encounter?.departmentDailySequenceNumber ?? null,

    encounterDate: encounter?.encounterDate ?? null,

    status: encounter?.status,

    chiefComplaint: encounter?.chiefComplaint ?? null,

    hasPrescription: Boolean(encounter?.hasPrescription),
    hasOrder: Boolean(encounter?.hasOrder),
    isObserved: Boolean(encounter?.isObserved),
  });

  const saveChanges = async () => {
    try {
      const idToUpdate = localEncounter?.id ?? encounterId;

      if (!idToUpdate) {
        dispatch(notify({ msg: 'No encounter id to update', sev: 'error' }));
        return;
      }

      const payload = toEncounterPayload(localEncounter);

      if (!payload.patientId || !payload.facilityId || !payload.departmentId) {
        dispatch(
          notify({
            msg: 'Missing required fields: patientId / facilityId / departmentId',
            sev: 'error',
          })
        );
        return;
      }

      if (payload.encounterReason === 'FOLLOW_UP' && !payload.followUpEncounterId) {
        dispatch(
          notify({
            msg: 'Follow-up encounter is required when reason is FOLLOW_UP',
            sev: 'error',
          })
        );
        return;
      }

      const updatedEncounter = await updateEncounter({
        id: idToUpdate,
        body: payload,
      }).unwrap();

      setLocalEncounter(updatedEncounter);
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Save Failed', sev: 'error' }));
    }
  };

  const tabData = [
    {
      title: 'Visit Details',
      content: (
        <div className={clsx('column-container', { 'disabled-panel': edit })}>
          <div className="top-section">
            <SectionContainer
              title={<>Chief Complaint</>}
              content={
                <Form fluid>
                  <MyInput
                    width="100%"
                    height="95px"
                    showLabel={false}
                    fieldType="textarea"
                    fieldName="chiefComplaint"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />
                </Form>
              }
              action={
                <MyButton size="small" onClick={saveChanges}>
                  Save
                </MyButton>
              }
            />
            <EncounterAssessmentSection patient={patient} encounterId={localEncounter?.id} />
          </div>

          <SectionContainer
            title="Patient Diagnosis"
            content={<PatientDiagnosis patient={patient} encounter={localEncounter} />}
          />

          <div className="last-section-clinical-visit">
            <div className="half-width-section">
              <PatientPlan patient={patient} localEncounter={localEncounter} />
            </div>
            <div className="half-width-section">
              <PatientHistorySummary
                button={
                  <MyButton size="small" onClick={saveChanges}>
                    Get Summary
                  </MyButton>
                }
                patient={patient}
                encounter={localEncounter}
                edit={edit}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Physical Examination & Findings',
      content: <ReviewOfSystems patient={patient} encounter={localEncounter} edit={edit} />,
    },
  ];

  useEffect(() => {
    if (isLoading || isFetching) dispatch(showSystemLoader());
    else dispatch(hideSystemLoader());

    return () => dispatch(hideSystemLoader());
  }, [isLoading, isFetching, dispatch]);

  return (
    <div className="patient-summary-container">
      <MyTab data={tabData} />
    </div>
  );
};

export default SOAP;
