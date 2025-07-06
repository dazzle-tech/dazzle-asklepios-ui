import { newApEncounter, newApOperationRequests, newApPatient } from "@/types/model-types-constructor";
import React,{useState,useEffect} from "react";
import PatientSide from "../encounter/encounter-main-info-section/PatienSide";
import { useGetOperationRequestsListQuery } from "@/services/operationService";
import { initialListRequest, ListRequest } from "@/types/types";
import Translate from "@/components/Translate";
import { formatDateWithoutSeconds } from "@/utils";

const Operation=()=>{
    const [patient,setPatient]=useState({...newApPatient});
    const [encounter,setEncounter]=useState({...newApEncounter});
      const [request, setRequest] = useState<any>({ ...newApOperationRequests});
      const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
         
          {
            fieldName: "status_lkey",
            operator: "match",
            value: '6134761379970516',
          }
    
        ],
      });
      const isSelected = rowData => {
        if (rowData && request && rowData.key === request.key) {
          return 'selected-row';
        } else return '';
      };
    
    //operation Api's
      const { data: operationrequestList, refetch, isLoading } = useGetOperationRequestsListQuery(listRequest);


      //table 
        const columns = [
          {
            key: "facilityKey",
            title: <Translate>facility</Translate>,
            render: (rowData: any) => {
              return null;
            }
          },
          {
            key: "departmentKey",
            title: <Translate>department</Translate>,
            render: (rowData: any) => {
              return rowData?.departmentKey;
            }
          },
          {
            key: "oparetionKey",
            title: <Translate>oparation name</Translate>,
            render: (rowData: any) => {
              return null;
            }
          },
          {
            key: "operationTypeLkey",
            title: <Translate>operation type</Translate>,
            render: (rowData: any) => {
              return rowData.operationTypeLvalue ? rowData.operationTypeLvalue.lovDisplayVale : rowData.operationTypeLkey;
            }
          },
          {
            key: "operationLevelLkey",
            title: <Translate>Operation Level</Translate>,
            render: (rowData: any) => {
              return rowData.operationLevelLvalue ? rowData.operationLevelLvalue.lovDisplayVale : rowData.operationLevelLkey;
            }
          },
          {
            key: "operationDateTime",
            title: <Translate>Operation Date/Time</Translate>,
            render: (rowData: any) => {
              return formatDateWithoutSeconds(rowData?.operationDateTime);
            }
          },
          {
            key: "priorityLkey",
            title: <Translate>Priority</Translate>,
            render: (rowData: any) => {
              return rowData.priorityLvalue ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey;;
            }
          },
          {
            key: "diagnosisKey",
            title: <Translate>Pre-op Diagnosis</Translate>,
            render: (rowData: any) => {
              return null;
            }
          },
          {
            key: "statusLkey",
            title: <Translate>Status</Translate>,
            render: (rowData: any) => {
              return rowData.statusLvalue ? rowData.statusLvalue?.lovDisplayVale : rowData.statusLkey;
            }
          },
          
          {
            key: "",
            title: <Translate>Created At/By</Translate>,
            expandable: true,
            render: (rowData: any) => {
              return (<>
                <span>{rowData.createdBy}</span>
                <br />
                <span className='date-table-style'>{formatDateWithoutSeconds(rowData.createdAt)}</span>
              </>)
            }
      
          },
          {
            key: "",
            title: <Translate>Submited At/By</Translate>,
            expandable: true,
            render: (rowData: any) => {
              return (<>
                <span>{rowData.submitedBy}</span>
                <br />
                <span className='date-table-style'>{formatDateWithoutSeconds(rowData.submitedAt)}</span>
              </>)
            }
      
          },
      
          {
            key: "",
            title: <Translate>Cancelled At/By</Translate>,
            expandable: true,
            render: (rowData: any) => {
              return (<>
                <span>{rowData.deletedBy}</span>
                <br />
                <span className='date-table-style'>{formatDateWithoutSeconds(rowData.deletedAt)}</span>
              </>)
            }
          },
        ];
    return(<div className='container'>
        <div className='left-box' >
          
        </div>
        <div className='right-box' >
        <PatientSide patient={patient} encounter={encounter} />
      </div>
    </div>);
}
export default Operation;