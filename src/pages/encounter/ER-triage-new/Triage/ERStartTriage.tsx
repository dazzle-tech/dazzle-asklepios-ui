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

}

const ERStartTriage = (props: ERTriageProps) => {
  const location = useLocation();
  const patient = props.patient ?? location.state?.patient ?? {};
  const encounterData = props.encounter ?? location.state?.encounter ?? {};
  const emergencyTriageNew = props.emergencyTriageNew ?? location.state?.emergencyTriageNew ?? null;
  const dispatch = useAppDispatch();

  const [refetchPatientObservations] = useState(false);

  useEffect(() => {
    dispatch(setPageCode('Start_Triage'));
    dispatch(setDivContent('ER Start Triage'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(' '));
    };
  }, [dispatch]);
  return (
    <div className="er-main-container">
      <div className="left-box">
       <StartTriage
          patient={patient}
          encounter={encounterData}
          sourcePage={"Emergency"}
          emergencyTriageNew={emergencyTriageNew}
          // edit={edit}
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

export default ERStartTriage;
