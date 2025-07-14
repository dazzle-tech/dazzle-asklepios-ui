import MyButton from '@/components/MyButton/MyButton';
import React, { useState } from 'react';
import { Col, Divider, Form, Row, Text } from 'rsuite';
import MyInput from '@/components/MyInput';
import Icd10Search from '@/pages/medical-component/Icd10Search';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyTagInput from '@/components/MyTagInput/MyTagInput';
import MyLabel from '@/components/MyLabel';
const DischargePlanning = () => {
    // Fetch readiness Status Lov response
  const { data: readinessStatusLovQueryResponse } = useGetLovValuesByCodeQuery('READINESS_STATUS');
  const [object, setObject] = useState({ homeCareNeeded: false, readinessStatus: "" });
  const [medicalEquipmentTags, setMedicalEquipmentTags] = useState([]);
  const [homeCareNeedsTags, setHomeCareNeedsTags] = useState([]);
  const [topicsCoveredTags, setTopicsCoveredTags] = useState([]);
  
  return (
    <>
      <Row gutter={15} className="d">
        <Form fluid>
          <Col md={12}>
            <Row>
              <div className="container-form">
                <div className="title-div">
                  <Text>Planned Discharge Readiness</Text>
                </div>
                <Divider />
                <Row>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="date"
                      fieldName="Expected Discharge Date"
                      record=""
                      setRecord=""
                    />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      disabled
                      fieldName="Estimated Length of Stay (LOS)"
                      record=""
                      setRecord=""
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      selectData={readinessStatusLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      fieldType="select"
                      fieldName="readinessStatus"
                      record={object}
                      setRecord={setObject}
                    />
                  </Col>
                  {object.readinessStatus == "7081919156301225" && (
                    <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldName="ReasonForDelay"
                      record=""
                      setRecord=""
                    />
                  </Col>
                )}
                </Row>
              </div>
            </Row>
            <Row>
              <div className="container-form">
                <div className="title-div">
                  <Text>Clinical Clearance</Text>
                </div>
                <Divider />
                <Row>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="medicalConditionStable"
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
                      fieldName="pendingInvestigations"
                      record={object}
                      setRecord={setObject}
                    />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      checkedLabel="Dependent"
                      unCheckedLabel="Independent"
                      fieldName="mobility"
                      fieldLabel="Mobility / ADL status"
                      record={object}
                      setRecord={setObject}
                    />
                  </Col>
                </Row>
                <Row>
                    <Col md={12}>
                    <Icd10Search object="" setOpject="" fieldName="diagnosisKey" />
                  </Col>
                </Row>
              </div>
            </Row>
                <Row>
               <div className="container-form">
                <div className="title-div">
                  <Text>Discharge Checklist</Text>
                </div>
                <Divider />
                <Row>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="finalMedicationReconciliationCompleted"
                      record={object}
                      setRecord={setObject}
                    />
                  </Col>
                  <Col md={12}>
                   <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="dischargeSummaryPrepared"
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
                      fieldName="dischargeOrdersSigned"
                      record={object}
                      setRecord={setObject}
                    />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="nursingDischargeReportDone"
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
                      fieldName="patient/familyInformed"
                      record={object}
                      setRecord={setObject}
                    />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="transportArranged"
                      record={object}
                      setRecord={setObject}
                    />
                  </Col>
                  </Row>
              </div>
              </Row>
          </Col>
          <Col md={12}>
            <Row>
              <div className="container-form">
                <div className="title-div">
                  <Text>Post-Discharge Needs</Text>
                </div>
                <Divider />
                <Row>
                   <Col md={12}>
                    <Text>Medications to Continue</Text>
                  </Col> 
                   <Col md={12}>
                    <MyButton>Prescription</MyButton>
                  </Col>
                </Row>
                <Row>
                  <Col md={24}>
                    <MyTagInput
                      tags={medicalEquipmentTags}
                      setTags={setMedicalEquipmentTags}
                      labelText="Medical Equipment"
                    />
                  </Col>
                  </Row>
                  <Row>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="homeCareNeeded"
                      record={object}
                      setRecord={setObject}
                    />
                  </Col>
                  {object.homeCareNeeded == true && (
                    <Col md={12}>
                      <MyTagInput
                        tags={homeCareNeedsTags}
                        setTags={setHomeCareNeedsTags}
                        labelText="Home Care Needs"
                      />
                    </Col>
                  )}
                  </Row>
                  <Row>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="textarea"
                      fieldName="dietaryPlan"
                      record={object}
                      setRecord={setObject}
                    />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="textarea"
                      fieldName="socialNeeds"
                      record={object}
                      setRecord={setObject}
                    />
                  </Col>
                  </Row>
                  <Row>
                   <Col md={12}>
                    <Text>Follow-up Plan</Text>
                  </Col> 
                   <Col md={12}>
                    <MyButton>Create follow-up</MyButton>
                  </Col>
                </Row>
              </div>
            </Row>
            <Row>
              <div className="container-form">
                <div className="title-div">
                  <Text>Patient Education</Text>
                </div>
                <Divider />                  
                  <Row>
                  <Col md={24}>
                    <MyTagInput
                      tags={topicsCoveredTags}
                      setTags={setTopicsCoveredTags}
                      labelText="Topics Covered"
                    />
                  </Col>
                  </Row>
                  <Row>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="textarea"
                      fieldName="dietaryPlan"
                      record={object}
                      setRecord={setObject}
                    />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="textarea"
                      fieldName="socialNeeds"
                      record={object}
                      setRecord={setObject}
                    />
                  </Col>
                  </Row>
                  <Row className='container-of-checks'>
                    <Col md={6}>
                      <MyLabel label="Material Given"/>
                    </Col>
                    <Col md={6}>
                      <MyInput
                        width="100%"
                        fieldType="check"
                        fieldName="Leaflet"
                        record={object}
                        setRecord={setObject}
                        showLabel={false}
                      />
                    </Col>
                    <Col md={6}>
                      <MyInput
                        width="100%"
                        fieldType="check"
                        fieldName="Verbal"
                        record={object}
                        setRecord={setObject}
                        showLabel={false}
                      />
                    </Col>
                    <Col md={6}>
                      <MyInput
                        width="100%"
                        fieldType="check"
                        fieldName="Video"
                        record={object}
                        setRecord={setObject}
                        showLabel={false}
                      />
                    </Col>
                  </Row>
                  <Row>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="educationProvided"
                      record={object}
                      setRecord={setObject}
                    />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldType="checkbox"
                      fieldName="patientUnderstanding"
                      checkedChildren="Verified"
                      unCheckedChildren="Not Verified"
                      record={object}
                      setRecord={setObject}
                    />
                  </Col>
                  </Row>
                   </div>
                </Row>
          </Col>
        </Form>
      </Row>
      
    </>
  );
};
export default DischargePlanning;
