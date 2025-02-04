import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import MoreIcon from '@rsuite/icons/More';
import {
    InputGroup,
    Form,
    Input,
    Panel,
    DatePicker,
    Text,
    Checkbox,
    Dropdown,
    Button,
    IconButton,
    SelectPicker,
    Table,
    Modal,
    Stack,
    Divider,
    Toggle,

} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
    useGetGenericMedicationQuery,
    useGetPrescriptionInstructionQuery,
    useGetGenericMedicationActiveIngredientQuery
} from '@/services/medicationsSetupService';
import {

    useGetPrescriptionsQuery,
    useGetPrescriptionMedicationsQuery,
    useGetCustomeInstructionsQuery

} from '@/services/encounterService';
import {
    useGetDrugOrderQuery,
    useGetDrugOrderMedicationQuery
} from '@/services/encounterService';
import { initialListRequest } from '@/types/types';
import { ApDrugOrder, ApDrugOrderMedications, ApPrescription } from '@/types/model-types';
import { newApDrugOrder, newApDrugOrderMedications, newApPrescription } from '@/types/model-types-constructor';
const MedicationsRecord = () => {
    const patientSlice = useAppSelector(state => state.patient);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [prescription, setPrescription] = useState<ApPrescription>({ ...newApPrescription });
    const { data: prescriptions, isLoading: isLoadingPrescriptions, refetch: preRefetch } = useGetPrescriptionsQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patientSlice.patient.key,
            },
            {
                fieldName: "status_lkey",
                operator: "match",
                value: "1804482322306061"
            }

        ],
    });
    const { data: genericMedicationListResponse } = useGetGenericMedicationQuery({ ...initialListRequest });
    const { data: prescriptionMedications, isLoading: isLoadingPrescriptionMedications, refetch: medicRefetch } = useGetPrescriptionMedicationsQuery({
        ...initialListRequest,

        filters: [
            {
                fieldName: "prescription_key",
                operator: "",
                value: prescription.key,
            }
            ,
            {
                fieldName: "status_lkey",
                operator: "notMatch",
                value: "1804447528780744",
            }
        ],
    }, { skip: prescription.key === null });
    const { data: prescriptionMedicationsPatient } = useGetPrescriptionMedicationsQuery({
        ...initialListRequest,

        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patientSlice.patient.key,
            }
            ,
            {
                fieldName: "status_lkey",
                operator: "notMatch",
                value: "1804447528780744",
            }
        ],
    });
    const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({ ...initialListRequest });
    const isSelected = rowData => {
        if (rowData && prescription && rowData.key === prescription.key) {
            return 'selected-row';
        } else return '';
    };
    const [order, setOrder] = useState<ApDrugOrder>({ ...newApDrugOrder });
    const { data: orders, refetch: ordRefetch } = useGetDrugOrderQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patientSlice.patient.key,
            },

            {
                fieldName: "status_lkey",
                operator: "match",
                value: "1804482322306061"
            }

        ],
    });
    const { data: orderMedications, refetch: medicORefetch } = useGetDrugOrderMedicationQuery({
        ...initialListRequest,

        filters: [
            {
                fieldName: "drug_order_key",
                operator: "",
                value: order.key,
            },
            {
                fieldName: "status_lkey",
                operator: "notMatch",
                value: "1804447528780744",
            }
        ],
    });
    const { data: customeInstructions, isLoading: isLoadingCustomeInstructions, refetch: refetchCo } = useGetCustomeInstructionsQuery({
        ...initialListRequest,

    });
    const { data: orderMedicationsPatient } = useGetDrugOrderMedicationQuery({
        ...initialListRequest,

        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patientSlice.patient.key,
            },
            {
                fieldName: "status_lkey",
                operator: "notMatch",
                value: "1804447528780744",
            }
        ],
    });
    const [orderMedication, setOrderMedication] = useState<ApDrugOrderMedications>(
        {
            ...newApDrugOrderMedications,



        });
    const isSelectedO = rowData => {
        if (rowData && order && rowData.key === order.key) {
            return 'selected-row';
        } else return '';
    };
    const [listGinricRequest, setListGinricRequest] = useState({
        ...initialListRequest,
        sortType: 'desc'

    });
    const { data: genericMedicationActiveIngredientListResponseData, refetch: refetchGenric } = useGetGenericMedicationActiveIngredientQuery({ ...listGinricRequest });
    const combinedArray = [];


    orderMedicationsPatient?.object?.forEach(order => {
        if (order.chronicMedication) {
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
        }
    });

    prescriptionMedicationsPatient?.object?.forEach(pre => {
        if (pre.chronicMedication) {
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
        }
    });

    const handleFilterChange = (fieldName, value) => {
        if (value) {
            setListRequest(
                addFilterToListRequest(
                    fromCamelCaseToDBName(fieldName),
                    'containsIgnoreCase',
                    value,
                    listRequest
                )
            );
        } else {
            setListRequest({ ...listRequest, filters: [] });
        }
    };
    const joinValuesFromArray = (values) => {
        return values.filter(Boolean).join(', ');
    };
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
    const renderRowExpanded = rowData => {
        // Add this line to check children data

        return (


            <Table
                data={[rowData]} // Pass the data as an array to populate the table
                bordered
                cellBordered
                style={{ width: '100%', marginTop: '10px' }}
                height={100} // Adjust height as needed
            >
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Created At</HeaderCell>
                    <Cell dataKey="createdAt" >
                        {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Created By</HeaderCell>
                    <Cell dataKey="createdBy" />
                </Column>

                <Column flexGrow={2} align="center" fullText>
                    <HeaderCell>Cancelled At</HeaderCell>
                    <Cell dataKey="deletedAt" >
                        {rowData => rowData.deletedAt ? new Date(rowData.deletedAt).toLocaleString() : ""}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Cancelled By</HeaderCell>
                    <Cell dataKey="deletedBy" />
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Cancelliton Reason</HeaderCell>
                    <Cell dataKey="cancellationReason" />
                </Column>
            </Table>


        );
    };

    const handleExpanded = (rowData) => {
        let open = false;
        const nextExpandedRowKeys = [];

        expandedRowKeys.forEach(key => {
            if (key === rowData.key) {
                open = true;
            } else {
                nextExpandedRowKeys.push(key);
            }
        });

        if (!open) {
            nextExpandedRowKeys.push(rowData.key);
        }



        console.log(nextExpandedRowKeys)
        setExpandedRowKeys(nextExpandedRowKeys);
    };

    const ExpandCell = ({ rowData, dataKey, expandedRowKeys, onChange, ...props }) => (
        <Cell {...props} style={{ padding: 5 }}>
            <IconButton
                appearance="subtle"
                onClick={() => {
                    onChange(rowData);
                }}
                icon={
                    expandedRowKeys.some(key => key === rowData["key"]) ? (
                        <CollaspedOutlineIcon />
                    ) : (
                        <ExpandOutlineIcon />
                    )
                }
            />
        </Cell>
    );

    return (<>
        <Panel header="Prescriptions" collapsible bordered >

            <Table
                shouldUpdateScroll={true}
                bordered

                headerHeight={30}
                rowHeight={40}
                data={prescriptions?.object ?? []}
                autoHeight
                maxHeight={300}
                onRowClick={rowData => {
                    setPrescription(rowData);
                }}
                rowClassName={isSelected}
            >
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Prescription ID</HeaderCell>
                    <Cell  >
                        {rowData => rowData.prescriptionId}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Visit ID</HeaderCell>
                    <Cell  >
                        {rowData => rowData.encounter.visitId}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Visit Date</HeaderCell>
                    <Cell  >
                        {rowData => rowData.encounter.createdAt ? new Date(rowData.encounter.createdAt).toLocaleString() : " "}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Created At</HeaderCell>
                    <Cell  >
                        {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : " "}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Created By</HeaderCell>
                    <Cell  >
                        {rowData => rowData.createdBy}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Submitted By </HeaderCell>
                    <Cell  >
                        {rowData => rowData.submittedBy}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Submitted at</HeaderCell>
                    <Cell  >
                        {rowData => rowData.submittedAt ? new Date(rowData.submittedAt).toLocaleString() : " "}
                    </Cell>
                </Column>

            </Table>
            {prescription.key &&
                <Table
                    autoHeight
                    maxHeight={300}
                    headerHeight={30}
                    rowHeight={40}
                    bordered
                    cellBordered
                    data={prescriptionMedications?.object ?? []}
                    style={{ marginTop: '10px' }}
                >

                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">

                            <Translate>Medication Name</Translate>
                        </HeaderCell>

                        <Cell dataKey="genericMedicationsKey" >
                            {rowData =>
                                genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey)?.genericName
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={3} fullText>
                        <HeaderCell align="center">

                            <Translate>Instructions</Translate>
                        </HeaderCell>
                        <Cell>
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

                                return "no";
                            }}
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">

                            <Translate>Instructions Type</Translate>
                        </HeaderCell>
                        <Cell >
                            {rowData => rowData.instructionsTypeLkey ? rowData.instructionsTypeLvalue.lovDisplayVale : rowData.instructionsTypeLkey}
                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">

                            <Translate>Valid until</Translate>
                        </HeaderCell>
                        <Cell dataKey="validUtil" />
                    </Column>
                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">
                            <Translate>Note</Translate>
                        </HeaderCell>
                        <Cell dataKey="notes" />
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Lab Monitoring Parameters</Translate>
                        </HeaderCell>
                        <Cell dataKey="parametersToMonitor" />
                    </Column>
                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">
                            <Translate>Indicated Use</Translate>
                        </HeaderCell>
                        <Cell  >
                            {rowData => rowData.indicationUseLkey ? rowData.indicationUseLvalue.lovDisplayVale : rowData.indicationUseLkey}

                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Indication</Translate>
                        </HeaderCell>
                        <Cell  >
                            {rowData => joinValuesFromArray([rowData.indicationIcd, rowData.indicationManually])}

                        </Cell>
                    </Column>



                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">

                            <Translate>Is Chronic</Translate>
                        </HeaderCell>
                        <Cell  >
                            {rowData => rowData.chronicMedication ? "Yes" : "NO"}


                        </Cell>
                    </Column>
                </Table>

            }
        </Panel>
        <Panel header="Drug Orders" collapsible bordered >
            <Table
                bordered
                headerHeight={30}
                rowHeight={40}
                data={orders?.object ?? []}
                autoHeight
                maxHeight={300}
                onRowClick={rowData => {
                    setOrder(rowData);
                }}
                rowClassName={isSelectedO}
            >
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Order ID</HeaderCell>
                    <Cell  >
                        {rowData => rowData.drugorderId}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Visit ID</HeaderCell>
                    <Cell  >
                        {rowData => rowData.encounter.visitId}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Visit Date</HeaderCell>
                    <Cell  >
                        {rowData => rowData.encounter.createdAt ? new Date(rowData.encounter.createdAt).toLocaleString() : " "}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Created At</HeaderCell>
                    <Cell  >
                        {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : " "}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Created By</HeaderCell>
                    <Cell  >
                        {rowData => rowData.createdBy}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Submitted By </HeaderCell>
                    <Cell  >
                        {rowData => rowData.submittedBy}
                    </Cell>
                </Column>
                <Column flexGrow={1} align="center" fullText>
                    <HeaderCell>Submitted at</HeaderCell>
                    <Cell  >
                        {rowData => rowData.submittedAt ? new Date(rowData.submittedAt).toLocaleString() : " "}
                    </Cell>
                </Column>


            </Table>
            {order.key &&
                <Table
                    style={{ marginTop: '10px' }}
                    autoHeight
                    maxHeight={300}
                    data={orderMedications?.object || []}
                    rowKey="key"
                    expandedRowKeys={expandedRowKeys} // Ensure expanded row state is correctly handled
                    renderRowExpanded={renderRowExpanded} // This is the function rendering the expanded child table
                    shouldUpdateScroll={false}
                    bordered
                    cellBordered
                    onRowClick={rowData => {
                        setOrderMedication(rowData);
                    }}
                    rowClassName={isSelected}
                >
                    <Column width={70} align="center">
                        <HeaderCell>#</HeaderCell>
                        <ExpandCell rowData={rowData => rowData} dataKey="key" expandedRowKeys={expandedRowKeys} onChange={handleExpanded} />
                    </Column>
                    <Column flexGrow={2}>
                        <HeaderCell align="center">

                            <Translate>Medication Name</Translate>
                        </HeaderCell>

                        <Cell dataKey="genericMedicationsKey" >
                            {rowData =>
                                genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey)?.genericName
                            }
                        </Cell>
                    </Column>
                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">
                            <Translate>Drug Order Type</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.drugOrderTypeLvalue?.lovDisplayVale
                            }
                        </Cell>
                    </Column >

                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Instruction</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => {
                                return joinValuesFromArray([rowData.dose, rowData.doseUnitLvalue?.lovDisplayVale, rowData.drugOrderTypeLkey == '2937757567806213' ? "STAT" : "every " + rowData.frequency + " hours", rowData.roaLvalue?.lovDisplayVale]);
                            }
                            }
                        </Cell>
                    </Column>

                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">
                            <Translate>Start Date Time</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => rowData.startDateTime ? new Date(rowData.startDateTime).toLocaleString() : " "}
                        </Cell>
                    </Column>
                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">
                            <Translate>Note</Translate>
                        </HeaderCell>
                        <Cell dataKey="notes" />
                    </Column>
                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">
                            <Translate>Lab Monitoring Parameters</Translate>
                        </HeaderCell>
                        <Cell dataKey="parametersToMonitor" />
                    </Column>
                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">
                            <Translate>Indicated Use</Translate>
                        </HeaderCell>
                        <Cell  >
                            {rowData => rowData.indicationUseLkey ? rowData.indicationUseLvalue.lovDisplayVale : rowData.indicationUseLkey}

                        </Cell>
                    </Column>
                    <Column flexGrow={2} fullText>
                        <HeaderCell align="center">
                            <Translate>Indication</Translate>
                        </HeaderCell>
                        <Cell  >
                            {rowData => joinValuesFromArray([rowData.indicationIcd, rowData.indicationManually])}

                        </Cell>
                    </Column>

                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">
                            <Translate>Is Chronic</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData => rowData.chronicMedication ? "Yes" : "NO"}

                        </Cell>
                    </Column>

                    <Column flexGrow={1} fullText>
                        <HeaderCell align="center">
                            <Translate>priority Level</Translate>
                        </HeaderCell>
                        <Cell>
                            {rowData =>
                                rowData.priorityLkey ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey
                            }
                        </Cell>
                    </Column>

                </Table>

            }
        </Panel>
        <Panel header="Patient’s Chronic Medications" collapsible bordered >
            <Table
                autoHeight
                maxHeight={300}
                headerHeight={30}
                rowHeight={40}
                bordered

                data={combinedArray ?? []}
                onRowClick={rowData => ""}
                rowClassName={isSelected}

            >


                <Column flexGrow={1} width={150} fullText>
                    <HeaderCell align="center">

                        <Translate>Source </Translate>
                    </HeaderCell>
                    <Cell >
                        {rowData => rowData.sourceName}
                    </Cell>
                </Column>
                <Column flexGrow={1} width={150} fullText>
                    <HeaderCell align="center">

                        <Translate>Medication Name</Translate>
                    </HeaderCell>

                    <Cell >
                        {rowData =>
                            genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey)?.genericName
                        }
                    </Cell>
                </Column>
                <Column flexGrow={1} width={150} fullText>
                    <HeaderCell align="center">

                        <Translate>Dosage Form</Translate>
                    </HeaderCell>

                    <Cell >
                        {rowData =>
                            genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey)?.dosageFormLvalue.lovDisplayVale
                        }
                    </Cell>
                </Column>
                <Column flexGrow={2} width={200} fullText>
                    <HeaderCell align="center">

                        <Translate>Active Ingredients</Translate>
                    </HeaderCell>

                    <Cell >
                        {rowData => joinValuesFromArrayo(rowData.activeIngredient, rowData.genericMedicationsKey)

                        }
                    </Cell>
                </Column>
                <Column flexGrow={1} width={150} fullText>
                    <HeaderCell align="center">

                        <Translate>Instruction Type</Translate>
                    </HeaderCell>

                    <Cell >
                        {rowData =>

                            rowData.instructionsTypeLvalue
                        }
                    </Cell>
                </Column>

                <Column flexGrow={2.5} fullText>
                    <HeaderCell align="center">
                        <Translate>Instruction</Translate>
                    </HeaderCell>
                    <Cell  >
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

                            else { return joinValuesFromArray([rowData.dose, rowData.unit, "every " + rowData.frequency + " hours", rowData.roa]); }

                        }}

                    </Cell>
                </Column>
                <Column flexGrow={2} width={200} fullText>
                    <HeaderCell align="center">

                        <Translate>Date of Prescribing</Translate>
                    </HeaderCell>
                    <Cell >
                        {rowData => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : " "}
                    </Cell>
                </Column>
                <Column flexGrow={1.5} width={180} fullText>
                    <HeaderCell align="center">

                        <Translate>Prescribing Physician </Translate>
                    </HeaderCell>
                    <Cell >

                    </Cell>
                </Column>
                <Column flexGrow={2} fullText>
                    <HeaderCell align="center">
                        <Translate>Lab Monitoring Parameters</Translate>
                    </HeaderCell>
                    <Cell dataKey="parametersToMonitor" />
                </Column>
                <Column flexGrow={1} fullText>
                    <HeaderCell align="center">
                        <Translate>Note</Translate>
                    </HeaderCell>
                    <Cell dataKey="notes" />
                </Column>
            </Table>
        </Panel></>);
};
export default MedicationsRecord;