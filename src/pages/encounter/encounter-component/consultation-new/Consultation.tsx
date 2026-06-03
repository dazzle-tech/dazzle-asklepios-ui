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

        // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return <MyTab
  data={tabData.map(tab => ({
    ...tab,
    content: <div dir={dir}>{tab.content}</div>
  }))}
  appearance="pills"
  lazy
/>;
};

export default Consultation;
