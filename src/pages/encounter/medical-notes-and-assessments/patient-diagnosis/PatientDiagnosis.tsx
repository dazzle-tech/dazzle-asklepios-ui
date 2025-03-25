import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import * as icons from '@rsuite/icons';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import React, { useEffect, useState } from 'react';
import SearchIcon from '@rsuite/icons/Search';

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
  Form,
  Dropdown
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
const PatientDiagnosis = ({patient,encounter ,setEncounter}) => {
  
  const dispatch = useAppDispatch();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,

    timestamp: new Date().getMilliseconds(),
    sortBy: 'createdAt',
    sortType: 'desc',
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value:patient.key
      },
      {
        fieldName: 'visit_key',
        operator: 'match',
        value:encounter.key
      }

    ]
  });

  const patientDiagnoseListResponse = useGetPatientDiagnosisQuery(listRequest);
  const [listIcdRequest, setListIcdRequest] = useState({ ...initialListRequest });
  const { data: icdListResponseData } = useGetIcdListQuery(listIcdRequest);
 
  useEffect(() => {
    if (searchKeyword.trim() !== "") {
      setListIcdRequest(
        {
          ...initialListRequest,
          filterLogic: 'or',
          filters: [
            {
              fieldName: 'icd_code',
              operator: 'containsIgnoreCase',
              value: searchKeyword
            },
            {
              fieldName: 'description',
              operator: 'containsIgnoreCase',
              value: searchKeyword
            }

          ]
        }
      );
    }
  }, [searchKeyword]);
  const modifiedData = (icdListResponseData?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`
  }));
  const { data: sourceOfInfoLovResponseData } = useGetLovValuesByCodeQuery('DIAGNOSIS_TYPE');
  const { data: resolutionStatusLovResponseData } =
    useGetLovValuesByCodeQuery('ALLERGY_RES_STATUS');

  const [savePatientDiagnose, savePatientDiagnoseMutation] = useSavePatientDiagnoseMutation();
  const [diagnosisIcd, setDiagnosisIcd] = useState(null);
  const [selectedDiagnose, setSelectedDiagnose] = useState<ApPatientDiagnose>({
    ...newApPatientDiagnose,
    visitKey:encounter.key,
    patientKey:patient.key,
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
        ...selectedDiagnose,
        diagnoseCode: diagnosisIcd.key


      }).unwrap();
      dispatch(notify('saved  Successfully'));
    } catch (error) {

      console.error("Encounter save failed:", error);
      dispatch(notify('Save Failed'));
    }
  };
  const handleSearch = value => {
    setSearchKeyword(value);


  };
 
  return (
    <>
      <Panel style={{ display: 'flex', flexDirection: 'column', padding: '3px' }} >
        <div style={{ display: 'flex' }}>
          <div >
           
          
            <InputGroup inside style={{ width: '300px', zoom: 0.80 ,marginTop:'20px'}}>
              <Input
                placeholder={'Search ICD-10'}
                value={searchKeyword}
                onChange={handleSearch}
              />
              <InputGroup.Button>
                <SearchIcon />
              </InputGroup.Button>
            </InputGroup>
            {searchKeyword && (
              <Dropdown.Menu className="dropdown-menuresult">
                {modifiedData && modifiedData?.map(mod => (
                  <Dropdown.Item
                    key={mod.key}
                    eventKey={mod.key}
                    onClick={() => {
                      setSelectedDiagnose({
                        ...selectedDiagnose,
                        diagnoseCode: mod.key
                      })
                      setDiagnosisIcd(mod)
                      setSearchKeyword("");
                    }
                    }
                  >
                    <span style={{ marginRight: "19px" }}>{mod.icdCode}</span>
                    <span>{mod.description}</span>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            )}
          </div>
          <Form style={{ zoom: 0.87, marginLeft: "10px",display: 'flex' }} layout="inline" fluid>
            <MyInput

              disabled={encounter.encounterStatusLkey == '91109811181900' ? true : false}
              column
              fieldLabel="Suspected"
              fieldType="checkbox"
              fieldName="isSuspected"
              record={selectedDiagnose}
              setRecord={setSelectedDiagnose}
            //   disabled={!editing}
            />
            <MyInput
              style={{ marginLeft: "10px" }}
              disabled={encounter.encounterStatusLkey == '91109811181900' ? true : false}
              column
              fieldLabel="Major"
              fieldType="checkbox"
              fieldName="isMajor"
              record={selectedDiagnose}
              setRecord={setSelectedDiagnose}
            //   disabled={!editing}
            />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>

              <Button
                color="green"
                appearance="primary"
                onClick={save}


              >
                <Translate>Save</Translate>
              </Button>
            </div>
          </Form>

        </div>
        <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
          <div>

            <Text style={{ zoom: 0.85 }}>Diagnosis</Text>
            <InputGroup>

              <Input
                disabled={true}
                style={{ zoom: 0.80, width: '300px' }}
                value={
                  icdListResponseData?.object.find(item => item.key === selectedDiagnose?.diagnoseCode)
                  ? `${icdListResponseData.object.find(item => item.key === selectedDiagnose?.diagnoseCode)?.icdCode}, ${icdListResponseData.object.find(item => item.key === selectedDiagnose?.diagnoseCode)?.description}`
                  : ""
                }
                
              

              />
            </InputGroup>
            
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '3px' }}>
            <Text style={{ zoom: 0.88, width: '200px' }}>Type </Text>
            <SelectPicker
              disabled={encounter.encounterStatusLkey == '91109811181900' ? true : false}
              style={{ width: '100%', zoom: 0.96 }}
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


        </div>
      </Panel>

    </>
  );
};

export default PatientDiagnosis;
