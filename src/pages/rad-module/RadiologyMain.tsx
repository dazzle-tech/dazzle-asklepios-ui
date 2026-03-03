import MyTab from '@/components/MyTab';
import React, { useRef } from 'react';
import Rad from './Rad';
import RadiologistWorklist from './radiologist-worklist/RadiologistWorklist';
import RequestedTest from './requested-tests/RequestedTest';

const RadiologyMain = () => {
  const radRef = useRef<any>(null);

  const tabData = [
    {
      title: 'Imaging Radiology',
      content: <Rad ref={radRef} />
    },
    {
      title: 'Radiologist Worklist',
      content: (
        <RadiologistWorklist
          refetchAllRadData={() =>
            radRef.current?.refetchAllRadData?.()
          }
        />
      )
    },
    {
      title: 'Requested Tests',
      content: <RequestedTest requestType="RADIOLOGY" />
    },
  ];

  return <MyTab data={tabData} />;
};

export default RadiologyMain;