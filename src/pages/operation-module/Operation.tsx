import { newApEncounter, newApOperationRequests, newApPatient } from "@/types/model-types-constructor";
import React, { useEffect, useRef, useState } from "react";
import { Tabs, Text } from "rsuite";
import PatientSide from "../encounter/encounter-main-info-section/PatienSide";
import CompletedOperations from "./CompletedOperations";
import OngoingOperations from "./OngoingOperations";
import RequestList from "./RequestsList";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import { useAppDispatch } from "@/hooks";
import ReactDOMServer from 'react-dom/server';
import Translate from "@/components/Translate";
const Operation = () => {
   const dispatch=useAppDispatch();
   const [patient, setPatient] = useState({ ...newApPatient });
   const [encounter, setEncounter] = useState({ ...newApEncounter });
   const [request, setRequest] = useState<any>({ ...newApOperationRequests });
   const [open,setOpen]=useState(false);
   const [activeTab, setActiveTab] = useState<string>('1');

    const reqRef = useRef(null);
     const refetchOnGoing = () => {
       reqRef.current?.refetch();
     }
       const divContent = (
           "Operations"
       );
       useEffect(() => {

         dispatch(setPageCode('Operation_Module'));
         dispatch(setDivContent(divContent));
       }, []);
   return (<div className='container'>
      <div className='left-box' >
         <Tabs appearance="subtle" activeKey={activeTab} onSelect={(key) => {
            if (key) setActiveTab(key.toString());
         }}>
            <Tabs.Tab eventKey="1" title="Request List">
               <RequestList patient={patient} encounter={encounter} setPatient={setPatient} setEncounter={setEncounter} setActiveTab={setActiveTab}  
               setOpen={setOpen} request={request} setRequest={setRequest} refetchOnGoing={refetchOnGoing}/>
            </Tabs.Tab>
            <Tabs.Tab eventKey="2" title="Ongoing Operations" >
               <OngoingOperations   ref={reqRef} patient={patient} encounter={encounter} setPatient={setPatient} setEncounter={setEncounter} 
               open={open} setOpen={setOpen} request={request} setRequest={setRequest} />

            </Tabs.Tab>
            <Tabs.Tab eventKey="3" title="Completed Operations">
               <CompletedOperations patient={patient} encounter={encounter} setPatient={setPatient} setEncounter={setEncounter} open={open} setOpen={setOpen} request={request} setRequest={setRequest}/>

            </Tabs.Tab>

         </Tabs></div>

      <div className='right-box' >
         <PatientSide patient={patient} encounter={encounter} />
      </div>
   </div>);
}
export default Operation;