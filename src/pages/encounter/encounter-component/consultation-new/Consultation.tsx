import React from 'react';
import { useOutletContext } from 'react-router-dom';
import NormalConsultation from './NormalConsultation';
import TelephonicConsultation from './TelephonicConsultation';
import './styles.less';
import MyTab from '@/components/MyTab';

const Consultation = () => {
  const { patient, encounter, edit } = useOutletContext<any>();

  const tabData = [
    {
      title: 'Normal Consultation',
      content: <NormalConsultation patient={patient} encounter={encounter} edit={edit} />
    },
    {
      title: 'Telephonic Consultation',
      content: <TelephonicConsultation patient={patient} encounter={encounter} edit={edit} />
    }
  ];

  return <MyTab data={tabData} appearance="pills" />;
};

export default Consultation;
