import React from 'react';
import { Tabs } from 'rsuite';
import NewRound from './NewRound';
import { useLocation } from 'react-router-dom';

const DoctorRound = () => {
    const location = useLocation();
    const { patient, encounter, edit } = location.state || {};

    return (
        <Tabs appearance="subtle" className="doctor-round-tabs" defaultActiveKey="1">
            <Tabs.Tab eventKey="1" title="New Round">
                <NewRound
                    patient={patient}
                    encounter={encounter}
                    edit={edit} />
            </Tabs.Tab>
            <Tabs.Tab eventKey="2" title="Orders">

            </Tabs.Tab>
            <Tabs.Tab eventKey="3" title="Nurse Notes">

            </Tabs.Tab>
            <Tabs.Tab eventKey="4" title="Previous Rounds History">

            </Tabs.Tab>

        </Tabs>
    );
};
export default DoctorRound;


