//declares
import React from 'react';
import { useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import { Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
import { Checkbox } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import AttachmentModal from '@/components/AttachmentUploadModal/AttachmentUploadModal';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Style.less';

//Modal Props
const JhonsHopkinsToolSecondModal = ({
  open,
  setOpen
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
}) => {
  //open the attachment modal
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  //second modal content
  const ModalContent = (
<Form fluid>
  <div className='jhons-hopkins-tool-second-modal-main-container'>
  <div className='jhons-hopkins-tool-second-modal-checkboxes-positions-main-container'>
  <div className='jhons-hopkins-tool-second-modal-checkboxes-positions'>
          <Checkbox>Fall-risk wristband applied</Checkbox>
          <Checkbox>Bed in low position</Checkbox>
          <Checkbox>Bed alarms enabled</Checkbox></div>
            <div className='jhons-hopkins-tool-second-modal-checkboxes-positions'>
          <Checkbox>2-hour rounding</Checkbox>
          <Checkbox>Non-skid footwear</Checkbox>
          <Checkbox>Assistive device provided</Checkbox></div></div>
<div className='jhons-hopkins-tool-second-modal-input-position'>
        <MyInput
          width={'100%'}
          column
          fieldLabel=""
          placeholder="Assessment Notes"
          fieldName="text"
          record={''}
          disabled={false}
          className="search-input"
          /></div>

        <MyButton
          className="my-button-for-attachment-modal"
          onClick={() => {
            setShowAttachmentModal(true);
          }}
        >
          <FontAwesomeIcon icon={faPaperclip} />
          Attachments
        </MyButton>

        <MyInput
          width={'100%'}
          fieldLabel="Next Assessment Due"
          fieldType="date"
          fieldName="key0"
          record={''}
          setRecord={''}
        /></div>
</Form>
  );

  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Second Modal"
        steps={[{ title: 'Fall Prevention Plan Triggered',icon:<FontAwesomeIcon icon={faListCheck}/> }]}
        size="30vw"
        position="right"
        actionButtonLabel="Save"
        content={ModalContent}
      />
      <AttachmentModal
        isOpen={showAttachmentModal}
        setIsOpen={setShowAttachmentModal}
        selectedPatientAttacment={null}
        setSelectedPatientAttacment={() => null}
      />
    </>
  );
};

export default JhonsHopkinsToolSecondModal;
