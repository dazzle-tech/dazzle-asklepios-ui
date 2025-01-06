import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import './styles.less';
import { BodyComponent } from "reactjs-human-body";
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApEncounter } from '@/types/model-types';
import { newApEncounter } from '@/types/model-types-constructor';
import Chart from '../../../../images/bodychart.svg';
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
import {
    useGetPatientDiagnosisQuery,
} from '@/services/encounterService';
import {
    useGetPrescriptionsQuery,
    useGetPrescriptionMedicationsQuery,
    useGetAllergiesQuery,
    useGetCustomeInstructionsQuery
} from '@/services/encounterService';
import {
    useGetGenericMedicationQuery
} from '@/services/medicationsSetupService';
import { useGetEncountersQuery } from '@/services/encounterService';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useGetAllergensQuery } from '@/services/setupService';
import {
    useGetPrescriptionInstructionQuery,

} from '@/services/medicationsSetupService';
import { useGetGenericMedicationActiveIngredientQuery, useGetActiveIngredientQuery } from '@/services/medicationsSetupService';

const PatientSummary = ({ patient, encounter }) => {
    const patientSlice = useAppSelector(state => state.patient);
    const { data: encounterTypeLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_TYPE');
    const { data: encounterReasonLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_REASON');
    const { data: allergensListToGetName } = useGetAllergensQuery({
        ...initialListRequest
    });
    const filters = [
        {
            fieldName: 'patient_key',
            operator: 'match',
            value: patientSlice.patient.key
        },

        {
            fieldName: "status_lkey",
            operator: "Match",
            value: "9766169155908512",
        }
    ];


    const { data: customeInstructions, isLoading: isLoadingCustomeInstructions, refetch: refetchCo } = useGetCustomeInstructionsQuery({
        ...initialListRequest,

    });
    const { data: activeIngredientListResponseData } = useGetActiveIngredientQuery({ ...initialListRequest });
    const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({ ...initialListRequest });
    const { data: allergiesListResponse, refetch: fetchallerges } = useGetAllergiesQuery({ ...initialListRequest, filters });
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
    const { data: encounterPatientList } = useGetEncountersQuery({ ...patientVisitListRequest }, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
    });
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
    const getPrevDiag = (targetDate) => {

        const list = encounterPatientList?.object;


        if (!Array.isArray(list) || list.length === 0) {
            return null;
        }


        const index = list.findIndex(
            (item) => item.plannedStartDate.slice(0, 10) === targetDate
        );


        if (index !== -1 && index - 1 < list.length) {
            return list[index - 1].key;
        }

        return null;
    };
    const [listmRequest, setListmRequest] = useState({
        ...initialListRequest,
        pageSize: 100,
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
                fieldName: 'is_major',
                operator: 'match',
                value: true
            },


        ]
    });
    console.log(getPrevObjectByPlannedStartDate(patientSlice.encounter.plannedStartDate)?.key)
    const [listdRequest, setListdRequest] = useState({
        ...initialListRequest,
        pageSize: 100,
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
                value: getPrevObjectByPlannedStartDate(patientSlice.encounter.plannedStartDate)?.key
            }


        ]
    });
    const { data: majorDiagnoses } = useGetPatientDiagnosisQuery(listmRequest)
    const majorDiagnosesCodes = majorDiagnoses?.object.map(diagnose => diagnose);
    const { data: Diagnoses, refetch: fetchlastDiag } = useGetPatientDiagnosisQuery(listdRequest
        , {
            refetchOnMountOrArgChange: true,
            refetchOnFocus: true
        }

    )


    const { data: genericMedicationListResponse } = useGetGenericMedicationQuery({ ...initialListRequest });
    const { data: prescriptionMedications, isLoading: isLoadingPrescriptions, refetch: preRefetch } = useGetPrescriptionMedicationsQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patient.key
            },
            {
                fieldName: "chronic_medication",
                operator: "match",
                value: true
            },
            {
                fieldName: "status_lkey",
                operator: "match",
                value: "1804482322306061"
            },


        ],
    });
   const [listGinricRequest, setListGinricRequest] = useState({
        ...initialListRequest,

        
       
        sortType: 'desc'
        
            
           
        
    });
    const { data: genericMedicationActiveIngredientListResponseData, refetch: refetchGenric } = useGetGenericMedicationActiveIngredientQuery({...listGinricRequest});

   console.log(genericMedicationActiveIngredientListResponseData?.object)

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
    const joinValuesFromArray = (values) => {
        return values.filter(Boolean).join(', ');
    };

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
                            width={300}
                            fieldLabel="Diagnosis Description"
                            fieldName="description"
                            record={Diagnoses?.object[0]?.diagnosisObject || {}}
                        /></Form>

                </div>

                <div style={{ flex: 2 }} className='patient-summary-panel' onClick={handleopenMajoModel}>
                    Patient Major Problem
                    <Row gutter={15}>
                        <Col xs={24}>
                            <Table
                                bordered
                                data={majorDiagnosesCodes ?? []}
                                onRowClick={rowData => {

                                }}


                            >

                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell>Problem code</Table.HeaderCell>
                                    <Table.Cell>{rowData => rowData.diagnosisObject.icdCode}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1} fullText>
                                    <Table.HeaderCell>Description</Table.HeaderCell>
                                    <Table.Cell>{rowData => rowData.diagnosisObject.description}</Table.Cell>
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
                                data={prescriptionMedications?.object ?? []}
                                onRowClick={rowData => {

                                }}


                            >

                                <Table.Column flexGrow={1} fullText>
                                    <Table.HeaderCell>Medication Generic Name</Table.HeaderCell>
                                    <Table.Cell>{rowData =>
                                        genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey)?.genericName
                                    }</Table.Cell>
                                </Table.Column>

                                <Table.Column flexGrow={1} fullText>
                                    <Table.HeaderCell>Instructions</Table.HeaderCell>
                                    <Table.Cell>
                                        {rowData => {
                                            if (rowData.instructionsTypeLkey === "3010591042600262") {
                                                const generic = predefinedInstructionsListResponse?.object?.find(
                                                    item => item.key === rowData.instructions
                                                );

                                                if (generic) {
                                                    console.log("Found generic:", generic);
                                                } else {
                                                    console.warn("No matching generic found for key:", rowData.instructions);
                                                }
                                                return [
                                                    generic?.dose,
                                                    generic?.unitLvalue?.lovDisplayVale,

                                                    generic?.frequencyLvalue?.lovDisplayVale
                                                ]
                                                    .filter(Boolean)
                                                    .join(', ');
                                            }
                                            if (rowData.instructionsTypeLkey === "3010573499898196") {
                                                return rowData.instructions

                                            }
                                            if (rowData.instructionsTypeLkey === "3010606785535008") {
                                                return customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.dose +
                                                    "," + customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.unitLvalue.lovDisplayVale + "," +
                                                    customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.frequencyLvalue.lovDisplayVale


                                            }

                                            return "no";
                                        }}
                                    </Table.Cell>
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
                                data={allergiesListResponse?.object || []}
                                onRowClick={rowData => {

                                }}


                            >

                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '10px' }} >Allergy Type</Table.HeaderCell>
                                    <Table.Cell>{rowData => rowData.allergyTypeLvalue?.lovDisplayVale}</Table.Cell>

                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '10px' }}>Allergene</Table.HeaderCell>
                                    <Table.Cell>
                                        {rowData => {
                                            
                                            if (!allergensListToGetName?.object) {
                                                return "Loading...";
                                            }
                                            const getname = allergensListToGetName.object.find(item => item.key === rowData.allergenKey);
                                            
                                            return getname?.allergenName || "No Name";
                                        }}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell style={{ fontSize: '10px' }} >Start Date</Table.HeaderCell>
                                    <Table.Cell>{rowData =>
                                        rowData.severityLvalue?.lovDisplayVale
                                    }</Table.Cell>
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
                    <Modal.Title>Body Diagram</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <BodyComponent
                        partsInput={{
                            head: { show: true },
                            leftShoulder: { show: true },
                            rightShoulder: { show: true },
                            leftArm: { show: true },
                            rightArm: { show: true },
                            chest: { show: true },
                            stomach: { show: true },
                            leftLeg: { show: true },
                            rightLeg: { show: true },
                            leftHand: { show: true },
                            rightHand: { show: true },
                            leftFoot: { show: true },
                            rightFoot: { show: true }
                        }}
                    />

                </Modal.Body>
                <Modal.Footer style={{ display: "flex", justifyContent: "flex-start" }}>
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
                    <Modal.Title>Patient Major Diagnoses </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row gutter={15}>
                        <Col xs={24}>
                            <Table
                                bordered
                                data={majorDiagnosesCodes ?? []}
                                onRowClick={rowData => {

                                }}


                            >

                                <Table.Column flexGrow={1} fullText>
                                    <Table.HeaderCell>Problem code</Table.HeaderCell>
                                    <Table.Cell>{rowData => rowData.diagnosisObject.icdCode}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={2} fullText>
                                    <Table.HeaderCell>Description</Table.HeaderCell>
                                    <Table.Cell>{rowData => rowData.diagnosisObject.description}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1} fullText>
                                    <Table.HeaderCell>Type</Table.HeaderCell>
                                    <Table.Cell>
                                        {rowData =>
                                            rowData.diagnoseTypeLvalue
                                                ? rowData.diagnoseTypeLvalue.lovDisplayVale
                                                : rowData.diagnoseTypeLkey
                                        }
                                    </Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={2} fullText>
                                    <Table.HeaderCell>Diagnosis Date</Table.HeaderCell>
                                    <Table.Cell>{rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ""}</Table.Cell>
                                </Table.Column>
                            </Table>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer style={{ display: "flex", justifyContent: "flex-start" }}>
                    <Button onClick={handlecloseMajorModel} appearance="primary">
                        Ok
                    </Button>
                    <Button onClick={handlecloseMajorModel} appearance="subtle">
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal size="md" open={ChronicModelIsOpen} onClose={handlecloseChronicModel}>
                <Modal.Header>
                    <Modal.Title>Patient Chronic Medications</Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    <Table
                        bordered
                        data={prescriptionMedications?.object ?? []}
                        onRowClick={rowData => {

                        }}


                    >

                        <Table.Column flexGrow={1} fullText>
                            <Table.HeaderCell>Medication Generic Name</Table.HeaderCell>
                            <Table.Cell>{rowData =>
                                genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey)?.genericName
                            }</Table.Cell>
                        </Table.Column>
                        <Table.Column flexGrow={2} fullText>
                            <Table.HeaderCell>Medication Active Ingredient(s)</Table.HeaderCell>
                            <Table.Cell>{rowData => {
                               const act = genericMedicationActiveIngredientListResponseData?.object?.filter(gin => {
                                console.log(`Checking: ${rowData.genericMedicationsKey} === ${gin.genericMedicationKey}`);  return rowData.genericMedicationsKey === gin.genericMedicationKey;
                            });
                             
                             const ingredientNames = activeIngredientListResponseData?.object
                             ?.filter((active) =>
                                 act?.some((item) => item.activeIngredientKey === active.key)
                             )
                             .map((active) => active.name); // Extract only the `name` property
                         
                        
                            return joinValuesFromArray(ingredientNames);
                            
                            }
                                }</Table.Cell>
                        </Table.Column>
                        <Table.Column flexGrow={1} fullText>
                            <Table.HeaderCell>Instructions</Table.HeaderCell>
                            <Table.Cell>
                                {rowData => {
                                    if (rowData.instructionsTypeLkey === "3010591042600262") {
                                        const generic = predefinedInstructionsListResponse?.object?.find(
                                            item => item.key === rowData.instructions
                                        );

                                        if (generic) {
                                            console.log("Found generic:", generic);
                                        } else {
                                            console.warn("No matching generic found for key:", rowData.instructions);
                                        }
                                        return [
                                            generic?.dose,
                                            generic?.unitLvalue?.lovDisplayVale,

                                            generic?.frequencyLvalue?.lovDisplayVale
                                        ]
                                            .filter(Boolean)
                                            .join(', ');
                                    }
                                    if (rowData.instructionsTypeLkey === "3010573499898196") {
                                        return rowData.instructions

                                    }
                                    if (rowData.instructionsTypeLkey === "3010606785535008") {
                                        return customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.dose +
                                            "," + customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.unitLvalue.lovDisplayVale + "," +
                                            customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.frequencyLvalue.lovDisplayVale


                                    }

                                    return "no";
                                }}
                            </Table.Cell>
                        </Table.Column>

                        <Table.Column flexGrow={1} fullText>
                            <Table.HeaderCell>Instructions Type</Table.HeaderCell>
                            <Table.Cell>
                            {rowData =>rowData.instructionsTypeLkey?rowData.instructionsTypeLvalue.lovDisplayVale:rowData.instructionsTypeLkey}
                                </Table.Cell>
                        </Table.Column>
                   

                    <Table.Column flexGrow={1} fullText>
                        <Table.HeaderCell>Start Date</Table.HeaderCell>
                        <Table.Cell>{rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ""}</Table.Cell>
                    </Table.Column>
                </Table>

            </Modal.Body>
            <Modal.Footer style={{ display: "flex", justifyContent: "flex-start" }}>
                <Button onClick={handlecloseChronicModel} appearance="primary">
                    Ok
                </Button>
                <Button onClick={handlecloseChronicModel} appearance="subtle">
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    </div >
    </>);
};
export default PatientSummary;




