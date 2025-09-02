import React, { useState } from 'react';
import Section from '@/components/Section';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PatientAttachment from '@/pages/patient/patient-profile/tabs/Attachment';
import { useLocation } from 'react-router-dom';
import './style.less';
import SectionContainer from '@/components/SectionsoContainer';

const AttachmentsSection = () => {
  const location = useLocation();
  const propsData = location.state;
  const [refetchAttachmentList, setRefetchAttachmentList] = useState(false);

  return (
    <SectionContainer
      title={
        <div className="title-div">
          <FontAwesomeIcon icon={faPaperclip} className="font-small title-div-s" />
          <p className="font-small title-div-p">Attachments</p>
        </div>
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
