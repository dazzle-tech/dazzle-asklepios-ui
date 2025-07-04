import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs } from 'rsuite';
import Result from './Result';
import Reports from './Reports';
import LaboratoryResultComparison from './LaboratoryResultComparison';
import { useAppSelector } from '@/hooks';
const DiagnosticsResult = (props) => {
  const location = useLocation();
  const authSlice = useAppSelector(state => state.auth);

  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;


  return (<>
    <Tabs defaultActiveKey="1" appearance="subtle">
      <Tabs.Tab eventKey="1" title="Results" ><Result patient={patient} user={authSlice.user.key} /></Tabs.Tab>
      <Tabs.Tab eventKey="2" title="Reports" ><Reports patient={patient} user={authSlice.user.key} /></Tabs.Tab>
      <Tabs.Tab eventKey='3' title="Laboratory Result Comparison"><LaboratoryResultComparison patient={patient} /></Tabs.Tab>
    </Tabs>
  </>);
};
export default DiagnosticsResult;