import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetPrescriptionMedicationsQuery } from "@/services/encounterService";
import { useGetPrescriptionInstructionQuery } from "@/services/medicationsSetupService";
import { initialListRequest } from "@/types/types";
import React from "react";
import { FlexboxGrid } from "rsuite";
const PrescriptionDetails=({genericMedicationListResponse,customeInstructions ,prescription})=>{
     const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({ ...initialListRequest });
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
                     operator: "match",
                     value: "1804482322306061",
                 }
             ],
         }, { skip: prescription.key === null });
     const joinValuesFromArray = (values) => {
        return values.filter(Boolean).join(', ');
    };
    const tableColumns=[
        {
            key: "genericMedicationsKey",
            dataKey:"genericMedicationsKey",
            title: <Translate>Medication Name</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return genericMedicationListResponse?.find(item => item.key === rowData.genericMedicationsKey)?.genericName??"";
            }
        },
        {
            key: "",
            title: <Translate>Instructions</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
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
                    return customeInstructions?.find(item => item.prescriptionMedicationsKey === rowData.key)?.dose + ","
                        + customeInstructions?.find(item => item.prescriptionMedicationsKey === rowData.key)?.roaLvalue?.lovDisplayVale +
                        "," + customeInstructions?.find(item => item.prescriptionMedicationsKey === rowData.key)?.unitLvalue?.lovDisplayVale + "," +
                        customeInstructions?.find(item => item.prescriptionMedicationsKey === rowData.key)?.frequencyLvalue?.lovDisplayVale


                }

                return " ";
            }
        },
        {
            key: "",
            title: <Translate>Instructions Type</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.instructionsTypeLkey ? rowData.instructionsTypeLvalue.lovDisplayVale : rowData.instructionsTypeLkey;
            }
        },
        {
            key: "validUtil",
            dataKey:"validUtil",
            title: <Translate>Valid util</Translate>,
            flexGrow: 1,
          
        },
        {
            key: "notes",
            dataKey:'notes',
            title: <Translate>Note</Translate>,
            flexGrow: 1,
          
        },
        {
            key: "parametersToMonitor",
            dataKey:"parametersToMonitor" ,
            title: <Translate>Lab Monitoring Parameters</Translate>,
            flexGrow: 1,
           
        },
        {
            key: "",
            title: <Translate>Indicated Use</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData.indicationUseLkey ? rowData.indicationUseLvalue.lovDisplayVale : rowData.indicationUseLkey;
            }
        },
        {
            key: "",
            title: <Translate>Indication</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return joinValuesFromArray([rowData.indicationIcd, rowData.indicationManually]);
            }
        },
        {
            key:"chronicMedication",
            dataKEy:"chronicMedication",
            title:<Translate>Is Chronic</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return  rowData.chronicMedication ? "Yes" : "NO";
            }
        }

    ]
    return(<>
    <MyTable
    columns={tableColumns}
    loading={isLoadingPrescriptionMedications}
    data={prescriptionMedications?.object ?? []}
    /></>)
}
export default PrescriptionDetails;