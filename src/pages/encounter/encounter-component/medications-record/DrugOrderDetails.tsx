import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetDrugOrderMedicationQuery } from "@/services/encounterService";
import { newApDrugOrderMedications } from "@/types/model-types-constructor";
import { initialListRequest } from "@/types/types";
import React,{useState} from "react";
import { formatDateWithoutSeconds } from "@/utils";
const DrugOrderDetails=({genericMedicationListResponse ,order})=>{
      const [orderMedication, setOrderMedication] = useState(
            {
                ...newApDrugOrderMedications,

            });
     const { data: orderMedications, refetch: medicORefetch ,isLoading } = useGetDrugOrderMedicationQuery({
            ...initialListRequest,
    
            filters: [
                {
                    fieldName: "drug_order_key",
                    operator: "",
                    value: order.key,
                },
                {
                    fieldName: "status_lkey",
                    operator: "match",
                    value: "1804482322306061",
                }
            ],
        });
     const   isSelected = rowData => {
            if (rowData && orderMedication && rowData.key === orderMedication.key) {
                return 'selected-row';
            } else return '';
        };
    const joinValuesFromArray = (values) => {
        return values.filter(Boolean).join(', ');
    };
    const tableColumns=[
        {key:"genericMedicationsKey",
         dataKey:"genericMedicationsKey",
         title:<Translate>Medication Name</Translate>,
         flexGrow:1,
         render:(rowData:any)=>{
            return genericMedicationListResponse?.find(item => item.key === rowData.genericMedicationsKey)?.genericName;
         }
    
        
        },
        {key:"drugOrderTypeLkey",
            dataKey:"drugOrderTypeLkey",
            title:<Translate>Drug Order Type</Translate>,
            flexGrow:1,
            render:(rowData:any)=>{
               return rowData.drugOrderTypeLvalue?.lovDisplayVale??null;
            }
       
           
           },
           {key:"instruction",
            dataKey:"instruction",
            title:<Translate>Instruction</Translate>,
            flexGrow:1,
            render:(rowData:any)=>{
               return joinValuesFromArray([rowData.dose, rowData.doseUnitLvalue?.lovDisplayVale, rowData.drugOrderTypeLkey == '2937757567806213' ? "STAT" : "every " + rowData.frequency + " hours", rowData.roaLvalue?.lovDisplayVale]);
            }
       
           
           },
           {key:"startDateTime",
            dataKey:"startDateTime",
            title:<Translate>Start Date Time</Translate>,
            flexGrow:1,
            render:(rowData:any)=>{
               return formatDateWithoutSeconds(rowData.startDateTime);
            }
       
           
           },
           {key:"notes",
            dataKey:"notes",
            title:<Translate>Note</Translate>,
            flexGrow:1,
           
           
           },
           {key:"parametersToMonitor",
            dataKey:"parametersToMonitor",
            title:<Translate>Lab Monitoring Parameters</Translate>,
            flexGrow:1          
           },
           {key:"indicationUseLkey",
            dataKey:"indicationUseLkey",
            title:<Translate>Indicated Use</Translate>,
            flexGrow:1,
            render:(rowData:any)=>{
               return rowData.indicationUseLvalue ? rowData.indicationUseLvalue.lovDisplayVale : rowData.indicationUseLkey;
            }
       
           
           },
           {key:"indication",
            dataKey:"indication",
            title:<Translate>Indication</Translate>,
            flexGrow:1,
            render:(rowData:any)=>{
               return joinValuesFromArray([rowData.indicationIcd, rowData.indicationManually]);
            }
       
           
           },
           {key:"chronicMedication",
            dataKey:"chronicMedication",
            title:<Translate>Is Chronic</Translate>,
            flexGrow:1,
            render:(rowData:any)=>{
               return rowData.chronicMedication ? "Yes" : "NO";
            }
       
           
           },
           {key:"priorityLkey",
            dataKey:"priorityLkey",
            title:<Translate>priority Level</Translate>,
            flexGrow:1,
            render:(rowData:any)=>{
               return rowData.priorityLkey ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey;
            }
       
           
           },
           {key:"createdAt",
            dataKey:"createdAt",
            title:<Translate>Created At</Translate>,
            flexGrow:1,
            expandable:true,
            render:(rowData:any)=>{
               return formatDateWithoutSeconds(rowData.createdAt);
            }
           },
           ,
           {key:"createdBy",
            dataKey:"createdBy",
            title:<Translate>Created By</Translate>,
            flexGrow:1,
            expandable:true,
           
           },
           ,
           {key:"deletedAt",
            dataKey:"deletedAt",
            title:<Translate>Cancelled At</Translate>,
            flexGrow:1,
            expandable:true,
            render:(rowData:any)=>{
               return formatDateWithoutSeconds(rowData.deletedAt);
            }
           }
           ,
           {key:"deletedBy",
            dataKey:"deletedBy",
            title:<Translate>Cancelled By</Translate>,
            flexGrow:1,
            expandable:true,
          
           }
           ,
           {key:"cancellationReason",
            dataKey:"cancellationReason",
            title:<Translate>Cancelliton Reason</Translate>,
            flexGrow:1,
            expandable:true,
           
           }
        
    
       ]
       return(<>
       <MyTable 
       data={orderMedications?.object || []}
       columns={tableColumns}
       loading={isLoading}
       rowClassName={isSelected}
       /></>);
}
export default DrugOrderDetails