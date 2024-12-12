import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import './styles.less';
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

        sortBy: 'plannedStartDate',
        filters: [
            {

                fieldName: 'patient_key',
                operator: 'match',
                value: patient.key
            }

        ],

    });
    const { data: encounterPatientList } = useGetEncountersQuery({ ...patientVisitListRequest });
    const [LastPatientVisit, setLastPatientVisit] = useState<ApEncounter>({ ...newApEncounter });
    const [chartModelIsOpen, setChartModelIsOpen] = useState(false);
    const [majorModelIsOpen, setMajorModelIsOpen] = useState(false);
    const [ChronicModelIsOpen, setChronicModelIsOpen] = useState(false);
    const getPrevObjectByPlannedStartDate = (targetDate) => {

        const list = encounterPatientList?.object;


        if (!Array.isArray(list) || list.length === 0) {
            return null;
        }


        const index = list.findIndex(
            (item) => item.plannedStartDate.slice(0, 10) === targetDate
        );


        if (index !== -1 && index - 1 < list.length) {
            return list[index - 1];
        }

        return null;
    };

    const handleopenchartModel = () => {
        setChartModelIsOpen(true);
    };
    const handleopenMajoModel = () => {
        setMajorModelIsOpen(true);
    };
    const handleclosechartModel = () => {
        setChartModelIsOpen(false);
    };
    const handlecloseMajorModel = () => {
        setMajorModelIsOpen(false);
    };
    const handleopenChronicModel = () => {
        setChronicModelIsOpen(true);
    };
    const handlecloseChronicModel = () => {
        setChronicModelIsOpen(false);
    };
    console.log(patientVisitListRequest);
    console.log(encounterPatientList?.object);
    console.log(getPrevObjectByPlannedStartDate(encounter.plannedStartDate));
    console.log(encounterPatientList);

    return (<>
        <h5>Patient Dashboard</h5>

        <div className='patient-summary-container'>


            <div className='patient-summary-Column'>
                <div className='patient-summary-panel'>


                    Previuos Visit
                    <Form disabled style={{ zoom: 0.85 }} layout="inline" fluid >
                        <MyInput
                            column
                            width={140}
                            fieldLabel="Visit Date"
                            fieldType="date"
                            fieldName="plannedStartDate"
                            record={getPrevObjectByPlannedStartDate(encounter.plannedStartDate) || {}}
                        />
                        <MyInput
                            column
                            width={140}
                            fieldType="select"
                            fieldLabel="Visit Type"
                            fieldName="encounterTypeLkey"
                            selectData={encounterTypeLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={getPrevObjectByPlannedStartDate(encounter.plannedStartDate) || {}}
                        />
                        <MyInput
                            width={140}
                            column
                            fieldType="select"
                            fieldLabel="Reason"
                            fieldName="encounterReasonLkey"
                            selectData={encounterReasonLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={getPrevObjectByPlannedStartDate(encounter.plannedStartDate) || {}}
                        />

                        <MyInput
                            column
                            width={250}
                            fieldLabel="Diagnosis Description"
                            fieldName="PreviuosDiagnosis"
                            record={encounter}
                        /></Form>

                </div>

                <div style={{ flex: 2 }} className='patient-summary-panel' onClick={handleopenMajoModel}>
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

                            </Table>
                        </Col>
                    </Row>

                </div>

                <div style={{ flex: 2 }} className='patient-summary-panel' onClick={handleopenChronicModel}>
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
                                    <Table.HeaderCell>Dose(Unit)</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>

                            </Table>
                        </Col>
                    </Row>
                </div>
            </div>




            <div className='patient-summary-Column'>

                <div className='patient-summary-panel' >
                    <img className='image-style' src={Chart} onClick={handleopenchartModel} />
                </div>

            </div>

            <div className='patient-summary-Column'>
                <div className='patient-summary-panel'>
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
                <div className='patient-summary-panel'>
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
                <div className='patient-summary-panel'>
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
                    </Row></div>
            </div>
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

            <Modal open={majorModelIsOpen} onClose={handlecloseMajorModel}>
                <Modal.Header>
                    <Modal.Title>Modal Title</Modal.Title>
                </Modal.Header>
                <Modal.Body>
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
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handlecloseMajorModel} appearance="primary">
                        Ok
                    </Button>
                    <Button onClick={handlecloseMajorModel} appearance="subtle">
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal open={ChronicModelIsOpen} onClose={handlecloseChronicModel}>
                <Modal.Header>
                    <Modal.Title>Modal Title</Modal.Title>
                </Modal.Header>
                <Modal.Body>
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
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handlecloseChronicModel} appearance="primary">
                        Ok
                    </Button>
                    <Button onClick={handlecloseChronicModel} appearance="subtle">
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    </>);
};
export default PatientSummary;




