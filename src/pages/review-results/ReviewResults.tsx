import MyTab from '@/components/MyTab';
import { useAppSelector } from '@/hooks';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import React from 'react';
import PatientSide from '@/pages/encounter/encounter-main-info-section/PatienSide';
import FavoriteTests from './FavoriteTests';
import ReviewReport from './Reports';
import Results from './Results';
import { newPatientEncounter } from '@/types/model-types-constructor-new';

const ReviewResults = () => {
  const [patient, setPatient] = React.useState({ ...newApPatient });
  const [encounter, setEncounter] = React.useState<any>({
    ...newPatientEncounter,
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

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
  <div dir={dir}>
    <div className="container">
      <div className="left-box">
        <MyTab data={tabData} />
      </div>
      <div className="right-box">
        
              <PatientSide
                patient={patient}
                setPatient={setPatient}
                encounter={encounter}
                showDiagnosis={false}
                showVisitDetails={false}
                showBalance={false}
              />
      </div>
    </div>
  </div>  
  );
};

export default ReviewResults;
