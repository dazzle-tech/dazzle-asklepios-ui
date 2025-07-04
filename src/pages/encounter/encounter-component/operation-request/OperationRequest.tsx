import React from "react";
import { Tabs } from "rsuite";
import Request from "./request/Request";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "@/hooks";
import { useGetRequestedOperationQuery } from "@/services/operationService";
import AnesthesiaCarePlan from "./AnesthesiaCarePlan";

const OperationRequest = () => {
   const location = useLocation();
   const { patient, encounter, edit } = location.state || {};
   const authSlice = useAppSelector(state => state.auth);
   const {
      data: requestedOperation,
      refetch,
      isLoading,
      error
   } = useGetRequestedOperationQuery(
      {
         encounterKey: encounter?.key,
         patientKey: patient?.key
      },
      {
         skip: !encounter?.key || !patient?.key 
      }
   );
   
   return (
      <Tabs defaultActiveKey="1" appearance="subtle">
         <Tabs.Tab eventKey="1" title=" Request">
            <Request patient={patient} encounter={encounter} user={authSlice.user}  refetchrequest={refetch}/>
         </Tabs.Tab>
         <Tabs.Tab eventKey="2" title="Anesthesia Care Plan"
         disabled={!requestedOperation?.object}
         >
            <AnesthesiaCarePlan operation={requestedOperation} patient={patient} encounter={encounter} user={authSlice.user}/>
         </Tabs.Tab>
         <Tabs.Tab eventKey="3" title=" Pre-Op Checklist"
         disabled={!requestedOperation?.object}>
            3
         </Tabs.Tab>
         <Tabs.Tab eventKey="4" title="  Devices\ Implants"
         disabled={!requestedOperation?.object}>
            4
         </Tabs.Tab>
      </Tabs>
   );
};

export default OperationRequest;