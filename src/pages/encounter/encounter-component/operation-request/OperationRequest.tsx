import React from "react";
import { Tabs } from "rsuite";
import Request from "./request/Request";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "@/hooks";

const OperationRequest = () => {
      const location = useLocation();
      const { patient, encounter,edit } = location.state || {};
      const authSlice = useAppSelector(state => state.auth);
    return (
        <Tabs defaultActiveKey="1" appearance="subtle">
            <Tabs.Tab eventKey="1" title=" Request">
               <Request patient={patient} encounter={encounter} user={authSlice.user} />
            </Tabs.Tab>
            <Tabs.Tab eventKey="2" title="Anesthesia Care Plan">
               2
            </Tabs.Tab>
            <Tabs.Tab eventKey="3" title=" Pre-Op Checklist">
               3
            </Tabs.Tab>
            <Tabs.Tab eventKey="4" title="  Devices\ Implants">
              4
            </Tabs.Tab>
        </Tabs>
    );
};

export default OperationRequest;