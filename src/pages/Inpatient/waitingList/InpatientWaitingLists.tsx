import React from 'react';
import { Tabs } from 'rsuite';
import WaitingList from './newAdmissions';
import TransferPatientsList from './transferRequests';
import TransferTransactions from './transferTrasactions';
const InpatientWaitingLists = () => {
    return (
        <Tabs defaultActiveKey="1" appearance="subtle" className="tab-container">
            <Tabs.Tab eventKey="1" title="New Admissions"><WaitingList/></Tabs.Tab>
            <Tabs.Tab eventKey="2" title="Transfer Requests" ><TransferPatientsList/></Tabs.Tab>
            <Tabs.Tab eventKey="3" title="Transfer Transactions"><TransferTransactions/></Tabs.Tab>
        </Tabs>);
}
export default InpatientWaitingLists;