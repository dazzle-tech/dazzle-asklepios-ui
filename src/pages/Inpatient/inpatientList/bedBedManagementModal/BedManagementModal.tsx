import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyModal from '@/components/MyModal/MyModal';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import { Tabs } from 'rsuite';
import BedManagmentFirstTab from './BedManagmentFirstTab';
import BedTransactionsSecondTab from './BedTransactionsSecondTab';
const BedManagementModal = ({ open, setOpen, encounter }) => {

    // modal content
    const modalContent = (
        <Tabs defaultActiveKey="1" appearance="subtle" className="tab-container">
            <Tabs.Tab eventKey="1" title="Bed Management"  ><BedManagmentFirstTab encounter={encounter} /></Tabs.Tab>
            <Tabs.Tab eventKey="2" title="Bed Transactions" ><BedTransactionsSecondTab encounter={encounter} /></Tabs.Tab>
        </Tabs>);

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Bed Management"
            steps={[{ title: "Bed Management", icon: <FontAwesomeIcon icon={faBed} /> }]}
            size="90vw"
            bodyheight='75vh'
            actionButtonFunction={null}
            content={modalContent}
            hideActionBtn={true}
        />);
}
export default BedManagementModal;