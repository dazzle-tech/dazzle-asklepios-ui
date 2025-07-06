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

const Operation = () => {
 
  return (<>
      <Tabs defaultActiveKey="1" appearance="subtle">
         <Tabs.Tab eventKey="1" title="Request List">
            <RequestList />
         </Tabs.Tab>
         <Tabs.Tab eventKey="2" title="Ongoing Operations"
       
         >
          
         </Tabs.Tab>
         <Tabs.Tab eventKey="3" title="Completed Operations"
    >
          
         </Tabs.Tab>

      </Tabs>
  </>);
}
export default Operation;