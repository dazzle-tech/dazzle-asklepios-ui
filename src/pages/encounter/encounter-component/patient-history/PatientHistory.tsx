import React from 'react';
import { Tabs } from 'rsuite';
import MedicalHistory from './MedicalHistory/MedicalHistory';
import SurgicalHistory from './SurgicalHistory';
import SocialHistory from './SocialHistory';
import { useLocation } from 'react-router-dom';
import MyTab from '@/components/MyTab';
const PatientHistory = ({
  toShowData = false,
  patient: patientProp,
  encounter: encounterProp,
  edit: editProp
}) => {
  const location = useLocation();

  const state = location.state || {};

  const patient = patientProp ?? state.patient;
  const encounter = encounterProp ?? state.encounter;
  const edit = editProp ?? state.edit;
  const tabData = [
    {
      title: 'Medical History',
      content: (
        <MedicalHistory
          patient={patient}
          encounter={encounter}
          edit={edit}
          toShowData={toShowData}
        />
      )
    },
    {
      title: 'Surgical History',
      content: (
        <SurgicalHistory
          patient={patient}
          encounter={encounter}
          edit={edit}
          toShowData={toShowData}
        />
      )
    },
    {
      title: 'Social History',
      content: (
        <SocialHistory
          patient={patient}
          encounter={encounter}
          edit={edit}
          toShowData={toShowData}
        />
      )
    }
  ];

  return <MyTab data={tabData} />;
};
export default PatientHistory;
