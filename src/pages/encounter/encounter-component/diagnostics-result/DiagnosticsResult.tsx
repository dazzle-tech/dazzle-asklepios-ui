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
  const patient = props.patient || location.state?.patient;

  const tabData = [
    {title: "Results", content: <Result patient={patient} user={authSlice.user.key} />},
    {title: "Reports", content: <Reports patient={patient} user={authSlice.user.key} />},
    {title: "Laboratory Result Comparison", content: <LaboratoryResultComparison patient={patient} />}
  ];

  return (<>
    <MyTab 
     data={tabData}
    />
  </>);
};
export default DiagnosticsResult;