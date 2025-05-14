import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetDrugOrderMedicationQuery, useGetPrescriptionMedicationsQuery } from "@/services/encounterService";
import { useGetGenericMedicationActiveIngredientQuery, useGetPrescriptionInstructionQuery } from "@/services/medicationsSetupService";
import { initialListRequest } from "@/types/types";
import React, { useState } from "react";
const PatientChronic = ({ genericMedicationListResponse, customeInstructions, patient }) => {

    const [listGinricRequest, setListGinricRequest] = useState({
        ...initialListRequest,
        sortType: 'desc'


    });

    //if can type of instruction in prescription pre defined -get pre defined instruction list and search of instruction for prescription brand
    const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({ ...initialListRequest });
    // get list of brands(generic) to find search of order brand
    const { data: genericMedicationActiveIngredientListResponseData, refetch: refetchGenric } = useGetGenericMedicationActiveIngredientQuery({ ...listGinricRequest });
    // Combine all of the patient's medications when it is chronic. from orders and prescription
    const combinedArray = [];
    //get all medication for current patient from orders 
    const { data: orderMedicationsPatient } = useGetDrugOrderMedicationQuery({
        ...initialListRequest,

        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patient.key,
            },
            {
                fieldName: "status_lkey",
                operator: "match",
                value: "1804482322306061",
            }
        ],
    });

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
    //get all medication for current patient from prescription 
    const { data: prescriptionMedicationsPatient } = useGetPrescriptionMedicationsQuery({
        ...initialListRequest,

        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patient.key,
            }
            ,
            {
                fieldName: "status_lkey",
                operator: "match",
                value: "1804482322306061",
            }
        ],
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
    //function to join value from array to   String 
    const joinValuesFromArray = (values) => {
        return values.filter(Boolean).join(', ');
    };
    // to return brand name with active ingredient
    const joinValuesFromArrayo = (objects, genericMedicationsKey) => {

        return objects
            .map(obj => {

                const matchingActiveIngredient = genericMedicationActiveIngredientListResponseData?.object?.find(ingredient => {
                    return ingredient.genericMedicationKey === genericMedicationsKey && ingredient.activeIngredientKey === obj.key;
                });


                if (matchingActiveIngredient) {
                    return `${obj.name}:${matchingActiveIngredient?.strength} ${matchingActiveIngredient.unitLvalue?.lovDisplayVale} `;
                }

                return obj.name;
            })
            .join(', ');
    };
    const tableColumns = [
        {
            key: "sourceName",
            dataKey: "sourceName",
            title: <Translate>Source</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.sourceName;
            }
        },
        {
            key: "",
            dataKey: "",
            title: <Translate>Medication Name</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return genericMedicationListResponse?.find(item => item.key === rowData.genericMedicationsKey)?.genericName;
            }
        },
        {
            key: "",
            dataKey: "",
            title: <Translate>Dosage Form</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return genericMedicationListResponse?.find(item => item.key === rowData.genericMedicationsKey)?.dosageFormLvalue.lovDisplayVale;
            }
        },
        {
            key: "",
            dataKey: "",
            title: <Translate>Active Ingredients</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return joinValuesFromArrayo(rowData.activeIngredient, rowData.genericMedicationsKey);
            }
        },
        {
            key: "",
            dataKey: "",
            title: <Translate>Instruction Type</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.instructionsTypeLvalue;
            }
        },
        {
            key: "",
            dataKey: "",
            title: <Translate>Instruction</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                if (rowData.sourceName == 'Prescription') {
                    if (rowData.instructionsTypeLkey === "3010591042600262") {
                        const generic = predefinedInstructionsListResponse?.object?.find(
                            item => item.key === rowData.instructions
                        );


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
                        return customeInstructions?.find(item => item.prescriptionMedicationsKey === rowData.key)?.dose + ","
                            + customeInstructions?.find(item => item.prescriptionMedicationsKey === rowData.key)?.roaLvalue?.lovDisplayVale +
                            "," + customeInstructions?.find(item => item.prescriptionMedicationsKey === rowData.key)?.unitLvalue?.lovDisplayVale + "," +
                            customeInstructions?.find(item => item.prescriptionMedicationsKey === rowData.key)?.frequencyLvalue?.lovDisplayVale


                    }

                }

                else { return joinValuesFromArray([rowData.dose, rowData.unit, "every " + rowData.frequency + " hours", rowData.roa]); }

            }
        },
        {
            key: "createdAt",
            dataKey: "createdAt",
            title: <Translate>Date of Prescribing</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : " ";
            }
        },
        {
            key: "parametersToMonitor",
            dataKey: "parametersToMonitor",
            title: <Translate>Lab Monitoring Parameters</Translate>,
            flexGrow: 1
        },
        {
            key: "notes",
            dataKey: "notes",
            title: <Translate>Note</Translate>,
            flexGrow: 1
        },
    ];
    const [pageIndex, setPageIndex] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const handlePageChange = (_: unknown, newPage: number) => {
        setPageIndex(newPage);
    }
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPageIndex(0);

    };
    const totalCount = combinedArray?.length ?? 0;
    const paginatedData = combinedArray?.slice(
        pageIndex * rowsPerPage,
        pageIndex * rowsPerPage + rowsPerPage
    );
    return (<>
        <MyTable
            data={paginatedData ?? []}
            columns={tableColumns}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
        />
    </>)
}
export default PatientChronic