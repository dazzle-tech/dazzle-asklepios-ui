import React from "react";
import { Tabs } from "rsuite";
import ReviewReport from "./Reports";
import Results from "./Results";
import { newApEncounter, newApPatient } from "@/types/model-types-constructor";
import PatientSide from "../lab-module/PatienSide";
import { useAppSelector } from "@/hooks";

const ReviewResults=()=>{
    const [patient, setPatient] = React.useState({...newApPatient});
    const [encounter, setEncounter] = React.useState<any>({...newApEncounter,discharge:false});
     const authSlice = useAppSelector(state => state.auth);

    return (
        <div className="container">
            <div className="left-box">
                <Tabs defaultActiveKey="1" appearance="subtle">
                 <Tabs.Tab eventKey="1" title="Results" ><Results setEncounter={setEncounter} setPatient={setPatient} user={authSlice.user.key}/></Tabs.Tab>
                 <Tabs.Tab eventKey="2" title="Reports" ><ReviewReport setEncounter={setEncounter} setPatient={setPatient}  user={authSlice.user.key}/></Tabs.Tab>
                 </Tabs>
            </div>
            <div className="right-box"><PatientSide patient={patient} encounter={encounter} /></div>
        </div>
    );
}
export default ReviewResults;