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
const RecoveryRoomFunctionalities = ({ patient, encounter }) => {
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
  const anesthesiaRef = useRef(null);

  // dummy data
  const data = [
    {
      key: '1',
      time: '12:12',
      latestbpSystolic: '20',
      latestbpDiastolic: '20',
      latestheartrate: '20',
      latestrespiratoryrate: '20',
      latestoxygensaturation: '20',
      latesttemperature: '20'
    },
    {
      key: '2',
      time: '11:11',
      latestbpSystolic: '30',
      latestbpDiastolic: '30',
      latestheartrate: '30',
      latestrespiratoryrate: '30',
      latestoxygensaturation: '30',
      latesttemperature: '30'
    },
    {
      key: '3',
      time: '10:10',
      latestbpSystolic: '40',
      latestbpDiastolic: '40',
      latestheartrate: '40',
      latestrespiratoryrate: '40',
      latestoxygensaturation: '40',
      latesttemperature: '40'
    }
  ];

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && observation && rowData.key === observation.key) {
      return 'selected-row';
    } else return '';
  };

  // Icons column for
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={20}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => setOpenAddNewPopup(true)}
      />
      <ImCancelCircle
        title="Cancel"
        size={18}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => setPopupCancelOpen(true)}
      />
    </div>
  );

  // Table Columns
  const tableColumns = [
    {
      key: 'time',
      title: <Translate>Time</Translate>
    },
    {
      key: 'latestbpSystolic',
      title: <Translate>BP</Translate>,
      render: (rowData: any) => `${rowData?.latestbpSystolic}/${rowData?.latestbpDiastolic} mmHg`
    },
    {
      key: 'latestheartrate',
      title: <Translate>Pulse</Translate>,
      render: (rowData: any) => (rowData?.latestheartrate ? `${rowData?.latestheartrate} bpm` : ' ')
    },
    {
      key: 'latestrespiratoryrate',
      title: <Translate>R.R</Translate>,
      render: (rowData: any) =>
        rowData?.latestrespiratoryrate ? `${rowData?.latestrespiratoryrate} bpm` : ' '
    },
    {
      key: 'latestoxygensaturation',
      title: <Translate>SpO2</Translate>,
      render: (rowData: any) =>
        rowData?.latestoxygensaturation ? `${rowData?.latestoxygensaturation} %` : ' '
    },
    {
      key: 'latesttemperature',
      title: <Translate>Temp</Translate>,
      render: (rowData: any) =>
        rowData?.latesttemperature ? `${rowData?.latesttemperature} °C` : ' '
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: () => iconsForActions()
    }
  ];

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
                <div className="container-form">
                  <div className="title-div">
                    <Text>Arrival to Recovery Room</Text>
                  </div>
                  <Divider />
                  <Row>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="time"
                        fieldName="arrivalTime"
                        record=""
                        setRecord=""
                      />
                    </Col>
                    <Col md={8}>
                      <MyInput width="100%" fieldName="accompaniedBy" record="" setRecord="" />
                    </Col>
                    <Col md={8}>
                      <MyInput width="100%" fieldName="handoverSummary" record="" setRecord="" />
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldType="time"
                        fieldName="initialAssessmentTime"
                        record=""
                        setRecord=""
                      />
                    </Col>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldType="select"
                        fieldLabel="User"
                        selectData={userList?.object ?? []}
                        selectDataLabel="username"
                        selectDataValue="key"
                        fieldName="initiatedBy"
                        record=""
                        setRecord=""
                      />
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
                <div className="container-form">
                  <div className="title-div">
                    <Text>Continuous Vitals Monitoring</Text>
                  </div>
                  <Divider />
                  <div className="container-of-add-new-button">
                    <MyButton
                      prefixIcon={() => <AddIcon />}
                      color="var(--deep-blue)"
                      width="90px"
                      onClick={() => {
                        setOpenAddNewPopup(true);
                        setObservation({});
                      }}
                    >
                      Add
                    </MyButton>
                  </div>
                  <MyTable
                    data={data}
                    columns={tableColumns}
                    onRowClick={rowData => {
                      setObservation({ ...rowData });
                    }}
                    rowClassName={rowData => isSelected(rowData)}
                  />
                  <AddEditPopup
                    open={openAddNewPopup}
                    setOpen={setOpenAddNewPopup}
                    observation={observation}
                    setObservation={setObservation}
                    width={width}
                  />
                  <CancellationModal
                    title="Cancel Observation"
                    fieldLabel="Cancellation Reason"
                    open={popupCancelOpen}
                    setOpen={setPopupCancelOpen}
                    object={observation}
                    setObject={setObservation}
                    handleCancle=""
                    fieldName="cancellationReason"
                  />
                  <br />
                </div>
              </Row>
              <Row>
                <div className="container-form">
                  <div className="title-div">
                    <Text>Discharge Readiness Assessment</Text>
                  </div>
                  <Divider />
                  <PostProcedureAnesthesia noBorder ref={anesthesiaRef} procedure="" user="" />
                  <Row>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldType="checkbox"
                        fieldName="painControlled"
                        record={object}
                        setRecord={setObject}
                      />
                    </Col>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldType="checkbox"
                        fieldName="vitalsStable"
                        record={object}
                        setRecord={setObject}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldType="checkbox"
                        fieldName="fullyAwake"
                        record={object}
                        setRecord={setObject}
                      />
                    </Col>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldType="checkbox"
                        fieldName="ableToMaintainAirway"
                        record={object}
                        setRecord={setObject}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldType="checkbox"
                        fieldName="site/DressingIntact"
                        record={object}
                        setRecord={setObject}
                      />
                    </Col>
                    <Col md={12}>
                      <MyInput
                        width="100%"
                        fieldType="checkbox"
                        fieldName="Nausea Controlled"
                        record={object}
                        setRecord={setObject}
                      />
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
