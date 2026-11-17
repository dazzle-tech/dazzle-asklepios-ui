import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { useLocation, useOutletContext } from 'react-router-dom';

import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import SectionContainer from '@/components/SectionsoContainer';

import PatientDiagnosis from '@/pages/encounter/medical-notes-and-assessments/patient-diagnosis';
import PatientPlan from '@/pages/encounter/medical-notes-and-assessments/patient-plan/PatientPlan';
import MedicalHistory from '@/pages/encounter/encounter-component/patient-history/MedicalHistory/MedicalHistory';
import PainAssessment from '@/pages/encounter/encounter-pre-observations-new/observations/PainAssessment';
import FieldAuditHistoryModal from '@/pages/encounter/encounter-component/s.o.a.p/FieldAuditHistory';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetEncounterAuditQuery,
  useGetEncounterByIdQuery,
  useUpdateEncounterMutation
} from '@/services/encounters/patientEncounterService';
import { useGetLatestPatientObservationsComplaintsByEncounterIdQuery } from '@/services/medicalsheetsEncounter/observations/patientObservationsComplaintsService';
import type { Patient, PatientEncounter } from '@/types/model-types-new';

import './ClinicalDocumentationTab.less';

type ClinicalDocumentationTabProps = {
  patient?: Patient;
  encounter?: PatientEncounter;
};

type UiOnlyEducation = {
  topic: string;
  method: string;
  effectiveness: string;
};

const ClinicalDocumentationTab: React.FC<ClinicalDocumentationTabProps> = ({
  patient: patientProp,
  encounter: encounterProp
}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const outletContext = useOutletContext<any>();

  const patient =
    patientProp || location.state?.patient || outletContext?.patient;

  const encounterFromNav =
    encounterProp || location.state?.encounter || outletContext?.encounter;

  const viewMode = location.state?.viewMode ?? outletContext?.viewMode;

  const edit =
    viewMode === 'readOnly' ||
    (location.state?.edit ?? outletContext?.edit ?? false);

  const encounterId = encounterFromNav?.id || location.state?.encounter?.id;

  const [localEncounter, setLocalEncounter] = useState<any>(encounterFromNav || {});
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedAuditField, setSelectedAuditField] = useState('');

  // UI-only fields.
  const [dentalHistory, setDentalHistory] = useState({ dentalHistory: '' });
  const [treatmentOutcome, setTreatmentOutcome] = useState({ treatmentOutcome: '' });
  const [patientFamilyEducation, setPatientFamilyEducation] =
    useState<UiOnlyEducation>({
      topic: '',
      method: '',
      effectiveness: ''
    });

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

  const { data: encounterAudit = [] } = useGetEncounterAuditQuery(
    { id: encounterId },
    { skip: !encounterId }
  );

  const { data: nurseComplaints } =
    useGetLatestPatientObservationsComplaintsByEncounterIdQuery(
      { encounterId },
      { skip: !encounterId }
    );

  const [updateEncounter] = useUpdateEncounterMutation();

  useEffect(() => {
    if (encounterFromServer) {
      setLocalEncounter({
        ...encounterFromServer,
        chiefComplaint:
          encounterFromServer.chiefComplaint || nurseComplaints?.reasonOfVisit || ''
      });
    }
  }, [encounterFromServer, nurseComplaints]);

  const toEncounterPayload = (encounter: any): PatientEncounter =>
    ({
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
      followUpEncounterId:
        encounter?.followUpEncounterId ?? encounter?.followUpEncounter?.id ?? null,
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
    }) as PatientEncounter;

  const saveChiefComplaint = async () => {
    if (!localEncounter?.chiefComplaint?.trim()) {
      dispatch(
        notify({
          msg: 'Chief Complaint cannot be empty.',
          sev: 'warning'
        })
      );
      return;
    }

    if (
      localEncounter?.chiefComplaint?.trim() ===
      (encounterFromServer?.chiefComplaint ?? '').trim()
    ) {
      return;
    }

    try {
      const idToUpdate = localEncounter?.id ?? encounterId;

      if (!idToUpdate) {
        dispatch(notify({ msg: 'No encounter id to update', sev: 'error' }));
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

      const updatedEncounter = await updateEncounter({
        id: idToUpdate,
        body: payload
      }).unwrap();

      setLocalEncounter(updatedEncounter);
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch (e: any) {
      dispatch(
        notify({
          msg: e?.data?.detail || e?.data?.message || 'Save Failed',
          sev: 'error'
        })
      );
    }
  };

  const openAuditHistory = (fieldName: string) => {
    setSelectedAuditField(fieldName);
    setAuditModalOpen(true);
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const patientIdNumber = patient?.id ? Number(patient.id) : null;

  const encounterIdNumber = localEncounter?.id
    ? Number(localEncounter.id)
    : encounterId
      ? Number(encounterId)
      : null;

  return (
    <div className="clinical-documentation-tab" dir={dir}>
      <div className="cd-top-grid">
        <div className="cd-section">
          <SectionContainer
            collapsible
            title="Chief Complaint"
            content={
              <Form fluid>
                <MyInput
                  width="100%"
                  height={112}
                  showLabel={false}
                  fieldType="textarea"
                  fieldName="chiefComplaint"
                  record={localEncounter}
                  setRecord={setLocalEncounter}
                  onBlur={() => {
                    if (!edit) saveChiefComplaint();
                  }}
                  disabled={edit || isLoading || isFetching}
                />
              </Form>
            }
            action={
              <div className="cd-section-actions">
                <MyButton
                  size="small"
                  onClick={() => openAuditHistory('chiefComplaint')}
                >
                  History
                </MyButton>

                <MyButton
                  size="small"
                  onClick={saveChiefComplaint}
                  disabled={edit || isLoading || isFetching}
                >
                  Save
                </MyButton>
              </div>
            }
          />
        </div>

        <div className="cd-section">
          <SectionContainer
            collapsible
            title="Dental History"
            content={
              <Form fluid>
                <MyInput
                  width="100%"
                  height={112}
                  showLabel={false}
                  fieldType="textarea"
                  fieldName="dentalHistory"
                  record={dentalHistory}
                  setRecord={setDentalHistory}
                  disabled={edit}
                />
              </Form>
            }
          />
        </div>

        <div className="cd-section cd-section--full">
          <SectionContainer
            collapsible
            title="Medical History"
            content={
              <MedicalHistory
                patient={patient}
                encounter={localEncounter}
                edit={edit}
                toShowData={false}
                showFreeText={true}
              />
            }
          />
        </div>

        <div className="cd-section cd-section--full">
          <PatientPlan
            patient={patient}
            localEncounter={localEncounter}
            disabled={edit}
            title="Treatment Plan / Management"
          />
        </div>
      </div>

      <div className="cd-section">
        <SectionContainer
          collapsible
          title="Patient Diagnosis"
          content={
            <PatientDiagnosis
              patient={patient}
              encounter={localEncounter}
              disabled={edit}
            />
          }
        />
      </div>

      <div
        className={`cd-bottom-grid${
          patientIdNumber && encounterIdNumber ? '' : ' cd-bottom-grid--single'
        }`}
      >
        {patientIdNumber && encounterIdNumber ? (
          <div className="cd-section">
            <Form fluid>
              <PainAssessment
                patientId={patientIdNumber}
                encounterId={encounterIdNumber}
                encounter={localEncounter}
                disabled={edit}
                title="Pain Assessment"
              />
            </Form>
          </div>
        ) : null}

        <div className="cd-section">
          <SectionContainer
            collapsible
            title="Treatment Outcome"
            content={
              <Form fluid>
                <MyInput
                  width="100%"
                  height={112}
                  showLabel={false}
                  fieldType="textarea"
                  fieldName="treatmentOutcome"
                  record={treatmentOutcome}
                  setRecord={setTreatmentOutcome}
                  disabled={edit}
                />
              </Form>
            }
          />
        </div>
      </div>

      <div className="cd-section">
        <SectionContainer
          collapsible
          title="Patient & Family Education"
          content={
            <Form fluid>
              <div className="cd-education-grid">
                <MyInput
                  width="100%"
                  fieldType="text"
                  fieldName="topic"
                  fieldLabel="Topic"
                  record={patientFamilyEducation}
                  setRecord={setPatientFamilyEducation}
                  disabled={edit}
                />

                <MyInput
                  width="100%"
                  fieldType="text"
                  fieldName="method"
                  fieldLabel="Method"
                  record={patientFamilyEducation}
                  setRecord={setPatientFamilyEducation}
                  disabled={edit}
                />

                <MyInput
                  width="100%"
                  fieldType="text"
                  fieldName="effectiveness"
                  fieldLabel="Effectiveness"
                  record={patientFamilyEducation}
                  setRecord={setPatientFamilyEducation}
                  disabled={edit}
                />
              </div>
            </Form>
          }
        />
      </div>

      <FieldAuditHistoryModal
        open={auditModalOpen}
        setOpen={setAuditModalOpen}
        audit={encounterAudit}
        fieldName={selectedAuditField}
      />
    </div>
  );
};

export default ClinicalDocumentationTab;
