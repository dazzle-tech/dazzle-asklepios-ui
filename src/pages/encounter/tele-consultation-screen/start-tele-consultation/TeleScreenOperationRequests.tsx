// TeleScreenOperationRequests.tsx
import React, { useState } from 'react';
import Details from '../../encounter-component/operation-request/request/Details';
import { newApOperationRequests } from '@/types/model-types-constructor';

const TeleScreenOperationRequests = ({ open, onClose, patient, encounter, refetch }) => {
  const [request, setRequest] = useState({ ...newApOperationRequests });
      // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (<div dir={dir}>
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
    /> </div>
  );
};

export default TeleScreenOperationRequests;
