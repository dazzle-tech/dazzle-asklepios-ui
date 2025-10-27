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
    // <Tabs defaultActiveKey="1" appearance="subtle" className="tab-container">
    //   <Tabs.Tab eventKey="1" title="New Admissions">
    //     <WaitingList />
    //   </Tabs.Tab>
    //   <Tabs.Tab eventKey="2" title="Transfer Requests">
    //     <TransferPatientsList />
    //   </Tabs.Tab>
    //   <Tabs.Tab eventKey="3" title="Transfer Transactions">
    //     <TransferTransactions />
    //   </Tabs.Tab>
    // </Tabs>
    <MyTab
     data={tabData}
    />
  );
};
export default InpatientWaitingLists;
