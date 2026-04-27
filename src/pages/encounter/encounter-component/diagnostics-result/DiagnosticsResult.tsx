import React from 'react';
import { useLocation } from 'react-router-dom';
import Result from './Result';
import Reports from './Reports';
import LaboratoryResultComparison from './LaboratoryResultComparison';
import { useAppSelector } from '@/hooks';
import MyTab from '@/components/MyTab';
const DiagnosticsResult = props => {
  const location = useLocation();
  const authSlice = useAppSelector(state => state.auth);
  //add new patient edits
  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const tabData = [
    { title: 'Results', content: <Result patient={patient} /> },
    {
      title: 'Reports',
      content: <Reports patient={patient} />
    },
    {
      title: 'Laboratory Result Comparison',
      content: <LaboratoryResultComparison patient={patient} />
    }
  ];

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <MyTab
        data={tabData.map(tab => ({
          ...tab,
          content: <div dir={dir}>{tab.content}</div>
        }))}
      />
    </div>
  );
};
export default DiagnosticsResult;
