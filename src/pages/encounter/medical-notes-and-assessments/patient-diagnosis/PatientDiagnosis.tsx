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
import { Plus, Trash } from '@rsuite/icons';
import { MdSave } from 'react-icons/md';
import {
  useGetPatientDiagnosisQuery,
  useRemovePatientDiagnoseMutation,
  useSavePatientDiagnoseMutation
} from '@/services/encounterService';
import { useGetIcdListQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApPatientDiagnose } from '@/types/model-types';
const PatientDiagnosis = () => {
  const patientSlice = useAppSelector(state => state.patient);

  const [selectedDiagnose, setSelectedDiagnose] = useState<ApPatientDiagnose>({
    ...newApPatientDiagnose
  });

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
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
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

  const save = () => {
    savePatientDiagnose({
      ...selectedDiagnose,
      visitKey: patientSlice.encounter.key,
      patientKey: patientSlice.patient.key,
      createdBy: 'Administrator'
    }).unwrap();
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
      <Panel  >
        <Grid fluid>
          <Row gutter={15}>
            <Col xs={14} >
              <Row >
                <Text>Diagnose</Text>
                <SelectPicker
                  style={{ width: '100%' }}
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
                Additional Description
                <InputGroup>
                  <InputGroup.Addon>
                    {<icons.CheckRound color="green" />}


                  </InputGroup.Addon>
                  <Input


                    value={""}
                  // onChange={e => setLocalEncounter({ ...localEncounter, progressNote: e })}
                  // onBlur={progressNoteIsChanged() ? saveChanges : undefined}
                  />
                </InputGroup>
              </Row>

            </Col>
            <Col xs={7} >

              <Row gutter={5}>
                <div style={{ display: "flex", gap: "2px" }}>

                  <div style={{ display: "flex", flexDirection: "column", flex: "1" }}><Text >Syspected</Text><Toggle checkedChildren="Yes" unCheckedChildren="No" defaultChecked /></div>

                  <div style={{ display: "flex", flexDirection: "column", flex: "1" }}><Text>Major</Text><Toggle checkedChildren="Yes" unCheckedChildren="No" defaultChecked /></div>
                </div>
              </Row>
              <Row >
                <Text>Type</Text>
                <SelectPicker
                  style={{ width: '100%' }}
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
              </Row>
            </Col>


          </Row>
          
        </Grid>

      </Panel>

    </>
  );
};

export default PatientDiagnosis;
