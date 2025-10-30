import React from 'react';
import { Tabs } from 'rsuite';
import MedicalHistory from './MedicalHistory/MedicalHistory';
import SurgicalHistory from './SurgicalHistory';
import SocialHistory from './SocialHistory';
import { useLocation } from 'react-router-dom';
import MyTab from '@/components/MyTab';
const PatientHistory = () => {
  const location = useLocation();
  const { patient, encounter, edit } = location.state || {};

  const tabData = [
    {title: "Medical History", content: <MedicalHistory patient={patient} encounter={encounter} edit={edit} />},
    {title: "Surgical History", content: <SurgicalHistory patient={patient} encounter={encounter} edit={edit} />},
    {title: "Social History", content: <SocialHistory patient={patient} encounter={encounter} edit={edit} />}
  ];

  return (
   <MyTab
    data={tabData}
   />
  );
};
export default PatientHistory;
