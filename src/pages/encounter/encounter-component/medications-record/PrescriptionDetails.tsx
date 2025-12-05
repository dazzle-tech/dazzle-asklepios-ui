import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetPrescriptionMedicationsQuery } from "@/services/encounterService";
import { useGetPrescriptionInstructionQuery } from "@/services/medicationsSetupService";
import { useGetAllBrandMedicationsQuery } from "@/services/setup/brandmedication/BrandMedicationService ";
import { useGetAllPrescriptionInstructionsQuery } from "@/services/setup/prescription-instruction/prescriptionInstructionService";
import { initialListRequest } from "@/types/types";
import { formatEnumString } from "@/utils";
import React from "react";
import { FlexboxGrid } from "rsuite";
const PrescriptionDetails=({customeInstructions ,prescription})=>{
   
    const { data: genericMedicationListResponse } =
        useGetAllBrandMedicationsQuery({ page: 0, size: 1000, sort: 'id,asc' });
         console.log("PrescriptionDetails", genericMedicationListResponse);
     const { data: predefinedInstructionsListResponse } = useGetAllPrescriptionInstructionsQuery
     ({page:1,size:1000});
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
            dataKey:"genericMedicationsId",
            title: <Translate>Medication Name</Translate>,
            flexGrow: 1,
           render: (rowData: any) => {
        return genericMedicationListResponse?.data?.find(
          item => item.id === rowData.genericMedicationsId
        )?.name;
      }
        },
        {
              key: 'instructions',
              dataKey: '',
              title: 'Instructions',
              flexGrow: 3,
              render: (rowData: any) => {
                if (rowData.instructionsTypeLkey === '3010591042600262') {
                  const generic = predefinedInstructionsListResponse?.data?.find(
                    item => item.id === Number(rowData.instructions)
                  );
               
        
                  if (generic) {
                  } else {
                    console.warn('No matching generic found for key:', rowData.instructions);
                  }
                  return [
                    generic?.dose ?? '',
                    formatEnumString(generic?.unit) ?? '',
                    formatEnumString(generic?.rout) ?? '',   // ✅ route
                    formatEnumString(generic?.frequency) ?? '',
                  ]
                    .filter(v => v != null && String(v).trim() !== '')
                    .join(', ');
                }
                if (rowData.instructionsTypeLkey === '3010573499898196') {
                  return rowData.instructions;
                }
                if (rowData.instructionsTypeLkey === '3010606785535008') {
                  return (
                    customeInstructions?.object?.find(
                      item => item.prescriptionMedicationsKey === rowData.key
                    )?.dose +
                    ',' +
                    customeInstructions?.object?.find(
                      item => item.prescriptionMedicationsKey === rowData.key
                    )?.unitLvalue.lovDisplayVale +
                    ',' +
                    customeInstructions?.object?.find(
                      item => item.prescriptionMedicationsKey === rowData.key
                    )?.frequencyLvalue.lovDisplayVale
                  );
                }
        
                return 'no';
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