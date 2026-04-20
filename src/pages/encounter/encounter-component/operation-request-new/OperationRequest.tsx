import React from 'react';
import { Tabs } from 'rsuite';
import Request from './request/Request';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks';
import { useGetRequestedOperationQuery } from '@/services/operationService';
import AnesthesiaCarePlan from './AnesthesiaCarePlan';
import PreCheckList from './PreCheckList';
import './styles.less';
import Translate from '@/components/Translate';
const OperationRequest = props => {
  const location = useLocation();

  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const edit = props.edit ?? location.state?.edit ?? false;
  const authSlice = useAppSelector(state => state.auth);
  const {
    data: requestedOperation,
    refetch,
    isLoading,
    error
  } = useGetRequestedOperationQuery(
    {
      encounterKey: encounter?.key,
      patientKey: patient?.key
    },
    {
      skip: !encounter?.key || !patient?.key
    }
  );
        // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
    <Tabs defaultActiveKey="1" appearance="subtle">
      <Tabs.Tab eventKey="1" title={<Translate>Request</Translate>}>
        <div className="remove-over-flow-handle">
          <Request
            patient={patient}
            encounter={encounter}
            user={authSlice.user}
            refetchrequest={refetch}
          />
        </div>
      </Tabs.Tab>
      <Tabs.Tab eventKey="2" title={<Translate>Anesthesia Care Plan</Translate>} disabled={!requestedOperation?.object}>
        {' '}
        <div className="remove-over-flow-handle">
          <AnesthesiaCarePlan
            operation={requestedOperation}
            patient={patient}
            encounter={encounter}
            user={authSlice.user}
          />
        </div>
      </Tabs.Tab>
      <Tabs.Tab eventKey="3" title={<Translate>Pre-Op Checklist</Translate>} disabled={!requestedOperation?.object}>
        <div className="remove-over-flow-handle">
          <PreCheckList
            operation={requestedOperation}
            patient={patient}
            encounter={encounter}
            user={authSlice.user}
          />
        </div>
      </Tabs.Tab>
      <Tabs.Tab eventKey="4" title={<Translate>Devices\ Implants</Translate>} disabled={!requestedOperation?.object}>
        4
      </Tabs.Tab>
    </Tabs></div>
  );
};

export default OperationRequest;
