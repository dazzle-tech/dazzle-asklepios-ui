import React from 'react';
import { Tabs } from 'rsuite';
import WaitingList from './newAdmissions';
const InpatientWaitingLists = () => {
    return (
        <Tabs defaultActiveKey="1" appearance="subtle" className="tab-container">
            <Tabs.Tab eventKey="1" title="New Admissions"><WaitingList/></Tabs.Tab>
            <Tabs.Tab eventKey="2" title="Transfer Requests" ></Tabs.Tab>
        </Tabs>);
}
export default InpatientWaitingLists;