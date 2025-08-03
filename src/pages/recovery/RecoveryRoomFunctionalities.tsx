import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTagInput from '@/components/MyTagInput/MyTagInput';
import {
  useGetOperationPreMedicationListQuery,
  useSaveOperationPreMedicationMutation
} from '@/services/operationService';
import {
  useGetDepartmentsQuery,
  useGetLovValuesByCodeQuery,
  useGetUsersQuery
} from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useEffect, useState } from 'react';
import { Col, Divider, Form, Radio, RadioGroup, Row, Text } from 'rsuite';
import GenericAdministeredMedications from '../encounter/encounter-component/procedure/Post-ProcedureCare/AdministeredMedications ';
import PatientSide from '../lab-module/PatienSide';
import ArrivalRecoveryRoom from './ArrivalRecoveryRoom';
import ContinuousVitalsMonitoring from './ContinuousVitalsMonitoring';
import DischargeReadinessAssessment from './DischargeReadinessAssessment';
import './styles.less';
import AnesthesiaRecovery from './AnesthesiaRecovery';
import NursingCare from './NursingCareInterventions';
const RecoveryRoomFunctionalities = ({ patient, encounter, operation }) => {
  const [object, setObject] = useState({ oxygenGiven: false, returnToDifferentWard: false });
  const [departmentListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [width, setWidth] = useState<number>(window.innerWidth);

  // Fetch  department List response
  const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);
  const { data: userList } = useGetUsersQuery({
    ...initialListRequest,
    //to do Nurse code
    filters: [
      {
        fieldName: 'job_role_lkey',
        operator: 'match',
        value: '157153858530600'
      }
    ]
  });


 



 

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="container">
      <div className="left-box">
        <Row gutter={15} className="d">
          <Form fluid>
            <Col md={12}>
              <Row>
                <ArrivalRecoveryRoom operation={operation} />
              </Row>
              <Row>
                <AnesthesiaRecovery operation={operation} />
              </Row>
              <Row>
              <NursingCare operation={operation} />
              </Row>
            </Col>
            <Col md={12}>
              <Row>
                <ContinuousVitalsMonitoring operation={operation} />
              </Row>
              <Row>
                <DischargeReadinessAssessment operation={operation} />
              </Row>
              <Row>
                <div className="container-form">
                  <div className="title-div">
                    <Text>Discharge to Ward</Text>
                  </div>
                  <Divider />
                  <Row>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="checkbox"
                        fieldName="returnToDifferentWard"
                        record={object}
                        setRecord={setObject}
                      />
                    </Col>
                    {object.returnToDifferentWard && (
                      <Col md={8}>
                        <MyInput
                          fieldName="departmentKey"
                          fieldType="select"
                          fieldLabel="Select Designation"
                          selectData={departmentListResponse?.object ?? []}
                          selectDataLabel="name"
                          selectDataValue="key"
                          record=""
                          setRecord=""
                          width="100%"
                          menuMaxHeight={150}
                        />
                      </Col>
                    )}
                    {object.returnToDifferentWard && (
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="time"
                          fieldName="transferTime"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>
                    )}
                  </Row>
                  <Row>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="Receiving Nurse"
                        selectData={userList?.object ?? []}
                        selectDataLabel="username"
                        selectDataValue="key"
                        fieldName="receivingNurse"
                        record=""
                        setRecord=""
                      />
                    </Col>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldName="finalNotes"
                        record={object}
                        setRecord={setObject}
                      />
                    </Col>
                  </Row>
                  <MyInput
                    width="100%"
                    fieldType="checkbox"
                    fieldLabel="Patient ID Band Rechecked"
                    fieldName="patientIdBandRechecked"
                    record={object}
                    setRecord={setObject}
                  />
                  <Row className="container-of-radio-recovery">
                    <Col md={6}>
                      <label>Transport Mode</label>
                    </Col>
                    <Col md={18}>
                      <RadioGroup name="Transport Mode" inline>
                        <Radio value="bed">Bed</Radio>
                        <Radio value="stretcher">Stretcher</Radio>
                        <Radio value="wheelchair">Wheelchair</Radio>
                      </RadioGroup>
                    </Col>
                  </Row>
                  <br />
                  <Row>
                    <div className="container-of-add-new-button">
                      <MyButton color="var(--deep-blue)" width="90px">
                        Save
                      </MyButton>
                    </div>
                  </Row>
                </div>
              </Row>
            </Col>
          </Form>
        </Row>
      </div>
      <div className="right-box">
        <PatientSide patient={patient} encounter={encounter} />
      </div>
    </div>
  );
};
export default RecoveryRoomFunctionalities;
