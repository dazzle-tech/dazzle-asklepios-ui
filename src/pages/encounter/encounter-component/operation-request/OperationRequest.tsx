import React from 'react';
import Request from './request/Request';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks';
import { useGetRequestedOperationQuery } from '@/services/operationService';
import AnesthesiaCarePlan from './AnesthesiaCarePlan';
import PreCheckList from './PreCheckList';
import './styles.less';
import MyTab from '@/components/MyTab';
const OperationRequest = props => {
  const location = useLocation();

  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const authSlice = useAppSelector(state => state.auth);
  const {
    data: requestedOperation,
    refetch,
  } = useGetRequestedOperationQuery(
    {
      encounterKey: encounter?.key,
      patientKey: patient?.key
    },
    {
      skip: !encounter?.key || !patient?.key
    }
  );

  const tabData = [
    {
      title: 'Request',
      content: (
        <div className="remove-over-flow-handle">
          <Request
            patient={patient}
            encounter={encounter}
            user={authSlice.user}
            refetchrequest={refetch}
          />
        </div>
      )
    },
    {
      title: 'Anesthesia Care Plan',
      content: (
        <div className="remove-over-flow-handle">
          <AnesthesiaCarePlan
            operation={requestedOperation}
            patient={patient}
            encounter={encounter}
            user={authSlice.user}
          />
        </div>
      ),
      disabled: !requestedOperation?.object
    },
    {
      title: 'Pre-Op Checklist',
      content: (
        <div className="remove-over-flow-handle">
          <PreCheckList
            operation={requestedOperation}
            patient={patient}
            encounter={encounter}
            user={authSlice.user}
          />
        </div>
      ),
      disabled: !requestedOperation?.object
    },
    { title: 'Devices Implants', content: <>4</>, disabled: !requestedOperation?.object }
  ];
  return (
    <MyTab 
     data={tabData}
    />
  );
};

export default OperationRequest;
