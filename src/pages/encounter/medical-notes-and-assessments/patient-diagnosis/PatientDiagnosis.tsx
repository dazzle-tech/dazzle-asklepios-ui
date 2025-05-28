import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import * as icons from '@rsuite/icons';
import { useAppDispatch, useAppSelector } from '@/hooks';
import React, { useEffect, useState } from 'react';
import SearchIcon from '@rsuite/icons/Search';
import { forwardRef, useImperativeHandle } from 'react';
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
import './styles.less';
const PatientDiagnosis = ({ patient, encounter }) => {
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
  const [listIcdRequest, setListIcdRequest] = useState({ ...initialListRequest,pageSize:1000 });
  const { data: icdListResponseData } = useGetIcdListQuery(listIcdRequest);

  useEffect(() => {
    if (searchKeyword.trim() !== '') {
      setListIcdRequest({
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
      });
    }
  }, [searchKeyword]);
  const modifiedData = (icdListResponseData?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`
  }));
  const { data: sourceOfInfoLovResponseData } = useGetLovValuesByCodeQuery('DIAGNOSIS_TYPE');

  const [savePatientDiagnose, savePatientDiagnoseMutation] = useSavePatientDiagnoseMutation();
  const [diagnosisIcd, setDiagnosisIcd] = useState(null);
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
        ...selectedDiagnose,
        diagnoseCode: diagnosisIcd.key
      }).unwrap();
      dispatch(notify({msg:'saved  Successfully',sev:'success'}));
    } catch (error) {
      console.error('Encounter save failed:', error);
      dispatch(notify('Save Failed'));
    }

  };
  const handleSearch = value => {
    setSearchKeyword(value);
  };

  return (

    <div  className='flex-column gap10'>
      <Text>Search</Text>
         <InputGroup inside >
            <Input placeholder={'Search ICD-10'} value={searchKeyword} onChange={handleSearch} />

            <InputGroup.Button>
              <SearchIcon />
            </InputGroup.Button>
          </InputGroup>
          
          {searchKeyword && (
            <Dropdown.Menu>
              {modifiedData &&
                modifiedData?.map(mod => (
                  <Dropdown.Item
               
                    key={mod.key}
                    eventKey={mod.key}
                    onClick={() => {
                      setSelectedDiagnose({
                        ...selectedDiagnose,
                        diagnoseCode: mod.key
                      });
                      setDiagnosisIcd(mod);
                      setSearchKeyword('');
                    }}
                  >

                    <span >{mod.icdCode}</span>
                    <span>&nbsp; &nbsp;</span>

                    <span>{mod.description}</span>
                  </Dropdown.Item>
                ))}
            </Dropdown.Menu>
          )}
          
          <div  className='mid-div'>
          <div style={{flex:1}} >
          <Text>Diagnosis</Text>
          <InputGroup>
            <Input
              disabled={true}
             
              value={
              selectedDiagnose?.diagnosisObject
                  ? `${
                      selectedDiagnose?.diagnosisObject?.icdCode
                    }, ${
                     selectedDiagnose?.diagnosisObject?.description
                    }`
                  : ''
              }
            />
          </InputGroup>
        </div>
        <div  className='type-div' >
          <Text >Type </Text>
          <SelectPicker
            disabled={encounter.encounterStatusLkey == '91109811181900' ? true : false}
           
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
      <div className='buttom-dev'>
       
        <Form  className='flex-row gap10' layout="inline" fluid>
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

            disabled={encounter.encounterStatusLkey == '91109811181900' ? true : false}
            column
            fieldLabel="Major"
            fieldType="checkbox"
            fieldName="isMajor"
            record={selectedDiagnose}
            setRecord={setSelectedDiagnose}
            //   disabled={!editing}
          />
         
        </Form>
        <div  className='bt-save-div'>
        <MyButton
                    size='small'
                   
                    onClick={save}

                  >Save</MyButton>
                  </div>
      </div>
      
    </div>
  );
};

export default PatientDiagnosis;
