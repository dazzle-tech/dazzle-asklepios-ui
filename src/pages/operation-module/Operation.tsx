import {
  newApEncounter,
  newApOperationRequests,
  newApPatient
} from '@/types/model-types-constructor';
import React, { useEffect, useRef, useState } from 'react';
import PatientSide from '../encounter/encounter-main-info-section/PatienSide';
import CompletedOperations from './CompletedOperations';
import OngoingOperations from './OngoingOperations';
import RequestList from './RequestsList';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTab from '@/components/MyTab';
const Operation = () => {
  const dispatch = useAppDispatch();
  const [patient, setPatient] = useState({ ...newApPatient });
  const [encounter, setEncounter] = useState({ ...newApEncounter });
  const [request, setRequest] = useState<any>({ ...newApOperationRequests });
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('1');

  const reqRef = useRef(null);
  const refetchOnGoing = () => {
    reqRef.current?.refetch();
  };
  const divContent = 'Operations';

  const tabData = [
    {
      title: 'Request List',
      content: (
        <RequestList
          patient={patient}
          encounter={encounter}
          setPatient={setPatient}
          setEncounter={setEncounter}
          setActiveTab={setActiveTab}
          setOpen={setOpen}
          request={request}
          setRequest={setRequest}
          refetchOnGoing={refetchOnGoing}
        />
      )
    },
    {
      title: 'Ongoing Operations',
      content: (
        <OngoingOperations
          ref={reqRef}
          patient={patient}
          encounter={encounter}
          setPatient={setPatient}
          setEncounter={setEncounter}
          open={open}
          setOpen={setOpen}
          request={request}
          setRequest={setRequest}
        />
      )
    },
    {
      title: 'Completed Operations',
      content: (
        <CompletedOperations
          patient={patient}
          encounter={encounter}
          setPatient={setPatient}
          setEncounter={setEncounter}
          open={open}
          setOpen={setOpen}
          request={request}
          setRequest={setRequest}
        />
      )
    }
  ];

  useEffect(() => {
    dispatch(setPageCode('Operation_Module'));
    dispatch(setDivContent(divContent));
  }, []);
  return (
    <div className="container">
      <div className="left-box">
        <MyTab data={tabData} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <div className="right-box">
        <PatientSide patient={patient} encounter={encounter} />
      </div>
    </div>
  );
};
export default Operation;
