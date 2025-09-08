import React from 'react';
import { useLocation } from 'react-router-dom';
import InpatientObservations from '../encounter-pre-observations/observations/InpatientObservations';
import './style.less';

const ContinuousObservations = () => {
  const location = useLocation();
  const propsData = location.state;

  return (
    <InpatientObservations
      editable={propsData.edit}
      localPatient={propsData.patient}
      localEncounter={propsData.encounter}
    />
  );
};

export default ContinuousObservations;
