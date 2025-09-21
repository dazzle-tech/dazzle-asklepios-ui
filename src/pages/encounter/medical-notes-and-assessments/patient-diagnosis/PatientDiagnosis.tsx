import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import React, { useEffect, useState } from 'react';
import {
  Form,
} from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { initialListRequest } from '@/types/types';
import { newApPatientDiagnose } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetPatientDiagnosisQuery,
  useSavePatientDiagnoseMutation
} from '@/services/encounterService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import './styles.less';
import Icd10Search from '@/pages/medical-component/Icd10Search';
const PatientDiagnosis = ({ patient, encounter }) => {
  const dispatch = useAppDispatch();
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,

    timestamp: new Date().getMilliseconds(),
    sortBy: 'createdAt',
    sortType: 'desc',
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
  });

  const patientDiagnoseListResponse = useGetPatientDiagnosisQuery(listRequest);
  const { data: sourceOfInfoLovResponseData } = useGetLovValuesByCodeQuery('DIAGNOSIS_TYPE');

  const [savePatientDiagnose] = useSavePatientDiagnoseMutation();

  const [selectedDiagnose, setSelectedDiagnose] = useState<any>({
    ...newApPatientDiagnose,
    visitKey: encounter.key,
    patientKey: patient.key,
    createdBy: 'Administrator'
  });
  useEffect(() => {
    if (patientDiagnoseListResponse.data?.object?.length > 0) {
      setSelectedDiagnose(patientDiagnoseListResponse.data.object[0]);
    }
  }, [patientDiagnoseListResponse.data]);

  const save = () => {
    try {
      savePatientDiagnose({
        ...selectedDiagnose
      }).unwrap();
      dispatch(notify({ msg: 'saved  Successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify('Save Failed'));
    }
  };

  return (
    <div className="flex-column gap10">
      <Icd10Search
        object={selectedDiagnose}
        setOpject={setSelectedDiagnose}
        fieldName="diagnoseCode"
        label="Diagnosis"
      />
      <div className="mid-div">
        <div className="type-div">
          <Form fluid>
          <MyInput 
           fieldName="diagnoseTypeLkey"
           fieldType='select'
           record={selectedDiagnose}
           setRecord={setSelectedDiagnose}
            disabled={encounter.encounterStatusLkey == '91109811181900' ? true : false}
            selectData={sourceOfInfoLovResponseData?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            fieldLabel="Type"
            width="100%"
          />
          </Form>
        </div>
      </div>
      <div className="buttom-dev">
        <Form className="flex-row gap10" layout="inline" fluid>
          <MyInput
            disabled={encounter.encounterStatusLkey == '91109811181900' ? true : false}
            column
            fieldLabel="Suspected"
            fieldType="checkbox"
            fieldName="isSuspected"
            record={selectedDiagnose}
            setRecord={setSelectedDiagnose}
          />
          <MyInput
            disabled={encounter.encounterStatusLkey == '91109811181900' ? true : false}
            column
            fieldLabel="Major"
            fieldType="checkbox"
            fieldName="isMajor"
            record={selectedDiagnose}
            setRecord={setSelectedDiagnose}
          />
        </Form>
        <div className="bt-save-div">
          <MyButton size="small" onClick={save}>
            Save
          </MyButton>
        </div>
      </div>
    </div>
  );
};

export default PatientDiagnosis;
