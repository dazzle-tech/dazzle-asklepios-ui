import MyTab from '@/components/MyTab';
import React, { useRef } from 'react';
import Rad from './Rad';
import RadiologistWorklist from './radiologist-worklist/RadiologistWorklist';
import RequestedTest from './requested-tests/RequestedTest';

const RadiologyMain = () => {
  const radRef = useRef<any>(null);

  // Direction handling for RTL/LTR
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
    {
      title: 'Requested Tests',
      content: (
        <div dir={dir}>
          <RequestedTest requestType="RADIOLOGY" />
        </div>
      )
    }
  ];

  return <MyTab data={tabData} />;
};

export default RadiologyMain;
