import React from 'react';
import { useLocation } from 'react-router-dom';

import MyTab from '@/components/MyTab';
import { useAppSelector } from '@/hooks';
import Results from './Results';
import Reports from './Reports';

const TestsResults = props => {
  const location = useLocation();
  const authSlice = useAppSelector(state => state.auth);

  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;

  const viewMode = location.state?.viewMode;
  const edit = viewMode === 'readOnly';

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  const tabData = [
    {
      title: 'Results',
      content: (
        <div className={edit ? 'disabled-panel' : ''}>
          <Results
            patient={patient}
            encounter={encounter}
          />
        </div>
      )
    },
    {
      title: 'Reports',
      content: (
        <div className={edit ? 'disabled-panel' : ''}>
          <Reports
            patient={patient}
            encounter={encounter}
          />
        </div>
      )
    }
  ];

  return (
    <div dir={dir}>
      <MyTab
        lazy
        data={tabData.map(tab => ({
          ...tab,
          content: <div dir={dir}>{tab.content}</div>
        }))}
      />
    </div>
  );
};

export default TestsResults;