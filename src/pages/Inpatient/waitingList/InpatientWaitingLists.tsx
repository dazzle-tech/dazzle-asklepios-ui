import React from 'react';
import { Tabs } from 'rsuite';
import WaitingList from './newAdmissions';
import TransferPatientsList from './transferRequests';
import TransferTransactions from './transferTrasactions';
import MyTab from '@/components/MyTab';

const InpatientWaitingLists = () => {
  const tabData = [
    { title: 'New Admissions', content: <WaitingList /> },
    { title: 'Transfer Requests', content: <TransferPatientsList /> },
    { title: 'Transfer Transactions', content: <TransferTransactions /> }
  ];

        // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';
  return (<div dir={dir}>
            <MyTab
            lazy
              data={tabData.map(tab => ({
                ...tab,
                content: <div dir={dir}>{tab.content}</div>
              }))}
              className="tab-container"
            />  
          </div>       
  );
};

export default InpatientWaitingLists;
