import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import MoreIcon from '@rsuite/icons/More';
import {
    Panel,
    IconButton,
    Table,
    Tabs

} from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
    useGetGenericMedicationQuery,
    useGetPrescriptionInstructionQuery,
    useGetGenericMedicationActiveIngredientQuery
} from '@/services/medicationsSetupService';
import {

    useGetPrescriptionsQuery,
    useGetPrescriptionMedicationsQuery,
    useGetCustomeInstructionsQuery

} from '@/services/encounterService';
import {
    useGetDrugOrderQuery,
    useGetDrugOrderMedicationQuery
} from '@/services/encounterService';
import { initialListRequest } from '@/types/types';
import { ApDrugOrder, ApDrugOrderMedications, ApPrescription } from '@/types/model-types';
import { newApDrugOrder, newApDrugOrderMedications, newApPrescription } from '@/types/model-types-constructor';
import './styles.less';

import Prescriptions from './Prescriptions';
import DrugOrder from './DrugOrder';
import PatientChronic from './PatientChronic';
const MedicationsRecord = ({patient ,encounter}) => {   
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