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

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


    return (
        <MyTab
        data={tabData.map(tab => ({
            ...tab,
            content: <div dir={dir}>{tab.content}</div>
        }))}
        />
    );
};
export default DayCaseContent;


