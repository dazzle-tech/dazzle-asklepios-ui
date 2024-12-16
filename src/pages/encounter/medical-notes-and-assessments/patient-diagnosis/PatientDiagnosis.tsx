import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import * as icons from '@rsuite/icons';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import React, { useEffect, useState } from 'react';
import { Toggle } from 'rsuite';
import {
  FlexboxGrid,
  IconButton,
  Input,
  Panel,
  Table,
  Button,
  Grid,
  Row,
  Col,
  ButtonToolbar,
  Text,
  InputGroup,
  SelectPicker,
  DatePicker,
  Form
} from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { initialListRequest } from '@/types/types';

import { newApPatientDiagnose } from '@/types/model-types-constructor';
import { Plus, Trash } from '@rsuite/icons';

import { MdSave } from 'react-icons/md';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetPatientDiagnosisQuery,
  useRemovePatientDiagnoseMutation,
  useSavePatientDiagnoseMutation
} from '@/services/encounterService';
import { useGetIcdListQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApPatientDiagnose } from '@/types/model-types';
const PatientDiagnosis = () => {
  const patientSlice = useAppSelector(state => state.patient);
  const dispatch = useAppDispatch();


  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
    pageSize: 100,
    timestamp: new Date().getMilliseconds(),
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patientSlice.patient.key
      },
      {
        fieldName: 'visit_key',
        operator: 'match',
        value: patientSlice.encounter.key
      }

    ]
  });

  const patientDiagnoseListResponse = useGetPatientDiagnosisQuery(listRequest);

  const { data: icdListResponseData } = useGetIcdListQuery({
    ...initialListRequest,
    pageSize: 100
  });

  const { data: sourceOfInfoLovResponseData } = useGetLovValuesByCodeQuery('DIAGNOSIS_TYPE');
  const { data: resolutionStatusLovResponseData } =
    useGetLovValuesByCodeQuery('ALLERGY_RES_STATUS');

  const [savePatientDiagnose, savePatientDiagnoseMutation] = useSavePatientDiagnoseMutation();
  const [removePatientDiagnose, removePatientDiagnoseMutation] = useRemovePatientDiagnoseMutation();
  const existingDiagnoseKey = "";
  const [selectedDiagnose, setSelectedDiagnose] = useState<ApPatientDiagnose>({
    ...newApPatientDiagnose,
    visitKey: patientSlice.encounter.key,
    patientKey: patientSlice.patient.key,
    createdBy: 'Administrator'


  });


  const key =
    patientDiagnoseListResponse?.data?.object &&
      Array.isArray(patientDiagnoseListResponse.data.object) &&
      patientDiagnoseListResponse.data.object.length > 0
      ? patientDiagnoseListResponse.data.object[0].key ?? ""
      : "";

  console.log(key);

  useEffect(() => {
    if (patientDiagnoseListResponse.data?.object?.length > 0) {
      setSelectedDiagnose(patientDiagnoseListResponse.data.object[0]);
    }
  }, [patientDiagnoseListResponse.data]);

  console.log(selectedDiagnose);
  const save = () => {

    try {
      savePatientDiagnose({
        ...selectedDiagnose


      }).unwrap();
      dispatch(notify('saved  Successfully'));
    } catch (error) {

      console.error("Encounter save failed:", error);
      dispatch(notify('saved  fill'));
    }
  };

  const remove = () => {
    if (selectedDiagnose.key) {
      removePatientDiagnose({
        ...selectedDiagnose,
        deletedBy: 'Administrator'
      }).unwrap();
    }
  };

  useEffect(() => {
    if (savePatientDiagnoseMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getMilliseconds()
      });
      setSelectedDiagnose({ ...newApPatientDiagnose });
    }
  }, [savePatientDiagnoseMutation]);

  useEffect(() => {
    if (removePatientDiagnoseMutation.isSuccess) {
      setListRequest({
        ...listRequest,
        timestamp: new Date().getMilliseconds()
      });
      setSelectedDiagnose({ ...newApPatientDiagnose });
    }
  }, [removePatientDiagnoseMutation]);

  function formatDate(_date) {
    if (!_date) return '';

    const date = new Date(_date);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}/${month}/${day}`;
  }

  const isSelected = rowData => {
    if (rowData && rowData.key === selectedDiagnose.key) {
      return 'selected-row';
    } else return '';
  };
  return (
    <>
      <Panel style={{ display: 'flex', flexDirection: 'column', padding: '3px' }} >
        <div style={{ display: 'flex' }}>
          <div >
            <Text style={{ zoom: 0.88 }}>Diagnose</Text>
            <SelectPicker
              disabled={patientSlice.encounter.encounterStatusLkey == '91109811181900' ? true : false}
              style={{ width: '200px', zoom: 0.80 }}
              data={icdListResponseData?.object ?? []}
              labelKey="description"
              valueKey="key"
              placeholder="ICD"
              value={selectedDiagnose.diagnoseCode}
              onChange={e =>
                setSelectedDiagnose({
                  ...selectedDiagnose,
                  diagnoseCode: e
                })
              }
              renderMenuItem={(label, item) => (
                <div>
                   <span>{item.icdCode}</span>- <span>{item.description}</span> 
                </div>
            )}
            />
          </div>
          <Form style={{ zoom: 0.80, marginLeft: "3px" }} layout="inline" fluid>
            <MyInput

              disabled={patientSlice.encounter.encounterStatusLkey == '91109811181900' ? true : false}
              column
              fieldLabel="Suspected"
              fieldType="checkbox"
              fieldName="isSuspected"
              record={selectedDiagnose}
              setRecord={setSelectedDiagnose}
            //   disabled={!editing}
            />
            <MyInput

              disabled={patientSlice.encounter.encounterStatusLkey == '91109811181900' ? true : false}
              column
              fieldLabel="Major"
              fieldType="checkbox"
              fieldName="isMajor"
              record={selectedDiagnose}
              setRecord={setSelectedDiagnose}
            //   disabled={!editing}
            />
          </Form>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <div>

            <Text style={{ zoom: 0.85 }}>Additional Description</Text>
            <InputGroup>
              <InputGroup.Addon>
                {<icons.CheckRound color="green" />}


              </InputGroup.Addon>
              <Input
                disabled={patientSlice.encounter.encounterStatusLkey == '91109811181900' ? true : false}
                style={{ zoom: 0.80 }}
                value={selectedDiagnose.description}
                onChange={e => setSelectedDiagnose({ ...selectedDiagnose, description: e })}

              />
            </InputGroup>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '3px' }}>
            <Text style={{ zoom: 0.88 }}>Type </Text>
            <SelectPicker
              disabled={patientSlice.encounter.encounterStatusLkey == '91109811181900' ? true : false}
              style={{ width: '100%', zoom: 0.94 }}
              data={sourceOfInfoLovResponseData?.object ?? []}
              labelKey="lovDisplayVale"
              valueKey="key"

              value={selectedDiagnose.diagnoseTypeLkey}
              onChange={e =>
                setSelectedDiagnose({
                  ...selectedDiagnose,
                  diagnoseTypeLkey: e
                })
              }
            />
          </div>
          <div style={{display:'flex',justifyContent: 'center', alignItems: 'flex-end'}}>
          <Button
                    color="green"
                    appearance="primary"
                    onClick={save}
                  
                    
                >
                    <Translate>Save</Translate>
                </Button>
                </div>
       
        </div>
      </Panel>

    </>
  );
};

export default PatientDiagnosis;
