import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import ReviewOfSystems from '../../medical-notes-and-assessments/review-of-systems';
import { useSaveEncounterChangesMutation } from '@/services/encounterService';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';
import SectionContainer from '@/components/SectionsoContainer';
import PatientPlan from '../../medical-notes-and-assessments/patient-plan/PatientPlan';
import PatientHistorySummary from '../patient-history/MedicalHistory/PatientHistorySummary';
import MyTab from '@/components/MyTab';
import { useGetEncounterByIdQuery } from '@/services/encounterService';
import { showSystemLoader, hideSystemLoader } from '@/utils/uiReducerActions';
import EncounterAssessmentSection from '../../medical-notes-and-assessments/encounter-assessments';
import PatientDiagnosis from '../../medical-notes-and-assessments/patient-diagnosis';

const SOAP = props => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const encounterKey = props.encounter?.key || location.state?.encounter?.key;

  const {
    data: encounterFromServer,
    isLoading,
    isFetching
  } = useGetEncounterByIdQuery(encounterKey, {
    skip: !encounterKey,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true
  });



  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;
  const [localEncounter, setLocalEncounter] = useState<any>(
    props.encounter || location.state?.encounter || {}
  );

  useEffect(() => {
    if (encounterFromServer) {
      setLocalEncounter(encounterFromServer);
    }
  }, [encounterFromServer]);

  const [saveEncounterChanges, saveEncounterChangesMutation] = useSaveEncounterChangesMutation();



  const saveChanges = async () => {
    try {
      const updatedEncounter = await saveEncounterChanges(localEncounter).unwrap();
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
              title={
                <>
                  Chief Complaint

                </>
              }
              content={<>
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
              </>}
              action={<MyButton size="small" onClick={saveChanges}>
                Save
              </MyButton>}
            />
            <EncounterAssessmentSection patient={patient} encounterId={encounter?.key} />
          </div>
          <SectionContainer
            title="Patient Diagnosis"
            content={<PatientDiagnosis patient={patient} encounter={encounter} />}
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
                encounter={encounter}
                edit={edit}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Physical Examination & Findings',
      content: <ReviewOfSystems patient={patient} encounter={encounter} edit={edit} />
    }
  ];

  useEffect(() => {
    if (isLoading || isFetching) {
      dispatch(showSystemLoader());
    } else {
      dispatch(hideSystemLoader());
    }

    return () => {
      dispatch(hideSystemLoader());
    };
  }, [isLoading, isFetching, dispatch]);


  return (
    <div className="patient-summary-container">
      <MyTab data={tabData} />
    </div>
  );
};
export default SOAP;
