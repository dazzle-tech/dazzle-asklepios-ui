import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import AddIcon from '@mui/icons-material/Add';
import { MdModeEdit } from 'react-icons/md';
import {
  useGetDepartmentsQuery,
  useGetLovValuesByCodeQuery,
  useGetUsersQuery
} from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useEffect, useRef, useState } from 'react';
import { Col, Divider, Form, Radio, RadioGroup, Row, Text } from 'rsuite';
import PatientSide from '../lab-module/PatienSide';
import MyTagInput from '@/components/MyTagInput/MyTagInput';
import GenericAdministeredMedications from '../encounter/encounter-component/procedure/Post-ProcedureCare/AdministeredMedications ';
import {
  useGetOperationPreMedicationListQuery,
  useSaveOperationPreMedicationMutation
} from '@/services/operationService';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { ImCancelCircle } from 'react-icons/im';
import AddEditPopup from './oepnAddEditPopup';
import CancellationModal from '@/components/CancellationModal';
import './styles.less';
import PostProcedureAnesthesia from '../encounter/encounter-component/procedure/Post-ProcedureCare/PostProcedureAnesthesia';
import ArrivalRecoveryRoom from './ArrivalRecoveryRoom';
import DischargeReadinessAssessment from './DischargeReadinessAssessment';
import ContinuousVitalsMonitoring from './ContinuousVitalsMonitoring';
const RecoveryRoomFunctionalities = ({ patient, encounter, operation }) => {
  const [iVFluidsGivenTags, setiVFluidsGivenTags] = useState([]);
  const [analgesicsGivenTags, setAanalgesicsGivenTags] = useState([]);
  const [drainsAndTubesTags, setDrainsAndTubesTags] = useState([]);
  const [complicationsObservedTags, setComplicationsObservedTags] = useState([]);
  const [object, setObject] = useState({ oxygenGiven: false, returnToDifferentWard: false });
  const [departmentListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [openAddNewPopup, setOpenAddNewPopup] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [observation, setObservation] = useState({});
  const [popupCancelOpen, setPopupCancelOpen] = useState<boolean>(false);
  // Fetch  consciousness Level Lov response
  const { data: consciousnessLevelLovQueryResponse } = useGetLovValuesByCodeQuery('LEVEL_OF_CONSC');
  // Fetch  pain Level Lov response
  const { data: painLevelLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
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
                <div className="container-form">
                  <div className="title-div">
                    <Text>Anesthesia Recovery</Text>
                  </div>
                  <Divider />
                  <Row>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldName="anesthesiaType"
                        record=""
                        setRecord=""
                        disabled
                      />
                    </Col>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldName="airwayTypeOnArrival"
                        record=""
                        setRecord=""
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldType="checkbox"
                        fieldName="oxygenGiven"
                        record={object}
                        setRecord={setObject}
                      />
                    </Col>
                    {object.oxygenGiven == true && (
                      <Col md={12}>
                        <MyInput
                          width="100%"
                          fieldType="number"
                          fieldName=""
                          fieldLabel="L/min"
                          record={object}
                          setRecord={setObject}
                        />
                      </Col>
                    )}
                  </Row>
                  <MyInput
                    width="100%"
                    fieldType="time"
                    fieldName="extubationTime"
                    record={object}
                    setRecord={setObject}
                  />
                  <Row className="container-of-radio-recovery">
                    <Col md={6}>
                      <label>Extubation Status</label>
                    </Col>
                    <Col md={18}>
                      <RadioGroup name="extubationStatus" inline>
                        <Radio value="extubated">Extubated</Radio>
                        <Radio value="Not extubated">Not extubated</Radio>
                        <Radio value="na">NA</Radio>
                      </RadioGroup>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <MyInput
                        fieldLabel="Consciousness Level"
                        fieldType="select"
                        fieldName="consciousnessLevel"
                        selectData={consciousnessLevelLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record=""
                        setRecord=""
                        maxHeightMenu={200}
                      />
                    </Col>
                    <Col md={12}>
                      <MyInput
                        fieldLabel="Pain Level"
                        fieldType="select"
                        fieldName="painLevel"
                        selectData={painLevelLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record=""
                        setRecord=""
                        maxHeightMenu={200}
                      />
                    </Col>
                  </Row>
                  <MyInput
                    width="100%"
                    fieldType="checkbox"
                    fieldName="nausea/vomiting"
                    record={object}
                    setRecord={setObject}
                  />
                  <GenericAdministeredMedications
                    parentKey=""
                    filterFieldName=""
                    medicationService={{
                      useGetQuery: useGetOperationPreMedicationListQuery,
                      useSaveMutation: useSaveOperationPreMedicationMutation
                    }}
                    newMedicationTemplate=""
                    title="Antiemetics Given"
                    noBorder
                  />
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
              <Row>
                <div className="container-form">
                  <div className="title-div">
                    <Text>Nursing Care & Interventions</Text>
                  </div>
                  <Divider />
                  <Row>
                    <Col md={12}>
                      <MyTagInput
                        tags={iVFluidsGivenTags}
                        setTags={setiVFluidsGivenTags}
                        labelText="IV Fluids Given"
                      />
                    </Col>
                    <Col md={12}>
                      <MyTagInput
                        tags={analgesicsGivenTags}
                        setTags={setAanalgesicsGivenTags}
                        labelText="Analgesics Given"
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <MyTagInput
                        tags={drainsAndTubesTags}
                        setTags={setDrainsAndTubesTags}
                        labelText="Drains & Tubes"
                      />
                    </Col>
                    <Col md={12}>
                      <MyTagInput
                        tags={complicationsObservedTags}
                        setTags={setComplicationsObservedTags}
                        labelText="Complications Observed"
                      />
                    </Col>
                  </Row>
                  <Row className="container-of-radio-recovery">
                    <Col md={8}>
                      <label>Wound/Dressing Checked</label>
                    </Col>

                    <Col md={16}>
                      <RadioGroup name="extubationStatus" inline>
                        <Radio value="clean">Clean</Radio>
                        <Radio value="Not extubated">Oozing</Radio>
                        <Radio value="na">Reinforced</Radio>
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
