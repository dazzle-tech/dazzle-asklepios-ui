import React, { useEffect, useState } from 'react';
import { Divider } from 'rsuite';

import MyInput from '@/components/MyInput';
import { Form, Tabs, Text } from 'rsuite';
import ChildBoy from '../../../../images/Chart_Child_Boy.svg';
import ChildGirl from '../../../../images/Chart_Child_Girl.svg';
import Female from '../../../../images/Chart_Female.svg';
import Male from '../../../../images/Chart_Male.svg';
import './styles.less';

import { useGetAgeGroupValueQuery } from '@/services/patientService';
import PatientDiagnosis from '../../medical-notes-and-assessments/patient-diagnosis';
import ReviewOfSystems from '../../medical-notes-and-assessments/review-of-systems';

import { useSaveEncounterChangesMutation } from '@/services/encounterService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';

import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import { useGetObservationSummariesQuery } from '@/services/observationService';
import { ApPatientObservationSummary } from '@/types/model-types';
import { newApPatientObservationSummary } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';

const SOAP = props => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const [record, setRecord] = useState({});
  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;
  const [localEncounter, setLocalEncounter] = useState({ ...encounter });

  const { data: planLovQueryResponse } = useGetLovValuesByCodeQuery('VISIT_CAREPLAN_OPT');

  const [saveEncounterChanges, saveEncounterChangesMutation] = useSaveEncounterChangesMutation();

  const [patientObservationsListRequest, setPatientObservationsListRequest] = useState<ListRequest>(
    {
      ...initialListRequest,
      timestamp: new Date().getMilliseconds(),
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient.key
        },
        {
          fieldName: 'visit_key',
          operator: 'match',
          value: encounter.key
        }
      ]
    }
  );
  const { data: getCurrenttObservationSummaries } = useGetObservationSummariesQuery({
    ...patientObservationsListRequest
  });
  const { data: patientAgeGroupResponse, refetch: patientAgeGroupRefetch } =
    useGetAgeGroupValueQuery(
      {
        dob: patient?.dob ? new Date(patient.dob).toISOString() : null
      },
      { skip: !patient?.dob }
    );
  const currentObservationSummary =
    getCurrenttObservationSummaries?.object?.length > 0
      ? getCurrenttObservationSummaries.object[0]
      : null;
  const [patientObservationSummary, setPatientObservationSummary] =
    useState<ApPatientObservationSummary>({
      ...newApPatientObservationSummary,
      latesttemperature: null,
      latestbpSystolic: null,
      latestbpDiastolic: null,
      latestheartrate: null,
      latestrespiratoryrate: null,
      latestoxygensaturation: null,
      latestglucoselevel: null,
      latestweight: null,
      latestheight: null,
      latestheadcircumference: null,
      latestpainlevelLkey: null
    });

  useEffect(() => {
    if (saveEncounterChangesMutation.status === 'fulfilled') {
      setLocalEncounter(saveEncounterChangesMutation.data);
    }
  }, [saveEncounterChangesMutation]);

  useEffect(() => {
    setPatientObservationSummary(prevSummary => ({
      ...prevSummary,
      latesttemperature: currentObservationSummary?.latesttemperature,
      latestbpSystolic: currentObservationSummary?.latestbpSystolic,
      latestbpDiastolic: currentObservationSummary?.latestbpDiastolic,
      latestheartrate: currentObservationSummary?.latestheartrate,
      latestrespiratoryrate: currentObservationSummary?.latestrespiratoryrate,
      latestglucoselevel: currentObservationSummary?.latestglucoselevel,
      latestoxygensaturation: currentObservationSummary?.latestoxygensaturation,
      latestweight: currentObservationSummary?.latestweight,
      latestheight: currentObservationSummary?.latestheight,
      latestheadcircumference: currentObservationSummary?.latestheadcircumference,
      latestpainlevelLkey: currentObservationSummary?.latestpainlevelLkey,
      latestnotes: currentObservationSummary?.latestnotes,
      latestpaindescription: currentObservationSummary?.latestpaindescription,
      key: currentObservationSummary?.key
    }));
  }, [currentObservationSummary]);

  const saveChanges = async () => {
    try {
      await saveEncounterChanges(localEncounter).unwrap();
      dispatch(notify({ msg: '  Saved Successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify('Save Failed'));
    }
  };
  const savePlan = async () => {
    try {
      await saveEncounterChanges({ ...localEncounter }).unwrap();
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify('Save Failed'));
    }
  };

  return (
    <div className="patient-summary-container">
      <Tabs defaultActiveKey="1" appearance="subtle">
        <Tabs.Tab eventKey="1" title="Chief Complain">
          <div className={clsx('column-container', { 'disabled-panel': edit })}>
            <div className="top-section">
              <div className="flex1 chief-complaint-section-handle">
                <div className="title-div">
                  <Text>Chief Complaint </Text>
                  <MyButton size="small" onClick={saveChanges}>
                    Save
                  </MyButton>
                </div>
                <Divider />
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
              </div>

              <div className="flex1 chief-complaint-section-handle">
                <div className="title-div">
                  <Text>Assessment</Text>
                  <MyButton size="small" onClick={saveChanges}>
                    Save
                  </MyButton>
                </div>
                <Divider />
                <Form fluid>
                  <MyInput
                    width="100%"
                    height="95px"
                    showLabel={false}
                    placeholder={'Only you can see this Assessment'}
                    fieldType="textarea"
                    fieldName="assessmentSummery"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />
                </Form>
              </div>
            </div>

            <div className="flex1 chief-complaint-section-handle">
              <div className="title-div">
                <Text>Patient Diagnosis </Text>
              </div>
              <Divider />
              <PatientDiagnosis patient={patient} encounter={encounter} />
            </div>

            <div className="last-section-clinical-visit">
              <div className="clinical-section-box">
                <div className="clinical-section-header">
                  <Text>Plan</Text>
                  <MyButton size="small" onClick={saveChanges}>
                    Save
                  </MyButton>
                </div>
                <Divider />
                <Form fluid>
                  <MyInput
                    width="100%"
                    fieldType="select"
                    selectData={planLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    fieldName="planInstructionsLkey"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                  />
                  <MyInput
                    width="100%"
                    fieldType="textarea"
                    fieldName="planInstructionsNote"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                    row={4}
                  />
                </Form>
              </div>

              <div className="clinical-section-box">
                <div className="clinical-section-header">
                  <Text>Summary of Patient History</Text>
                  <MyButton size="small" onClick={saveChanges}>
                    Save
                  </MyButton>
                </div>
                <Divider />
                <Form fluid>
                  <MyInput
                    width="100%"
                    height="150px"
                    showLabel={false}
                    placeholder="Summary of Patient History"
                    fieldType="textarea"
                    fieldName="assessmentSummery"
                    record={record}
                    setRecord={setRecord}
                  />
                </Form>
              </div>
            </div>
          </div>
        </Tabs.Tab>
        <Tabs.Tab eventKey="2" title="Physical Examination & Findings">
          <ReviewOfSystems patient={patient} encounter={encounter} edit={edit} />
        </Tabs.Tab>
        <Tabs.Tab eventKey="3" title="Physical Examination & Findings BY Image">
          {(patientAgeGroupResponse?.object?.key === '5945922992301153' ||
            patientAgeGroupResponse?.object?.key === '1790407842882435' ||
            patientAgeGroupResponse?.object?.key === '5946401407873394' ||
            patientAgeGroupResponse?.object?.key === '1375554380483561' ||
            patientAgeGroupResponse?.object?.key === '5945877765605378') &&
            (patient?.genderLkey === '1' ? (
              <img className="image-style" src={ChildBoy} />
            ) : (
              <img className="image-style" src={ChildGirl} />
            ))}
          {(patientAgeGroupResponse?.object?.key === '1790428129203615' ||
            patientAgeGroupResponse?.object?.key === '1790525617633551') &&
            (patient?.genderLkey === '1' ? (
              <img className="image-style" src={Male} />
            ) : (
              <img className="image-style" src={Female} />
            ))}
        </Tabs.Tab>
      </Tabs>
    </div>
  );
};
export default SOAP;
