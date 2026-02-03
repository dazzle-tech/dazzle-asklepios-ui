import React from 'react';
import ReviewReport from './Reports';
import Results from './Results';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import PatientSide from '../lab-module/PatienSide';
import { useAppSelector } from '@/hooks';
import MyTab from '@/components/MyTab';
import FavoriteTests from './FavoriteTests';

const ReviewResults = () => {
  const [patient, setPatient] = React.useState({ ...newApPatient });
  const [encounter, setEncounter] = React.useState<any>({
    ...newApEncounter,
    discharge: false
  });

  const authSlice = useAppSelector(state => state.auth);

  const userId: number | undefined =
    authSlice.user?.id ?? authSlice.user?.key;

  const tabData = [
    {
      title: 'Results',
      content:
        userId ? (
          <Results
            setEncounter={setEncounter}
            setPatient={setPatient}
            user={userId}
          />
        ) : null
    },
    {
      title: 'Reports',
      content:
        userId ? (
          <ReviewReport
            setEncounter={setEncounter}
            setPatient={setPatient}
            user={userId}
          />
        ) : null
    },
    {
      title: 'Favorites Tests',
      content: userId ? <FavoriteTests user={userId} /> : null
    }
  ];

  return (
    <div className="container">
      <div className="left-box">
        <MyTab data={tabData} />
      </div>
      <div className="right-box">
        <PatientSide patient={patient} encounter={encounter} />
      </div>
    </div>
  );
};

export default ReviewResults;
