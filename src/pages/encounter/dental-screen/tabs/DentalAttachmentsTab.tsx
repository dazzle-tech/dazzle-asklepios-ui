import React from 'react';
import { useLocation } from 'react-router-dom';
import EncounterAttachment from '@/pages/patient/patient-profile/tabs/Attachment-new/EncounterAttachment';

const DentalAttachmentsTab = ({ patient, encounter }) => {
  const location = useLocation();
  const edit = location.state?.viewMode === 'readOnly' || Boolean(location.state?.edit ?? false);

  return (
    <EncounterAttachment
      localEncounter={encounter}
      patientId={patient?.id ?? patient?.key ?? encounter?.patientId}
      allSources={true}
      source="NURSE_STATION_ATTACHMENT"
      edit={edit}
      refetchAttachmentList={false}
      setRefetchAttachmentList={() => {}}
    />
  );
};

export default DentalAttachmentsTab;
