// TeleScreenOperationRequests.tsx
import React, { useState } from 'react';
import Details from '../../encounter-component/operation-request/request/Details'; // أو وين ما كان موجود فعليًا
import { newApOperationRequests } from '@/types/model-types-constructor';

const TeleScreenOperationRequests = ({ open, onClose, patient, encounter, refetch }) => {
  const [request, setRequest] = useState({ ...newApOperationRequests });

  return (
    <Details
      open={open}
      setOpen={onClose}
      patient={patient}
      encounter={encounter}
      request={request}
      setRequest={setRequest}
      refetch={refetch}
      refetchrequest={() => {}}
      user={{}}
    />
  );
};

export default TeleScreenOperationRequests;
