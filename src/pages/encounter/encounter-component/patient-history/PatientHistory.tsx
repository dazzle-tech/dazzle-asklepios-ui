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

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  const patient = patientProp ?? state.patient;
  const encounter = encounterProp ?? state.encounter;
  const edit = editProp ?? state.edit;
  const tabData = [
    {
      title: 'Medical History',
      content: (<div dir={dir}>
        <MedicalHistory
          patient={patient}
          encounter={encounter}
          edit={edit}
          toShowData={toShowData}
        />
        </div>
      )
    },
    {
      title: 'Surgical History',
      content: (<div dir={dir}>
        <SurgicalHistory
          patient={patient}
          encounter={encounter}
          edit={edit}
          toShowData={toShowData}
        />
        </div>
      )
    },
    {
      title: 'Social History',
      content: (<div dir={dir}>
        <SocialHistory
          patient={patient}
          encounter={encounter}
          edit={edit}
          toShowData={toShowData}
        />
        </div>
      )
    }
  ];



return (
  <MyTab
  lazy
    data={tabData.map(tab => ({
      ...tab,
      content: <div dir={dir}>{tab.content}</div>
    }))}
  />
);
};
export default PatientHistory;
