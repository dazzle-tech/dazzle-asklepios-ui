import React, { useMemo } from 'react';
import { Col, Form, Row } from 'rsuite';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useUpdateEmergencyTriageEyeAssessmentMutation } from '@/services/encounters/er-triage/emergencyTriageService';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import PatientHistorySummary from '@/pages/encounter/encounter-component/patient-history/MedicalHistory/PatientHistorySummary/PatientHistorySummary';

type EyeAssessmentHPIProps = {
  triageId?: number | string | null;
  triage: any;
  setTriage: (next: any) => void;
  patient?: any;
  encounter?: any;
  readOnly?: boolean;
};

const EyeAssessmentHPI = ({
  triageId,
  triage,
  setTriage,
  patient,
  encounter,
  readOnly = false
}: EyeAssessmentHPIProps) => {
  const dispatch = useAppDispatch();
  const [updateEyeAssessment, updateEyeAssessmentState] = useUpdateEmergencyTriageEyeAssessmentMutation();
  const { data: sizeLovQueryResponse } = useGetLovValuesByCodeQuery('SIZE');

  const sizeOptions = useMemo(() => {
    const list = sizeLovQueryResponse?.object ?? [];
    return list.map((x: any) => ({
      label: x?.lovDisplayVale ?? x?.valueCode ?? x?.key,
      value: x?.valueCode ?? x?.lovDisplayVale ?? x?.key
    }));
  }, [sizeLovQueryResponse]);

  const handleSave = async () => {
    if (!triageId) {
      dispatch(notify({ msg: 'Emergency triage record not found (missing id)', sev: 'error' }));
      return;
    }

    try {
      const updated = await updateEyeAssessment({
        id: Number(triageId),
        rightEyeLightResponse: !!triage?.rightEyeLightResponse,
        rightEyePupilSize: triage?.rightEyePupilSize ?? null,
        leftEyeLightResponse: !!triage?.leftEyeLightResponse,
        leftEyePupilSize: triage?.leftEyePupilSize ?? null,
        hpiAdditionalNotes: triage?.hpiAdditionalNotes ?? null
      }).unwrap();

      setTriage((prev: any) => ({ ...prev, ...updated }));
      dispatch(notify({ msg: 'Eye assessment saved', sev: 'success' }));
    } catch (error) {
      console.error('Error saving eye assessment', error);
      dispatch(notify({ msg: 'Failed to save eye assessment', sev: 'error' }));
    }
  };

  return (
    <SectionContainer
      title="Eye Assessment & HPI"
      content={
        <>
          <Row>
            <Col md={12}>
              <SectionContainer
                title="Right eye"
                content={
                  <Form fluid layout="inline">
                    <MyInput
                      width={200}
                      column
                      fieldLabel="Reacting to light"
                      fieldType="checkbox"
                      fieldName="rightEyeLightResponse"
                      record={triage}
                      setRecord={setTriage}
                      disabled={readOnly}
                    />
                    <MyInput
                      column
                      width={200}
                      fieldLabel="Pupil Size"
                      fieldType="select"
                      fieldName="rightEyePupilSize"
                      selectData={sizeOptions}
                      selectDataLabel="label"
                      selectDataValue="value"
                      record={triage}
                      setRecord={setTriage}
                      searchable={false}
                      disabled={readOnly}
                    />
                  </Form>
                }
              />
            </Col>

            <Col md={12}>
              <SectionContainer
                title="Left eye"
                content={
                  <Form fluid layout="inline">
                    <MyInput
                      width={200}
                      column
                      fieldLabel="Reacting to light"
                      fieldType="checkbox"
                      fieldName="leftEyeLightResponse"
                      record={triage}
                      setRecord={setTriage}
                      disabled={readOnly}
                    />
                    <MyInput
                      column
                      width={200}
                      fieldLabel="Pupil Size"
                      fieldType="select"
                      fieldName="leftEyePupilSize"
                      selectData={sizeOptions}
                      selectDataLabel="label"
                      selectDataValue="value"
                      record={triage}
                      setRecord={setTriage}
                      searchable={false}
                      disabled={readOnly}
                    />
                  </Form>
                }
              />
            </Col>
          </Row>

          <Row>
            <Col md={24}>
              <SectionContainer
                title="HPI"
                content={
                  <Form fluid layout="inline" className="form-inline-wrap bt-div">
                    <MyInput
                      column
                      fieldType="textarea"
                      record={triage}
                      setRecord={setTriage}
                      fieldLabel="Additional notes"
                      fieldName="hpiAdditionalNotes"
                      width={400}
                      disabled={readOnly}
                    />

                    {!readOnly && (
                      <MyButton
                        onClick={handleSave}
                        appearance="primary"
                        disabled={updateEyeAssessmentState.isLoading}
                      >
                       <Translate> Save </Translate>
                      </MyButton>
                    )}
                  </Form>
                }
              />
            </Col>
          </Row>

          <Row>
            <Col md={24}>
              <PatientHistorySummary patient={patient} encounter={encounter} />
            </Col>
          </Row>
        </>
      }
    />
  );
};

export default EyeAssessmentHPI;


