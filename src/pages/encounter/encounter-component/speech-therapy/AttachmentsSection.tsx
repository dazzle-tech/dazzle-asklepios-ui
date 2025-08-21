import React, { useState } from 'react';
import Section from '@/components/Section';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PatientAttachment from '@/pages/patient/patient-profile/tabs/Attachment';
import { useLocation } from 'react-router-dom';
import './style.less';

const AttachmentsSection = () => {
  const location = useLocation();
  const propsData = location.state;
  const [refetchAttachmentList, setRefetchAttachmentList] = useState(false);

  return (
      <Section
        title={
          <>
            <FontAwesomeIcon icon={faPaperclip} className="font-small" />
            <p className="font-small">Attachments</p>
          </>
        }
        content={
          <PatientAttachment
            localPatient={propsData?.patient}
            setRefetchAttachmentList={setRefetchAttachmentList}
            refetchAttachmentList={refetchAttachmentList}
          />
        }
      />
  );
};

export default AttachmentsSection;
