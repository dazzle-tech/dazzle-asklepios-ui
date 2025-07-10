import React, { useState } from 'react';
import { Tabs } from 'rsuite';
import NewRound from './NewRound/NewRound';
import { useLocation } from 'react-router-dom';
import NurseNotes from './NurseNotes/NurseNotes';
import PreviousRoundsHistory from './PreviousRoundsHistory';

const DoctorRound = () => {
    const location = useLocation();
    const { patient, encounter, edit } = location.state || {};
    const [isConfirmedRound , setIsConfirmedRound] = useState(false);
    return (
        <Tabs appearance="subtle" className="doctor-round-tabs" defaultActiveKey="1">
            <Tabs.Tab eventKey="1" title="New Round">
                <NewRound
                    patient={patient}
                    encounter={encounter}
                    edit={edit} 
                    setIsConfirmedRound={setIsConfirmedRound}/>
            </Tabs.Tab>
            <Tabs.Tab eventKey="2" title="Orders">

            </Tabs.Tab>
            <Tabs.Tab eventKey="3" title="Nurse Notes">
                <NurseNotes
                    patient={patient}
                    encounter={encounter}
                    edit={edit} />
            </Tabs.Tab>
            <Tabs.Tab eventKey="4" title="Previous Rounds History">
             <PreviousRoundsHistory
                    patient={patient}
                    encounter={encounter} 
                    isConfirmedRound={isConfirmedRound}
                    setIsConfirmedRound={setIsConfirmedRound}/>
            </Tabs.Tab>

        </Tabs>
    );
};
export default DoctorRound;


