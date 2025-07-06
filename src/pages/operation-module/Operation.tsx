import { newApEncounter, newApPatient } from "@/types/model-types-constructor";
import React,{useState,useEffect} from "react";
import PatientSide from "../encounter/encounter-main-info-section/PatienSide";

const Operation=()=>{
    const [patient,setPatient]=useState({...newApPatient});
    const [encounter,setEncounter]=useState({...newApEncounter});
    return(<div className='container'>
        <div className='left-box' ></div>
        <div className='right-box' >
        <PatientSide patient={patient} encounter={encounter} />
      </div>
    </div>);
}
export default Operation;