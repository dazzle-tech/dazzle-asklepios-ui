import React from 'react';
import PreOperationAssessment from './PreOperationAssessment';
import PostOperationRecovery from './PostOperationRecovery';
import DischargeFollowUp from './DischargeFollowUp';
import MyTab from '@/components/MyTab';

const DayCaseContent = () => {

    const tabData = [
     {title: "Pre-Operation Assessment", content: <PreOperationAssessment/>},
     {title: "Post-Operation Recovery", content: <PostOperationRecovery/>},
     {title: "Discharge & Follow-Up", content: <DischargeFollowUp/>}
    ];

    return (
        <MyTab 
         data={tabData}
        />
    );
};
export default DayCaseContent;


