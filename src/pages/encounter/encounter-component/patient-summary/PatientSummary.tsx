import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApEncounter } from '@/types/model-types';
import { newApEncounter } from '@/types/model-types-constructor';
import Chart from '../../../../images/trace.svg';
import { initialListRequest, ListRequest } from '@/types/types';
import {
    FlexboxGrid,
    IconButton,
    Input,
    Panel,
    Table,
    Grid,
    Row,
    Col,
    Modal,
    Button,
    ButtonToolbar,
    Placeholder,
    Text,
    InputGroup,
    SelectPicker
} from 'rsuite';
import { useGetEncountersQuery } from '@/services/encounterService';
const PatientSummary = ({ patient, encounter }) => {
    const { data: encounterTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
    const { data: encounterReasonLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_REASON');


    const [patientVisitListRequest, setPatientVisitListReques] = useState<ListRequest>({
      ...initialListRequest,

      sortBy:'plannedStartDate',
      filters: [
        {
            
          fieldName: 'patient_key',
          operator: 'match',
          value:patient.key
        }

      ],

    });
    const {data:encounterPatientList}=useGetEncountersQuery({...patientVisitListRequest});
    const [LastPatientVisit, setLastPatientVisit] = useState<ApEncounter>({ ...newApEncounter});
    const [chartModelIsOpen, setChartModelIsOpen] = useState(false);
    const getNextObjectByPlannedStartDate = (targetDate) => {
        // الوصول إلى المصفوفة داخل خاصية "object"
        const list = encounterPatientList?.object;
    
        // تحقق مما إذا كانت المصفوفة موجودة وغير فارغة
        if (!Array.isArray(list) || list.length === 0) {
            return null;
        }
    
        // إيجاد فهرس العنصر الذي يتطابق مع التاريخ المحدد
        const index = list.findIndex(
            (item) => item.plannedStartDate.slice(0, 10) === targetDate
        );
    
        // التأكد من أن هناك عنصرًا تاليًا
        if (index !== -1 && index + 1 < list.length) {
            return list[index + 1]; // إعادة العنصر التالي
        }
    
        return null; // إذا لم يوجد عنصر تالي أو التاريخ غير موجود
    };
    
    const handleopenchartModel = () => {
        setChartModelIsOpen(true);
    };
    const handleclosechartModel = () => {
        setChartModelIsOpen(false);
    };
    console.log(patientVisitListRequest);
    console.log( encounterPatientList?.object);
    console.log(getNextObjectByPlannedStartDate(encounter.plannedStartDate));
    console.log(encounterPatientList); // تحقق من هيكل encounterPatientList

    return (<>
        <h5>Patient Summary</h5>

        <div style={{ height: '100vh', display: 'flex', margin: "5px", gap: '18px' }}>


            <div style={{ flex: 3, display: 'flex', flexDirection: "column", gap: '20px' }}>
                <div style={{ flex: 1, display: 'flex', gap: '10px' }}>

                    <div style={{ flex: 1, border: '1px solid #8c8c8c', borderRadius: '8px', padding: "15px" }} >
                        Previuos Visit
                        <Form disabled style={{ zoom: 0.85 }} layout="inline" fluid >
                            <MyInput
                                column
                                width={130}
                                fieldLabel="Visit Date"
                                fieldType="date"
                                fieldName="plannedStartDate"
                                record={getNextObjectByPlannedStartDate(encounter.plannedStartDate) || {}}
                            />
                            <MyInput
                                column
                                width={130}
                                fieldType="select"
                                fieldLabel="Visit Type"
                                fieldName="encounterTypeLkey"
                                selectData={encounterTypeLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={getNextObjectByPlannedStartDate(encounter.plannedStartDate) || {}}
                            />
                            <MyInput
                                width={130}
                                column
                                fieldType="select"
                                fieldLabel="Reason"
                                fieldName="encounterReasonLkey"
                                selectData={encounterReasonLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={getNextObjectByPlannedStartDate(encounter.plannedStartDate) || {}}
                            />
                        </Form>


                    </div>
                    <div style={{ flex: 1, border: '1px solid #8c8c8c', borderRadius: '8px', padding: "15px" }} >
                        Previuos Diagnosis
                        <br />
                        <Form disabled style={{ zoom: 0.85 }} layout="inline" fluid >
                            <MyInput
                                column
                                fieldLabel="Diagnosis Description"
                                fieldName="PreviuosDiagnosis"
                                record={encounter}
                            /></Form>
                    </div>
                </div>

                <div style={{ flex: 2, border: '1px solid #8c8c8c', borderRadius: '8px', padding: "10px" }}>
                    Patient Major Problem
                    <Row gutter={15}>
                        <Col xs={24}>
                            <Table
                                bordered
                                onRowClick={rowData => {

                                }}


                            >

                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell>Problem code</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell>Description</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell>Severity</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell>Diagnosis Date</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                            </Table>
                        </Col>
                    </Row>

                </div>

                <div style={{ flex: 2, border: '1px solid #8c8c8c', borderRadius: '8px', padding: "10px" }}>
                Patient Chronic Medications
                     <Row gutter={15}>
            <Col xs={24}>
              <Table
                bordered
                onRowClick={rowData => {
                  
                }}
                
               
              >
               
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Medication Generic Name</Table.HeaderCell>
                  <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Medication Active Ingredient(s)</Table.HeaderCell>
                  <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Dose(Unit)</Table.HeaderCell>
                  <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Internal Code</Table.HeaderCell>
                  <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={1}>
                  <Table.HeaderCell>Start Date</Table.HeaderCell>
                  <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                </Table.Column>
              </Table>
            </Col>
          </Row>
</div>
            </div>




            <div style={{ flex: 1, display: 'flex', flexDirection: "column", gap: '20px' }}>
                <div style={{ flex: 1, border: '1px solid #8c8c8c', borderRadius: '8px', padding: "10px" }} >
                No-Show count
                    <Form disabled style={{ zoom: 0.85 }} layout="inline" fluid>
                    <MyInput
                                column
                               fieldLabel="Count"
                                fieldName="PreviuosDiagnosis"
                                record={encounter}
                            />
                    </Form>
                    </div>
                <div style={{ flex: 5, border: '1px solid #8c8c8c', borderRadius: '8px' }} >
                    <img style={{ width: "300px", height: "100%", objectFit: "cover", borderRadius: '8px' }} src={Chart} onClick={handleopenchartModel} />
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: "column", gap: '20px' }}>
                <div style={{ flex: 1, border: '1px solid #8c8c8c', borderRadius: '8px', padding: "5px" }}>
                    Active Allergies
                    <Row gutter={10}>
                        <Col xs={24}>
                            <Table
                                bordered
                                onRowClick={rowData => {

                                }}


                            >

                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '10px' }} >Allergy Type</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '10px' }}>Allergene</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '10px' }} >Start Date</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>

                            </Table>
                        </Col>
                    </Row>
                </div>
                <div style={{ flex: 1, border: '1px solid #8c8c8c', borderRadius: '8px', padding: "5px" }}>
                    Medical Warnings
                    <Row gutter={10}>
                        <Col xs={24}>
                            <Table
                                bordered
                                onRowClick={rowData => {

                                }}


                            >

                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '10px' }}>Warning Type</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '10px' }}>Warning</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '10px' }}>Start Date</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>

                            </Table>
                        </Col>
                    </Row>
                </div>
                <div style={{ flex: 1, border: '1px solid #8c8c8c', borderRadius: '8px', padding: "5px" }}>
                    Recent Test Results
                    <Row gutter={10}>
                        <Col xs={24}>
                            <Table
                                bordered
                                onRowClick={rowData => {

                                }}


                            >

                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '9px' }}> Type</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '9px' }}>Name</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '9px' }} >Order Time</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '9px' }}>Result Time</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                            </Table>
                        </Col>
                    </Row></div></div>
            <Modal open={chartModelIsOpen} onClose={handleclosechartModel}>
                <Modal.Header>
                    <Modal.Title>Modal Title</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <img style={{ width: "400px", height: "500px", objectFit: "cover", borderRadius: '8px' }} src={Chart} />
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleclosechartModel} appearance="primary">
                        Ok
                    </Button>
                    <Button onClick={handleclosechartModel} appearance="subtle">
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    </>);
};
export default PatientSummary; 