import React, { useState } from 'react';
import NewRound from './NewRound/NewRound';
import { useLocation } from 'react-router-dom';
import NurseNotes from './NurseNotes/NurseNotes';
import PreviousRoundsHistory from './PreviousRoundsHistory';
import Orders from './Orders';
import MyTab from '@/components/MyTab';

const DoctorRound = () => {
  const location = useLocation();
  const { patient, encounter, edit } = location.state || {};
  const [isConfirmedRound, setIsConfirmedRound] = useState(false);

  const tabData = [
    {
      title: 'New Round',
      content: (
        <NewRound
          patient={patient}
          encounter={encounter}
          edit={edit}
          setIsConfirmedRound={setIsConfirmedRound}
        />
      )
    },
    { title: 'Orders', content: <Orders patient={patient} encounter={encounter} edit={edit} /> },
    {
      title: 'Nurse Notes',
      content: <NurseNotes patient={patient} encounter={encounter} edit={edit} />
    },
    {
      title: 'Previous Rounds History',
      content: (
        <PreviousRoundsHistory
          patient={patient}
          encounter={encounter}
          isConfirmedRound={isConfirmedRound}
          setIsConfirmedRound={setIsConfirmedRound}
        />
      )
    }
  ];

  return <MyTab data={tabData} />;
};
export default DoctorRound;
