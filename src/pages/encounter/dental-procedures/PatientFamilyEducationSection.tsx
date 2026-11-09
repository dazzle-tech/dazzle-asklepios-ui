import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useGetLatestPatientFamilyEducationQuery,
  useSavePatientFamilyEducationMutation
} from '@/services/patientFamilyEducationService';

type PatientFamilyEducationSectionProps = {
  patient?: any;
  encounter?: any;
  disabled?: boolean;
};

const emptyEducation = {
  id: null as number | null,
  topic: '',
  method: '',
  effectiveness: ''
};

const PatientFamilyEducationSection: React.FC<PatientFamilyEducationSectionProps> = ({
  patient,
  encounter,
  disabled = false
}) => {
  const dispatch = useAppDispatch();
  const educationMethods = useEnumOptions('PatientFamilyEducationMethod');
  const patientId = Number(patient?.id ?? patient?.key);
  const encounterId = Number(encounter?.id);
  const [record, setRecord] = useState({ ...emptyEducation });

  const { data } = useGetLatestPatientFamilyEducationQuery(encounterId, {
    skip: !encounterId
  });
  const [saveEducation, saveState] = useSavePatientFamilyEducationMutation();

  useEffect(() => {
    setRecord({
      id: data?.id ?? null,
      topic: data?.topic ?? '',
      method: data?.method ?? '',
      effectiveness: data?.effectiveness ?? ''
    });
  }, [data?.id, data?.topic, data?.method, data?.effectiveness, encounterId]);

  const handleSave = async () => {
    if (!record.topic?.trim()) {
      dispatch(notify({ msg: 'Topic is required.', sev: 'warning' }));
      return;
    }
    if (!patientId || !encounterId) {
      dispatch(notify({ msg: 'Patient and encounter are required.', sev: 'warning' }));
      return;
    }

    try {
      await saveEducation({
        id: record.id,
        patientId,
        encounterId,
        topic: record.topic.trim(),
        method: record.method || null,
        effectiveness: record.effectiveness?.trim() || null
      }).unwrap();
      dispatch(notify({ msg: 'Patient and family education saved', sev: 'success' }));
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.data?.detail ||
            error?.data?.message ||
            'Failed to save patient and family education',
          sev: 'warning'
        })
      );
    }
  };

  return (
    <SectionContainer
      collapsible
      title={<Translate>Patient & Family Education</Translate>}
      action={
        <MyButton onClick={handleSave} disabled={disabled || saveState.isLoading || !encounterId}>
          Save
        </MyButton>
      }
      content={
        <Form fluid>
          <div className="dental-education-grid">
            <MyInput
              width="100%"
              fieldType="text"
              fieldName="topic"
              fieldLabel="Topic"
              record={record}
              setRecord={setRecord}
              disabled={disabled}
              required
            />
            <MyInput
              width="100%"
              fieldType="select"
              fieldName="method"
              fieldLabel="Method"
              selectData={educationMethods}
              selectDataLabel="label"
              selectDataValue="value"
              record={record}
              setRecord={setRecord}
              disabled={disabled}
            />
            <MyInput
              width="100%"
              fieldType="textarea"
              fieldName="effectiveness"
              fieldLabel="Effectiveness"
              record={record}
              setRecord={setRecord}
              disabled={disabled}
            />
          </div>
        </Form>
      }
    />
  );
};

export default PatientFamilyEducationSection;
