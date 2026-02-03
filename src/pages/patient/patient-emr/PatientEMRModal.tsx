import React from 'react';
import 'react-tabs/style/react-tabs.css';
import PatientEMR from './PatientEMR';
import './styles.less';

const PatientEMRModal = ({ patient, encounter }) => {
  return (
    <PatientEMR
      inModal={true}
      patient={patient}
      encounter={encounter}
      hideProfileSidebar={true}
    />
  );
};

export default PatientEMRModal;