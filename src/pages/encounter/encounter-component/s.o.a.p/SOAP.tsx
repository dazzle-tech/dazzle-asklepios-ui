import React, { useEffect, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
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
  useGetEncounterAuditQuery,
  useGetEncounterByIdQuery,
  useUpdateEncounterMutation
} from '@/services/encounters/patientEncounterService';

import { useGetLatestPatientObservationsComplaintsByEncounterIdQuery } from '@/services/medicalsheetsEncounter/observations/patientObservationsComplaintsService';

import type { PatientEncounter } from '@/types/model-types-new';
import Translate from '@/components/Translate';
import HistoryOfPresentIllnessSection from './HistoryOfPresentIllnessSection';
import FieldAuditHistoryModal from './FieldAuditHistory';

const SOAP = props => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('1');
  const outletContext = useOutletContext<any>();
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedAuditField, setSelectedAuditField] = useState('');

  const patient = props.patient || location.state?.patient || outletContext?.patient;
  const encounterFromNav = props.encounter || location.state?.encounter || outletContext?.encounter;

  const viewMode = props.viewMode ?? location.state?.viewMode ?? outletContext?.viewMode;

  const edit =
    viewMode === 'readOnly' || (props.edit ?? location.state?.edit ?? outletContext?.edit ?? false);

  const onDiagnosisSaved = props.onDiagnosisSaved || outletContext?.onDiagnosisSaved;

  const encounterId = encounterFromNav?.id || location.state?.encounter?.id;

  const [localEncounter, setLocalEncounter] = useState<any>(encounterFromNav || {});

  const {
    data: encounterFromServer,
    isLoading,
    isFetching
  } = useGetEncounterByIdQuery(
    { id: encounterId },
    {
      skip: !encounterId,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true
    }
  );

  const {
  data: encounterAudit = []
} = useGetEncounterAuditQuery(
  { id: encounterId },
  { skip: !encounterId }
);

  const { data: nurseComplaints } = useGetLatestPatientObservationsComplaintsByEncounterIdQuery(
    { encounterId },
    { skip: !encounterId }
  );

  useEffect(() => {
    if (encounterFromServer) {
      setLocalEncounter({
        ...encounterFromServer,
        chiefComplaint: encounterFromServer.chiefComplaint || nurseComplaints?.reasonOfVisit || ''
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
    physicalExaminationSummery: encounter?.physicalExaminationSummery ?? null
  });

  const saveChanges = async () => {
    if (!localEncounter?.chiefComplaint?.trim()) {
      dispatch(
        notify({
          msg: 'Chief Complaint cannot be empty.',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      const idToUpdate = localEncounter?.id ?? encounterId;

      if (!idToUpdate) {
        dispatch(
          notify({
            msg: 'No encounter id to update',
            sev: 'error'
          })
        );
        return;
      }

      const payload = {
        ...toEncounterPayload(localEncounter),
        physicalExaminationSummery:
          encounterFromServer?.physicalExaminationSummery ?? null
      };

      if (!payload.patientId || !payload.facilityId || !payload.departmentId) {
        dispatch(
          notify({
            msg: 'Missing required fields: patientId / facilityId / departmentId',
            sev: 'error'
          })
        );
        return;
      }

      if (
        payload.encounterReason === 'FOLLOW_UP' &&
        !payload.followUpEncounterId
      ) {
        dispatch(
          notify({
            msg: 'Follow-up encounter is required when reason is FOLLOW_UP',
            sev: 'error'
          })
        );
        return;
      }

      const updatedEncounter = await updateEncounter({
        id: idToUpdate,
        body: payload
      }).unwrap();

      setLocalEncounter(updatedEncounter);

      dispatch(
        notify({
          msg: 'Saved Successfully',
          sev: 'success'
        })
      );
    } catch {
      dispatch(
        notify({
          msg: 'Save Failed',
          sev: 'error'
        })
      );
    }
  };

  const openAuditHistory = (fieldName: string) => {
   setSelectedAuditField(fieldName);
   setAuditModalOpen(true);
  };

  const savePhysicalExamination = async () => {
    try {
      const idToUpdate = localEncounter?.id ?? encounterId;

      if (!idToUpdate) {
        dispatch(
          notify({
            msg: 'No encounter id to update',
            sev: 'error'
          })
        );
        return;
      }

      const payload = {
        ...toEncounterPayload(localEncounter),
        chiefComplaint:
          encounterFromServer?.chiefComplaint ??
          nurseComplaints?.reasonOfVisit ??
          null
      };

      if (!payload.patientId || !payload.facilityId || !payload.departmentId) {
        dispatch(
          notify({
            msg: 'Missing required fields: patientId / facilityId / departmentId',
            sev: 'error'
          })
        );
        return;
      }

      const updatedEncounter = await updateEncounter({
        id: idToUpdate,
        body: payload
      }).unwrap();

      setLocalEncounter(updatedEncounter);

      dispatch(
        notify({
          msg: 'Saved Successfully',
          sev: 'success'
        })
      );
    } catch {
      dispatch(
        notify({
          msg: 'Save Failed',
          sev: 'error'
        })
      );
    }
  };

  const tabData = [
    {
      title: 'Visit Details',
      content: (
        <div
          className={clsx('column-container', { 'disabled-panel': edit })}
          style={edit ? { pointerEvents: 'none', opacity: 0.6 } : {}}
        >
             <div className="top-section">
                <div style={{ marginBottom: '16px' }}>
                  <SectionContainer
                    title={<Translate>Chief Complaint </Translate>}
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

                        {/* <MyInput
                          width="100%"
                          height="120px"
                          fieldLabel="Physical Examination Summary"
                          fieldType="textarea"
                          fieldName="physicalExaminationSummery"
                          record={{
                            physicalExaminationSummery:
                              localEncounter?.physicalExaminationSummery || ''
                          }}
                          setRecord={() => { }}
                          disabled
                        /> */}
                      </Form>
                    }
                    action={
                      <>
                      <MyButton
                        size="small"
                        onClick={() => openAuditHistory('chiefComplaint')}
                      >
                         History
                      </MyButton>
                      <MyButton size="small" onClick={saveChanges}>
                        Save
                      </MyButton>
                      </>
                    }
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <HistoryOfPresentIllnessSection
                    encounter={localEncounter}
                    setEncounter={setLocalEncounter}
                    disabled={edit}
                    onShowHistory={() => openAuditHistory('historyOfPresentIllness')}

                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <SectionContainer
                    title={<Translate>Physical Examination Summary </Translate>}
                    content={
                      <Form fluid>
                        <MyInput
                          width="100%"
                          height="120px"
                          fieldLabel="Physical Examination Summary"
                          showLabel={false}
                          fieldType="textarea"
                          fieldName="physicalExaminationSummery"
                          record={localEncounter}
                          setRecord={setLocalEncounter}
                        />
                      </Form>
                    }
                    action={
                      <>
                      <MyButton
                        size="small"
                        onClick={() => openAuditHistory('physicalExaminationSummery')}
                      >
                        History
                      </MyButton>
                      <MyButton size="small" onClick={savePhysicalExamination}>
                        Save
                      </MyButton>
                      </>
                    }
                  />
                </div>
             </div>

          <div style={{ marginBottom: '16px' }}>
            <SectionContainer
              title={<Translate>Patient Diagnosis</Translate>}
              content={
                <div style={{ width: '100%' }}>
                  <PatientDiagnosis
                    patient={patient}
                    encounter={localEncounter}
                    onDiagnosisSaved={onDiagnosisSaved}
                  />
                </div>
              }
            /></div>

          <div style={{ marginBottom: '16px' }}>
            <EncounterAssessmentSection patient={patient} encounterId={localEncounter?.id} />
          </div>
          <div className="last-section-clinical-visit">
            <div className="half-width-section">
              <div style={{ marginBottom: '16px' }}>
                <PatientPlan patient={patient} localEncounter={localEncounter} />
              </div>
            </div>
            <div className="half-width-section">
              <PatientHistorySummary
              
                patientId={patient?.id}
                encounterId={localEncounter?.id}
                edit={edit}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Physical Examination & Findings',
      content: (
        <div
          className={clsx('column-container', { 'disabled-panel': edit })}
          style={edit ? { pointerEvents: 'none', opacity: 0.6 } : {}}
        >
          <ReviewOfSystems patient={patient} encounter={localEncounter} edit={edit} setEncounter={setLocalEncounter} />
        </div>
      )
    }
  ];

  useEffect(() => {
    if (isLoading || isFetching) dispatch(showSystemLoader());
    else dispatch(hideSystemLoader());

    return () => dispatch(hideSystemLoader());
  }, [isLoading, isFetching, dispatch]);

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div className="patient-summary-container">
      <MyTab data={tabData} activeTab={activeTab} setActiveTab={setActiveTab} lazy />
      <FieldAuditHistoryModal
        open={auditModalOpen}
        setOpen={setAuditModalOpen}
        audit={encounterAudit}
        fieldName={selectedAuditField}
/>
    </div>
  );
};

export default SOAP;
