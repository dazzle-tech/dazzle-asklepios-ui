import React, { useState } from 'react';
import { Tabs } from 'rsuite';
import { useLocation } from 'react-router-dom';
import PreOperationAssessment from './PreOperationAssessment';
import PostOperationRecovery from './PostOperationRecovery';
import DischargeFollowUp from './DischargeFollowUp';


const DayCaseContent = () => {
    const location = useLocation();
    const { patient, encounter, edit } = location.state || {};
    const [isConfirmedRound , setIsConfirmedRound] = useState(false);
    return (
        <Tabs appearance="subtle" className="doctor-round-tabs" defaultActiveKey="1">
            <Tabs.Tab eventKey="1" title="Pre-Operation Assessment">
             <PreOperationAssessment/>
            </Tabs.Tab>
            <Tabs.Tab eventKey="2" title="Post-Operation Recovery">
             <PostOperationRecovery/>
            </Tabs.Tab>
            <Tabs.Tab eventKey="3" title="Discharge & Follow-Up">
             <DischargeFollowUp/>
            </Tabs.Tab>

        </Tabs>
    );
};
export default DayCaseContent;


