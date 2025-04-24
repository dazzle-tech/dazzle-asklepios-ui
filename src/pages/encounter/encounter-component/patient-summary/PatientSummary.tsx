import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import './styles.less';

import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { ApEncounter } from '@/types/model-types';
import { newApEncounter } from '@/types/model-types-constructor';
import ChildBoy from '../../../../images/Chart_Child_Boy.svg';
import ChildGirl from '../../../../images/Chart_Child_Girl.svg';
import Female from '../../../../images/Chart_Female.svg';
import Male from '../../../../images/Chart_Male.svg';
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
    useGetAgeGroupValueQuery
} from '@/services/patientService';
import {
    useGetAllergiesQuery
} from '@/services/observationService';

import {
    useGetGenericMedicationQuery
} from '@/services/medicationsSetupService';

import {
    useGetEncountersQuery, useGetPrescriptionsQuery,
    useGetPrescriptionMedicationsQuery, useGetCustomeInstructionsQuery
} from '@/services/encounterService';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useGetAllergensQuery } from '@/services/setupService';
import {
    useGetWarningsQuery,
    useSaveWarningsMutation
} from '@/services/observationService';
import {
    useGetDrugOrderMedicationQuery,
} from '@/services/encounterService';
import {
    useGetPrescriptionInstructionQuery

} from '@/services/medicationsSetupService';
import { useGetGenericMedicationActiveIngredientQuery, useGetActiveIngredientQuery } from '@/services/medicationsSetupService';

const PatientSummary = ({ patient, encounter }) => {

    const { data: encounterTypeLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');
    const { data: encounterReasonLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_REASON');
    const [prevencounter, setPrevencounter] = useState<ApEncounter>({ ...newApEncounter });
    const { data: allergensListToGetName } = useGetAllergensQuery({
        ...initialListRequest
    });
    const filters = [
        {
            fieldName: 'patient_key',
            operator: 'match',
            value: patient?.key
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
    const { data: patientAgeGroupResponse, refetch: patientAgeGroupRefetch } =
        useGetAgeGroupValueQuery(
            {
                dob: patient?.dob ? new Date(patient.dob).toISOString() : null
            },
            { skip: !patient?.dob }
        );
console.log("encounter?.plannedStartDate-->",encounter?.plannedStartDate);
    const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({ ...initialListRequest });
    const { data: allergiesListResponse, refetch: fetchallerges } = useGetAllergiesQuery({ ...initialListRequest, filters });
    const { data: warningsListResponse, refetch: fetchwarnings } = useGetWarningsQuery({ ...initialListRequest, filters });
    const [patientVisitListRequest, setPatientVisitListReques] = useState<ListRequest>({
        ...initialListRequest,

        sortBy: 'plannedStartDate',
        filters: [
            {

                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
            },
            {
                fieldName: 'planned_start_date',
                operator: 'lt',
                value: encounter?.plannedStartDate
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
                value: patient?.key
            },
            {
                fieldName: 'is_major',
                operator: 'match',
                value: true
            },


        ]
    });

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
                value: patient?.key
            },
            {
                fieldName: 'visit_key',
                operator: 'match',
                value: prevencounter?.key
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
    const [diadiscription, setDiaDescription] = useState(null);


    const { data: genericMedicationListResponse } = useGetGenericMedicationQuery({ ...initialListRequest });
    const { data: prescriptionMedications, isLoading: isLoadingPrescriptions, refetch: preRefetch } = useGetPrescriptionMedicationsQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patient?.key
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
    const { data: orderMedications } = useGetDrugOrderMedicationQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patient?.key
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


    const combinedArray = [];


    orderMedications?.object?.forEach(order => {

        combinedArray.push({
            createdAt: order.createdAt,
            createdBy: order.createdBy,
            key: order.key,
            genericMedicationsKey: order.genericMedicationsKey,
            instructionsTypeLvalue: "Custom",
            instructions: order.instructions,
            notes: order.notes,
            parametersToMonitor: order.parametersToMonitor,
            indication: order.indicationIcd,
            indicationUse: order.indicationUseLvalue?.lovDisplayVale ?? "",
            indicationManually: order.indicationManually,
            activeIngredient: order.activeIngredient,
            roa: order.roaLvalue?.lovDisplayVale,
            frequency: order.frequency,
            dose: order.dose,
            unit: order.doseUnitLvalue?.lovDisplayVale,
            sourceName: 'Order',
        });

    });

    prescriptionMedications?.object?.forEach(pre => {

        combinedArray.push({
            createdAt: pre.createdAt,
            createdBy: pre.createdBy,
            key: pre.key,
            genericMedicationsKey: pre.genericMedicationsKey,
            instructionsTypeLvalue: pre.instructionsTypeLvalue?.lovDisplayVale ?? "",
            instructionsTypeLkey: pre.instructionsTypeLkey,
            instructions: pre.instructions,
            notes: pre.notes,
            parametersToMonitor: pre.parametersToMonitor,
            indication: pre.indicationIcd,
            indicationUse: pre.indicationUseLvalue?.lovDisplayVale ?? "",
            indicationManually: pre.indicationManually,
            activeIngredient: pre.activeIngredient,
            sourceName: 'Prescription',
        });

    });

    const [listGinricRequest, setListGinricRequest] = useState({
        ...initialListRequest,
        sortType: 'desc'

    });
    const { data: genericMedicationActiveIngredientListResponseData, refetch: refetchGenric } = useGetGenericMedicationActiveIngredientQuery({ ...listGinricRequest });



    useEffect(() => {

        setPrevencounter(encounterPatientList?.object[0]);
    }, [encounterPatientList])
    useEffect(() => {

        const updatedFilters = [
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
            },
            {
                fieldName: 'visit_key',
                operator: 'match',
                value: prevencounter?.key
            }


        ];

        setListdRequest((prevRequest) => ({

            ...prevRequest,
            filters: updatedFilters,

        }));

    }, [prevencounter]);
    const joinValuesFromArrayo = (objects, genericMedicationsKey) => {
        return objects
            .map(obj => {

                const matchingActiveIngredient = genericMedicationActiveIngredientListResponseData?.object?.find(ingredient => {

                    return ingredient.genericMedicationKey === genericMedicationsKey && ingredient.activeIngredientKey === obj.key;
                });


                if (matchingActiveIngredient) {
                    return `${obj.name}:${matchingActiveIngredient.strength} ${matchingActiveIngredient.unitLvalue.lovDisplayVale} `;
                }

                return obj.name;
            })
            .join(', ');
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
    const joinValuesFromArray = (values) => {
        return values.filter(Boolean).join(', ');
    };


    return (
        <div className='patient-summary-container'>

            <div className='patient-summary-Column'>

                <div className='patient-summary-panel' style={{ height: '520px' }} >
                    {
                        (patientAgeGroupResponse?.object?.key === '5945922992301153' ||
                            patientAgeGroupResponse?.object?.key === '1790407842882435' ||
                            patientAgeGroupResponse?.object?.key === '5946401407873394' ||
                            patientAgeGroupResponse?.object?.key === '1375554380483561' ||
                            patientAgeGroupResponse?.object?.key === '5945877765605378')
                        && (
                            patient?.genderLkey === '1' ? (
                                <img className='image-style' src={ChildBoy} onClick={handleopenchartModel} />
                            ) : (
                                <img className='image-style' src={ChildGirl} onClick={handleopenchartModel} />
                            )
                        )
                    }
                    {
                        (patientAgeGroupResponse?.object?.key === '1790428129203615' ||

                            patientAgeGroupResponse?.object?.key === '1790525617633551')
                        && (
                            patient?.genderLkey === '1' ? (
                                <img className='image-style' src={Male} onClick={handleopenchartModel} />
                            ) : (
                                <img className='image-style' src={Female} onClick={handleopenchartModel} />
                            )
                        )
                    }



                </div>
                <div className='patient-summary-panel'>

                <div className='panel-header'>
                        <Text className='title'>Previuos Visit</Text>
                        
                    </div>
                    
                    <Form disabled layout="inline" fluid >
                        <MyInput
                            column
                            width={140}
                            fieldLabel="Visit Date"
                            fieldType="date"
                            fieldName="plannedStartDate"
                            record={prevencounter || {}}
                        />
                        <MyInput
                            column
                            width={140}
                            fieldType="select"
                            fieldLabel="Visit Type"
                            fieldName="visitTypeLkey"
                            selectData={encounterTypeLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={prevencounter || {}}
                        />
                        <MyInput
                            width={140}
                            column
                            fieldType="select"
                            fieldLabel="Reason"
                            fieldName="reasonLkey"
                            selectData={encounterReasonLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            record={prevencounter || {}}
                        />

                        <MyInput
                            column
                            width={300}
                            fieldLabel="Diagnosis Description"
                            fieldName="description"
                            record={Diagnoses?.object[0]?.diagnosisObject || {}}
                        /></Form>

                </div>

            </div>
            <div className='patient-summary-Column'>


                <div className='patient-summary-panel' >
                    <div className='panel-header'>
                        <Text className='title'>Patient Major Problem</Text>
                        <Text className='full-view' onClick={handleopenMajoModel}>Full view</Text>
                    </div>

                    <Row >
                        <Col xs={24}>
                            <Table

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

                <div className='patient-summary-panel' style={{ height: '523px' }} >
                    
                    <div className='panel-header'>
                        <Text className='title'>Patient Chronic Medications</Text>
                        <Text className='full-view' onClick={handleopenChronicModel}>Full view</Text>
                    </div>  
                     
                            <Table
                                height={500}
                                data={combinedArray ?? []}
                                onRowClick={rowData => {

                                }}


                            >

                                <Table.Column flexGrow={1} fullText>
                                    <Table.HeaderCell>Medication Brand Name</Table.HeaderCell>
                                    <Table.Cell>{rowData =>
                                        genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey)?.genericName
                                    }</Table.Cell>
                                </Table.Column>

                                <Table.Column flexGrow={1} fullText>
                                    <Table.HeaderCell>Instructions</Table.HeaderCell>
                                    <Table.Cell>
                                        {rowData => {
                                            if (rowData.sourceName == 'Prescription') {
                                                if (rowData.instructionsTypeLkey === "3010591042600262") {
                                                    const generic = predefinedInstructionsListResponse?.object?.find(
                                                        item => item.key === rowData.instructions
                                                    );

                                                    if (generic) {

                                                    } else {
                                                        console.warn("No matching generic found for key:", rowData.instructions);
                                                    }
                                                    return [
                                                        generic?.dose,
                                                        generic?.unitLvalue?.lovDisplayVale,
                                                        generic?.routLvalue?.lovDisplayVale,
                                                        generic?.frequencyLvalue?.lovDisplayVale
                                                    ]
                                                        .filter(Boolean)
                                                        .join(', ');
                                                }
                                                if (rowData.instructionsTypeLkey === "3010573499898196") {
                                                    return rowData.instructions

                                                }
                                                if (rowData.instructionsTypeLkey === "3010606785535008") {
                                                    return customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.dose + ","
                                                        + customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.roaLvalue.lovDisplayVale +
                                                        "," + customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.unitLvalue.lovDisplayVale + "," +
                                                        customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.frequencyLvalue.lovDisplayVale


                                                }

                                            }

                                            else { return joinValuesFromArray([rowData.dose, rowData.unit, rowData.frequency > 0 ? "every " + rowData.frequency + " hours" : "STAT", rowData.roa]); }

                                        }}
                                    </Table.Cell>
                                </Table.Column>

                            </Table>
                        
                    
                </div>
            </div>

            <div className='patient-summary-Column'>
                <div className='patient-summary-panel'>
                <div className='panel-header'>
                        <Text className='title'>Active Allergies</Text>
                        
                    </div>
                
                    <Row gutter={10}>
                        <Col xs={24}>
                            <Table

                                data={allergiesListResponse?.object || []}
                                onRowClick={rowData => {

                                }}


                            >

                                <Table.Column flexGrow={1} fullText>
                                    <Table.HeaderCell  >Allergy Type</Table.HeaderCell>
                                    <Table.Cell>{rowData => rowData.allergyTypeLvalue?.lovDisplayVale}</Table.Cell>

                                </Table.Column>
                                <Table.Column flexGrow={1} fullText>
                                    <Table.HeaderCell >Allergene</Table.HeaderCell>
                                    <Table.Cell>

                                        {rowData => {

                                            if (!allergensListToGetName?.object) {
                                                return " ";
                                            }
                                            const getname = allergensListToGetName.object.find(item => item.key === rowData.allergenKey);

                                            return getname?.allergenName || " ";
                                        }}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1} fullText>
                                    <Table.HeaderCell  >Onset Date</Table.HeaderCell>
                                    <Table.Cell>

                                        {rowData => rowData.onsetDate ? new Date(rowData.onsetDate).toLocaleString() : "Undefind"}</Table.Cell>
                                </Table.Column>

                            </Table>
                        </Col>
                    </Row>
                </div>
                <div className='patient-summary-panel'>
                <div className='panel-header'>
                        <Text className='title'>Medical Warnings</Text>
                        
                    </div>
                    
                    <Row gutter={10}>
                        <Col xs={24}>
                            <Table

                                data={warningsListResponse?.object || []}
                                onRowClick={rowData => {

                                }}


                            >

                                <Table.Column flexGrow={1} fullText>
                                    <Table.HeaderCell >Warning Type</Table.HeaderCell>
                                    <Table.Cell>{rowData => rowData.warningTypeLvalue?.lovDisplayVale}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1} fullText>
                                    <Table.HeaderCell >Warning</Table.HeaderCell>
                                    <Table.Cell>{rowData => rowData.warning}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1} fullText>
                                    <Table.HeaderCell >First Time Recorded</Table.HeaderCell>
                                    <Table.Cell>{rowData => rowData.firstTimeRecorded ? new Date(rowData.firstTimeRecorded).toLocaleString() : "Undefind"}</Table.Cell>
                                </Table.Column>

                            </Table>
                        </Col>
                    </Row>
                </div>
                <div className='patient-summary-panel'>
                  <div className='panel-header'>
                        <Text className='title'>Recent Test Results</Text>
                        
                    </div>
                    
                    <Row gutter={10}>
                        <Col xs={24}>
                            <Table

                                onRowClick={rowData => {

                                }}


                            >

                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell > Type</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell >Name</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell >Order Time</Table.HeaderCell>
                                    <Table.Cell>{rowData => <Text>h</Text>}</Table.Cell>
                                </Table.Column>
                                <Table.Column flexGrow={1}>
                                    <Table.HeaderCell >Result Time</Table.HeaderCell>
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
                    <div >
                        {
                            (patientAgeGroupResponse?.object?.key === '5945922992301153' ||
                                patientAgeGroupResponse?.object?.key === '1790407842882435' ||
                                patientAgeGroupResponse?.object?.key === '5946401407873394' ||
                                patientAgeGroupResponse?.object?.key === '1375554380483561' ||
                                patientAgeGroupResponse?.object?.key === '5945877765605378')
                            && (
                                patient?.genderLkey === '1' ? (
                                    <img className='image-style' src={ChildBoy} onClick={handleopenchartModel} />
                                ) : (
                                    <img className='image-style' src={ChildGirl} onClick={handleopenchartModel} />
                                )
                            )
                        }
                        {
                            (patientAgeGroupResponse?.object?.key === '1790428129203615' ||

                                patientAgeGroupResponse?.object?.key === '1790525617633551')
                            && (
                                patient?.genderLkey === '1' ? (
                                    <img className='image-style' src={Male} onClick={handleopenchartModel} />
                                ) : (
                                    <img className='image-style' src={Female} onClick={handleopenchartModel} />
                                )
                            )
                        }
                    </div>
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

                        data={combinedArray ?? []}
                        onRowClick={rowData => {

                        }}


                    >

                        <Table.Column flexGrow={1} fullText>
                            <Table.HeaderCell>Medication Brand Name</Table.HeaderCell>
                            <Table.Cell>{rowData =>
                                genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey)?.genericName
                            }</Table.Cell>
                        </Table.Column>
                        <Table.Column flexGrow={2} fullText>
                            <Table.HeaderCell>Medication Active Ingredient(s)</Table.HeaderCell>
                            <Table.Cell>
                                {rowData => joinValuesFromArrayo(rowData.activeIngredient, rowData.genericMedicationsKey)

                                }</Table.Cell>
                        </Table.Column>
                        <Table.Column flexGrow={1} fullText>
                            <Table.HeaderCell>Instructions</Table.HeaderCell>
                            <Table.Cell>
                                {rowData => {
                                    if (rowData.sourceName == 'Prescription') {
                                        if (rowData.instructionsTypeLkey === "3010591042600262") {
                                            const generic = predefinedInstructionsListResponse?.object?.find(
                                                item => item.key === rowData.instructions
                                            );

                                            if (generic) {

                                            } else {
                                                console.warn("No matching generic found for key:", rowData.instructions);
                                            }
                                            return [
                                                generic?.dose,
                                                generic?.unitLvalue?.lovDisplayVale,
                                                generic?.routLvalue?.lovDisplayVale,
                                                generic?.frequencyLvalue?.lovDisplayVale
                                            ]
                                                .filter(Boolean)
                                                .join(', ');
                                        }
                                        if (rowData.instructionsTypeLkey === "3010573499898196") {
                                            return rowData.instructions

                                        }
                                        if (rowData.instructionsTypeLkey === "3010606785535008") {
                                            return customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.dose + ","
                                                + customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.roaLvalue.lovDisplayVale +
                                                "," + customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.unitLvalue.lovDisplayVale + "," +
                                                customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key)?.frequencyLvalue.lovDisplayVale


                                        }

                                    }

                                    else { return joinValuesFromArray([rowData.dose, rowData.unit, rowData.drugOrderTypeLkey == '2937757567806213' ? "STAT" : "every " + rowData.frequency + " hours", rowData.roa]); }

                                }}
                            </Table.Cell>
                        </Table.Column>

                        <Table.Column flexGrow={1} fullText>
                            <Table.HeaderCell>Instructions Type</Table.HeaderCell>
                            <Table.Cell>
                                {rowData => rowData.instructionsTypeLvalue}
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
    );
};
export default PatientSummary;




