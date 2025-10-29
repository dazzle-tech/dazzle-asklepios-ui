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

  return (
    <MyTab
     data={tabData}
     className="tab-container"
    />
  );
};
export default InpatientWaitingLists;
