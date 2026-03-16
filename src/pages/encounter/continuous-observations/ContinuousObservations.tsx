import React from 'react';
import { useLocation } from 'react-router-dom';
import InpatientObservations from '../encounter-pre-observations/observations/InpatientObservations';
import './style.less';

const ContinuousObservations = ({...props}) => {
  const location = useLocation();
  const propsData = location.state;

  return (
    <InpatientObservations
      editable={propsData.edit}
      localPatient={props?.patient ? props?.patient : propsData.patient}
      localEncounter={props?.encounter ? props?.encounter : propsData.encounter}
    />
  );
};

export default ContinuousObservations;
