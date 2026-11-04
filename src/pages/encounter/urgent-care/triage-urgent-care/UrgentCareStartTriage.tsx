import React, { useEffect, useState } from 'react';
import PatientSide from '../../encounter-main-info-section/PatienSide';
import { useLocation } from 'react-router-dom';
import '../styles.less';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import StartTriage from './component/StartTriage';

interface ERTriageProps {
  patient?: any;
  encounter?: any;
  edit?: boolean;
  emergencyTriageNew?: any;
  fromPage?: string;
}

const UrgentCareStartTriage = (props: ERTriageProps) => {
  const location = useLocation();
  const patient = props.patient ?? location.state?.patient ?? {};
  const encounterData = props.encounter ?? location.state?.encounter ?? {};
  const emergencyTriageNew = props.emergencyTriageNew ?? location.state?.emergencyTriageNew ?? null;
  const dispatch = useAppDispatch();
  const fromPage = props.fromPage ?? location.state?.fromPage ?? '';
  const [refetchPatientObservations] = useState(false);

  useEffect(() => {
    dispatch(setPageCode('UrgentCare_Start_Triage'));
    dispatch(setDivContent('Urgent Care Start Triage'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [dispatch]);

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';
  return (
    <div className="er-main-container" dir={dir}>
      <div className="left-box">
        <StartTriage
          patient={patient}
          encounter={encounterData}
          sourcePage="UrgentCare"
          fromPage={fromPage}
          emergencyTriageNew={emergencyTriageNew}
        />
      </div>
      <div className="right-box">
        <PatientSide
          patient={patient}
          
          encounter={encounterData}
          refetchList={refetchPatientObservations}
        />
      </div>
    </div>
  );
};

export default UrgentCareStartTriage;
