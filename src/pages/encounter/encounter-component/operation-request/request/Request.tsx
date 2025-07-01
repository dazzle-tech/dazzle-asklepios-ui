import MyButton from "@/components/MyButton/MyButton";
import React, { useState } from "react";
import { Checkbox, Row } from "rsuite";
import Details from "./Details";
import Translate from "@/components/Translate";
import { render } from "react-dom";
import { formatDateWithoutSeconds } from "@/utils";
import { MdModeEdit } from "react-icons/md";
import { newApOperationRequests } from "@/types/model-types-constructor";
const Request = ({patient ,encounter,user}) => {
    const [showCanceled, setShowCanceled] = useState(true);
    const [open,setOpen]=useState(false);
     const [request, setRequest] = useState({ ...newApOperationRequests });
    const columns=[
        { key:"facilityKey",
          title:<Translate>facility</Translate>,
          render:(rowData:any)=>{
            return null;
          }         
        },
        { key:"departmentKey",
          title:<Translate>department</Translate>,
          render:(rowData:any)=>{
            return null;
          }         
        },
        { key:"oparetionKey",
          title:<Translate>oparation name</Translate>,
          render:(rowData:any)=>{
            return null;
          }         
        },
        { key:"operationTypeLkey",
          title:<Translate>operation type</Translate>,
          render:(rowData:any)=>{
            return rowData.operationTypeLvalue?rowData.operationTypeLvalue.lovDisplayVale:rowData.operationTypeLkey;
          }         
        },
        { key:"operationLevelLkey",
          title:<Translate>Operation Level</Translate>,
          render:(rowData:any)=>{
            return  rowData.operationLevelLvalue?rowData.operationLevelLvalue.lovDisplayVale:rowData.operationLevelLkey;
          }         
        },
        { key:"operationDateTime",
          title:<Translate>Operation Date/Time</Translate>,
          render:(rowData:any)=>{
            return formatDateWithoutSeconds(rowData?.operationDateTime);
          }         
        },
        { key:"priorityLkey",
          title:<Translate>Priority</Translate>,
          render:(rowData:any)=>{
            return  rowData.priorityLvalue?rowData.priorityLvalue?.lovDisplayVale:rowData.priorityLkey;;
          }         
        },
        { key:"diagnosisKey",
          title:<Translate>Pre-op Diagnosis</Translate>,
          render:(rowData:any)=>{
            return null;
          }         
        },
        { key:"statusLkey",
          title:<Translate>Request Status</Translate>,
          render:(rowData:any)=>{
            return rowData.statusLvalue?rowData.statusLvalue?.lovDisplayVale:rowData.statusLkey;
          }         
        },
        { key:"edit",
          title:<Translate>Edit</Translate>,
          
          render:(rowData:any)=>{
           return (<MdModeEdit
                               title="Edit"
                               size={24}
           
                               fill="var(--primary-gray)"
                               onClick={() => {   
                                setOpen(true);
                                setRequest(rowData);
                                
                                }}
                           />)
          }         
        }
        ,
        { key:"",
          title:<Translate></Translate>,
          expandable: true,
          render:(rowData:any)=>{
            return null;
          }         
        }
        ,
        { key:"",
          title:<Translate></Translate>,
          expandable: true,
          render:(rowData:any)=>{
            return null;
          }         
        }
        ,
        { key:"",
          title:<Translate></Translate>,
          expandable: true,
          render:(rowData:any)=>{
            return null;
          }         
        }
        ,
        { key:"",
          title:<Translate></Translate>,
          expandable: true,
          render:(rowData:any)=>{
            return null;
          }         
        },
        
        { key:"",
          title:<Translate></Translate>,
          expandable: true,
          render:(rowData:any)=>{
            return null;
          }         
        },
        { key:"",
          title:<Translate></Translate>,
          expandable: true,
          render:(rowData:any)=>{
            return null;
          }         
        }
        ,
 ,
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
            title: <Translate>Updated At/By</Translate>,
            expandable: true,
            render: (rowData: any) => {
                return (<>
                    <span>{rowData.updatedBy}</span>
                    <br />
                    <span className='date-table-style'>{formatDateWithoutSeconds(rowData.updatedAt)}</span>
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
                    <span className='date-table-style'>{formatDateWithoutSeconds(rowData.deletedAt) }</span>
                </>)
            }
        },
    ]
    return (<>
<div className='bt-div'>
     <Checkbox
          checked={!showCanceled}
          onChange={() => {
            setShowCanceled(!showCanceled);
          }}>
          Show Cancelled
        </Checkbox>
    <div className='bt-right'>
      <MyButton onClick={()=>setOpen(true)}>Add Request</MyButton>
      <MyButton >Submit</MyButton>
      <MyButton >Cancel</MyButton>
    </div>
    
</div>
<Row></Row>
<Details open={open} setOpen={setOpen} user={user} request={request}  setRequest={setRequest}/>
    </>)
}
export default Request;