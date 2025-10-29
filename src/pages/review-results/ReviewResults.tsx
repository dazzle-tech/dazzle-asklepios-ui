import React from "react";
import { Tabs } from "rsuite";
import ReviewReport from "./Reports";
import Results from "./Results";
import { newApEncounter, newApPatient } from "@/types/model-types-constructor";
import PatientSide from "../lab-module/PatienSide";
import { useAppSelector } from "@/hooks";
import MyTab from "@/components/MyTab";

const ReviewResults=()=>{
    const [patient, setPatient] = React.useState({...newApPatient});
    const [encounter, setEncounter] = React.useState<any>({...newApEncounter,discharge:false});
     const authSlice = useAppSelector(state => state.auth);

     const tabData = [
       {title: "Results", content: <Results setEncounter={setEncounter} setPatient={setPatient} user={authSlice.user.key}/>},
        {title: "Reports", content: <ReviewReport setEncounter={setEncounter} setPatient={setPatient}  user={authSlice.user.key}/>}
     ];
    return (
        <div className="container">
            <div className="left-box">
                 <MyTab 
                  data={tabData}
                 />
            </div>
            <div className="right-box"><PatientSide patient={patient} encounter={encounter} /></div>
        </div>
    );
}
export default ReviewResults;