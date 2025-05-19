import {
    useGetCustomeInstructionsQuery
} from '@/services/encounterService';
import {
    useGetGenericMedicationQuery
} from '@/services/medicationsSetupService';
import { initialListRequest } from '@/types/types';
import React from 'react';
import {
    Table,
    Tabs
} from 'rsuite';
import './styles.less';
const { Column, HeaderCell, Cell } = Table;

import DrugOrder from './DrugOrder';
import PatientChronic from './PatientChronic';
import Prescriptions from './Prescriptions';
import { useLocation } from 'react-router-dom';
const MedicationsRecord = () => {   
     const location = useLocation();
       const { patient, encounter, edit } = location.state || {};
    const { data: genericMedicationListResponse } = useGetGenericMedicationQuery({ ...initialListRequest });
    const { data: customeInstructions, isLoading: isLoadingCustomeInstructions, refetch: refetchCo } = useGetCustomeInstructionsQuery({
        ...initialListRequest,

    });
 

    return (<>
     <Tabs defaultActiveKey="1" appearance="subtle">
     <Tabs.Tab eventKey="1" title="Prescriptions" >
        <Prescriptions 
        genericMedicationListResponse={genericMedicationListResponse?.object} 
        customeInstructions={customeInstructions?.object} 
        patient={patient}/>
     
     </Tabs.Tab>
     <Tabs.Tab eventKey="2" title="Drug Orders" >
       <DrugOrder genericMedicationListResponse={genericMedicationListResponse?.object} patient={patient}/>
     </Tabs.Tab>
     <Tabs.Tab eventKey="3" title="Patient’s Chronic Medications" >
           <PatientChronic  genericMedicationListResponse={genericMedicationListResponse?.object} patient={patient} customeInstructions={customeInstructions?.object}/>
         
     </Tabs.Tab>
     </Tabs>

        </>);
};
export default MedicationsRecord;