import { newApEncounter, newApOperationRequests, newApPatient } from "@/types/model-types-constructor";
import React, { useState, useEffect } from "react";
import PatientSide from "../encounter/encounter-main-info-section/PatienSide";
import { useGetOperationRequestsListQuery } from "@/services/operationService";
import { initialListRequest, ListRequest } from "@/types/types";
import Translate from "@/components/Translate";
import { formatDateWithoutSeconds } from "@/utils";
import { Col, Row, Tabs } from "rsuite";
import MyTable from "@/components/MyTable";
import RequestList from "./RequestsList";
import OngoingOperations from "./OngoingOperations";

const Operation = () => {
 const [patient, setPatient] = useState({ ...newApPatient });
     const [encounter, setEncounter] = useState({ ...newApEncounter });
  return (<div className='container'>
        <div className='left-box' >
      <Tabs defaultActiveKey="1" appearance="subtle">
         <Tabs.Tab eventKey="1" title="Request List">
            <RequestList patient={patient}  encounter={encounter} setPatient={setPatient} setEncounter={setEncounter}/>
         </Tabs.Tab>
         <Tabs.Tab eventKey="2" title="Ongoing Operations" >
            <OngoingOperations patient={patient}  encounter={encounter} setPatient={setPatient} setEncounter={setEncounter}/>
          
         </Tabs.Tab>
         <Tabs.Tab eventKey="3" title="Completed Operations"
    >
          
         </Tabs.Tab>

      </Tabs></div>
  
    <div className='right-box' >
              <PatientSide patient={patient} encounter={encounter} />
          </div>
      </div>);
}
export default Operation;