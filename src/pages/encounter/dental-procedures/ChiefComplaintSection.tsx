import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetEncounterByIdQuery,
  useUpdateEncounterMutation
} from '@/services/encounters/patientEncounterService';
import { useGetLatestPatientObservationsComplaintsByEncounterIdQuery } from '@/services/medicalsheetsEncounter/observations/patientObservationsComplaintsService';
import type { PatientEncounter } from '@/types/model-types-new';

type ChiefComplaintSectionProps = {
  encounter?: any;
  disabled?: boolean;
};

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
});

const ChiefComplaintSection: React.FC<ChiefComplaintSectionProps> = ({
  encounter,
  disabled = false
}) => {
  const dispatch = useAppDispatch();
  const encounterId = encounter?.id;
  const [localEncounter, setLocalEncounter] = useState<any>(encounter || {});
  const [updateEncounter] = useUpdateEncounterMutation();

  const { data: encounterFromServer } = useGetEncounterByIdQuery(
    { id: encounterId },
    { skip: !encounterId, refetchOnMountOrArgChange: true }
  );

  const { data: nurseComplaints } = useGetLatestPatientObservationsComplaintsByEncounterIdQuery(
    { encounterId },
    { skip: !encounterId }
  );

  useEffect(() => {
    if (!encounterFromServer) return;
    setLocalEncounter({
      ...encounterFromServer,
      chiefComplaint: encounterFromServer.chiefComplaint || nurseComplaints?.reasonOfVisit || ''
    });
  }, [encounterFromServer, nurseComplaints]);

  const saveChanges = async (silentUnchanged = false) => {
    if (!localEncounter?.chiefComplaint?.trim()) {
      if (!silentUnchanged) {
        dispatch(notify({ msg: 'Chief Complaint cannot be empty.', sev: 'warning' }));
      }
      return;
    }

    if (
      localEncounter.chiefComplaint.trim() === (encounterFromServer?.chiefComplaint ?? '').trim()
    ) {
      return;
    }

    const idToUpdate = localEncounter?.id ?? encounterId;
    if (!idToUpdate) {
      dispatch(notify({ msg: 'No encounter id to update', sev: 'error' }));
      return;
    }

    const payload = {
      ...toEncounterPayload(localEncounter),
      physicalExaminationSummery: encounterFromServer?.physicalExaminationSummery ?? null
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

    try {
      const updatedEncounter = await updateEncounter({ id: idToUpdate, body: payload }).unwrap();
      setLocalEncounter(updatedEncounter);
      dispatch(notify({ msg: 'Chief complaint saved successfully', sev: 'success' }));
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || error?.data?.message || 'Failed to save chief complaint',
          sev: 'error'
        })
      );
    }
  };

  return (
    <SectionContainer
      collapsible
      title={<Translate>Chief Complain</Translate>}
      action={
        <MyButton size="small" onClick={() => saveChanges(false)} disabled={disabled}>
          Save
        </MyButton>
      }
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
            disabled={disabled}
            onBlur={() => {
              if (!disabled) saveChanges(true);
            }}
          />
        </Form>
      }
    />
  );
};

export default ChiefComplaintSection;
