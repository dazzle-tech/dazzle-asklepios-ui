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
  Grid,
  Row,
  Col,
  ButtonToolbar,
  Text,
  InputGroup,
  SelectPicker,
  DatePicker
} from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { initialListRequest } from '@/types/types';

import { newApPatientDiagnose } from '@/types/model-types-constructor';
import { Plus, Trash} from '@rsuite/icons';

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
  const existingDiagnoseKey ="";
  const [selectedDiagnose, setSelectedDiagnose] = useState<ApPatientDiagnose>({
    ...newApPatientDiagnose,
    visitKey: patientSlice.encounter.key,
      patientKey: patientSlice.patient.key,
      createdBy: 'Administrator'
     

  });
  
 const key=patientDiagnoseListResponse.data?.object?.[0].key??"";
 console.log(key);
 useEffect(() => {
  if (patientDiagnoseListResponse.data?.object?.length > 0) {
    setSelectedDiagnose(patientDiagnoseListResponse.data.object[0]);
  }
}, [patientDiagnoseListResponse.data]);

console.log(selectedDiagnose);
  const save = () => {
   
    try{
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
      <Panel   >
        <Grid fluid>
          <Row gutter={15}>
            <Col xs={11} >
              <Row >
                <Text  style={{ zoom:0.80}}>Diagnose</Text>
                <SelectPicker
                  disabled={patientSlice.encounter.encounterStatusLkey=='91109811181900'?true:false}
                  style={{ width: '100%' ,zoom:0.80}}
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
                />
              </Row>
              <Row >
                
                <Text  style={{ zoom:0.80}}>Additional Description</Text>
                <InputGroup>
                  <InputGroup.Addon>
                    {<icons.CheckRound color="green" />}


                  </InputGroup.Addon>
                  <Input
                    disabled={patientSlice.encounter.encounterStatusLkey=='91109811181900'?true:false}
                    style={{zoom:0.80 }}
                    value={selectedDiagnose.description}
                  onChange={e => setSelectedDiagnose({ ...selectedDiagnose, description: e })}
                 
                  />
                </InputGroup>
              </Row>

            </Col>
            <Col xs={10} >

              <Row gutter={5}>
                <div style={{ display: "flex", gap: "2px" }}>

                  <div style={{ display: "flex", flexDirection: "column", flex: "1" }}><Text style={{marginRight:"2px"}} >Syspected</Text><Toggle  
                  onChange={e =>
                    setSelectedDiagnose({
                      ...selectedDiagnose,
                      isSuspected: e
                    })
                  } checkedChildren="Yes" unCheckedChildren="No"  
                  defaultChecked ={selectedDiagnose.isSuspected}
                  disabled={patientSlice.encounter.encounterStatusLkey=='91109811181900'?true:false}
                  /></div>

                  <div style={{ display: "flex", flexDirection: "column", flex: "1" }}><Text>Major</Text>
                  <Toggle 
                   onChange={e =>
                    setSelectedDiagnose({
                      ...selectedDiagnose,
                      isMajor: e
                    })}
                    disabled={patientSlice.encounter.encounterStatusLkey=='91109811181900'?true:false}
                  checkedChildren="Yes" unCheckedChildren="No" defaultChecked={selectedDiagnose.isMajor} /></div>
                </div>
              </Row>
              <Row style={{display:"flex"}} >
              <div style={{display:'flex',flexDirection:'column'}}>
              <Text  style={{ zoom:0.80}}>Type </Text>
                <SelectPicker
                disabled={patientSlice.encounter.encounterStatusLkey=='91109811181900'?true:false}
                  style={{ width: '100%',zoom:0.80 }}
                  data={sourceOfInfoLovResponseData?.object ?? []}
                  labelKey="lovDisplayVale"
                  valueKey="key"
                  placeholder="DIAGNOSIS TYPE"
                  value={selectedDiagnose.diagnoseTypeLkey}
                  onChange={e =>
                    setSelectedDiagnose({
                      ...selectedDiagnose,
                      diagnoseTypeLkey: e
                    })
                  }
                />
                </div>
               
                 <IconButton style={{zoom:0.90 ,color: "green"}}  icon={<MdSave/>} onClick={save} disabled={patientSlice.encounter.encounterStatusLkey=='91109811181900'?true:false}/>
              
              </Row>
            </Col>


          </Row>
          
        </Grid>

      </Panel>

    </>
  );
};

export default PatientDiagnosis;
