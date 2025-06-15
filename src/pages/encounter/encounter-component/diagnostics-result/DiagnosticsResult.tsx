import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs } from 'rsuite';
import Result from './Result';
import Reports from './Reports';
import LaboratoryResultComparison from './LaboratoryResultComparison';
import { useAppSelector } from '@/hooks';
const DiagnosticsResult =()=>{
   
     const location = useLocation();
       const { patient, encounter, edit } = location.state || {};
        const authSlice = useAppSelector(state => state.auth);
    return(<> <Tabs defaultActiveKey="1" appearance="subtle">
                 <Tabs.Tab eventKey="1" title="Results" ><Result patient={patient}  user={authSlice.user.key}/></Tabs.Tab>
                 <Tabs.Tab eventKey="2" title="Reports" ><Reports patient={patient} user={authSlice.user.key}/></Tabs.Tab>
                 <Tabs.Tab eventKey='3' title="Laboratory Result Comparison"><LaboratoryResultComparison patient={patient}/></Tabs.Tab>
                 </Tabs></>);
};
export default DiagnosticsResult;