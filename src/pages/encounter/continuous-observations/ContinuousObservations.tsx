import React from 'react';
import { useLocation } from 'react-router-dom';
import InpatientObservations from '../encounter-pre-observations/observations/InpatientObservations';
import './style.less';

const ContinuousObservations = ({...props}) => {
  const location = useLocation();
  const propsData = location.state;

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (<div dir={dir}>
    <InpatientObservations
      editable={propsData.edit}
      localPatient={props?.patient ? props?.patient : propsData.patient}
      localEncounter={props?.encounter ? props?.encounter : propsData.encounter}
    /></div>
  );
};

export default ContinuousObservations;
