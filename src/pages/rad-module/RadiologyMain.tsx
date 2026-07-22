import MyTab from '@/components/MyTab';
import React, { useRef } from 'react';
import Rad from './Rad';
import RadiologistWorklist from './radiologist-worklist/RadiologistWorklist';
import RequestedTest from './requested-tests/RequestedTest';
import Reports from '@/pages/rad-module/Reports';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { useAppSelector } from '@/hooks';
const RadiologyMain = () => {
  const radRef = useRef<any>(null);
  const authSlice = useAppSelector(state => state.auth);
const user = authSlice?.user;
  // Direction handling for RTL/LTR
  const [activeKey, setActiveKey] = React.useState('1');
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  const tabData = [
    {
      title: 'Imaging Radiology',
      content: (
        <div dir={dir}>
          <Rad ref={radRef} />
        </div>
      )
    },
    {
      title: 'Radiologist Worklist',
      content: (
        <div dir={dir}>
          <RadiologistWorklist refetchAllRadData={() => radRef.current?.refetchAllRadData?.()} />
        </div>
      )
    },
    // {
    //   title: 'Requested Tests',
    //   content: (
    //     <div dir={dir}>
    //       <RequestedTest requestType="RADIOLOGY" />
    //     </div>
    //   )
    // },
    {
      title : 'Reviewed Reports',
      content : (
        <div dir={dir}>
          <Reports setPatient={setPatient} setEncounter={setEncounter} user={user}/>
        </div>
      )
    }
  ];

  return <MyTab data={tabData} activeTab={activeKey} setActiveTab={setActiveKey} lazy/>;
};

export default RadiologyMain;
